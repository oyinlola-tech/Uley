import type { RentalPeriod } from '../enums/rentalPeriod.enum';

export type LocalPropertyDraft = {
  clientDraftId: string;
  propertyId?: string;
  name: string;
  description: string;
  streetAddress: string;
  neighborhood: string;
  city: string;
  state: string;
  unitName: string;
  rentAmount: string;
  rentalPeriod: RentalPeriod;
  securityDeposit: string;
  monthlyServiceCharge: string;
  inspectionFee: string;
  bedrooms: string;
  bathrooms: string;
  latitude?: number;
  longitude?: number;
  savedAt: string;
};
