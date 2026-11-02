import { AppError, conflict, notFound } from '@kta/service-kit';
import { Topics } from '@kta/kafka-events';
import { bus } from '../../shared/bus';
import { auditRepository } from '../audit/audit.repository';
import { usersRepository } from './users.repository';

interface Actor { userId: string; email: string }

export const usersService = {
  /**
   * Suspend/reactivate. The auth-service owns credentials, so we publish an event it consumes (it blocks sign-in,
   * revokes refresh tokens and rejects live access tokens). The local read model is updated after the publish succeeds.
   */
  async setSuspended(actor: Actor, userId: string, disabled: boolean, reason?: string) {
    const user = await usersRepository.get(userId);
    if (!user) throw notFound('User not found');
    if (user.disabled === disabled) throw conflict(disabled ? 'User is already suspended' : 'User is not suspended');
    try {
      await bus.publish(Topics.AdminUserStatusChanged, { userId, disabled, reason: reason ?? null, actorId: actor.userId }, userId);
    } catch {
      throw new AppError(503, 'Could not reach the event bus. Nothing was changed.', 'EVENT_BUS_UNAVAILABLE');
    }
    await usersRepository.setDisabled(userId, disabled, reason ?? null);
    await auditRepository.record(actor, disabled ? 'USER_SUSPENDED' : 'USER_REACTIVATED', { type: 'user', id: userId }, { email: user.email, reason: reason ?? null });
    return usersRepository.get(userId);
  },
};
