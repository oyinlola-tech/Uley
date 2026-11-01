import { findPendingPropertyReviews } from '../../../repositories/propertyReview.repository.js';
export async function getReviewModerationQueue() { return findPendingPropertyReviews(); }
