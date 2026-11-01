import { findPublicUserProfile } from '../../../repositories/userProfile.repository.js';
export async function getPublicUserProfile(profileId: string, viewerId: string) { return findPublicUserProfile(profileId, viewerId); }
