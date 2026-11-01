import { findStudentInspections } from '../../../repositories/inspection.repository.js';

export async function listStudentInspectionRequests(studentId: string) {
  return findStudentInspections(studentId);
}
