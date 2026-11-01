import type { ReviewDecision } from '../enums/reviewDecision.enum.js';
import type { RentalPeriod } from '../enums/rentalPeriod.enum.js';

export interface CreateLandlordPropertyDto {
  landlordId: string;
  clientDraftId?: string | undefined;
  name: string;
  description: string;
  streetAddress: string;
  neighborhood: string;
  city: string;
  state: string;
  unitName: string;
  rentAmount: number;
  rentalPeriod: RentalPeriod;
  securityDeposit: number;
  monthlyServiceCharge: number;
  inspectionFee: number;
  bedrooms: number;
  bathrooms: number;
  latitude?: number | undefined;
  longitude?: number | undefined;
}

export type UpdateLandlordPropertyDto = Omit<CreateLandlordPropertyDto, 'landlordId' | 'clientDraftId'>;

export interface ReviewVerificationDto {
  reviewerId: string;
  requestId?: string;
  decision: ReviewDecision;
  rejectionReason?: string;
}

