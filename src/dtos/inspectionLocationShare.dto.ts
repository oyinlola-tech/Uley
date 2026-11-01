export interface InspectionLocationPointDto {
  latitude: number;
  longitude: number;
}

export interface InspectionLocationAccessDto {
  inspectionId: string;
  participantId: string;
}

export interface UpdateInspectionLocationDto extends InspectionLocationAccessDto, InspectionLocationPointDto {}
