import type { ComplaintStatus } from '../enums/complaintStatus.enum.js';

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
