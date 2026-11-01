import { UserRole } from '../../../enums/userRole.enum.js';
import { registerAccountWithRole } from './registerAccount.command.js';
import type { AuthenticatedUserResponse } from './authResponse.dto.js';

export interface RegisterCaretakerCommand {
  emailAddress: string;
  fullName: string;
  plainTextPassword: string;
}

export async function registerCaretakerAccount(command: RegisterCaretakerCommand): Promise<AuthenticatedUserResponse> {
  return registerAccountWithRole(command, UserRole.CARETAKER);
}
