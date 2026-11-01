import { updateOwnUserProfile } from '../../../repositories/userProfile.repository.js';
export async function saveUserProfile(userId: string, data: Record<string, unknown>) { return updateOwnUserProfile(userId, data); }
