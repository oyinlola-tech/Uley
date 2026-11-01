import { escalateHousingComplaint } from '../../../repositories/complaintWorkflow.repository.js';
export async function escalateHousingComplaintToSchool(input: Parameters<typeof escalateHousingComplaint>[0]) { return escalateHousingComplaint(input); }
