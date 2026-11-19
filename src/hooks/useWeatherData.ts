import { useEffect, useState } from 'react';
import { weatherService } from '../services/weatherService';
import type { WeatherObservation } from '../types/weather';

interface UseWeatherDataResult {
  data: WeatherObservation | null;
  loading: boolean;
}

export function useWeatherData(
  location: string,
  refreshTick: number
): UseWeatherDataResult {
  const [data, setData] = useState<WeatherObservation | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    weatherService
      .fetchWeather(location)
      .then((obs) => {
        if (!cancelled) {
          setData(obs);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [location, refreshTick]);

  return { data, loading };
}
