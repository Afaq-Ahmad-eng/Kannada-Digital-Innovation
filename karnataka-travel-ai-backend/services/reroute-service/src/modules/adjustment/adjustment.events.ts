import { Topics } from '@kta/kafka-events';
import { bus } from '../../shared/bus';
import { adjustmentRepository } from './adjustment.repository';
import { adjustmentService } from './adjustment.service';

export async function registerConsumers(): Promise<void> {
  await bus.subscribe('reroute-service', {
    [Topics.ItineraryGenerated]: async (p) => adjustmentRepository.saveSnapshot(p.tripId, p.userId, p.plan),
    [Topics.ItineraryRerouted]: async (p) => adjustmentRepository.mergeDays(p.tripId, p.changedDays),
    [Topics.ItineraryDisrupted]: async (p) => adjustmentService.handleDisruption(p),
  });
}
