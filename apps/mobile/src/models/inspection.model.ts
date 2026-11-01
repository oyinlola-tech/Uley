import type { InspectionStatus } from '../enums/inspectionStatus.enum';

export interface InspectionRecord {
  id: string;
  status: InspectionStatus;
  scheduledFor: string;
  studentMessage?: string | null;
  landlordResponse?: string | null;
  property: { id: string; name: string; streetAddress: string; neighborhood: string; city: string };
  unit: { id: string; name: string; rentAmount: string; rentalPeriod: string };
  student?: { id: string; fullName: string; email: string };
  feedback?: { outcome: string; comment?: string | null } | null;
  occupancy?: { id: string; status: string; paymentConfirmedAt?: string | null; review?: { id: string; status: string } | null } | null;
  rentalApplication?: { id: string; status: string } | null;
  rescheduleRequests?: { id: string; proposedFor: string; message?: string | null; status: string }[];
}
