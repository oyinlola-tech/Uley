import type { InspectionFeedbackOutcome, InspectionRescheduleStatus } from '@prisma/client';

export interface RequestInspectionRescheduleDto {
  inspectionId: string;
  studentId: string;
  proposedFor: Date;
  message?: string;
}

export interface RespondToInspectionRescheduleDto {
  requestId: string;
  landlordId: string;
  decision: InspectionRescheduleStatus;
  response?: string;
}

export interface SubmitInspectionFeedbackDto {
  inspectionId: string;
  studentId: string;
  outcome: InspectionFeedbackOutcome;
  comment?: string;
  moveInDate?: Date;
  paymentReported: boolean;
}
