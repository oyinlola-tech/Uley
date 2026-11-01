import type { FastifyInstance } from 'fastify';
import { WebSocket } from 'ws';
import { Client } from 'pg';
import { prismaDatabaseClient } from '../../database/prisma.database.js';
import { applicationEnvironment } from '../../configs/env.config.js';
import { API_ENDPOINTS } from '../../constants/apiEndpoint.constant.js';
import { CONVERSATION_REALTIME_LIMITS } from '../../constants/conversationRealtime.constant.js';
import { verifyAuthenticatedSession } from '../auth/queries/verifyAuthenticatedSession.query.js';
import { verifySignedAccessToken } from '../../utils/accessToken.js';
import { requireConversationParticipant } from '../../repositories/conversation.repository.js';

type ConnectedClient = { socket: WebSocket; userId?: string; sessionId?: string; userRole?: string; tokenExpiresAt?: number; authenticating?: boolean; controlWindowStartedAt?: number; controlMessageCount?: number; subscriptions: Set<string> };
type ConversationEvent = { conversationId: string; messageId: string };
const connectedClients = new Set<ConnectedClient>();
let postgresListener: Client | undefined;
let postgresListenerReady = false;
let shutdownRequested = false;
let reconnectDelay: number = CONVERSATION_REALTIME_LIMITS.reconnectInitialDelayMilliseconds;
let reconnectTimer: NodeJS.Timeout | undefined;

export function initializeConversationRealtimeListener(application: FastifyInstance): void {
  shutdownRequested = false;
  application.addHook('preClose', async () => {
    shutdownRequested = true;
    postgresListenerReady = false;
    if (reconnectTimer) clearTimeout(reconnectTimer);
    for (const client of connectedClients) client.socket.close(1001, 'Server shutdown');
    connectedClients.clear();
    await postgresListener?.end().catch(() => undefined);
    postgresListener = undefined;
  });
  application.addHook('onClose', async () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
  });
  void connectPostgresListener(application);
}

export function registerConversationRealtimeRoute(application: FastifyInstance): void {
  application.get(API_ENDPOINTS.conversationRealtime, { websocket: true }, (socket, request) => {
    const requestOrigin = request.headers.origin;
    if (requestOrigin && !isAllowedWebSocketOrigin(requestOrigin)) return socket.close(1008, 'Origin is not allowed');
    if (connectedClients.size >= CONVERSATION_REALTIME_LIMITS.maximumConnectionsPerApiInstance) return socket.close(1013, 'Realtime capacity reached');
    const client: ConnectedClient = { socket, subscriptions: new Set() };
    connectedClients.add(client);
    const authenticationTimer = setTimeout(() => socket.close(1008, 'Authenticate to continue'), CONVERSATION_REALTIME_LIMITS.authenticationTimeoutMilliseconds);
    const sessionTimer = setInterval(() => void recheckSocketSession(client), CONVERSATION_REALTIME_LIMITS.sessionRecheckMilliseconds);
    socket.on('close', () => { clearTimeout(authenticationTimer); clearInterval(sessionTimer); connectedClients.delete(client); });
    socket.on('error', (error) => request.log.warn({ err: error }, 'Conversation websocket failed'));
    socket.on('message', (rawMessage, isBinary) => { void handleSocketMessage(client, rawMessage.toString(), isBinary, authenticationTimer); });
  });
}

function isAllowedWebSocketOrigin(requestOrigin: string): boolean {
  if (!applicationEnvironment.webAppBaseUrl) return true;
  try { return new URL(requestOrigin).origin === new URL(applicationEnvironment.webAppBaseUrl).origin; }
  catch { return false; }
}

async function handleSocketMessage(client: ConnectedClient, rawMessage: string, isBinary: boolean, authenticationTimer: NodeJS.Timeout): Promise<void> {
  if (isBinary || rawMessage.length > CONVERSATION_REALTIME_LIMITS.maximumPayloadBytes) return client.socket.close(1009, 'Message too large');
  let payload: { type?: string; accessToken?: string; conversationId?: string };
  try {
    const parsedPayload: unknown = JSON.parse(rawMessage);
    if (!parsedPayload || typeof parsedPayload !== 'object' || Array.isArray(parsedPayload)) return client.socket.close(1008, 'Invalid message');
    payload = parsedPayload as typeof payload;
  } catch { return client.socket.close(1008, 'Invalid message'); }
  const currentTime = Date.now();
  if (!client.controlWindowStartedAt || currentTime - client.controlWindowStartedAt >= 60_000) { client.controlWindowStartedAt = currentTime; client.controlMessageCount = 0; }
  client.controlMessageCount = (client.controlMessageCount ?? 0) + 1;
  if (client.controlMessageCount > CONVERSATION_REALTIME_LIMITS.maximumControlMessagesPerMinute) return client.socket.close(1008, 'Too many websocket messages');
  if (!client.userId) {
    if (client.authenticating) return client.socket.close(1008, 'Authentication is already in progress');
    if (payload.type !== 'AUTH' || !payload.accessToken) return client.socket.close(1008, 'Authenticate to continue');
    if (!postgresListenerReady) return client.socket.close(1013, 'Live messaging is reconnecting');
    client.authenticating = true;
    try {
      const claims = verifySignedAccessToken(payload.accessToken);
      const account = await verifyAuthenticatedSession(claims.sid, claims.sub);
      if (account.userRole !== claims.role) return client.socket.close(1008, 'Account role changed');
      if ([...connectedClients].filter((item) => item.userId === account.id).length >= CONVERSATION_REALTIME_LIMITS.maximumConnectionsPerAccount) return client.socket.close(1013, 'Too many active connections');
      client.userId = account.id;
      client.sessionId = claims.sid;
      client.userRole = claims.role;
      client.tokenExpiresAt = claims.exp * 1000;
      clearTimeout(authenticationTimer);
      client.socket.send(JSON.stringify({ type: 'AUTHENTICATED' }));
    } catch { client.socket.close(1008, 'Authentication failed'); }
    return;
  }
  if (payload.type === 'SUBSCRIBE' && payload.conversationId && client.subscriptions.size < CONVERSATION_REALTIME_LIMITS.maximumSubscriptionsPerConnection) {
    try {
      await requireConversationParticipant(payload.conversationId, client.userId);
      client.subscriptions.add(payload.conversationId);
      client.socket.send(JSON.stringify({ type: 'SUBSCRIBED', conversationId: payload.conversationId }));
    } catch { client.socket.send(JSON.stringify({ type: 'SUBSCRIPTION_DENIED', conversationId: payload.conversationId })); }
  }
  if (payload.type === 'UNSUBSCRIBE' && payload.conversationId) client.subscriptions.delete(payload.conversationId);
}

async function recheckSocketSession(client: ConnectedClient): Promise<void> {
  if (!client.userId || !client.sessionId || !client.tokenExpiresAt) return;
  if (client.tokenExpiresAt <= Date.now()) return client.socket.close(1008, 'Session has expired');
  const account = await verifyAuthenticatedSession(client.sessionId, client.userId).catch(() => null);
  if (!account || account.userRole !== client.userRole) client.socket.close(1008, 'Session is no longer active');
}

async function connectPostgresListener(application: FastifyInstance): Promise<void> {
  if (shutdownRequested) return;
  const listener = new Client({ connectionString: applicationEnvironment.databaseUrl });
  listener.on('notification', (notification) => { if (notification.payload) void publishToSubscribedClients(notification.payload, application); });
  listener.on('error', (error) => {
    postgresListenerReady = false;
    for (const client of connectedClients) client.socket.close(1012, 'Live messaging is reconnecting');
    application.log.error({ err: error }, 'Conversation event listener connection failed');
    if (postgresListener === listener) postgresListener = undefined;
    void listener.end().catch(() => undefined);
    scheduleListenerReconnect(application);
  });
  try {
    await listener.connect();
    await listener.query('LISTEN uley_conversation_events');
    if (shutdownRequested) return void await listener.end();
    postgresListener = listener;
    postgresListenerReady = true;
    reconnectDelay = CONVERSATION_REALTIME_LIMITS.reconnectInitialDelayMilliseconds;
    application.log.info('Conversation event listener connected');
  } catch (error) {
    postgresListenerReady = false;
    application.log.error({ err: error }, 'Conversation event listener could not connect');
    await listener.end().catch(() => undefined);
    scheduleListenerReconnect(application);
  }
}

function scheduleListenerReconnect(application: FastifyInstance): void {
  if (shutdownRequested || reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined;
    void connectPostgresListener(application);
  }, reconnectDelay);
  reconnectDelay = Math.min(reconnectDelay * 2, CONVERSATION_REALTIME_LIMITS.reconnectMaximumDelayMilliseconds);
}

async function publishToSubscribedClients(payload: string, application: FastifyInstance): Promise<void> {
  let event: ConversationEvent;
  try { event = JSON.parse(payload) as ConversationEvent; } catch { return; }
  if (!event.conversationId || !event.messageId) return;
  const serializedEvent = JSON.stringify({ type: 'MESSAGE_AVAILABLE', ...event });
  const subscribers = [...connectedClients].filter((client) => client.userId && client.subscriptions.has(event.conversationId) && client.socket.readyState === WebSocket.OPEN);
  if (!subscribers.length) return;
  try {
    const participants = await prismaDatabaseClient.conversationParticipant.findMany({ where: { conversationId: event.conversationId, leftAt: null }, select: { userId: true } });
    const participantIds = participants.map(({ userId }) => userId);
    const blocked = await prismaDatabaseClient.userBlock.findMany({ where: { OR: [{ blockerId: { in: participantIds }, blockedUserId: { in: participantIds } }, { blockedUserId: { in: participantIds }, blockerId: { in: participantIds } }] }, select: { blockerId: true, blockedUserId: true } });
    const blockedIds = new Set(blocked.flatMap(({ blockerId, blockedUserId }) => [blockerId, blockedUserId]));
    const activeParticipants = new Set(participantIds.filter((userId) => !blockedIds.has(userId)));
    for (const client of subscribers) {
      if (activeParticipants.has(client.userId!)) client.socket.send(serializedEvent);
      else {
        client.subscriptions.delete(event.conversationId);
        client.socket.send(JSON.stringify({ type: 'SUBSCRIPTION_DENIED', conversationId: event.conversationId }));
      }
    }
  } catch (error) {
    application.log.warn({ err: error, conversationId: event.conversationId }, 'Could not publish a conversation event');
    for (const client of subscribers) client.socket.close(1011, 'Refresh conversation connection');
  }
}
