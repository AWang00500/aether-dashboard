const WEEKDAYS_ZH = [
  '星期日',
  '星期一',
  '星期二',
  '星期三',
  '星期四',
  '星期五',
  '星期六',
] as const;

export function pad2(num: number): string {
  return String(Math.floor(num)).padStart(2, '0');
}

export function formatZhDate(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}年${month}月${day}日`;
}

export function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  return `${year}-${month}-${day}`;
}

export function formatWeekdayZh(date: Date): string {
  return WEEKDAYS_ZH[date.getDay()];
}

export function formatTimeParts(
  date: Date,
  options: { use24Hour?: boolean; timeZone?: string } = {}
): {
  hours: string;
  minutes: string;
  seconds: string;
  period: string;
  dateLabel: string;
  weekdayLabel: string;
} {
  const { use24Hour = true, timeZone } = options;

  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone || undefined,
      hour12: !use24Hour,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      weekday: 'short',
    });

    const parts = formatter.formatToParts(date);
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

    const rawHour = get('hour');
    const hours = use24Hour && rawHour === '24' ? '00' : rawHour.padStart(2, '0');
    const minutes = get('minute').padStart(2, '0');
    const seconds = get('second').padStart(2, '0');
    const period = use24Hour ? '' : get('dayPeriod');
    const year = get('year');
    const month = get('month');
    const day = get('day');

    const weekdayMap: Record<string, string> = {
      Sun: '星期日',
      Mon: '星期一',
      Tue: '星期二',
      Wed: '星期三',
      Thu: '星期四',
      Fri: '星期五',
      Sat: '星期六',
    };

    return {
      hours,
      minutes,
      seconds,
      period,
      dateLabel: `${year}年${month}月${day}日`,
      weekdayLabel: weekdayMap[get('weekday')] ?? formatWeekdayZh(date),
    };
  } catch {
    const rawHours = date.getHours();
    const displayHours = use24Hour ? rawHours : rawHours % 12 || 12;
    return {
      hours: pad2(displayHours),
      minutes: pad2(date.getMinutes()),
      seconds: pad2(date.getSeconds()),
      period: use24Hour ? '' : rawHours >= 12 ? 'PM' : 'AM',
      dateLabel: formatZhDate(date),
      weekdayLabel: formatWeekdayZh(date),
    };
  }
}

export function formatShortTimestamp(isoString?: string): string {
  if (!isoString) return '--:--:--';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '--:--:--';
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

export interface CountdownBreakdown {
  isPast: boolean;
  totalSeconds: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function getCountdownBreakdown(targetIso: string, now: Date): CountdownBreakdown {
  const targetMs = new Date(targetIso).getTime();
  if (Number.isNaN(targetMs)) {
    return { isPast: false, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const diffMs = targetMs - now.getTime();
  const isPast = diffMs < 0;
  const absSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const days = Math.floor(absSeconds / 86400);
  const hours = Math.floor((absSeconds % 86400) / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const seconds = absSeconds % 60;

  return {
    isPast,
    totalSeconds: absSeconds,
    days,
    hours,
    minutes,
    seconds,
  };
}
