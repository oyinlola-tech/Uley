import { reviewSponsoredCampaign } from '../../../repositories/sponsoredCampaign.repository.js';
export async function decideSponsoredCampaign(input: Parameters<typeof reviewSponsoredCampaign>[0]) { return reviewSponsoredCampaign(input); }
