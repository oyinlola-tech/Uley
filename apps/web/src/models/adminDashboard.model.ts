export interface AdminDashboardResponse {
  administrator: string;
  metrics: {
    students: number;
    landlords: number;
    publishedProperties: number;
    suspendedProperties: number;
    pendingLandlords: number;
    pendingProperties: number;
    pendingInspections: number;
    openReports: number;
  };
  recentActions: Array<{ id: string; actionType: string; targetType: string; targetId: string; reason: string; createdAt: string; actor: { fullName: string } }>;
}

export interface AdminAccount {
  id: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminProperty {
  id: string;
  name: string;
  city: string;
  status: string;
  updatedAt: string;
  landlord: { id: string; fullName: string; email: string; isActive: boolean };
  verification: { status: string } | null;
  units: Array<{ id: string; name: string; isAvailable: boolean; rentAmount: string; rentalPeriod: string }>;
}

export interface AdminPropertyReport {
  id: string;
  category: string;
  description: string;
  createdAt: string;
  property: { name: string; city: string; status: string };
  reporter: { fullName: string; email: string };
}

export interface AdminInspection {
  id: string;
  scheduledFor: string;
  status: string;
  student: { fullName: string; email: string };
  property: { name: string; city: string; landlord: { fullName: string } };
  unit: { name: string; rentAmount: string; rentalPeriod: string };
}
