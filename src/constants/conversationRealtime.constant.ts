export const CONVERSATION_REALTIME_LIMITS = {
  maximumPayloadBytes: 8192,
  maximumControlMessagesPerMinute: 60,
  authenticationTimeoutMilliseconds: 10_000,
  sessionRecheckMilliseconds: 60_000,
  maximumConnectionsPerAccount: 4,
  maximumConnectionsPerApiInstance: 5000,
  maximumSubscriptionsPerConnection: 10,
  reconnectInitialDelayMilliseconds: 1000,
  reconnectMaximumDelayMilliseconds: 30_000,
} as const;
