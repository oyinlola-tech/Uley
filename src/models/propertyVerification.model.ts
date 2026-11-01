import type { VerificationStatus } from '../enums/verificationStatus.enum.js';

export interface PropertyVerificationModel {
  id: string;
  propertyId: string;
  status: VerificationStatus;
  submittedAt: Date;
  reviewedAt: Date | null;
  reviewerId: string | null;
  rejectionReason: string | null;
}
