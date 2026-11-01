import { findSystemLogs } from '../../../repositories/systemLog.repository.js';
import type { ListSystemLogsDto } from '../../../dtos/systemLog.dto.js';

export async function listSystemLogs(query: ListSystemLogsDto) {
  const { logs, totalCount } = await findSystemLogs(query);
  return { logs, pagination: { page: query.page, pageSize: query.pageSize, totalCount, totalPages: Math.ceil(totalCount / query.pageSize) } };
}
