import type { ComplaintStatus } from '../../../enums/complaint-status.enum.js';

export interface TransitionComplaintCommand {
  complaintId: string;
  actingUserId: string;
  requestedNextComplaintStatus: ComplaintStatus;
  reason?: string;
}
