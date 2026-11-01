import { createSignedImageUrls } from '../../mediaScanning/queries/createSignedImageUrls.query.js';

type AdImageRecord = { imageStorageKey?: string | null };

export async function addAdvertisementImageUrls<T extends AdImageRecord>(ads: T[]) {
  const keys = ads.flatMap((ad) => ad.imageStorageKey ? [ad.imageStorageKey] : []);
  const signedUrls = await createSignedImageUrls(keys);
  return ads.map((ad) => {
    const { imageStorageKey, ...safeAd } = ad;
    return { ...safeAd, imageUrl: imageStorageKey ? signedUrls[imageStorageKey] ?? null : null };
  });
}
