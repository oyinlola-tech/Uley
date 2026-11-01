import type { Prisma } from '@prisma/client';
import type { SystemLogEventType } from '../enums/systemLogEventType.enum.js';
import type { SystemLogLevel } from '../enums/systemLogLevel.enum.js';

type SystemLogWriter = Pick<Prisma.TransactionClient, 'systemLog'>;

export interface WriteSystemLogEntryInput {
  eventType: SystemLogEventType;
  level?: SystemLogLevel;
  summary: string;
  requestId?: string;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  method?: string;
  route?: string;
  statusCode?: number;
  errorCode?: string;
  metadata?: Prisma.InputJsonValue;
}

export function writeSystemLogEntry(writer: SystemLogWriter, input: WriteSystemLogEntryInput) {
  return writer.systemLog.create({ data: {
    eventType: input.eventType,
    level: input.level ?? 'INFO',
    summary: input.summary,
    ...(input.requestId ? { requestId: input.requestId } : {}),
    ...(input.actorId ? { actorId: input.actorId } : {}),
    ...(input.targetType ? { targetType: input.targetType } : {}),
    ...(input.targetId ? { targetId: input.targetId } : {}),
    ...(input.method ? { method: input.method } : {}),
    ...(input.route ? { route: input.route } : {}),
    ...(input.statusCode ? { statusCode: input.statusCode } : {}),
    ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    ...(input.metadata ? { metadata: input.metadata } : {}),
  } });
}
