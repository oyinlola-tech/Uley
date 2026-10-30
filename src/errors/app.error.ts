export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 500,
    public readonly code = 'INTERNAL_SERVER_ERROR',
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'The request conflicts with the current resource state.') {
    super(message, 409, 'CONFLICT');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You are not allowed to perform this action.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication is required.') {
    super(message, 401, 'UNAUTHORIZED');
  }
}
