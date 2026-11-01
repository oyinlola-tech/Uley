import type { FastifyReply, FastifyRequest } from 'fastify';
import { AuthClientType } from '../enums/authClientType.enum.js';
import { AUTH_RESPONSE_MESSAGES } from '../constants/authResponse.constant.js';
import { AUTH_SECURITY_CONSTANTS } from '../constants/authSecurity.constant.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { applicationEnvironment } from '../configs/env.config.js';
import { UnauthorizedError, ValidationError } from '../errors/app.error.js';
import {
  changeAuthenticatedUserPassword,
  getAuthenticatedUser,
  logInWithPassword,
  refreshAuthenticatedSession,
  registerLandlordAccount,
  registerStudentAccount,
  revokeAllAuthenticatedSessions,
  revokeAuthenticatedSession,
} from '../services/auth/index.js';
import type { AuthTokenResponse } from '../services/auth/index.js';
import {
  changeAccountPasswordRequestSchema,
  logInWithPasswordRequestSchema,
  refreshAuthenticatedSessionRequestSchema,
  registerLandlordRequestSchema,
  registerStudentRequestSchema,
} from '../validations/auth.validation.js';

const refreshTokenCookieName = AUTH_SECURITY_CONSTANTS.refreshTokenCookieName;

function parseRequestBodyWithSchema<TSchema extends { safeParse: (value: unknown) => { success: true; data: unknown } | { success: false; error: { flatten: () => unknown } } }>(
  requestBody: unknown,
  requestSchema: TSchema,
): TSchema extends { safeParse: (value: unknown) => { success: true; data: infer TData } | { success: false; error: unknown } } ? TData : never {
  const parsedRequestBody = requestSchema.safeParse(requestBody);
  if (!parsedRequestBody.success) {
    throw new ValidationError();
  }
  return parsedRequestBody.data as never;
}

function setRefreshTokenCookie(fastifyReply: FastifyReply, refreshToken: string): void {
  fastifyReply.setCookie(refreshTokenCookieName, refreshToken, {
    httpOnly: true,
    secure: applicationEnvironment.nodeEnvironment === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
    maxAge: applicationEnvironment.refreshTokenLifetimeInDays * AUTH_SECURITY_CONSTANTS.secondsInDay,
  });
}

function clearRefreshTokenCookie(fastifyReply: FastifyReply): void {
  fastifyReply.clearCookie(refreshTokenCookieName, {
    httpOnly: true,
    secure: applicationEnvironment.nodeEnvironment === 'production',
    sameSite: 'strict',
    path: '/api/v1/auth',
  });
}

function setRefreshTokenCookieOrReturnToNativeClient(
  fastifyReply: FastifyReply,
  authTokenResponse: AuthTokenResponse,
  clientType: AuthClientType,
): AuthTokenResponse {
  if (clientType === AuthClientType.BROWSER) {
    setRefreshTokenCookie(fastifyReply, authTokenResponse.refreshToken ?? '');
    delete authTokenResponse.refreshToken;
  }
  return authTokenResponse;
}

function getRequestMetadata(fastifyRequest: FastifyRequest) {
  const userAgentHeader = fastifyRequest.headers['user-agent'];
  return {
    userAgent: typeof userAgentHeader === 'string' ? userAgentHeader : null,
    ipAddress: fastifyRequest.ip,
  };
}

export async function registerStudentAccountFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  const registrationData = parseRequestBodyWithSchema(fastifyRequest.body, registerStudentRequestSchema);
  const registeredStudent = await registerStudentAccount({
    ...(registrationData.universityId ? { universityId: registrationData.universityId } : {}),
    ...(registrationData.unlistedUniversity ? { unlistedUniversity: registrationData.unlistedUniversity } : {}),
    emailAddress: registrationData.emailAddress,
    fullName: registrationData.fullName,
    plainTextPassword: registrationData.password,
  });
  return fastifyReply.code(201).send({ authenticatedUser: registeredStudent });
}

export async function registerLandlordAccountFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  const registrationData = parseRequestBodyWithSchema(fastifyRequest.body, registerLandlordRequestSchema);
  const registeredLandlord = await registerLandlordAccount({
    ...(registrationData.universityId ? { universityId: registrationData.universityId } : {}),
    ...(registrationData.unlistedUniversity ? { unlistedUniversity: registrationData.unlistedUniversity } : {}),
    emailAddress: registrationData.emailAddress,
    fullName: registrationData.fullName,
    plainTextPassword: registrationData.password,
  });
  return fastifyReply.code(201).send({ authenticatedUser: registeredLandlord });
}

export async function logInAccountFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  const loginData = parseRequestBodyWithSchema(fastifyRequest.body, logInWithPasswordRequestSchema);
  const authTokenResponse = await logInWithPassword({
    emailAddress: loginData.emailAddress,
    plainTextPassword: loginData.password,
    clientType: loginData.clientType,
    ...getRequestMetadata(fastifyRequest),
  });
  return fastifyReply.code(200).send(
    setRefreshTokenCookieOrReturnToNativeClient(fastifyReply, authTokenResponse, loginData.clientType),
  );
}

export async function refreshAccountSessionFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  const refreshData = parseRequestBodyWithSchema(fastifyRequest.body ?? {}, refreshAuthenticatedSessionRequestSchema);
  const refreshToken = fastifyRequest.cookies[refreshTokenCookieName] ?? refreshData.refreshToken;
  if (!refreshToken) throw new UnauthorizedError(ERROR_MESSAGES.refreshTokenRequired);
  const clientType = fastifyRequest.cookies[refreshTokenCookieName] ? AuthClientType.BROWSER : refreshData.clientType;
  const authTokenResponse = await refreshAuthenticatedSession({
    refreshToken,
    clientType,
    ...getRequestMetadata(fastifyRequest),
  });
  return fastifyReply.code(200).send(
    setRefreshTokenCookieOrReturnToNativeClient(fastifyReply, authTokenResponse, clientType),
  );
}

export async function logOutAccountFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  if (!fastifyRequest.authenticatedUser || !fastifyRequest.authSessionId) {
    throw new UnauthorizedError();
  }
  await revokeAuthenticatedSession(fastifyRequest.authSessionId, fastifyRequest.authenticatedUser.id);
  clearRefreshTokenCookie(fastifyReply);
  return fastifyReply.code(200).send({ message: AUTH_RESPONSE_MESSAGES.signedOut });
}

export async function logOutAllAccountSessionsFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  if (!fastifyRequest.authenticatedUser) throw new UnauthorizedError();
  await revokeAllAuthenticatedSessions(fastifyRequest.authenticatedUser.id);
  clearRefreshTokenCookie(fastifyReply);
  return fastifyReply.code(200).send({ message: AUTH_RESPONSE_MESSAGES.allSessionsRevoked });
}

export async function getCurrentAccountFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  if (!fastifyRequest.authenticatedUser) throw new UnauthorizedError();
  const authenticatedUser = await getAuthenticatedUser({ authenticatedUserId: fastifyRequest.authenticatedUser.id });
  return fastifyReply.code(200).send({ authenticatedUser });
}

export async function changeAccountPasswordFromRequest(
  fastifyRequest: FastifyRequest,
  fastifyReply: FastifyReply,
): Promise<FastifyReply> {
  if (!fastifyRequest.authenticatedUser) throw new UnauthorizedError();
  const passwordChangeData = parseRequestBodyWithSchema(
    fastifyRequest.body,
    changeAccountPasswordRequestSchema,
  );
  await changeAuthenticatedUserPassword({
    userId: fastifyRequest.authenticatedUser.id,
    currentPlainTextPassword: passwordChangeData.currentPassword,
    newPlainTextPassword: passwordChangeData.newPassword,
  });
  clearRefreshTokenCookie(fastifyReply);
  return fastifyReply.code(200).send({ message: AUTH_RESPONSE_MESSAGES.passwordChanged });
}
