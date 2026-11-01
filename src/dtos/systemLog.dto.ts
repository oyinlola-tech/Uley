import type { SystemLogEventType } from '../enums/systemLogEventType.enum.js';
import type { SystemLogLevel } from '../enums/systemLogLevel.enum.js';

export interface ListSystemLogsDto {
  page: number;
  pageSize: number;
  level?: SystemLogLevel;
  eventType?: SystemLogEventType;
  search?: string;
  from?: Date;
  to?: Date;
  offset: number;
}
