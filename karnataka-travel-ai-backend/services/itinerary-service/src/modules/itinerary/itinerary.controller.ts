import type { Request, Response } from 'express';
import { getAuth, parse } from '@kta/service-kit';
import { GenerateRequestSchema } from '@kta/shared-types';
import { itineraryService } from './itinerary.service';
import { IdParam, ReorderSchema } from './itinerary.validation';
import { streamHub } from './stream.hub';

export async function generate(req: Request, res: Response): Promise<void> {
  const params = parse(GenerateRequestSchema, req.body);
  const out = await itineraryService.generate(getAuth(req).userId, params);
  res.status(202).location(`/api/v1/itineraries/${out.tripId}`).json(out);
}

export async function list(req: Request, res: Response): Promise<void> {
  res.json({ trips: await itineraryService.list(getAuth(req).userId) });
}

export async function getOne(req: Request, res: Response): Promise<void> {
  const { id } = parse(IdParam, req.params);
  const auth = getAuth(req);
  res.json(await itineraryService.get(id, auth.userId, auth.role === 'ADMIN'));
}

export async function reorder(req: Request, res: Response): Promise<void> {
  const { id } = parse(IdParam, req.params);
  const body = parse(ReorderSchema, req.body);
  const auth = getAuth(req);
  res.json(await itineraryService.reorder(id, auth.userId, auth.role === 'ADMIN', body.dayNumber, body.orderedItemIds));
}

/** Server-Sent Events: live generation progress, disruptions, reroute proposals. */
export function stream(req: Request, res: Response): void {
  const { userId } = getAuth(req);
  res.status(200).set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  res.write(`event: connected\ndata: {}\n\n`);
  streamHub.add(userId, res);
  const heartbeat = setInterval(() => res.write(': ping\n\n'), 25_000);
  req.on('close', () => {
    clearInterval(heartbeat);
    streamHub.remove(userId, res);
  });
}
