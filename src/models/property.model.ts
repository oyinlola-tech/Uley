import type { PropertyStatus } from '../enums/propertyStatus.enum.js';

export interface PropertyModel {
  id: string;
  landlordId: string;
  name: string;
  description: string;
  address: string;
  latitude: number;
  longitude: number;
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;
}
