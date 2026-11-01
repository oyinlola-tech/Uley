import { findAdminSponsoredCampaigns } from '../../../repositories/sponsoredCampaign.repository.js';
export async function listSponsoredCampaignsForSchool() { return findAdminSponsoredCampaigns(); }
