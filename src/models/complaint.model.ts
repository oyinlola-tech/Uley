import type { ComplaintStatus } from '../enums/complaint-status.enum.js';

export interface ComplaintModel {
  id: string;
  reporterId: string;
  propertyId: string;
  occupancyId: string | null;
  category: string;
  description: string;
  isUrgent: boolean;
  status: ComplaintStatus;
  createdAt: Date;
  updatedAt: Date;
}
