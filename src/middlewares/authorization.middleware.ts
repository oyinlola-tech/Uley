import type { FastifyReply, FastifyRequest } from 'fastify';
import { ForbiddenError, UnauthorizedError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import type { UserRole } from '../enums/userRole.enum.js';

export function requireAccountRole(allowedRole: UserRole) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.authenticatedUser) throw new UnauthorizedError();
    if (request.authenticatedUser.userRole !== allowedRole) {
      throw new ForbiddenError(ERROR_MESSAGES.accountRoleRequired(allowedRole.toLowerCase()));
    }
  };
}

export function requireOneOfAccountRoles(allowedRoles: readonly UserRole[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.authenticatedUser) throw new UnauthorizedError();
    if (!allowedRoles.includes(request.authenticatedUser.userRole)) {
      throw new ForbiddenError(ERROR_MESSAGES.accountRoleRequired(allowedRoles.map((role) => role.toLowerCase()).join(' or ')));
    }
  };
}
