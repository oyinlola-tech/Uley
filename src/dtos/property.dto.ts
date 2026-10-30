import type { PropertyStatus } from '../enums/property-status.enum.js';

export interface CreatePropertyRequestDto {
  propertyName: string;
  propertyDescription: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
}

export interface PropertyResponseDto {
  id: string;
  propertyName: string;
  propertyDescription: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
  status: PropertyStatus;
}
