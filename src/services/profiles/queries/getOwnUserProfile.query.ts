import { findOrCreateOwnUserProfile } from '../../../repositories/userProfile.repository.js';
export async function getOwnUserProfile(userId: string) { return findOrCreateOwnUserProfile(userId); }
