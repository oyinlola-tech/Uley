export interface AdminDashboardData {
  administrator: string;
  metrics: Record<string, number>;
  recentActions: Array<{ id: string; actionType: string; targetType: string; reason: string; createdAt: string; actor: { fullName: string } }>;
}

export interface AdminRecord {
  id: string;
  title: string;
  detail: string;
  metadata: string;
  images?: Array<{ imageUrl: string; altText: string }>;
  actions?: AdminRecordAction[];
}

export interface AdminRecordAction {
  label: string;
  endpoint: string;
  body: Record<string, unknown>;
  reasonField?: 'reason' | 'rejectionReason';
}

export interface AdminVerificationFeed {
  landlordVerifications: Array<{ id: string; landlordId: string; submittedAt: string; landlord: { fullName: string; email: string } }>;
  propertyVerifications: Array<{ id: string; propertyId: string; submittedAt: string; property: { name: string; city: string; images: Array<{ imageUrl: string; altText: string }>; landlord: { fullName: string; email: string }; units: Array<{ name: string; rentAmount: string; rentalPeriod: string }> } }>;
}

export interface AdminInspectionFeed {
  id: string;
  status: string;
  scheduledFor: string;
  student: { fullName: string; email: string };
  property: { name: string; city: string; landlord: { fullName: string } };
  unit: { name: string; rentAmount: string; rentalPeriod: string };
}

export interface AdminReportFeed {
  id: string;
  category: string;
  description: string;
  createdAt: string;
  property: { name: string; city: string; status: string };
  reporter: { fullName: string; email: string };
}

export interface AdminPropertyFeed {
  id: string;
  name: string;
  city: string;
  status: string;
  landlord: { fullName: string; isActive: boolean };
  verification: { status: string } | null;
  units: Array<{ name: string; isAvailable: boolean; rentAmount: string; rentalPeriod: string }>;
}

export interface AdminAccountFeed {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminStaffFeed extends AdminAccountFeed {}

export interface AdminSystemLog {
  id: string;
  eventType: string;
  level: string;
  summary: string;
  requestId: string | null;
  method: string | null;
  route: string | null;
  statusCode: number | null;
  errorCode: string | null;
  targetType: string | null;
  targetId: string | null;
  metadata: unknown;
  occurredAt: string;
  actor: { id: string; fullName: string; role: string } | null;
}

export interface AdminSystemLogsData {
  logs: AdminSystemLog[];
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
}
