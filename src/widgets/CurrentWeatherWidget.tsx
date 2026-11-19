import {
  AlertTriangle,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Gauge,
  Sun,
  Sunrise,
  Sunset,
  Wind,
} from 'lucide-react';
import { useWeatherData } from '../hooks/useWeatherData';
import type { WeatherConditionCode } from '../types/weather';
import { formatShortTimestamp } from '../utils/dateTime';
import type { WidgetRenderProps } from './types';

function WeatherGlyph({ code }: { code: WeatherConditionCode }) {
  const cls = 'h-9 w-9 text-[#C49A52] shrink-0';
  switch (code) {
    case 'clear':
      return <Sun className={cls} />;
    case 'partly-cloudy':
      return <CloudSun className={cls} />;
    case 'cloudy':
      return <Cloud className={cls} />;
    case 'rain':
      return <CloudRain className={cls} />;
    case 'thunderstorm':
      return <CloudLightning className={cls} />;
    case 'fog':
    default:
      return <CloudFog className={cls} />;
  }
}

function formatTemp(tempC: number, unit: 'C' | 'F'): string {
  if (unit === 'F') {
    return `${((tempC * 9) / 5 + 32).toFixed(1)}°F`;
  }
  return `${tempC.toFixed(1)}°C`;
}

function formatTempInt(tempC: number, unit: 'C' | 'F'): string {
  if (unit === 'F') {
    return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  }
  return `${Math.round(tempC)}°C`;
}

export function CurrentWeatherWidget({
  widget,
  settings,
  refreshTick,
}: WidgetRenderProps) {
  const location =
    (typeof widget.config.locationOverride === 'string' && widget.config.locationOverride.trim()) ||
    settings.location;
  const unit = widget.config.temperatureUnit === 'F' ? 'F' : 'C';
  const { data, loading } = useWeatherData(location, refreshTick);

  if (loading && !data) {
    return (
      <div className="flex h-full items-center justify-center text-xs text-[#948D80]">
        正在連線中央氣象署資料…
      </div>
    );
  }

  if (!data || data.sourceMode === 'unconfigured' || data.sourceMode === 'error') {
    return (
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="flex items-start gap-3 rounded border border-[#D99B26]/35 bg-[#231C11]/70 p-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#D99B26]" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-[#F3EBDD]">
              {data?.sourceLabel ?? '無法取得中央氣象署資料'}
            </p>
            <p className="text-xs leading-relaxed text-[#D6BE91]">
              {data?.errorMessage ?? '中央氣象署資料服務尚未就緒。'}
            </p>
          </div>
        </div>
        <div className="border-t border-[#C49A52]/15 pt-2 text-xs text-[#948D80]">
          觀測所在地：{location}
        </div>
      </div>
    );
  }

  const hasCurrentTemp = data.currentTempC !== null;
  const hasMinMax = data.tempMinC !== null && data.tempMaxC !== null;

  return (
    <div className="flex h-full flex-col justify-between gap-3">
      {/* Location & Condition Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[#F3EBDD]">
            {data.location}
            {data.stationName && (
              <span className="ml-1.5 text-xs font-normal text-[#948D80]">
                ({data.stationName}測站)
              </span>
            )}
          </div>
          <div className="text-xs text-[#D6BE91]">{data.condition}</div>
        </div>
        <WeatherGlyph code={data.conditionCode} />
      </div>

      {/* Main Temperature & High/Low */}
      {(hasCurrentTemp || hasMinMax) && (
        <div className="flex items-baseline justify-between gap-2 border-y border-[#C49A52]/15 py-3">
          {hasCurrentTemp ? (
            <div className="font-mono-tabular text-4xl font-bold text-[#F3EBDD]">
              {formatTemp(data.currentTempC!, unit)}
            </div>
          ) : (
            <div className="text-sm font-medium text-[#948D80]">目前氣溫暫缺</div>
          )}

          {hasMinMax && (
            <div className="text-right font-mono-tabular text-xs text-[#D6BE91]">
              最高 {formatTempInt(data.tempMaxC!, unit)} · 最低 {formatTempInt(data.tempMinC!, unit)}
            </div>
          )}
        </div>
      )}

      {/* Available CWA Metrics Only */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {data.popPercent !== null && (
          <div className="flex items-center justify-between text-[#948D80]">
            <span className="inline-flex items-center gap-1.5">
              <Droplets className="h-3.5 w-3.5 text-[#C49A52]" />
              降雨機率
            </span>
            <span className="font-mono-tabular font-medium text-[#F3EBDD]">{data.popPercent}%</span>
          </div>
        )}

        {data.humidityPercent !== null && (
          <div className="flex items-center justify-between text-[#948D80]">
            <span className="inline-flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 text-[#C49A52]" />
              相對濕度
            </span>
            <span className="font-mono-tabular font-medium text-[#F3EBDD]">
              {Math.round(data.humidityPercent)}%
            </span>
          </div>
        )}

        {data.windSpeedMs !== null && (
          <div className="flex items-center justify-between text-[#948D80]">
            <span className="inline-flex items-center gap-1.5">
              <Wind className="h-3.5 w-3.5 text-[#C49A52]" />
              風速
            </span>
            <span className="font-mono-tabular font-medium text-[#F3EBDD]">
              {data.windSpeedMs} m/s
            </span>
          </div>
        )}

        {data.pressureHpa !== null && (
          <div className="flex items-center justify-between text-[#948D80]">
            <span>氣壓</span>
            <span className="font-mono-tabular font-medium text-[#D6BE91]">
              {data.pressureHpa} hPa
            </span>
          </div>
        )}

        {data.sunriseTime && (
          <div className="flex items-center justify-between text-[#948D80]">
            <span className="inline-flex items-center gap-1.5">
              <Sunrise className="h-3.5 w-3.5 text-[#C49A52]" />
              日出時間
            </span>
            <span className="font-mono-tabular font-medium text-[#D6BE91]">{data.sunriseTime}</span>
          </div>
        )}

        {data.sunsetTime && (
          <div className="flex items-center justify-between text-[#948D80]">
            <span className="inline-flex items-center gap-1.5">
              <Sunset className="h-3.5 w-3.5 text-[#C97B42]" />
              日落時間
            </span>
            <span className="font-mono-tabular font-medium text-[#D6BE91]">{data.sunsetTime}</span>
          </div>
        )}
      </div>

      {/* Data Source Notice */}
      <div className="border-t border-[#C49A52]/15 pt-2 text-[11px] text-[#948D80]">
        {data.sourceLabel} · 觀測{' '}
        <span className="font-mono-tabular">{formatShortTimestamp(data.observedAt)}</span>
      </div>
    </div>
  );
}
