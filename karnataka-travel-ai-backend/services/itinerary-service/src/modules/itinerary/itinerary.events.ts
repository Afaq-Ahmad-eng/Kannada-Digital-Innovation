import { hostname } from 'os';
import { Topics } from '@kta/kafka-events';
import { bus } from '../../shared/bus';
import { log } from '../../shared/logger';
import { itineraryRepository } from './itinerary.repository';
import { streamHub } from './stream.hub';

export async function registerConsumers(): Promise<void> {
  // 1) Persistence: one consumer group shared by all replicas.
  await bus.subscribe('itinerary-service', {
    [Topics.ItineraryProgress]: async (p) => {
      if (p.stage === 'FAILED') await itineraryRepository.markFailed(p.tripId, p.message);
      else await itineraryRepository.markGenerating(p.tripId);
    },
    [Topics.ItineraryGenerated]: async (p) => {
      await itineraryRepository.savePlan(p.tripId, p.plan, p.source);
      log.info({ tripId: p.tripId, source: p.source }, 'itinerary persisted');
    },
    [Topics.RouteLegsComputed]: async (p) => itineraryRepository.updateLegs(p.tripId, p.legs),
    [Topics.ItineraryDisrupted]: async (p) => itineraryRepository.setStatus(p.tripId, 'DISRUPTED', ['READY', 'DISRUPTED']),
    [Topics.ItineraryRerouted]: async (p) => {
      if (p.origin !== 'REROUTE') return; // user reorders were already applied synchronously
      await itineraryRepository.applyChangedDays(p.tripId, p.changedDays);
      log.info({ tripId: p.tripId, proposalId: p.proposalId }, 'reroute applied');
    },
  });

  // 2) Fan-out to browsers: a unique group per replica so every instance sees every event for its own SSE clients.
  await bus.subscribe(`itinerary-sse-${hostname()}`, {
    [Topics.ItineraryProgress]: async (p) => streamHub.send(p.userId, 'progress', { tripId: p.tripId, stage: p.stage, percent: p.percent, message: p.message }),
    [Topics.ItineraryGenerated]: async (p) => streamHub.send(p.userId, 'ready', { tripId: p.tripId, source: p.source }),
    [Topics.RouteLegsComputed]: async (p) => streamHub.send(p.userId, 'legs', { tripId: p.tripId }),
    [Topics.ItineraryDisrupted]: async (p) =>
      streamHub.send(p.userId, 'disrupted', { tripId: p.tripId, region: p.region, severity: p.severity, category: p.category, headline: p.headline, details: p.details, detectedAt: p.detectedAt, sources: p.sources }),
    [Topics.RerouteProposed]: async (p) => streamHub.send(p.userId, 'reroute-proposed', { tripId: p.tripId, proposalId: p.proposalId, summary: p.summary, reason: p.reason }),
    [Topics.ItineraryRerouted]: async (p) => streamHub.send(p.userId, 'rerouted', { tripId: p.tripId, proposalId: p.proposalId, reason: p.reason, origin: p.origin }),
  });
}
