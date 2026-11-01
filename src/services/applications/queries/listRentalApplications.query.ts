import { listLandlordRentalApplications, listStudentRentalApplications } from '../../../repositories/rentalApplication.repository.js';

export function listMyRentalApplications(studentId: string) {
  return listStudentRentalApplications(studentId);
}

export function listLandlordApplications(landlordId: string) {
  return listLandlordRentalApplications(landlordId);
}
