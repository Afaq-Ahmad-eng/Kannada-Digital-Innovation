import { randomUUID } from 'crypto';
import argon2 from 'argon2';
import { AppError, conflict, notFound } from '@kta/service-kit';
import { Topics } from '@kta/kafka-events';
import type { Preferences } from '@kta/shared-types';
import { bus } from '../../shared/bus';
import { log } from '../../shared/logger';
import { profileRepository } from './profile.repository';

export const profileService = {
  async register(input: { email: string; password: string; fullName: string; phone?: string }) {
    if (await profileRepository.emailExists(input.email)) throw conflict('An account with this email already exists');
    const id = randomUUID();
    // Argon2id, OWASP-recommended minimum parameters (19 MiB, t=2, p=1)
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
    let user;
    try {
      user = await profileRepository.create({ id, email: input.email, fullName: input.fullName, phone: input.phone });
    } catch (e) {
      if ((e as { code?: string }).code === '23505') throw conflict('An account with this email already exists');
      throw e;
    }
    try {
      await bus.publish(Topics.CredentialProvisioned, { userId: id, email: user.email, passwordHash, role: 'USER' }, id);
      await bus.publish(
        Topics.UserRegistered,
        { userId: id, email: user.email, fullName: user.fullName, phone: user.phone, contactChannels: ['EMAIL'], createdAt: user.createdAt },
        id,
      );
    } catch (err) {
      log.error({ err, userId: id }, 'event publish failed during registration; rolling back');
      await profileRepository.remove(id);
      throw new AppError(503, 'Registration is temporarily unavailable. Please retry.', 'EVENT_BUS_UNAVAILABLE');
    }
    return { id, email: user.email };
  },

  async me(userId: string) {
    const found = await profileRepository.find(userId);
    if (!found) throw notFound('Profile not found');
    return found;
  },

  async updatePreferences(userId: string, prefs: Preferences) {
    const updated = await profileRepository.updatePreferences(userId, prefs);
    await bus.publish(Topics.UserPreferencesUpdated, { userId, contactChannels: updated.contactChannels }, userId).catch((err) =>
      log.warn({ err }, 'could not publish preferences update'),
    );
    return updated;
  },
};
