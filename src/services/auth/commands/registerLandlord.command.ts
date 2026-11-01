import { UserRole } from '../../../enums/userRole.enum.js';
import { registerAccountWithRole } from './registerAccount.command.js';
import type { AuthenticatedUserResponse } from './authResponse.dto.js';
import type { UnlistedUniversityDto } from '../../../dtos/unlistedUniversity.dto.js';

export interface RegisterLandlordCommand {
  universityId?: string;
  unlistedUniversity?: UnlistedUniversityDto;
  emailAddress: string;
  fullName: string;
  plainTextPassword: string;
}

export async function registerLandlordAccount(command: RegisterLandlordCommand): Promise<AuthenticatedUserResponse> {
  return registerAccountWithRole(command, UserRole.LANDLORD);
}
