import { createFlatmateSearchPost } from '../../../repositories/conversation.repository.js';
export async function createFlatmatePost(input: Parameters<typeof createFlatmateSearchPost>[0]) { return createFlatmateSearchPost(input); }
