import type { FastifyReply, FastifyRequest } from 'fastify';
import { ConversationType, UserRole } from '@prisma/client';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { getOwnUserProfile, getPublicUserProfile, saveUserProfile, searchRoommateProfiles } from '../services/profiles/index.js';
import { startConversation } from '../services/conversations/index.js';
import { searchUserProfilesSchema, updateUserProfileSchema } from '../validations/profile.validation.js';

export async function getMyProfile(request: FastifyRequest, reply: FastifyReply) {
  const user = requireProfileMember(request);
  return reply.send({ profile: await getOwnUserProfile(user.id) });
}

export async function updateMyProfile(request: FastifyRequest, reply: FastifyReply) {
  const user = requireProfileMember(request);
  const parsed = updateUserProfileSchema.safeParse(request.body);
  if (!parsed.success) throw new ValidationError();
  const data = Object.fromEntries(Object.entries(parsed.data).map(([key, value]) => [key, value === '' ? null : value]));
  return reply.send({ profile: await saveUserProfile(user.id, data) });
}

export async function getPublicProfile(request: FastifyRequest, reply: FastifyReply) {
  const user = requireStudentViewer(request);
  const { profileId } = request.params as { profileId: string };
  const profile = await getPublicUserProfile(profileId, user.id);
  if (!profile) throw new NotFoundError(ERROR_MESSAGES.profileUnavailable);
  return reply.send({ profile });
}

export async function findRoommateProfiles(request: FastifyRequest, reply: FastifyReply) {
  const user = requireStudentViewer(request);
  const parsed = searchUserProfilesSchema.safeParse(request.query);
  if (!parsed.success) throw new ValidationError();
  return reply.send(await searchRoommateProfiles({ viewerId: user.id, page: parsed.data.page,
    ...(parsed.data.city ? { city: parsed.data.city } : {}),
    ...(parsed.data.universityId || user.universityId ? { universityId: parsed.data.universityId ?? user.universityId! } : {}),
    ...(parsed.data.maximumBudget ? { maximumBudget: parsed.data.maximumBudget } : {}),
  }));
}

export async function startProfileConversation(request: FastifyRequest, reply: FastifyReply) {
  const user = requireStudentViewer(request);
  const { profileId } = request.params as { profileId: string };
  const conversation = await startConversation({ userId: user.id, userRole: user.userRole, type: ConversationType.DIRECT, targetUserId: profileId });
  return reply.code(201).send({ conversation });
}

function requireProfileMember(request: FastifyRequest) {
  const user = request.authenticatedUser;
  if (!user || (user.userRole !== UserRole.STUDENT && user.userRole !== UserRole.LANDLORD)) throw new ForbiddenError(ERROR_MESSAGES.unauthorized);
  return user;
}

function requireStudentViewer(request: FastifyRequest) {
  const user = requireProfileMember(request);
  if (user.userRole !== UserRole.STUDENT) throw new ForbiddenError(ERROR_MESSAGES.accountRoleRequired('student'));
  return user;
}
