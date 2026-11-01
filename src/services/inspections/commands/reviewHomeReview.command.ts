import { reviewPropertyReview } from '../../../repositories/propertyReview.repository.js';
export async function reviewHomeReview(input: Parameters<typeof reviewPropertyReview>[0]) { return reviewPropertyReview(input); }
