import '../types/embedded';
import type { WeatherObservation } from '../types/weather';
import { hasEmbeddedSnapshot, shouldUseBackendApi } from '../utils/runtimeEnv';

export interface WeatherDataProvider {
  readonly providerName: string;
  fetchWeather(location: string): Promise<WeatherObservation>;
}

export const TAIWAN_LOCATIONS = [
  '高雄市',
  '臺南市',
  '屏東縣',
  '嘉義市',
  '嘉義縣',
  '臺北市',
  '新北市',
  '桃園市',
  '新竹市',
  '臺中市',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
] as const;

interface StaticWeatherSnapshot {
  configured: boolean;
  fetchedAt?: string;
  locations?: Record<string, WeatherObservation>;
  errorMessage?: string;
}

function createUnavailableObservation(
  location: string,
  sourceMode: 'unconfigured' | 'error',
  sourceLabel: string,
  errorMessage: string
): WeatherObservation {
  return {
    location,
    stationName: null,
    currentTempC: null,
    tempMinC: null,
    tempMaxC: null,
    condition: sourceMode === 'unconfigured' ? '尚未設定授權碼' : '資料取得失敗',
    conditionCode: 'fog',
    popPercent: null,
    humidityPercent: null,
    pressureHpa: null,
    windSpeedMs: null,
    sunriseTime: null,
    sunsetTime: null,
    sunriseIso: null,
    sunsetIso: null,
    tomorrow: null,
    sourceMode,
    sourceLabel,
    isRealtime: false,
    observedAt: new Date().toISOString(),
    errorMessage,
  };
}

export class CwaWeatherProvider implements WeatherDataProvider {
  readonly providerName = '中央氣象署開放資料 (CWA)';

  async fetchWeather(location: string): Promise<WeatherObservation> {
    // 1. Try server proxy (/api/weather) only when backed by Node/Express server
    if (shouldUseBackendApi()) {
      try {
        const res = await fetch(
          `/api/weather?location=${encodeURIComponent(location)}`,
          { headers: { Accept: 'application/json' }, cache: 'no-store' }
        );
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = (await res.json()) as {
            configured?: boolean;
            observation?: WeatherObservation;
            errorMessage?: string;
          };
          if (res.ok && json.configured && json.observation) {
            return { ...json.observation, sourceMode: 'api' };
          }
          if (json.configured === false) {
            return createUnavailableObservation(
              location,
              'unconfigured',
              '尚未設定中央氣象署 CWA_API_KEY',
              json.errorMessage ||
                '請於環境變數或 GitHub Secrets 設定 CWA_API_KEY，以取得中央氣象署觀測、預報與日出日落時刻。'
            );
          }
          if (!res.ok) {
            return createUnavailableObservation(
              location,
              'error',
              '中央氣象署資料取得失敗',
              json.errorMessage || `伺服器回傳錯誤 (${res.status})。`
            );
          }
        }
      } catch {
        // Fall through to embedded/static snapshot
      }
    }

    // 2. Check embedded snapshot inside standalone single-file HTML (SELF/index.html)
    const embeddedWeather =
      typeof window !== 'undefined' ? window.__AETHER_EMBEDDED_DATA__?.weather : undefined;
    if (embeddedWeather) {
      if (!embeddedWeather.configured) {
        return createUnavailableObservation(
          location,
          'unconfigured',
          '尚未設定中央氣象署 CWA_API_KEY',
          embeddedWeather.errorMessage ||
            '請於 GitHub Repository Secrets 設定 CWA_API_KEY 或自線上控制台下載最新獨立單檔。'
        );
      }
      const obs = embeddedWeather.locations?.[location];
      if (obs) {
        return {
          ...obs,
          sourceMode: 'snapshot',
          sourceLabel: '中央氣象署開放資料 (單檔內嵌快照)',
          isRealtime: false,
        };
      }
    }

    // 3. Fallback to static ./data/weather.json only on multi-file static builds (not SELF single-file)
    if (!hasEmbeddedSnapshot()) {
      try {
        const snapRes = await fetch('./data/weather.json', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (snapRes.ok) {
          const snap = (await snapRes.json()) as StaticWeatherSnapshot;
          if (!snap.configured) {
            return createUnavailableObservation(
              location,
              'unconfigured',
              '尚未設定中央氣象署 CWA_API_KEY',
              snap.errorMessage ||
                '請於 GitHub Repository Secrets 設定 CWA_API_KEY 並重新執行部署工作流程。'
            );
          }
          const obs = snap.locations?.[location];
          if (obs) {
            return {
              ...obs,
              sourceMode: 'snapshot',
              sourceLabel: '中央氣象署開放資料 (GitHub 排程快照)',
              isRealtime: false,
            };
          }
        }
      } catch {
        // Static snapshot unavailable
      }
    }

    return createUnavailableObservation(
      location,
      'unconfigured',
      '尚未設定中央氣象署資料來源',
      '尚未偵測到可用的中央氣象署資料。若部署於 GitHub Pages，請設定 CWA_API_KEY Secret 並執行 GitHub Actions 工作流程，或自線上控制台點擊左上角 LOGO 下載已內嵌最新資料的 index.html。'
    );
  }
}

export const weatherService: WeatherDataProvider = new CwaWeatherProvider();
