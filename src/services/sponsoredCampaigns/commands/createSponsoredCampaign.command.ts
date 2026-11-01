import { createLandlordSponsoredCampaign } from '../../../repositories/sponsoredCampaign.repository.js';
export async function requestSponsoredCampaign(input: Parameters<typeof createLandlordSponsoredCampaign>[0]) { return createLandlordSponsoredCampaign(input); }
