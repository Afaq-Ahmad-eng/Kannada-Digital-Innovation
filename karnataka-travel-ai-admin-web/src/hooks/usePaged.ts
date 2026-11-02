import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../services/http';

export interface Page<T> { items: T[]; total: number; page: number; pageSize: number }

/** Generic paginated loader; refetches when `deps` change and resets to page 1. */
export function usePaged<T>(fetcher: (page: number) => Promise<Page<T>>, deps: unknown[]) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<T> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0);

  const load = useCallback(async () => {
    const mine = ++seq.current;
    setLoading(true);
    try {
      const d = await fetcher(page);
      if (mine === seq.current) { setData(d); setError(null); }
    } catch (e) {
      if (mine === seq.current) setError(errorMessage(e));
    } finally {
      if (mine === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ...deps]);

  useEffect(() => { setPage(1); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [load]);
  return { data, page, setPage, error, loading, reload: load };
}
