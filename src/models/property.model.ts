import type { PropertyStatus } from '../enums/property-status.enum.js';

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
