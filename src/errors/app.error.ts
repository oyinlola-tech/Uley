import { ErrorCode } from './errorCode.enum.js';
import { ERROR_MESSAGES } from './errorMessages.js';
import { HttpStatusCode } from '../enums/httpStatusCode.enum.js';

export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
    public readonly code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string = ERROR_MESSAGES.validationFailed) {
    super(message, HttpStatusCode.BAD_REQUEST, ErrorCode.VALIDATION_FAILED);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = ERROR_MESSAGES.unauthorized) {
    super(message, HttpStatusCode.UNAUTHORIZED, ErrorCode.UNAUTHORIZED);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = ERROR_MESSAGES.forbidden) {
    super(message, HttpStatusCode.FORBIDDEN, ErrorCode.FORBIDDEN);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = ERROR_MESSAGES.notFound) {
    super(message, HttpStatusCode.NOT_FOUND, ErrorCode.NOT_FOUND);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string = ERROR_MESSAGES.validationFailed) {
    super(message, HttpStatusCode.PAYLOAD_TOO_LARGE, ErrorCode.PAYLOAD_TOO_LARGE);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = ERROR_MESSAGES.conflict) {
    super(message, HttpStatusCode.CONFLICT, ErrorCode.CONFLICT);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message: string = ERROR_MESSAGES.serviceUnavailable) {
    super(message, HttpStatusCode.SERVICE_UNAVAILABLE, ErrorCode.SERVICE_UNAVAILABLE);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(message, HttpStatusCode.TOO_MANY_REQUESTS, ErrorCode.TOO_MANY_REQUESTS);
  }
}
