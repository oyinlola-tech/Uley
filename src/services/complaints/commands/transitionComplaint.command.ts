import type { ComplaintStatus } from '../../../enums/complaintStatus.enum.js';

export interface TransitionComplaintCommand {
  complaintId: string;
  actingUserId: string;
  requestedNextComplaintStatus: ComplaintStatus;
  reason?: string;
}
