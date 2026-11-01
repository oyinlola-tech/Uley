import { findUserAdvertisements } from '../../../repositories/userAdvertisement.repository.js';
import { addAdvertisementImageUrls } from './signUserAdvertisementImages.query.js';
export async function listUserAdvertisements(input: Parameters<typeof findUserAdvertisements>[0]) {
  const result = await findUserAdvertisements(input);
  return { ...result, ads: await addAdvertisementImageUrls(result.ads) };
}
