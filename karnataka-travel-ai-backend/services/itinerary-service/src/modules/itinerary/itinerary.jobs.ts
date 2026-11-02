import { Topics } from '@kta/kafka-events';
import { bus } from '../../shared/bus';
import { log } from '../../shared/logger';
import { itineraryRepository } from './itinerary.repository';

/** Hourly sweep: trips whose end date has passed become COMPLETED and emit TripCompleted. */
export function startCompletionJob(): NodeJS.Timeout {
  const run = async () => {
    try {
      for (const t of await itineraryRepository.completeFinished()) {
        await bus.publish(Topics.TripCompleted, { tripId: t.id, userId: t.user_id, completedAt: new Date().toISOString() }, t.id);
      }
    } catch (err) {
      log.error({ err }, 'completion job failed');
    }
  };
  void run();
  return setInterval(run, 60 * 60 * 1000);
}
