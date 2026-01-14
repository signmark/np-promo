import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

/**
 * Создание кастомной ошибки приложения
 */
export class ApiError extends Error implements AppError {
  status: number;
  statusCode: number;
  code?: string;
  isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    isOperational: boolean = true
  ) {
    super(message);
    this.status = statusCode;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware для обработки 404 ошибок
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  const error = new ApiError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(error);
}

/**
 * Централизованный обработчик ошибок
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code;

  // Логирование ошибки
  if (status >= 500) {
    console.error('❌ Server Error:', {
      message,
      status,
      code,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  } else {
    console.warn('⚠️  Client Error:', {
      message,
      status,
      code,
      url: req.originalUrl,
      method: req.method,
    });
  }

  // Формируем ответ
  const errorResponse: any = {
    error: message,
    status,
  };

  if (code) {
    errorResponse.code = code;
  }

  // В development режиме добавляем stack trace
  if (process.env.NODE_ENV === 'development' && err.stack) {
    errorResponse.stack = err.stack;
  }

  res.status(status).json(errorResponse);
}

/**
 * Async wrapper для обработки ошибок в async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
