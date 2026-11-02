import { z } from '@kta/service-kit';

export const IdParam = z.object({ id: z.string().uuid() });

export const ReorderSchema = z.object({
  dayNumber: z.number().int().positive(),
  orderedItemIds: z.array(z.string().uuid()).min(1).max(30),
});
