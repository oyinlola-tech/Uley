import { ERROR_MESSAGES } from '../../../errors/errorMessages.js';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../../enums/userRole.enum.js';
import { ConflictError } from '../../../errors/app.error.js';
import { AuthRepository } from '../../../repositories/auth.repository.js';
import { hashAccountPassword } from '../../../utils/password.js';
import { mapDatabaseUserToAuthenticatedUserResponse } from './authResponse.dto.js';
import type { AuthenticatedUserResponse } from './authResponse.dto.js';
import type { RegisterLandlordCommand } from './registerLandlord.command.js';
import type { RegisterStudentCommand } from './registerStudent.command.js';
import type { RegisterBusinessAdvertiserCommand } from './registerBusinessAdvertiser.command.js';
import type { RegisterCaretakerCommand } from './registerCaretaker.command.js';

const authRepository = new AuthRepository();

export async function registerAccountWithRole(
  command: RegisterStudentCommand | RegisterLandlordCommand | RegisterBusinessAdvertiserCommand | RegisterCaretakerCommand,
  userRole: UserRole,
): Promise<AuthenticatedUserResponse> {
  const passwordHash = await hashAccountPassword(command.plainTextPassword);
  try {
    const registrationDetails = {
      ...('universityId' in command && command.universityId ? { universityId: command.universityId } : {}),
      ...('unlistedUniversity' in command && command.unlistedUniversity ? { unlistedUniversity: command.unlistedUniversity } : {}),
      ...('businessName' in command ? { businessProfile: { businessName: command.businessName, category: command.category, city: command.city, ...(command.websiteUrl ? { websiteUrl: command.websiteUrl } : {}) } } : {}),
    };
    const createdUser = await authRepository.createRegisteredUser({
      email: command.emailAddress,
      fullName: command.fullName,
      passwordHash,
      role: userRole,
      ...registrationDetails,
    });
    if (!createdUser) throw new ConflictError(ERROR_MESSAGES.universitySelectionUnavailable);
    return mapDatabaseUserToAuthenticatedUserResponse(createdUser);
  } catch (databaseError) {
    if (databaseError instanceof Prisma.PrismaClientKnownRequestError && databaseError.code === 'P2002') {
      throw new ConflictError(ERROR_MESSAGES.duplicateAccount);
    }
    throw databaseError;
  }
}
