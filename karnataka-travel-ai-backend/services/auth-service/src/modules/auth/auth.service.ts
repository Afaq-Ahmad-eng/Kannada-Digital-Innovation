import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { AppError } from '@kta/service-kit';
import type { Role } from '@kta/shared-types';
import { env } from '../../config';
import { redis } from '../../database';
import { authRepository, Credential } from './auth.repository';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export interface Claims {
  sub: string;
  role: Role;
  email: string;
  jti: string;
}

const GRACE_SECONDS = 10; // tolerate parallel tabs racing a refresh-token rotation
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= argon2.hash('timing-equalizer', { type: argon2.argon2id }));

async function issueTokens(c: Credential): Promise<TokenPair> {
  const accessToken = jwt.sign({ role: c.role, email: c.email }, env.JWT_ACCESS_SECRET, {
    subject: c.userId,
    jwtid: randomUUID(),
    expiresIn: env.ACCESS_TTL_SECONDS,
    algorithm: 'HS256',
  });
  const refreshJti = randomUUID();
  const refreshToken = jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: c.userId,
    jwtid: refreshJti,
    expiresIn: env.REFRESH_TTL_SECONDS,
    algorithm: 'HS256',
  });
  await redis
    .multi()
    .set(`rt:${refreshJti}`, c.userId, 'EX', env.REFRESH_TTL_SECONDS)
    .sadd(`rtu:${c.userId}`, refreshJti)
    .expire(`rtu:${c.userId}`, env.REFRESH_TTL_SECONDS)
    .exec();
  return { accessToken, refreshToken, expiresIn: env.ACCESS_TTL_SECONDS };
}

async function revokeAllRefreshTokens(userId: string): Promise<void> {
  const jtis = await redis.smembers(`rtu:${userId}`);
  if (jtis.length) await redis.del(...jtis.map((j) => `rt:${j}`));
  await redis.del(`rtu:${userId}`);
}

export const authService = {
  /** Apply a suspension / reactivation requested by the admin service. */
  async applyStatus(userId: string, disabled: boolean): Promise<void> {
    await authRepository.setDisabled(userId, disabled);
    if (disabled) {
      await redis.set(`disabled:${userId}`, '1');
      await revokeAllRefreshTokens(userId);
    } else {
      await redis.del(`disabled:${userId}`);
    }
  },

  async login(email: string, password: string): Promise<{ tokens: TokenPair; user: { id: string; email: string; role: Role } }> {
    const cred = await authRepository.findByEmail(email);
    const ok = cred ? await argon2.verify(cred.passwordHash, password).catch(() => false) : await argon2.verify(await getDummyHash(), password).then(() => false, () => false);
    if (!cred || !ok) throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    if (cred.disabled) throw new AppError(403, 'This account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
    return { tokens: await issueTokens(cred), user: { id: cred.userId, email: cred.email, role: cred.role } };
  },

  /** Rotating refresh tokens with reuse detection: replaying a rotated token revokes the whole session family. */
  async refresh(refreshToken: string | undefined): Promise<{ tokens: TokenPair; user: { id: string; email: string; role: Role } }> {
    if (!refreshToken) throw new AppError(401, 'Missing refresh token', 'NO_REFRESH_TOKEN');
    let payload: JwtPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }
    const { jti, sub } = payload;
    if (!jti || !sub) throw new AppError(401, 'Invalid refresh token', 'INVALID_REFRESH_TOKEN');

    const live = (await redis.get(`rt:${jti}`)) === sub;
    const inGrace = !live && (await redis.get(`rtg:${jti}`)) === sub;
    if (!live && !inGrace) {
      await revokeAllRefreshTokens(sub);
      throw new AppError(401, 'Refresh token reuse detected; please sign in again', 'REFRESH_REUSE');
    }
    const cred = await authRepository.findById(sub);
    if (!cred) throw new AppError(401, 'Account not found', 'INVALID_REFRESH_TOKEN');
    if (cred.disabled) {
      await revokeAllRefreshTokens(sub);
      throw new AppError(403, 'This account has been suspended. Please contact support.', 'ACCOUNT_SUSPENDED');
    }
    if (live) {
      await redis.multi().del(`rt:${jti}`).srem(`rtu:${sub}`, jti).set(`rtg:${jti}`, sub, 'EX', GRACE_SECONDS).exec();
    }
    return { tokens: await issueTokens(cred), user: { id: cred.userId, email: cred.email, role: cred.role } };
  },

  async logout(accessToken?: string, refreshToken?: string): Promise<void> {
    if (accessToken) {
      const d = jwt.decode(accessToken) as JwtPayload | null;
      if (d?.jti && d.exp) {
        const ttl = d.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) await redis.set(`bl:${d.jti}`, '1', 'EX', ttl);
      }
    }
    if (refreshToken) {
      try {
        const p = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
        if (p.jti && p.sub) await redis.multi().del(`rt:${p.jti}`).srem(`rtu:${p.sub}`, p.jti).exec();
      } catch {
        /* already invalid - nothing to revoke */
      }
    }
  },

  /** Introspection used by the API gateway on every authenticated request. */
  async verifyAccess(token: string): Promise<Claims> {
    let p: JwtPayload;
    try {
      p = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ['HS256'] }) as JwtPayload;
    } catch {
      throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
    }
    if (!p.jti || !p.sub) throw new AppError(401, 'Invalid token', 'INVALID_TOKEN');
    if (await redis.exists(`bl:${p.jti}`)) throw new AppError(401, 'Token has been revoked', 'TOKEN_REVOKED');
    if (await redis.exists(`disabled:${p.sub}`)) throw new AppError(401, 'Account suspended', 'ACCOUNT_SUSPENDED');
    return { sub: p.sub, role: p.role as Role, email: String(p.email ?? ''), jti: p.jti };
  },
};
