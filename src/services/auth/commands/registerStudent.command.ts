import { UserRole } from '../../../enums/userRole.enum.js';
import { registerAccountWithRole } from './registerAccount.command.js';
import type { AuthenticatedUserResponse } from './authResponse.dto.js';
import type { UnlistedUniversityDto } from '../../../dtos/unlistedUniversity.dto.js';

export interface RegisterStudentCommand {
  universityId?: string;
  unlistedUniversity?: UnlistedUniversityDto;
  emailAddress: string;
  fullName: string;
  plainTextPassword: string;
}

export async function registerStudentAccount(command: RegisterStudentCommand): Promise<AuthenticatedUserResponse> {
  return registerAccountWithRole(command, UserRole.STUDENT);
}
