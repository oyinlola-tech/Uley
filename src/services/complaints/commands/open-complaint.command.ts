export interface OpenComplaintCommand {
  reportingStudentUserId: string;
  propertyId: string;
  occupancyId?: string;
  complaintCategory: string;
  complaintDescription: string;
  isUrgent: boolean;
  shouldEscalateDirectlyToSchool: boolean;
  evidenceFileIds?: string[];
}
