import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import { Topics } from '@kta/kafka-events';
import { env } from '../../config';
import { bus } from '../../shared/bus';
import { log } from '../../shared/logger';
import { authRepository } from './auth.repository';
import { authService } from './auth.service';

/** Credentials are provisioned asynchronously from the User Profile service (database-per-service). */
export async function registerConsumers(): Promise<void> {
  await bus.subscribe('auth-service', {
    [Topics.CredentialProvisioned]: async (p) => {
      await authRepository.upsert({ userId: p.userId, email: p.email, passwordHash: p.passwordHash, role: p.role });
      log.info({ userId: p.userId }, 'credential provisioned');
    },
    [Topics.AdminUserStatusChanged]: async (p) => {
      await authService.applyStatus(p.userId, p.disabled);
      log.info({ userId: p.userId, disabled: p.disabled }, 'account status changed by admin');
    },
  });
}

export async function seedAdmin(): Promise<void> {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return;
  if (await authRepository.findByEmail(env.ADMIN_EMAIL)) return;
  const passwordHash = await argon2.hash(env.ADMIN_PASSWORD, { type: argon2.argon2id });
  await authRepository.upsert({ userId: randomUUID(), email: env.ADMIN_EMAIL, passwordHash, role: 'ADMIN' });
  log.info({ email: env.ADMIN_EMAIL }, 'seeded admin account');
}
