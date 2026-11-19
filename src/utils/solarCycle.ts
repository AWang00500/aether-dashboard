export type SolarPhase = 'before_sunrise' | 'daytime' | 'after_sunset';

export interface SolarEndpoint {
  type: 'sunrise' | 'sunset';
  label: string;
}

export interface SolarCycleState {
  phase: SolarPhase;
  statusLabel: string;
  targetType: 'sunrise' | 'sunset';
  targetTimeLabel: string;
  targetIso: string;
  progress: number | null;
  sunriseDisplayLabel: string | null;
  sunsetDisplayLabel: string;
  leftEndpoint: SolarEndpoint | null;
  rightEndpoint: SolarEndpoint;
}

function getTaipeiDateIso(d: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function extractTimeLabel(iso: string | null | undefined, fallback: string | null | undefined): string {
  if (iso && iso.length >= 16) {
    const match = iso.match(/T(\d{2}:\d{2})/);
    if (match) return match[1];
  }
  return fallback ?? '';
}

function findDateMatchedSlot(
  targetDateIso: string,
  candidates: Array<{ iso?: string | null; time?: string | null }>
): { iso: string; time: string } | null {
  for (const c of candidates) {
    if (c.iso && c.iso.startsWith(targetDateIso)) {
      const time = c.time || extractTimeLabel(c.iso, '');
      if (time) return { iso: c.iso, time };
    }
  }
  return null;
}

export function computeSolarCycleState(params: {
  now: Date;
  yesterdaySunsetTime?: string | null;
  yesterdaySunsetIso?: string | null;
  sunriseTime: string | null;
  sunsetTime: string;
  sunriseIso?: string | null;
  sunsetIso: string;
  tomorrowSunriseTime?: string | null;
  tomorrowSunriseIso?: string | null;
  tomorrowSunsetTime?: string | null;
  tomorrowSunsetIso?: string | null;
}): SolarCycleState {
  const {
    now,
    yesterdaySunsetTime,
    yesterdaySunsetIso,
    sunriseTime,
    sunsetTime,
    sunriseIso,
    sunsetIso,
    tomorrowSunriseTime,
    tomorrowSunriseIso,
    tomorrowSunsetTime,
    tomorrowSunsetIso,
  } = params;

  const taipeiYesterday = getTaipeiDateIso(new Date(now.getTime() - 86_400_000));
  const taipeiToday = getTaipeiDateIso(now);
  const taipeiTomorrow = getTaipeiDateIso(new Date(now.getTime() + 86_400_000));

  const matchedTodaySunrise = findDateMatchedSlot(taipeiToday, [
    { iso: sunriseIso, time: sunriseTime },
    { iso: tomorrowSunriseIso, time: tomorrowSunriseTime },
  ]);
  const matchedTodaySunset = findDateMatchedSlot(taipeiToday, [
    { iso: sunsetIso, time: sunsetTime },
    { iso: tomorrowSunsetIso, time: tomorrowSunsetTime },
  ]);
  const matchedYesterdaySunset = findDateMatchedSlot(taipeiYesterday, [
    { iso: yesterdaySunsetIso, time: yesterdaySunsetTime },
    { iso: sunsetIso, time: sunsetTime },
  ]);
  const matchedTomorrowSunrise = findDateMatchedSlot(taipeiTomorrow, [
    { iso: tomorrowSunriseIso, time: tomorrowSunriseTime },
  ]);

  const effectiveTodaySunriseTime = matchedTodaySunrise?.time ?? sunriseTime;
  const effectiveTodaySunsetTime = matchedTodaySunset?.time ?? sunsetTime;

  const effectiveTodaySunsetIso =
    matchedTodaySunset?.iso ??
    (effectiveTodaySunsetTime ? `${taipeiToday}T${effectiveTodaySunsetTime}:00+08:00` : sunsetIso);
  const effectiveTodaySunriseIso =
    matchedTodaySunrise?.iso ??
    (effectiveTodaySunriseTime ? `${taipeiToday}T${effectiveTodaySunriseTime}:00+08:00` : sunriseIso ?? null);

  const todaySunset = new Date(effectiveTodaySunsetIso);
  const todaySunrise = effectiveTodaySunriseIso ? new Date(effectiveTodaySunriseIso) : null;
  const nowMs = now.getTime();

  const hasValidSunrise = Boolean(todaySunrise && !Number.isNaN(todaySunrise.getTime()));

  // Phase 1: Between 00:00 and today's sunrise -> count down to today's sunrise
  // Timeline runs left->right: 昨日日落 -> 今日日出
  if (hasValidSunrise && todaySunrise && nowMs < todaySunrise.getTime()) {
    const prevSunsetTimeLabel =
      matchedYesterdaySunset?.time ?? yesterdaySunsetTime ?? effectiveTodaySunsetTime;
    const prevSunsetDate = matchedYesterdaySunset
      ? new Date(matchedYesterdaySunset.iso)
      : new Date(todaySunset.getTime() - 86_400_000);
    const prevSunsetMs = !Number.isNaN(prevSunsetDate.getTime())
      ? prevSunsetDate.getTime()
      : todaySunset.getTime() - 86_400_000;

    const progress = Math.max(
      0,
      Math.min(
        1,
        (nowMs - prevSunsetMs) / Math.max(1, todaySunrise.getTime() - prevSunsetMs)
      )
    );
    const sunriseLabel = `今日日出 ${effectiveTodaySunriseTime ?? ''}`.trim();
    const sunsetLabel = `昨日日落 ${prevSunsetTimeLabel}`;
    return {
      phase: 'before_sunrise',
      statusLabel: '日出前 · 距今日日出',
      targetType: 'sunrise',
      targetTimeLabel: effectiveTodaySunriseTime ?? '',
      targetIso: todaySunrise.toISOString(),
      progress,
      sunriseDisplayLabel: effectiveTodaySunriseTime ? sunriseLabel : null,
      sunsetDisplayLabel: sunsetLabel,
      leftEndpoint: { type: 'sunset', label: sunsetLabel },
      rightEndpoint: { type: 'sunrise', label: sunriseLabel },
    };
  }

  // Phase 3: After today's sunset -> count down to next day's sunrise
  // Timeline runs left->right: 今日日落 -> 隔日日出
  if (nowMs > todaySunset.getTime()) {
    const nextSunriseTime =
      matchedTomorrowSunrise?.time ?? tomorrowSunriseTime ?? effectiveTodaySunriseTime;
    if (nextSunriseTime) {
      const nextSunrise = matchedTomorrowSunrise
        ? new Date(matchedTomorrowSunrise.iso)
        : new Date(`${taipeiTomorrow}T${nextSunriseTime}:00+08:00`);
      const progress = Math.max(
        0,
        Math.min(
          1,
          (nowMs - todaySunset.getTime()) /
            Math.max(1, nextSunrise.getTime() - todaySunset.getTime())
        )
      );
      const sunriseLabel = `隔日日出 ${nextSunriseTime}`;
      const sunsetLabel = `今日日落 ${effectiveTodaySunsetTime}`;
      return {
        phase: 'after_sunset',
        statusLabel: '今日已日落 · 距隔日日出',
        targetType: 'sunrise',
        targetTimeLabel: nextSunriseTime,
        targetIso: nextSunrise.toISOString(),
        progress,
        sunriseDisplayLabel: sunriseLabel,
        sunsetDisplayLabel: sunsetLabel,
        leftEndpoint: { type: 'sunset', label: sunsetLabel },
        rightEndpoint: { type: 'sunrise', label: sunriseLabel },
      };
    }

    // Fallback only if sunrise data is completely missing
    const nextSunset = new Date(todaySunset.getTime() + 86_400_000);
    const sunsetLabel = `今日日落 ${effectiveTodaySunsetTime}`;
    return {
      phase: 'after_sunset',
      statusLabel: '今日已日落 · 距隔日日落',
      targetType: 'sunset',
      targetTimeLabel: effectiveTodaySunsetTime,
      targetIso: nextSunset.toISOString(),
      progress: 1,
      sunriseDisplayLabel: null,
      sunsetDisplayLabel: sunsetLabel,
      leftEndpoint: { type: 'sunset', label: sunsetLabel },
      rightEndpoint: { type: 'sunset', label: `隔日日落 ${effectiveTodaySunsetTime}` },
    };
  }

  // Phase 2: Daytime (after sunrise, before or at sunset) -> count down to today's sunset
  // Timeline runs left->right: 今日日出 -> 今日日落
  const progress =
    hasValidSunrise && todaySunrise
      ? Math.max(
          0,
          Math.min(
            1,
            (nowMs - todaySunrise.getTime()) /
              Math.max(1, todaySunset.getTime() - todaySunrise.getTime())
          )
        )
      : null;

  const sunriseLabel = effectiveTodaySunriseTime ? `今日日出 ${effectiveTodaySunriseTime}` : null;
  const sunsetLabel = `今日日落 ${effectiveTodaySunsetTime}`;

  return {
    phase: 'daytime',
    statusLabel: '距離今日日落',
    targetType: 'sunset',
    targetTimeLabel: effectiveTodaySunsetTime,
    targetIso: todaySunset.toISOString(),
    progress,
    sunriseDisplayLabel: sunriseLabel,
    sunsetDisplayLabel: sunsetLabel,
    leftEndpoint: sunriseLabel ? { type: 'sunrise', label: sunriseLabel } : null,
    rightEndpoint: { type: 'sunset', label: sunsetLabel },
  };
}
