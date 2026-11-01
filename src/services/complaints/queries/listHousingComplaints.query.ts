import { listMyHousingComplaints, listSchoolHousingComplaints } from '../../../repositories/complaintWorkflow.repository.js';
import type { UserRole } from '../../../enums/userRole.enum.js';
import { signHousingComplaintEvidence } from './signHousingComplaintEvidence.query.js';
export async function listHousingComplaintsForUser(input: { userId: string; role: UserRole; page: number }) {
  const result = await listMyHousingComplaints(input);
  return { ...result, complaints: await signHousingComplaintEvidence(result.complaints) };
}
export async function listHousingComplaintsForSchool(input: { page: number }) {
  const result = await listSchoolHousingComplaints(input);
  return { ...result, complaints: await signHousingComplaintEvidence(result.complaints) };
}
