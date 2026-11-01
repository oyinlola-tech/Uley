import { updateHousingComplaintStatus } from '../../../repositories/complaintWorkflow.repository.js';
export async function changeHousingComplaintStatus(input: Parameters<typeof updateHousingComplaintStatus>[0]) { return updateHousingComplaintStatus(input); }
