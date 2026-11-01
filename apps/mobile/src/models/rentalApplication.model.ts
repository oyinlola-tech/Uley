import type { RentalApplicationStatus } from '../enums';

export interface RentalApplicationRecord {
  id: string;
  status: RentalApplicationStatus;
  moveInDate?: string | null;
  studentMessage?: string | null;
  landlordResponse?: string | null;
  student: { fullName: string; email: string };
  property: { name: string; neighborhood: string; city: string };
  unit: { name: string; rentAmount: string; rentalPeriod: string; inspectionFee: string; securityDeposit: string };
  inspection: { scheduledFor: string };
}

export interface RentalApplicationListResponse {
  applications: RentalApplicationRecord[];
}
