import { AuthRepository } from '../../../repositories/auth.repository.js';

const authRepository = new AuthRepository();

export async function revokeAuthenticatedSession(authSessionId: string, userId: string): Promise<void> {
  await authRepository.revokeAuthSession(authSessionId, userId);
}

export async function revokeAllAuthenticatedSessions(userId: string): Promise<void> {
  await authRepository.revokeAllAuthSessionsForUser(userId);
}
