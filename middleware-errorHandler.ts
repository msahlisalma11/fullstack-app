// src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { createChildLogger } from '../config/logger';

const logger = createChildLogger('error-handler');

// Custom error class
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error class
export class ValidationError extends AppError {
  constructor(public errors: Record<string, string[]>) {
    super('Validation failed', 400, 'VALIDATION_ERROR');
  }
}

// Not found error class
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// Unauthorized error class
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

// Forbidden error class
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

// Conflict error class
export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 409, 'CONFLICT');
  }
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const requestId = req.id || 'unknown';

  // Log error
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Application error', {
        requestId,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
        path: req.path,
        method: req.method,
        stack: err.stack,
      });
    } else {
      logger.warn('Client error', {
        requestId,
        statusCode: err.statusCode,
        code: err.code,
        message: err.message,
      });
    }

    // Handle validation errors
    if (err instanceof ValidationError) {
      return res.status(err.statusCode).json({
        error: 'Validation Error',
        code: err.code,
        message: err.message,
        errors: err.errors,
        requestId,
      });
    }

    // Handle other app errors
    return res.status(err.statusCode).json({
      error: getErrorName(err.statusCode),
      code: err.code,
      message: err.message,
      requestId,
    });
  }

  // Handle database errors
  if (err.name === 'QueryFailedError' || err.message.includes('FOREIGN KEY')) {
    logger.error('Database error', {
      requestId,
      error: err.message,
      stack: err.stack,
    });

    return res.status(400).json({
      error: 'Database Error',
      message: 'An error occurred while processing your request',
      requestId,
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT error', {
      requestId,
      error: err.message,
    });

    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid token',
      requestId,
    });
  }

  // Handle unexpected errors
  logger.error('Unexpected error', {
    requestId,
    error: err.message,
    stack: err.stack,
    type: err.constructor.name,
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message:
      process.env.NODE_ENV === 'development'
        ? err.message
        : 'An unexpected error occurred',
    requestId,
  });
};

/**
 * Async route wrapper to catch errors
 */
export const asyncHandler =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/**
 * Get error name from status code
 */
function getErrorName(statusCode: number): string {
  const errorMap: Record<number, string> = {
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    409: 'Conflict',
    422: 'Unprocessable Entity',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };

  return errorMap[statusCode] || 'Error';
}

export default errorHandler;
