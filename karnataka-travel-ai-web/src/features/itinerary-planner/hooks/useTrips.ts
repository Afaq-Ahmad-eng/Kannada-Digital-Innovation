import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../../../services/http';
import { itineraryApi } from '../services/itineraryApi';
import type { TripSummary } from '../types';

export function useTrips() {
  const [trips, setTrips] = useState<TripSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      setTrips(await itineraryApi.list());
      setError(null);
    } catch (e) {
      setError(errorMessage(e));
    }
  }, []);
  useEffect(() => void refresh(), [refresh]);
  return { trips, error, refresh };
}
