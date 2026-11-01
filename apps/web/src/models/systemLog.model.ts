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

export interface AdminSystemLogResponse {
  logs: AdminSystemLog[];
  pagination: { page: number; pageSize: number; totalCount: number; totalPages: number };
}
