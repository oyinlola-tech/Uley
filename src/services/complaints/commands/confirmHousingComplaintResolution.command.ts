import { confirmHousingComplaintResolution } from '../../../repositories/complaintWorkflow.repository.js';
export async function confirmHousingComplaintResolutionByStudent(input: Parameters<typeof confirmHousingComplaintResolution>[0]) { return confirmHousingComplaintResolution(input); }
