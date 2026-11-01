import { UserRole } from '../../../enums/userRole.enum.js';
import { registerAccountWithRole } from './registerAccount.command.js';
import type { AuthenticatedUserResponse } from './authResponse.dto.js';

export interface RegisterBusinessAdvertiserCommand {
  emailAddress: string;
  fullName: string;
  plainTextPassword: string;
  businessName: string;
  category: string;
  city: string;
  websiteUrl?: string;
}

export async function registerBusinessAdvertiser(command: RegisterBusinessAdvertiserCommand): Promise<AuthenticatedUserResponse> {
  return registerAccountWithRole(command, UserRole.BUSINESS_ADVERTISER);
}
