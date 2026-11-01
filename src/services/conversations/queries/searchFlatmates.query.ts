import { searchFlatmatePosts } from '../../../repositories/conversation.repository.js';
export async function searchFlatmatePostsForUser(input: Parameters<typeof searchFlatmatePosts>[0]) { return searchFlatmatePosts(input); }
