import type { ComplaintCategory, ComplaintStatus } from '../enums/complaintStatus.enum.js';

export interface ComplaintModel {
  id: string;
  reporterId: string;
  propertyId: string;
  occupancyId: string;
  category: ComplaintCategory;
  description: string;
  isUrgent: boolean;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
  resolutionSummary: string | null;
  resolvedAt: Date | null;
  closedAt: Date | null;
  reviewedAt: Date | null;
  reviewerId: string | null;
}
