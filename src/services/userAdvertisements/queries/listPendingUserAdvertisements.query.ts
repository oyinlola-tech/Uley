import { findPendingUserAdvertisements } from '../../../repositories/userAdvertisement.repository.js';
import { addAdvertisementImageUrls } from './signUserAdvertisementImages.query.js';
export async function listPendingUserAdvertisements() { return addAdvertisementImageUrls(await findPendingUserAdvertisements()); }
