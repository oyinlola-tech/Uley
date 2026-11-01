export interface CreatePropertyCommand {
  landlordUserId: string;
  propertyName: string;
  propertyDescription: string;
  streetAddress: string;
  latitude: number;
  longitude: number;
}
