import type { RentalApplicationStatus } from '../enums';

export interface RentalApplicationRecord {
  id: string;
  status: RentalApplicationStatus;
  moveInDate?: string | null;
  studentMessage?: string | null;
  landlordResponse?: string | null;
  createdAt: string;
  student: { fullName: string; email: string };
  property: { id: string; name: string; neighborhood: string; city: string };
  unit: { name: string; rentAmount: string; rentalPeriod: string; securityDeposit: string; inspectionFee: string };
  inspection: { scheduledFor: string };
}

export interface RentalApplicationListResponse {
  applications: RentalApplicationRecord[];
}
