import { changeFlatmatePostStatus as updateOwnPost } from '../../../repositories/conversation.repository.js';
export async function changeOwnFlatmatePostStatus(input: Parameters<typeof updateOwnPost>[0]) { return updateOwnPost(input); }
