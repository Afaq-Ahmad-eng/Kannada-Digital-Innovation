import { z } from '@kta/service-kit';

export const PageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
export const offsetOf = (q: { page: number; pageSize: number }) => (q.page - 1) * q.pageSize;
