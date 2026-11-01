import { AccountRole } from '../enums/accountRole.enum';
import { SystemLogLevel } from '../enums/systemLogLevel.enum';

export const ADMIN_MOBILE_NAVIGATION = [
  { route: '/admin', label: 'Overview', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.VERIFICATION_ADMIN, AccountRole.SAFETY_ADMIN, AccountRole.INSPECTION_ADMIN, AccountRole.ACCOUNT_ADMIN] },
  { route: '/admin/reviews', label: 'Reviews', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.VERIFICATION_ADMIN] },
  { route: '/admin/reports', label: 'Reports', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.SAFETY_ADMIN] },
  { route: '/admin/complaints', label: 'Complaints', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.SAFETY_ADMIN] },
  { route: '/admin/chat-moderation', label: 'Chat safety', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.SAFETY_ADMIN] },
  { route: '/admin/sponsored-campaigns', label: 'Sponsored homes', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.SAFETY_ADMIN] },
  { route: '/admin/properties', label: 'Listings', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.SAFETY_ADMIN] },
  { route: '/admin/inspections', label: 'Visits', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.INSPECTION_ADMIN] },
  { route: '/admin/accounts', label: 'Accounts', roles: [AccountRole.SUPER_ADMIN, AccountRole.SCHOOL_ADMIN, AccountRole.ACCOUNT_ADMIN] },
  { route: '/admin/staff', label: 'Staff', roles: [AccountRole.SUPER_ADMIN] },
  { route: '/admin/logs', label: 'Logs', roles: [AccountRole.SUPER_ADMIN] },
] as const;

export const ADMIN_MOBILE_STAFF_ROLES = [AccountRole.SCHOOL_ADMIN, AccountRole.VERIFICATION_ADMIN, AccountRole.SAFETY_ADMIN, AccountRole.INSPECTION_ADMIN, AccountRole.ACCOUNT_ADMIN] as const;

export const ADMIN_MOBILE_STAFF_ROLE_LABELS: Record<(typeof ADMIN_MOBILE_STAFF_ROLES)[number], string> = {
  [AccountRole.SCHOOL_ADMIN]: 'School administrator',
  [AccountRole.VERIFICATION_ADMIN]: 'Verification administrator',
  [AccountRole.SAFETY_ADMIN]: 'Safety administrator',
  [AccountRole.INSPECTION_ADMIN]: 'Inspection administrator',
  [AccountRole.ACCOUNT_ADMIN]: 'Account administrator',
};

export const ADMIN_MOBILE_LIMITS = {
  reasonMinimumLength: 10,
  reasonMaximumLength: 500,
  staffPasswordMinimumLength: 16,
  staffPasswordMaximumLength: 128,
} as const;

export const ADMIN_MOBILE_LOG_LEVELS = ['ALL', SystemLogLevel.ERROR, SystemLogLevel.WARNING, SystemLogLevel.INFO] as const;
export const MOBILE_ADMIN_LOG_PAGE_SIZE = 50;
export const MOBILE_ADMIN_LOG_COPY = {
  title: 'Audit and system logs',
  intro: 'Trace actions, property reports, access denials, and API failures. Give support the request ID shown here to locate a server error.',
  searchLabel: 'Search summary, request ID, route or target',
  searchPlaceholder: 'Paste a request or record ID',
  searchButton: 'Search logs',
  refresh: 'Refresh',
  noResults: 'No events match these filters.',
  loading: 'Loading timeline…',
  unauthenticated: 'Unauthenticated request',
  previous: 'Previous',
  next: 'Next',
} as const;
