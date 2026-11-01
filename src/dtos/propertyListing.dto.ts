import type { RentalPeriod } from '../enums/rentalPeriod.enum.js';

export interface SearchPublicPropertyListingsDto {
  universityId?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  searchText?: string;
  city?: string;
  rentalPeriod: RentalPeriod;
  minimumRentAmount?: number;
  maximumRentAmount?: number;
  minimumBedrooms?: number;
  page: number;
  pageSize: number;
  offset: number;
}
