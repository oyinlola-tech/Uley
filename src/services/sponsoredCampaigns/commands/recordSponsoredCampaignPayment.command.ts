import { recordSponsoredCampaignPayment } from '../../../repositories/sponsoredCampaign.repository.js';
export async function recordCampaignPaymentConfirmation(input: Parameters<typeof recordSponsoredCampaignPayment>[0]) { return recordSponsoredCampaignPayment(input); }
