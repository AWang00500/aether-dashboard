import type { WidgetRenderProps } from './types';
import { formatTimeParts } from '../utils/dateTime';

const TIMEZONE_LABELS: Record<string, string> = {
  '': '瀏覽器本地時間',
  'Asia/Taipei': '台北 (UTC+8)',
  'Asia/Tokyo': '東京 (UTC+9)',
  'Europe/London': '倫敦 (GMT/BST)',
  'America/New_York': '紐約 (EST/EDT)',
  UTC: '協調世界時 (UTC)',
};

export function DigitalClockWidget({ widget, now }: WidgetRenderProps) {
  const use24Hour = widget.config.use24Hour !== false;
  const showSeconds = widget.config.showSeconds !== false;
  const timezone = typeof widget.config.timezone === 'string' ? widget.config.timezone : '';

  const parts = formatTimeParts(now, {
    use24Hour,
    timeZone: timezone || undefined,
  });

  const tzLabel = TIMEZONE_LABELS[timezone] ?? timezone;

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="flex items-baseline justify-between gap-2 text-xs text-[#948D80]">
        <span className="truncate">{tzLabel}</span>
        {parts.period && (
          <span className="font-mono-tabular font-semibold text-[#C49A52]">
            {parts.period}
          </span>
        )}
      </div>

      <div className="my-auto flex items-baseline justify-center py-2">
        <div className="font-mono-tabular text-4xl font-bold tracking-tight text-[#F3EBDD] sm:text-5xl">
          <span>{parts.hours}</span>
          <span className="mx-0.5 text-[#C49A52]">:</span>
          <span>{parts.minutes}</span>
          {showSeconds && (
            <>
              <span className="mx-0.5 text-[#C49A52]">:</span>
              <span className="text-3xl font-semibold text-[#D6BE91] sm:text-4xl">
                {parts.seconds}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-[#C49A52]/15 pt-2 text-xs text-[#D6BE91]">
        <span className="tabular-nums">{parts.dateLabel}</span>
        <span className="text-[#948D80]">{parts.weekdayLabel}</span>
      </div>
    </div>
  );
}
