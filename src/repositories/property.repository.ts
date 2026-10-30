import type { PropertyModel } from '../models/property.model.js';

export interface PropertyRepository {
  findPublishedPropertyById(propertyId: string): Promise<PropertyModel | null>;
}
