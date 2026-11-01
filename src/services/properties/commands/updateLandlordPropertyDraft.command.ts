import type { UpdateLandlordPropertyDto } from '../../../dtos/propertyManagement.dto.js';
import { VerificationStatus } from '../../../enums/verificationStatus.enum.js';
import { ForbiddenError } from '../../../errors/app.error.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { getLandlordVerification } from '../../../repositories/propertyManagement.repository.js';
import { updateLandlordPropertyDraft as saveLandlordPropertyDraft } from '../../../repositories/updateLandlordPropertyDraft.repository.js';

export async function updateLandlordPropertyDraft(command: UpdateLandlordPropertyDto & { propertyId: string; landlordId: string }) {
  const verification = await getLandlordVerification(command.landlordId);
  if (verification?.status !== VerificationStatus.APPROVED) throw new ForbiddenError(ERROR_MESSAGES.landlordVerificationRequired);
  const { propertyId, landlordId, ...propertyInput } = command;
  return saveLandlordPropertyDraft(propertyId, landlordId, propertyInput);
}
