import { reviewUserAdvertisement as reviewUserAdvertisementRecord } from '../../../repositories/userAdvertisement.repository.js';
export async function reviewUserAdvertisement(input: Parameters<typeof reviewUserAdvertisementRecord>[0]) { return reviewUserAdvertisementRecord(input); }
