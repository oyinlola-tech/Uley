export interface SearchPropertiesQuery {
  universityId: string;
  campusLatitude?: number;
  campusLongitude?: number;
  searchRadiusInMeters?: number;
  minimumMonthlyPrice?: number;
  maximumMonthlyPrice?: number;
  minimumBedroomCount?: number;
  pageNumber?: number;
  resultsPerPage?: number;
}
