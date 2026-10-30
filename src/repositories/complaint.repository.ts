import type { ComplaintModel } from '../models/complaint.model.js';

export interface ComplaintRepository {
  findComplaintById(complaintId: string): Promise<ComplaintModel | null>;
}
