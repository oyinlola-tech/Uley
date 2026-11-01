import type { CreateLandlordPropertyDto } from '../../../dtos/propertyManagement.dto.js';
import { createLandlordProperty as saveLandlordProperty } from '../../../repositories/propertyManagement.repository.js';
import { getLandlordVerification } from '../../../repositories/propertyManagement.repository.js';
import { VerificationStatus } from '../../../enums/verificationStatus.enum.js';
import { ForbiddenError } from '../../../errors/app.error.js';
import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';

export async function createLandlordProperty(command: CreateLandlordPropertyDto) {
  const landlordVerification = await getLandlordVerification(command.landlordId);
  if (landlordVerification?.status !== VerificationStatus.APPROVED) {
    throw new ForbiddenError(ERROR_MESSAGES.landlordVerificationRequired);
  }
  return saveLandlordProperty(command);
}
