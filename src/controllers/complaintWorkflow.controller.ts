import type { FastifyReply, FastifyRequest } from 'fastify';
import { ComplaintStatus } from '@prisma/client';
import { ConflictError, ForbiddenError, PayloadTooLargeError, ValidationError } from '../errors/app.error.js';
import { ERROR_MESSAGES } from '../errors/errorMessages.js';
import { COMPLAINT_LIMITS } from '../constants/complaint.constant.js';
import { listHousingComplaintsForSchool, listHousingComplaintsForUser, openHousingComplaint, changeHousingComplaintStatus, confirmHousingComplaintResolutionByStudent, escalateHousingComplaintToSchool, sendHousingComplaintMessage, queueHousingComplaintVideoEvidence, getHousingComplaintVideoScanStatus } from '../services/complaints/index.js';
import { complaintMessageSchema, complaintPageSchema, confirmComplaintResolutionSchema, createComplaintSchema, updateComplaintStatusSchema } from '../validations/complaint.validation.js';

export async function createComplaint(request: FastifyRequest, reply: FastifyReply) {
  const body = createComplaintSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const complaint = await openHousingComplaint({ studentId: actorId(request), ...body.data });
  return reply.code(201).send({ complaint });
}

export async function getMyComplaints(request: FastifyRequest, reply: FastifyReply) {
  const query = complaintPageSchema.safeParse(request.query);
  if (!query.success) throw new ValidationError();
  const actor = request.authenticatedUser;
  if (!actor) throw new ForbiddenError();
  return reply.send(await listHousingComplaintsForUser({ userId: actor.id, role: actor.userRole, page: query.data.page }));
}

export async function getSchoolComplaints(request: FastifyRequest, reply: FastifyReply) {
  const query = complaintPageSchema.safeParse(request.query);
  if (!query.success) throw new ValidationError();
  return reply.send(await listHousingComplaintsForSchool({ page: query.data.page }));
}

export async function updateLandlordComplaint(request: FastifyRequest, reply: FastifyReply) {
  return updateComplaintStatus(request, reply);
}
export async function updateSchoolComplaint(request: FastifyRequest, reply: FastifyReply) {
  return updateComplaintStatus(request, reply);
}

async function updateComplaintStatus(request: FastifyRequest, reply: FastifyReply) {
  const body = updateComplaintStatusSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const actor = request.authenticatedUser;
  if (!actor) throw new ForbiddenError();
  const complaint = await changeHousingComplaintStatus({ complaintId: routeId(request), actorId: actor.id, actorRole: actor.userRole, status: body.data.status as ComplaintStatus, ...(body.data.note ? { note: body.data.note } : {}), requestId: request.id });
  return reply.send({ complaint });
}

export async function confirmComplaintResolution(request: FastifyRequest, reply: FastifyReply) {
  const body = confirmComplaintResolutionSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError();
  return reply.send({ complaint: await confirmHousingComplaintResolutionByStudent({ complaintId: routeId(request), studentId: actorId(request), resolved: body.data.resolved, requestId: request.id }) });
}

export async function escalateComplaint(request: FastifyRequest, reply: FastifyReply) {
  return reply.send({ complaint: await escalateHousingComplaintToSchool({ complaintId: routeId(request), studentId: actorId(request), requestId: request.id }) });
}

export async function addComplaintMessage(request: FastifyRequest, reply: FastifyReply) {
  const body = complaintMessageSchema.safeParse(request.body);
  if (!body.success) throw new ValidationError(body.error.issues[0]?.message);
  const actor = request.authenticatedUser;
  if (!actor) throw new ForbiddenError();
  return reply.code(201).send({ message: await sendHousingComplaintMessage({ complaintId: routeId(request), senderId: actor.id, senderRole: actor.userRole, body: body.data.body }) });
}

export async function uploadComplaintVideoEvidence(request: FastifyRequest, reply: FastifyReply) {
  const actor = request.authenticatedUser;
  if (!actor) throw new ForbiddenError();
  const file = await request.file({ limits: { files: 1, fields: 0, parts: 1, fileSize: COMPLAINT_LIMITS.evidenceVideoMaximumBytes } }).catch((error: unknown) => {
    if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') throw new PayloadTooLargeError(ERROR_MESSAGES.complaintVideoTooLarge);
    throw error;
  });
  if (!file || file.fieldname !== 'video') throw new ValidationError(ERROR_MESSAGES.complaintVideoRejected);
  const videoBytes = await file.toBuffer().catch((error: unknown) => {
    if ((error as { code?: string }).code === 'FST_REQ_FILE_TOO_LARGE') throw new PayloadTooLargeError(ERROR_MESSAGES.complaintVideoTooLarge);
    throw error;
  });
  if (videoBytes.byteLength > COMPLAINT_LIMITS.evidenceVideoMaximumBytes) throw new PayloadTooLargeError(ERROR_MESSAGES.complaintVideoTooLarge);
  const fileName = (file.filename.split(/[\\/]/).pop() ?? 'complaint-evidence.mp4').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 160);
  const job = await queueHousingComplaintVideoEvidence({ complaintId: routeId(request), studentId: actor.id, fileName, videoBytes, contentType: file.mimetype });
  return reply.code(202).send({ scanJob: job });
}

export async function getComplaintVideoEvidenceStatus(request: FastifyRequest, reply: FastifyReply) {
  const actor = request.authenticatedUser;
  if (!actor) throw new ForbiddenError();
  const uploadId = (request.params as { uploadId?: string }).uploadId;
  if (!uploadId) throw new ValidationError();
  return reply.send(await getHousingComplaintVideoScanStatus({ uploadId, complaintId: routeId(request), actorId: actor.id, actorRole: actor.userRole }));
}

function actorId(request: FastifyRequest): string {
  if (!request.authenticatedUser) throw new ForbiddenError();
  return request.authenticatedUser.id;
}
function routeId(request: FastifyRequest): string {
  const id = (request.params as { complaintId?: string }).complaintId;
  if (!id) throw new ValidationError();
  return id;
}
