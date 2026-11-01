import type { Prisma } from '@prisma/client';
import { prismaDatabaseClient } from '../database/prisma.database.js';
import type { ListSystemLogsDto } from '../dtos/systemLog.dto.js';

export async function findSystemLogs(query: ListSystemLogsDto) {
  const search = query.search?.trim();
  const where: Prisma.SystemLogWhereInput = {
    ...(query.level ? { level: query.level } : {}),
    ...(query.eventType ? { eventType: query.eventType } : {}),
    ...(query.from || query.to ? { occurredAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
    ...(search ? { OR: ['summary', 'requestId', 'route', 'targetId', 'errorCode'].map((field) => ({ [field]: { contains: search, mode: 'insensitive' } })) } : {}),
  };
  const [logs, totalCount] = await Promise.all([
    prismaDatabaseClient.systemLog.findMany({ where, skip: query.offset, take: query.pageSize, orderBy: { occurredAt: 'desc' }, select: {
      id: true, eventType: true, level: true, summary: true, requestId: true, method: true, route: true,
      statusCode: true, errorCode: true, targetType: true, targetId: true, metadata: true, occurredAt: true,
      actor: { select: { id: true, fullName: true, role: true } },
    } }),
    prismaDatabaseClient.systemLog.count({ where }),
  ]);
  return { logs, totalCount };
}
