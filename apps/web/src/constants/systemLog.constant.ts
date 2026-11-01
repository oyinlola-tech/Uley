import { SystemLogEventType } from '../enums/systemLogEventType.enum';
import { SystemLogLevel } from '../enums/systemLogLevel.enum';

export const SYSTEM_LOG_EVENT_FILTERS = [
  [SystemLogEventType.ADMIN_ACTION, 'Administrator action'],
  [SystemLogEventType.PROPERTY_REPORT_SUBMITTED, 'Report submitted'],
  [SystemLogEventType.PROPERTY_REPORT_REVIEWED, 'Report reviewed'],
  [SystemLogEventType.PROPERTY_REPORT_DISMISSED, 'Report dismissed'],
  [SystemLogEventType.API_REQUEST_FAILED, 'API failure'],
  [SystemLogEventType.API_ACCESS_DENIED, 'Access denied'],
  [SystemLogEventType.COMPLAINT_EVENT, 'Housing complaint activity'],
  [SystemLogEventType.PROPERTY_CARETAKER_CHANGED, 'Property caretaker access'],
  [SystemLogEventType.RENTAL_APPLICATION_EVENT, 'Rental application and move-in'],
] as const;

export const SYSTEM_LOG_LEVEL_FILTERS = [
  [SystemLogLevel.INFO, 'Information'],
  [SystemLogLevel.WARNING, 'Warning'],
  [SystemLogLevel.ERROR, 'Error'],
] as const;

export const SYSTEM_LOG_PAGE_SIZE = 50;

export const ADMIN_SYSTEM_LOG_COPY = {
  eyebrow: 'SUPER ADMIN · AUDIT AND INCIDENTS',
  title: 'Trace what happened.',
  description: 'Review administrator actions, student property reports, housing complaint activity, denied access, and API failures. Search by request ID to follow one request from the response to its server log.',
  refresh: 'Refresh logs',
  searchLabel: 'Search summary, request ID, route, target',
  searchPlaceholder: 'Paste a request ID or record ID',
  levelLabel: 'Severity',
  eventLabel: 'Event',
  allLevels: 'All levels',
  allEvents: 'All events',
  applyFilters: 'Apply filters',
  timeline: 'System timeline',
  loading: 'Loading audit events…',
  noResults: 'No events match these filters.',
  matchingEvents: 'matching events',
  unauthenticated: 'Unauthenticated request',
  actionContext: 'Action context',
  previous: 'Previous',
  next: 'Next',
} as const;
