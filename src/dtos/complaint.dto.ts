import type { ComplaintStatus } from '../enums/complaint-status.enum.js';

export interface OpenComplaintRequestDto {
  propertyId: string;
  occupancyId?: string;
  complaintCategory: string;
  complaintDescription: string;
  isUrgent: boolean;
}

export interface ComplaintResponseDto {
  id: string;
  propertyId: string;
  status: ComplaintStatus;
  createdAt: string;
}
