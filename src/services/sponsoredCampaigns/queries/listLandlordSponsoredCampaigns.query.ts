import { findLandlordSponsoredCampaigns } from '../../../repositories/sponsoredCampaign.repository.js';
export async function listMySponsoredCampaigns(landlordId: string) { return findLandlordSponsoredCampaigns(landlordId); }
