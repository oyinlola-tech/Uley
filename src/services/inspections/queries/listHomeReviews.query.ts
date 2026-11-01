import { findPublicPropertyReviews } from '../../../repositories/propertyReview.repository.js';
export async function getPublicHomeReviews(propertyId: string) { return findPublicPropertyReviews(propertyId); }
