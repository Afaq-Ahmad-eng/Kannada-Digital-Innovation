import { Topics } from '@kta/kafka-events';
import { resolveDestinations } from '@kta/shared-types';
import { bus } from '../../shared/bus';
import { monitoringRepository } from './monitoring.repository';

/** Event-carried state: the alert service keeps its own view of contacts and active trips. */
export async function registerConsumers(): Promise<void> {
  await bus.subscribe('alert-service', {
    [Topics.UserRegistered]: async (p) =>
      monitoringRepository.upsertContact({ userId: p.userId, email: p.email, fullName: p.fullName, phone: p.phone, channels: p.contactChannels }),
    [Topics.UserPreferencesUpdated]: async (p) => monitoringRepository.upsertContact({ userId: p.userId, channels: p.contactChannels }),
    [Topics.TripRequested]: async (p) =>
      monitoringRepository.upsertTrip({
        tripId: p.tripId, userId: p.userId, regions: resolveDestinations(p.params), startDate: p.params.startDate, endDate: p.params.endDate,
      }),
    [Topics.ItineraryGenerated]: async (p) => {
      const regions = [...new Set(p.plan.days.flatMap((d) => d.activities.map((a) => a.destination)))];
      if (regions.length) await monitoringRepository.updateRegions(p.tripId, regions);
    },
    [Topics.TripCompleted]: async (p) => monitoringRepository.completeTrip(p.tripId),
  });
}
