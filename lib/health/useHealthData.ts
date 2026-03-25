import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AllHealthData,
  fetchAllHealthData,
  isHealthKitAvailable,
  requestPermissions,
} from './healthkit';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

interface UseHealthDataResult {
  readonly data: AllHealthData | null;
  readonly loading: boolean;
  readonly error: string | null;
  readonly refetch: () => Promise<void>;
}

export const useHealthData = (days = 7): UseHealthDataResult => {
  const [data, setData] = useState<AllHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchAllHealthData(days);
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch health data');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [days]);

  const initialize = useCallback(async () => {
    if (!isHealthKitAvailable()) {
      setError('HealthKit is not available on this device');
      setLoading(false);
      return;
    }

    try {
      const authorized = await requestPermissions();
      if (!authorized) {
        setError('HealthKit permissions were not granted');
        setLoading(false);
        return;
      }
      await fetchData();
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to initialize HealthKit');
        setLoading(false);
      }
    }
  }, [fetchData]);

  useEffect(() => {
    mountedRef.current = true;
    initialize();

    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [initialize, fetchData]);

  return { data, loading, error, refetch: fetchData };
};
