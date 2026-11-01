import { UserRole } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import { USER_PROFILE_LIMITS } from '../constants/profile.constant.js';

const profileUserSelection = {
  id: true,
  fullName: true,
  role: true,
  university: { select: { id: true, name: true, city: true, state: true } },
};

export async function findOrCreateOwnUserProfile(userId: string) {
  return prismaDatabaseClient.userProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: { user: { select: profileUserSelection } },
  });
}

export async function updateOwnUserProfile(userId: string, data: Record<string, unknown>) {
  return prismaDatabaseClient.userProfile.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
    include: { user: { select: profileUserSelection } },
  });
}

export async function findPublicUserProfile(profileId: string, viewerId: string) {
  const blocked = await prismaDatabaseClient.userBlock.findFirst({ where: { OR: [{ blockerId: viewerId, blockedUserId: profileId }, { blockerId: profileId, blockedUserId: viewerId }] }, select: { id: true } });
  if (blocked) return null;
  return prismaDatabaseClient.user.findFirst({
    where: { id: profileId, isActive: true, role: { in: [UserRole.STUDENT, UserRole.LANDLORD] }, profile: { is: { isDiscoverable: true } } },
    select: { ...profileUserSelection, profile: true },
  });
}

export async function searchRoommateProfiles(input: { viewerId: string; city?: string; universityId?: string; maximumBudget?: number; page: number }) {
  const blocks = await prismaDatabaseClient.userBlock.findMany({ where: { OR: [{ blockerId: input.viewerId }, { blockedUserId: input.viewerId }] }, select: { blockerId: true, blockedUserId: true } });
  const hiddenIds = blocks.map((block) => block.blockerId === input.viewerId ? block.blockedUserId : block.blockerId);
  const where = {
    id: { notIn: [input.viewerId, ...hiddenIds] },
    isActive: true,
    role: UserRole.STUDENT,
    profile: { is: { isDiscoverable: true, seekingRoommate: true,
      ...(input.city ? { roommateCity: { contains: input.city, mode: 'insensitive' as const } } : {}),
      ...(input.maximumBudget ? { roommateBudget: { lte: input.maximumBudget } } : {}),
    } },
    ...(input.universityId ? { universityId: input.universityId } : {}),
  };
  const [profiles, totalCount] = await Promise.all([
    prismaDatabaseClient.user.findMany({ where, select: { ...profileUserSelection, profile: true }, skip: (input.page - 1) * USER_PROFILE_LIMITS.profilesPerPage, take: USER_PROFILE_LIMITS.profilesPerPage, orderBy: { profile: { updatedAt: 'desc' } } }),
    prismaDatabaseClient.user.count({ where }),
  ]);
  return { profiles, pagination: { page: input.page, pageSize: USER_PROFILE_LIMITS.profilesPerPage, totalCount, totalPages: Math.ceil(totalCount / USER_PROFILE_LIMITS.profilesPerPage) } };
}
