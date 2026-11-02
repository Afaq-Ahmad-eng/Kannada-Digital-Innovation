import { Router } from 'express';
import { asyncHandler, requireAuth } from '@kta/service-kit';
import { generate, getOne, list, reorder, stream } from './itinerary.controller';

export const itineraryRouter = Router();
itineraryRouter.use(requireAuth);
itineraryRouter.get('/stream', stream); // must precede '/:id'
itineraryRouter.get('/', asyncHandler(list));
itineraryRouter.post('/generate', asyncHandler(generate));
itineraryRouter.get('/:id', asyncHandler(getOne));
itineraryRouter.put('/:id/reorder', asyncHandler(reorder));
