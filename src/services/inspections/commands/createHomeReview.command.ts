import { createEligiblePropertyReview as insertHomeReview } from '../../../repositories/propertyReview.repository.js';
export async function createEligiblePropertyReview(input: Parameters<typeof insertHomeReview>[0]) { return insertHomeReview(input); }
