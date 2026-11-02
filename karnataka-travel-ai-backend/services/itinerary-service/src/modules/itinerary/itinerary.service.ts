import { randomUUID } from 'crypto';
import { AppError, conflict, notFound } from '@kta/service-kit';
import { Topics } from '@kta/kafka-events';
import { daysBetween, Day, TripParams } from '@kta/shared-types';
import { bus } from '../../shared/bus';
import { log } from '../../shared/logger';
import { itineraryRepository, TripDTO } from './itinerary.repository';

const MAX_DAYS = 14;

async function getOwned(id: string, userId: string, isAdmin: boolean): Promise<TripDTO> {
  const trip = await itineraryRepository.get(id);
  if (!trip || (trip.userId !== userId && !isAdmin)) throw notFound('Itinerary not found');
  return trip;
}

export const itineraryService = {
  /** Persist PENDING, publish TripRequested, return immediately (HTTP 202). */
  async generate(userId: string, params: TripParams): Promise<{ tripId: string; status: 'PENDING' }> {
    const days = daysBetween(params.startDate, params.endDate);
    if (days > MAX_DAYS) throw new AppError(400, `Trips are limited to ${MAX_DAYS} days`, 'TRIP_TOO_LONG');
    const today = new Date().toISOString().slice(0, 10);
    if (params.endDate < today) throw new AppError(400, 'Trip dates are in the past', 'TRIP_IN_PAST');

    const tripId = randomUUID();
    await itineraryRepository.create(tripId, userId, params);
    try {
      await bus.publish(Topics.TripRequested, { tripId, userId, params }, tripId);
    } catch (err) {
      log.error({ err, tripId }, 'failed to publish TripRequested');
      await itineraryRepository.markFailed(tripId, 'Planning queue unavailable');
      throw new AppError(503, 'Planning service is temporarily unavailable. Please retry.', 'EVENT_BUS_UNAVAILABLE');
    }
    return { tripId, status: 'PENDING' };
  },

  list: (userId: string) => itineraryRepository.list(userId),
  get: getOwned,

  async reorder(id: string, userId: string, isAdmin: boolean, dayNumber: number, orderedItemIds: string[]): Promise<TripDTO> {
    const trip = await getOwned(id, userId, isAdmin);
    if (trip.status !== 'READY' && trip.status !== 'DISRUPTED') throw conflict('Itinerary is not editable in its current state');
    if (!trip.days.some((d) => d.dayNumber === dayNumber)) throw notFound('Day not found');
    await itineraryRepository.reorder(id, dayNumber, orderedItemIds);

    const updated = await getOwned(id, userId, isAdmin);
    const day = updated.days.find((d) => d.dayNumber === dayNumber)!;
    const changed: Day = {
      dayNumber: day.dayNumber,
      theme: day.theme,
      summary: day.summary,
      activities: day.activities.map(({ id: _id, ...a }) => a),
    };
    // Keeps the reroute snapshot in sync and triggers route-leg recomputation; ignored by this service's own consumer.
    await bus
      .publish(Topics.ItineraryRerouted, { tripId: id, userId: trip.userId, proposalId: randomUUID(), reason: 'Reordered by traveller', origin: 'USER_REORDER', changedDays: [changed] }, id)
      .catch((err) => log.warn({ err }, 'could not publish reorder event'));
    return updated;
  },
};
