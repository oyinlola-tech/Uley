import { findOwnUserAdvertisements, getUserAdvertisementAnalytics } from '../../../repositories/userAdvertisement.repository.js';
import { addAdvertisementImageUrls } from './signUserAdvertisementImages.query.js';
export async function listOwnUserAdvertisements(advertiserId: string) { return addAdvertisementImageUrls(await findOwnUserAdvertisements(advertiserId)); }
export async function getOwnUserAdvertisementAnalytics(advertiserId: string) {
  const analytics = await getUserAdvertisementAnalytics(advertiserId);
  return { ...analytics, ads: await addAdvertisementImageUrls(analytics.ads) };
}
