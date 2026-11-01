import type { ComplaintCategory } from '../../../enums/complaintStatus.enum.js';
export interface OpenComplaintCommand {
  reportingStudentUserId: string;
  occupancyId: string;
  category: ComplaintCategory;
  description: string;
  isUrgent: boolean;
}
