import { addHousingComplaintMessage } from '../../../repositories/complaintWorkflow.repository.js';
export async function sendHousingComplaintMessage(input: Parameters<typeof addHousingComplaintMessage>[0]) { return addHousingComplaintMessage(input); }
