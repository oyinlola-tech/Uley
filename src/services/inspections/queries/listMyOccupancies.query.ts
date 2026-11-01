import { findStudentOccupancies } from '../../../repositories/occupancy.repository.js';

export async function listMyOccupancies(studentId: string) {
  return findStudentOccupancies(studentId);
}
