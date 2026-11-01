import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { ConflictError, NotFoundError } from '../../../errors/app.error.js';
import { submitPropertyForReview as submitProperty } from '../../../repositories/propertyManagement.repository.js';

export async function submitPropertyForReview(propertyId: string, landlordId: string) {
  const result = await submitProperty(propertyId, landlordId);
  if (!result) throw new NotFoundError();
  if (!result.submitted) throw new ConflictError(ERROR_MESSAGES.propertySubmissionRequiresUnit);
  return result.property;
}
