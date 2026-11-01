import { recordUserAdvertisementEvent as recordUserAdvertisementEventRecord } from '../../../repositories/userAdvertisement.repository.js';
export async function recordUserAdvertisementEvent(input: Parameters<typeof recordUserAdvertisementEventRecord>[0]) { return recordUserAdvertisementEventRecord(input); }
