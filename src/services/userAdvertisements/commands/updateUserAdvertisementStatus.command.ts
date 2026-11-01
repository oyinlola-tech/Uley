import { changeOwnUserAdvertisementStatus } from '../../../repositories/userAdvertisement.repository.js';
export async function updateUserAdvertisementStatus(input: { advertisementId: string; advertiserId: string; status: 'APPROVED' | 'PAUSED' }) { return changeOwnUserAdvertisementStatus(input); }
