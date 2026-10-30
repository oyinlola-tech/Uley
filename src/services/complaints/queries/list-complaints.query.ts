export interface ListComplaintsQuery {
  requestingUserId: string;
  complaintStatuses?: string[];
  propertyId?: string;
  pageNumber?: number;
  resultsPerPage?: number;
}
