import { MOBILE_API_ENDPOINTS } from '../constants';
import type { AdminRecord, AdminVerificationFeed, AdminInspectionFeed, AdminReportFeed, AdminPropertyFeed, AdminAccountFeed } from '../models';

export function mapPendingVerificationRecords(feed: AdminVerificationFeed): AdminRecord[] {
  const landlords = feed.landlordVerifications.map((item) => ({ id: item.id, title: `Landlord · ${item.landlord.fullName}`, detail: item.landlord.email, metadata: `Submitted ${new Date(item.submittedAt).toLocaleDateString()}`, actions: [{ label: 'Approve', endpoint: `${MOBILE_API_ENDPOINTS.adminLandlordReviews}/${item.landlordId}${MOBILE_API_ENDPOINTS.verificationReviewAction}`, body: { decision: 'APPROVED' } }, { label: 'Reject', endpoint: `${MOBILE_API_ENDPOINTS.adminLandlordReviews}/${item.landlordId}${MOBILE_API_ENDPOINTS.verificationReviewAction}`, body: { decision: 'REJECTED' }, reasonField: 'rejectionReason' as const }] }));
  const properties = feed.propertyVerifications.map((item) => ({ id: item.id, title: `Property · ${item.property.name}`, detail: `${item.property.city} · ${item.property.landlord.fullName} · ${item.property.landlord.email}`, metadata: `${item.property.units.length} unit(s) · Submitted ${new Date(item.submittedAt).toLocaleDateString()}`, images: item.property.images, actions: [{ label: 'Approve', endpoint: `${MOBILE_API_ENDPOINTS.adminPropertyReviews}/${item.propertyId}${MOBILE_API_ENDPOINTS.verificationReviewAction}`, body: { decision: 'APPROVED' } }, { label: 'Reject', endpoint: `${MOBILE_API_ENDPOINTS.adminPropertyReviews}/${item.propertyId}${MOBILE_API_ENDPOINTS.verificationReviewAction}`, body: { decision: 'REJECTED' }, reasonField: 'rejectionReason' as const }] }));
  return [...landlords, ...properties];
}

export function mapInspectionRecords(records: AdminInspectionFeed[]): AdminRecord[] {
  return records.map((item) => ({ id: item.id, title: `${item.property.name} · ${item.unit.name}`, detail: `${item.property.city} · Student ${item.student.fullName} · Landlord ${item.property.landlord.fullName}`, metadata: `${item.status.replaceAll('_', ' ')} · ${new Date(item.scheduledFor).toLocaleString()} · ₦${Number(item.unit.rentAmount).toLocaleString()} per ${item.unit.rentalPeriod.toLowerCase()}` }));
}

export function mapReportRecords(records: AdminReportFeed[]): AdminRecord[] {
  return records.map((item) => ({ id: item.id, title: `${item.category.replaceAll('_', ' ')} · ${item.property.name}`, detail: `${item.description} · ${item.property.city} · Reported by ${item.reporter.fullName}`, metadata: `Submitted ${new Date(item.createdAt).toLocaleDateString()}`, actions: [{ label: 'Mark reviewed', endpoint: `${MOBILE_API_ENDPOINTS.adminReports}/${item.id}${MOBILE_API_ENDPOINTS.adminReportReviewAction}`, body: { status: 'REVIEWED' }, reasonField: 'reason' as const }, { label: 'Dismiss report', endpoint: `${MOBILE_API_ENDPOINTS.adminReports}/${item.id}${MOBILE_API_ENDPOINTS.adminReportReviewAction}`, body: { status: 'DISMISSED' }, reasonField: 'reason' as const }] }));
}

export function mapPropertyRecords(records: AdminPropertyFeed[]): AdminRecord[] {
  return records.map((item) => ({ id: item.id, title: `${item.name} · ${item.city}`, detail: `Landlord ${item.landlord.fullName} (${item.landlord.isActive ? 'active' : 'suspended'}) · ${item.units.filter((unit) => unit.isAvailable).length} available unit(s)`, metadata: `${item.status.replaceAll('_', ' ')} · Verification ${item.verification?.status ?? 'not submitted'}`, actions: item.status === 'PUBLISHED' || item.status === 'SUSPENDED' ? [{ label: item.status === 'PUBLISHED' ? 'Suspend listing' : 'Restore listing', endpoint: `${MOBILE_API_ENDPOINTS.adminProperties}/${item.id}${MOBILE_API_ENDPOINTS.adminPropertyStatusAction}`, body: { action: item.status === 'PUBLISHED' ? 'SUSPEND' : 'RESTORE' }, reasonField: 'reason' as const }] : [] }));
}

export function mapAccountRecords(records: AdminAccountFeed[], isStaff = false): AdminRecord[] {
  return records.map((item) => ({ id: item.id, title: item.fullName, detail: item.email, metadata: `${item.role.replaceAll('_', ' ')} · ${item.isActive ? 'Active' : 'Suspended'} · Joined ${new Date(item.createdAt).toLocaleDateString()}`, actions: item.role === 'SUPER_ADMIN' ? [] : [{ label: item.isActive ? 'Suspend access' : 'Restore access', endpoint: `${isStaff ? MOBILE_API_ENDPOINTS.adminStaff : MOBILE_API_ENDPOINTS.adminAccounts}/${item.id}${isStaff ? MOBILE_API_ENDPOINTS.adminStaffStatusAction : MOBILE_API_ENDPOINTS.adminAccountStatusAction}`, body: { isActive: !item.isActive }, ...(!isStaff ? { reasonField: 'reason' as const } : {}) }] }));
}
