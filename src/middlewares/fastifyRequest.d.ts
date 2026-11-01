import type { AuthenticatedUserResponse } from '../services/auth/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    authenticatedUser: AuthenticatedUserResponse | null;
    authSessionId: string | null;
    rawBody?: Buffer;
  }
}
