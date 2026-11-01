import type { PropertyStatus } from '../enums/propertyStatus.enum.js';

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
