import { createUserAdvertisement as createUserAdvertisementRecord } from '../../../repositories/userAdvertisement.repository.js';
export async function createUserAdvertisement(input: Parameters<typeof createUserAdvertisementRecord>[0]) { return createUserAdvertisementRecord(input); }
