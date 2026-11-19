import { AlertTriangle, Sunrise, Sunset } from 'lucide-react';
import { useWeatherData } from '../hooks/useWeatherData';
import { getCountdownBreakdown, pad2 } from '../utils/dateTime';
import { computeSolarCycleState } from '../utils/solarCycle';
import type { WidgetRenderProps } from './types';

export function SunsetCountdownWidget({
  widget,
  now,
  settings,
  refreshTick,
}: WidgetRenderProps) {
  const location =
    (typeof widget.config.locationOverride === 'string' && widget.config.locationOverride.trim()) ||
    settings.location;
  const { data } = useWeatherData(location, refreshTick);

  if (
    !data ||
    data.sourceMode === 'unconfigured' ||
    data.sourceMode === 'error' ||
    !data.sunsetIso ||
    !data.sunsetTime
  ) {
    return (
      <div className="flex h-full flex-col justify-between gap-2">
        <div className="flex items-start gap-2 rounded border border-[#D99B26]/35 bg-[#231C11]/70 p-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D99B26]" />
          <p className="text-xs text-[#D6BE91]">
            {data?.errorMessage ?? '尚未取得中央氣象署今日日落時刻（A-B0062-001）。'}
          </p>
        </div>
        <div className="text-[11px] text-[#948D80]">{location}</div>
      </div>
    );
  }

  const cycle = computeSolarCycleState({
    now,
    yesterdaySunsetTime: data.yesterdaySunsetTime,
    yesterdaySunsetIso: data.yesterdaySunsetIso,
    sunriseTime: data.sunriseTime,
    sunsetTime: data.sunsetTime,
    sunriseIso: data.sunriseIso,
    sunsetIso: data.sunsetIso,
    tomorrowSunriseTime: data.tomorrowSunriseTime,
    tomorrowSunriseIso: data.tomorrowSunriseIso,
    tomorrowSunsetTime: data.tomorrowSunsetTime,
    tomorrowSunsetIso: data.tomorrowSunsetIso,
  });

  const countdown = getCountdownBreakdown(cycle.targetIso, now);
  const progressPercent =
    cycle.progress !== null ? Math.min(100, Math.max(0, Math.round(cycle.progress * 100))) : null;

  return (
    <div className="flex h-full flex-col justify-between gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#D6BE91]">{cycle.statusLabel}</span>
        <span className="text-[#948D80]">{location}</span>
      </div>

      <div className="my-auto flex flex-col items-center justify-center">
        <div className="font-mono-tabular text-3xl font-bold tracking-tight text-[#F3EBDD] sm:text-4xl">
          {pad2(countdown.hours)}
          <span className="text-[#C49A52]">:</span>
          {pad2(countdown.minutes)}
          <span className="text-[#C49A52]">:</span>
          <span className="text-[#D6BE91]">{pad2(countdown.seconds)}</span>
        </div>
      </div>

      <div className="space-y-2 border-t border-[#C49A52]/15 pt-2">
        {progressPercent !== null && (
          <div className="h-2 w-full overflow-hidden rounded-sm border border-[#C49A52]/25 bg-[#0E1014]">
            <div
              className="h-full bg-gradient-to-r from-[#8A6A33] to-[#C49A52] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[#948D80]">
          {cycle.leftEndpoint ? (
            <span className="inline-flex items-center gap-1 font-mono-tabular text-[#948D80]">
              {cycle.leftEndpoint.type === 'sunrise' ? (
                <Sunrise className="h-3.5 w-3.5 text-[#C49A52]" />
              ) : (
                <Sunset className="h-3.5 w-3.5 text-[#C97B42]" />
              )}
              {cycle.leftEndpoint.label}
            </span>
          ) : (
            <span />
          )}

          <span className="inline-flex items-center gap-1 font-mono-tabular font-medium text-[#D6BE91]">
            {cycle.rightEndpoint.type === 'sunrise' ? (
              <Sunrise className="h-3.5 w-3.5 text-[#C49A52]" />
            ) : (
              <Sunset className="h-3.5 w-3.5 text-[#C97B42]" />
            )}
            {cycle.rightEndpoint.label}
          </span>
        </div>
      </div>
    </div>
  );
}
