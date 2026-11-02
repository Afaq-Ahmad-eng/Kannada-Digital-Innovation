import type { Request, Response } from 'express';
import { AppError, parse } from '@kta/service-kit';
import { env } from '../../config';
import { authService, TokenPair } from './auth.service';
import { LoginSchema, VerifySchema } from './auth.validation';

export const REFRESH_COOKIE = 'kta_refresh';
export const ADMIN_REFRESH_COOKIE = 'kta_refresh_admin';

const cookieOptions = {
  httpOnly: true,
  secure: env.COOKIE_SECURE === 'true',
  sameSite: 'strict' as const,
  path: '/api/v1/auth',
  maxAge: env.REFRESH_TTL_SECONDS * 1000,
};

// The admin web app identifies itself with "X-Client: admin": it gets a separate cookie (so it never collides with the
// traveller app on the same host) and only ADMIN accounts may sign in through it.
const isAdminClient = (req: Request): boolean => req.header('x-client') === 'admin';
const cookieName = (req: Request): string => (isAdminClient(req) ? ADMIN_REFRESH_COOKIE : REFRESH_COOKIE);

function respond(req: Request, res: Response, tokens: TokenPair, user: { id: string; email: string; role: string }): void {
  if (isAdminClient(req) && user.role !== 'ADMIN') throw new AppError(403, 'Administrator access only', 'ADMIN_ONLY');
  res.cookie(cookieName(req), tokens.refreshToken, cookieOptions);
  res.json({ accessToken: tokens.accessToken, expiresIn: tokens.expiresIn, user });
}

const bearer = (req: Request): string | undefined => {
  const h = req.header('authorization');
  return h?.startsWith('Bearer ') ? h.slice(7) : undefined;
};

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = parse(LoginSchema, req.body);
  const { tokens, user } = await authService.login(email, password);
  respond(req, res, tokens, user);
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const { tokens, user } = await authService.refresh(req.cookies?.[cookieName(req)]);
  respond(req, res, tokens, user);
}

export async function logout(req: Request, res: Response): Promise<void> {
  await authService.logout(bearer(req), req.cookies?.[cookieName(req)]);
  res.clearCookie(cookieName(req), { ...cookieOptions, maxAge: undefined });
  res.status(204).end();
}

export async function verifyToken(req: Request, res: Response): Promise<void> {
  const { token } = parse(VerifySchema, req.body);
  const claims = await authService.verifyAccess(token);
  res.json({ valid: true, claims });
}
