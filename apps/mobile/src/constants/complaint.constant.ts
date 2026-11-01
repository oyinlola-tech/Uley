import { ComplaintCategory } from '../enums/complaintStatus.enum';
export const MOBILE_COMPLAINT_CATEGORIES = Object.values(ComplaintCategory);
export const MOBILE_COMPLAINT_VIDEO_LIMITS = { maximumBytes: 20 * 1024 * 1024, maximumDurationSeconds: 90, maximumCount: 3 } as const;
export const MOBILE_COMPLAINT_COPY = {
  studentIntro: 'Normal issues go to your landlord first. Urgent safety issues can go straight to school support.',
  landlordIntro: 'A resolved complaint closes only after the student confirms the issue is fixed.',
  adminIntro: 'Urgent and escalated cases are prioritized. Record decisions for the student and audit log.',
} as const;
