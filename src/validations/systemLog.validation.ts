import { z } from 'zod';
import { SystemLogEventType } from '../enums/systemLogEventType.enum.js';
import { SystemLogLevel } from '../enums/systemLogLevel.enum.js';

const listSystemLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
  level: z.nativeEnum(SystemLogLevel).optional(),
  eventType: z.nativeEnum(SystemLogEventType).optional(),
  search: z.string().trim().max(120).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).strict().refine((query) => !query.from || !query.to || query.from <= query.to);

export function parseSystemLogsQuery(query: unknown) {
  return listSystemLogsQuerySchema.safeParse(query);
}
