import { reviewReportedContent } from '../../../repositories/contentReport.repository.js';
import { decideFlaggedMessage } from '../../../repositories/conversation.repository.js';
export async function reviewContentReport(input: Parameters<typeof reviewReportedContent>[0]) { return reviewReportedContent(input); }
export async function reviewFlaggedMessage(input: Parameters<typeof decideFlaggedMessage>[0]) { return decideFlaggedMessage(input); }
