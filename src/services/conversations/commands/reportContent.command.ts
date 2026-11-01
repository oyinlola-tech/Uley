import { submitContentReport } from '../../../repositories/contentReport.repository.js';
export async function reportConversationContent(input: Parameters<typeof submitContentReport>[0]) { return submitContentReport(input); }
