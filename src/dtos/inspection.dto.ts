export interface RequestInspectionDto {
  studentId: string;
  unitId: string;
  scheduledFor: Date;
  studentMessage?: string;
}

export interface RespondToInspectionDto {
  inspectionId: string;
  landlordId: string;
  decision: 'CONFIRMED' | 'DECLINED';
  landlordResponse?: string;
}
