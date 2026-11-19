import {
  AlertTriangle,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  Sun,
} from 'lucide-react';
import { useWeatherData } from '../hooks/useWeatherData';
import type { WeatherConditionCode } from '../types/weather';
import { formatShortTimestamp } from '../utils/dateTime';
import type { WidgetRenderProps } from './types';

function ForecastGlyph({ code }: { code: WeatherConditionCode }) {
  const cls = 'h-8 w-8 text-[#C49A52] shrink-0';
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

function formatTempInt(tempC: number, unit: 'C' | 'F'): string {
  if (unit === 'F') return `${Math.round((tempC * 9) / 5 + 32)}°F`;
  return `${Math.round(tempC)}°C`;
}

export function TomorrowForecastWidget({
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
        正在載入明日氣象預報…
      </div>
    );
  }

  if (
    !data ||
    !data.tomorrow ||
    data.sourceMode === 'unconfigured' ||
    data.sourceMode === 'error'
  ) {
    return (
      <div className="flex h-full flex-col justify-between gap-3">
        <div className="flex items-start gap-2.5 rounded border border-[#D99B26]/35 bg-[#231C11]/70 p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D99B26]" />
          <div className="space-y-1">
            <p className="text-xs font-semibold text-[#F3EBDD]">
              {data?.sourceLabel ?? '無法取得明日預報'}
            </p>
            <p className="text-xs text-[#D6BE91]">
              {data?.errorMessage ?? '中央氣象署預報資料尚未就緒。'}
            </p>
          </div>
        </div>
        <div className="border-t border-[#C49A52]/15 pt-2 text-[11px] text-[#948D80]">
          地區：{location}
        </div>
      </div>
    );
  }

  const { tomorrow } = data;
  const hasMinMax = tomorrow.tempMinC !== null && tomorrow.tempMaxC !== null;

  return (
    <div className="flex h-full flex-col justify-between gap-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-[#F3EBDD]">{data.location} · 明日</div>
          <div className="font-mono-tabular text-xs text-[#948D80]">{tomorrow.date}</div>
        </div>
        <ForecastGlyph code={tomorrow.conditionCode} />
      </div>

      <div className="space-y-2 border-y border-[#C49A52]/15 py-3">
        <div className="text-base font-medium text-[#D6BE91]">{tomorrow.condition}</div>
        {hasMinMax && (
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[#948D80]">預報氣溫區間</span>
            <span className="font-mono-tabular text-xl font-bold text-[#F3EBDD]">
              {formatTempInt(tomorrow.tempMinC!, unit)} – {formatTempInt(tomorrow.tempMaxC!, unit)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2 text-xs">
        {tomorrow.popPercent !== null && (
          <>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-[#948D80]">
                <Droplets className="h-3.5 w-3.5 text-[#C49A52]" />
                明日降雨機率
              </span>
              <span className="font-mono-tabular font-semibold text-[#F3EBDD]">
                {tomorrow.popPercent}%
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-sm border border-[#C49A52]/25 bg-[#0E1014]">
              <div
                className="h-full bg-gradient-to-r from-[#8A6A33] to-[#C49A52] transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, tomorrow.popPercent))}%` }}
              />
            </div>
          </>
        )}

        {tomorrow.comfortIndex && (
          <div className="flex items-center justify-between pt-1 text-[#948D80]">
            <span>舒適度評估</span>
            <span className="text-[#D6BE91]">{tomorrow.comfortIndex}</span>
          </div>
        )}
      </div>

      <div className="border-t border-[#C49A52]/15 pt-2 text-[11px] text-[#948D80]">
        {data.sourceLabel} · 更新{' '}
        <span className="font-mono-tabular">{formatShortTimestamp(data.observedAt)}</span>
      </div>
    </div>
  );
}
