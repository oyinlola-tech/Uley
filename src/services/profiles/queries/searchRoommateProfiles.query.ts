import { searchRoommateProfiles as findProfiles } from '../../../repositories/userProfile.repository.js';
export async function searchRoommateProfiles(input: Parameters<typeof findProfiles>[0]) { return findProfiles(input); }
