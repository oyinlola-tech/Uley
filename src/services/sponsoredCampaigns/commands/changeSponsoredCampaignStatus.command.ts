import { changeLandlordSponsoredCampaignStatus } from '../../../repositories/sponsoredCampaign.repository.js';
export async function changeOwnSponsoredCampaignStatus(input: Parameters<typeof changeLandlordSponsoredCampaignStatus>[0]) { return changeLandlordSponsoredCampaignStatus(input); }
