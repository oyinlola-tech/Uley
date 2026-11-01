import type { FastifyReply, FastifyRequest } from "fastify";
import { ValidationError } from "../errors/app.error.js";
import { listSystemLogs } from "../services/admin/index.js";
import { parseSystemLogsQuery } from "../validations/systemLog.validation.js";

export async function getSystemLogs(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const parsedQuery = parseSystemLogsQuery(request.query);
  if (!parsedQuery.success) throw new ValidationError();
  const query = parsedQuery.data;
  return reply.send(
    await listSystemLogs({
      page: query.page,
      pageSize: query.pageSize,
      offset: (query.page - 1) * query.pageSize,
      ...(query.level ? { level: query.level } : {}),
      ...(query.eventType ? { eventType: query.eventType } : {}),
      ...(query.search ? { search: query.search } : {}),
      ...(query.from ? { from: query.from } : {}),
      ...(query.to ? { to: query.to } : {}),
    }),
  );
}
