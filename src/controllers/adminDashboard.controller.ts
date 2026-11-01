import type { FastifyReply, FastifyRequest } from 'fastify';
import { ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { changeAdminManagedAccountStatus, changeAdminManagedPropertyStatus, getAdminDashboardOverview, listAdminManagedAccounts, listAdminManagedProperties, listOpenReportedProperties, listInspectionRequestsForSchoolReview, reviewReportedProperty, submitReportAboutProperty } from '../services/admin/index.js';
import { adminAccountStatusSchema, adminPropertyStatusSchema, reviewPropertyReportSchema, submitPropertyReportSchema } from '../validations/admin.validation.js';
import { adminStaffStatusSchema, createAdminStaffSchema } from '../validations/admin.validation.js';
import { changeAdministratorStaffStatus, createAdministratorStaff, listAdministratorStaff } from '../services/admin/index.js';

export async function getAdminDashboard(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ ...(await getAdminDashboardOverview()), administrator: request.authenticatedUser?.fullName });
}

export async function getAdminAccounts(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ accounts: await listAdminManagedAccounts() });
}

export async function updateAdminAccountStatus(request: FastifyRequest, reply: FastifyReply) {
  const body = adminAccountStatusSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message ?? ERROR_MESSAGES.validationFailed);
  const { userId } = request.params as { userId: string };
  return reply.send({ account: await changeAdminManagedAccountStatus({ ...body.data, userId, adminId: request.authenticatedUser!.id, requestId: request.id }) });
}

export async function getAdminProperties(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ properties: await listAdminManagedProperties() });
}

export async function updateAdminPropertyStatus(request: FastifyRequest, reply: FastifyReply) {
  const body = adminPropertyStatusSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message ?? ERROR_MESSAGES.validationFailed);
  const { propertyId } = request.params as { propertyId: string };
  return reply.send({ property: await changeAdminManagedPropertyStatus({ ...body.data, propertyId, adminId: request.authenticatedUser!.id, requestId: request.id }) });
}

export async function getOpenPropertyReports(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ reports: await listOpenReportedProperties() });
}

export async function getAdminStaff(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ staff: await listAdministratorStaff() });
}

export async function createAdminStaffFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = createAdminStaffSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message ?? ERROR_MESSAGES.validationFailed);
  return reply.code(201).send({ staff: await createAdministratorStaff({ ...body.data, actorId: request.authenticatedUser!.id, requestId: request.id }) });
}

export async function updateAdminStaffStatus(request: FastifyRequest, reply: FastifyReply) {
  const body = adminStaffStatusSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message ?? ERROR_MESSAGES.validationFailed);
  const { userId } = request.params as { userId: string };
  return reply.send({ staff: await changeAdministratorStaffStatus({ ...body.data, userId, actorId: request.authenticatedUser!.id, requestId: request.id }) });
}

export async function getAdminInspections(_request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ inspections: await listInspectionRequestsForSchoolReview() });
}

export async function createPropertyReport(request: FastifyRequest, reply: FastifyReply) {
  const body = submitPropertyReportSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message ?? ERROR_MESSAGES.validationFailed);
  return reply.code(201).send({ report: await submitReportAboutProperty({ ...body.data, reporterId: request.authenticatedUser!.id, requestId: request.id }) });
}

export async function reviewPropertyReportFromRequest(request: FastifyRequest, reply: FastifyReply) {
  const body = reviewPropertyReportSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message ?? ERROR_MESSAGES.validationFailed);
  const { reportId } = request.params as { reportId: string };
  return reply.send({ report: await reviewReportedProperty({ ...body.data, reportId, adminId: request.authenticatedUser!.id, requestId: request.id }) });
}
