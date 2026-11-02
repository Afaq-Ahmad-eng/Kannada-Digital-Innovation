import type { ErrorRequestHandler, NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError, ZodTypeAny, z } from 'zod';
import type { Logger } from '@kta/logger';

export class AppError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = 'ERROR',
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const badRequest = (message: string, details?: unknown) => new AppError(400, message, 'BAD_REQUEST', details);
export const unauthorized = (message = 'Authentication required') => new AppError(401, message, 'UNAUTHENTICATED');
export const forbidden = (message = 'Forbidden') => new AppError(403, message, 'FORBIDDEN');
export const notFound = (message = 'Not found') => new AppError(404, message, 'NOT_FOUND');
export const conflict = (message: string) => new AppError(409, message, 'CONFLICT');

/** Validate `data` with a zod schema or throw a 400 AppError. */
export function parse<S extends ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) throw new AppError(400, 'Validation failed', 'VALIDATION_ERROR', r.error.flatten());
  return r.data;
}

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
export const asyncHandler =
  (fn: AsyncHandler): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export const notFoundHandler: RequestHandler = (req, _res, next) =>
  next(new AppError(404, `Route ${req.method} ${req.path} not found`, 'ROUTE_NOT_FOUND'));

export function errorHandler(log: Logger): ErrorRequestHandler {
  return (err, req, res, _next) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    if (err instanceof ZodError) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Validation failed', details: err.flatten() } });
      return;
    }
    const status = typeof err?.status === 'number' && err.status < 500 ? err.status : 500;
    if (status >= 500) log.error({ err, path: req.path }, 'unhandled error');
    res.status(status).json({
      error: {
        code: status === 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST',
        message: status === 500 ? 'Internal server error' : String(err?.message ?? 'Bad request'),
      },
    });
  };
}
