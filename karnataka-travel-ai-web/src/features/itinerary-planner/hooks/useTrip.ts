import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../../../services/http';
import { useLiveStore } from '../../../store/live';
import { itineraryApi } from '../services/itineraryApi';
import type { Trip } from '../types';

/** Loads a trip and keeps it fresh: SSE ticks trigger refetches, with slow polling as a safety net while generating. */
export function useTrip(id: string) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [error, setError] = useState<string | null>(null);
  const tick = useLiveStore((s) => s.tick[id] ?? 0);
  const alive = useRef(true);

  const refetch = useCallback(async () => {
    try {
      const t = await itineraryApi.get(id);
      if (alive.current) {
        setTrip(t);
        setError(null);
      }
    } catch (e) {
      if (alive.current) setError(errorMessage(e, 'We could not load this trip.'));
    }
  }, [id]);

  useEffect(() => {
    alive.current = true;
    void refetch();
    return () => {
      alive.current = false;
    };
  }, [refetch]);

  // Server says something changed: refetch now and once more shortly after (persistence is asynchronous).
  useEffect(() => {
    if (tick === 0) return;
    void refetch();
    const t = setTimeout(() => void refetch(), 1500);
    return () => clearTimeout(t);
  }, [tick, refetch]);

  const generating = trip?.status === 'PENDING' || trip?.status === 'GENERATING';
  useEffect(() => {
    if (!generating) return;
    const i = setInterval(() => void refetch(), 4000);
    return () => clearInterval(i);
  }, [generating, refetch]);

  const reorder = useCallback(
    async (dayNumber: number, orderedIds: string[]) => {
      // optimistic update
      setTrip((t) => t && { ...t, days: t.days.map((d) => (d.dayNumber === dayNumber ? { ...d, activities: orderedIds.map((i) => d.activities.find((a) => a.id === i)!) } : d)) });
      try {
        setTrip(await itineraryApi.reorder(id, dayNumber, orderedIds));
      } catch (e) {
        setError(errorMessage(e, 'Could not save the new order.'));
        void refetch();
      }
    },
    [id, refetch],
  );

  return { trip, error, refetch, reorder };
}
