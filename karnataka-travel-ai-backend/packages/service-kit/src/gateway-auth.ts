import { timingSafeEqual } from 'crypto';
import type { Request, RequestHandler } from 'express';
import type { Role } from '@kta/shared-types';
import { AppError } from './errors';

export interface AuthContext {
  userId: string;
  role: Role;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

function safeEqual(a: string, b: string): boolean {
  const A = Buffer.from(a);
  const B = Buffer.from(b);
  return A.length === B.length && timingSafeEqual(A, B);
}

/**
 * Services are only reachable through the API gateway. The gateway authenticates the JWT, then forwards the
 * identity in x-user-* headers together with a shared internal key. Anything without the key is rejected.
 */
export function trustGateway(internalKey: string): RequestHandler {
  return (req, _res, next) => {
    const key = req.header('x-internal-key');
    if (!key || !safeEqual(key, internalKey)) return next(new AppError(403, 'Direct access is not allowed', 'FORBIDDEN'));
    const userId = req.header('x-user-id');
    if (userId) {
      req.auth = {
        userId,
        role: req.header('x-user-role') === 'ADMIN' ? 'ADMIN' : 'USER',
        email: req.header('x-user-email') ?? '',
      };
    }
    next();
  };
}

export const requireAuth: RequestHandler = (req, _res, next) =>
  req.auth ? next() : next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED'));

export function requireRole(...roles: Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.auth) return next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED'));
    if (!roles.includes(req.auth.role)) return next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'));
    next();
  };
}

export function getAuth(req: Request): AuthContext {
  if (!req.auth) throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
  return req.auth;
}
