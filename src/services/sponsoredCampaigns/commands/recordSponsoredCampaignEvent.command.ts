import { recordPublicCampaignEvent } from '../../../repositories/sponsoredCampaign.repository.js';
export async function recordSponsoredCampaignEvent(input: Parameters<typeof recordPublicCampaignEvent>[0]) { return recordPublicCampaignEvent(input); }
