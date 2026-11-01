export interface ComplaintNotificationJobPayload {
  complaintId: string;
  recipientUserIds: string[];
  notificationReason: string;
}
