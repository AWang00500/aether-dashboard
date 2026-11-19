import type { WidgetRenderProps } from './types';
import { formatTimeParts } from '../utils/dateTime';

const ROMAN_NUMERALS = [
  'XII',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
];

const ARABIC_NUMERALS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

export function AnalogClockWidget({ widget, now, settings }: WidgetRenderProps) {
  const showSeconds = widget.config.showSeconds !== false;
  const numeralStyle = widget.config.numeralStyle === 'arabic' ? 'arabic' : 'roman';
  const timezone = typeof widget.config.timezone === 'string' ? widget.config.timezone : '';

  const parts = formatTimeParts(now, {
    use24Hour: true,
    timeZone: timezone || undefined,
  });

  const hours = Number(parts.hours) % 12;
  const minutes = Number(parts.minutes);
  const seconds = Number(parts.seconds);

  const secondAngle = seconds * 6;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const hourAngle = hours * 30 + minutes * 0.5;

  const numerals = numeralStyle === 'roman' ? ROMAN_NUMERALS : ARABIC_NUMERALS;

  return (
    <div className="flex h-full flex-col items-center justify-between gap-2">
      <div className="relative flex min-h-0 flex-1 w-full items-center justify-center">
        <svg
          viewBox="0 0 240 240"
          className="h-full max-h-[240px] w-full max-w-[240px] select-none"
          role="img"
          aria-label={`機械時鐘 ${parts.hours}:${parts.minutes}:${parts.seconds}`}
        >
          {/* Outer brass bezel */}
          <circle cx="120" cy="120" r="112" fill="#0F1115" stroke="#8A6A33" strokeWidth="4" />
          <circle cx="120" cy="120" r="106" fill="#13161B" stroke="#C49A52" strokeWidth="1.5" />
          <circle cx="120" cy="120" r="96" fill="none" stroke="#C49A52" strokeWidth="0.6" strokeOpacity="0.45" />

          {/* Subtle central escapement gear ring */}
          <g
            className={settings.enableGearAnimations ? 'animate-gear-slow' : undefined}
            style={{ transformOrigin: '120px 120px' }}
            opacity="0.22"
          >
            <circle cx="120" cy="120" r="38" fill="none" stroke="#C49A52" strokeWidth="2" strokeDasharray="6 6" />
            <circle cx="120" cy="120" r="24" fill="none" stroke="#C49A52" strokeWidth="1.5" />
            <line x1="82" y1="120" x2="158" y2="120" stroke="#C49A52" strokeWidth="1.5" />
            <line x1="120" y1="82" x2="120" y2="158" stroke="#C49A52" strokeWidth="1.5" />
          </g>

          {/* 60 minute ticks */}
          {Array.from({ length: 60 }).map((_, idx) => {
            const angle = (idx * 6 * Math.PI) / 180;
            const isMajor = idx % 5 === 0;
            const r1 = isMajor ? 92 : 96;
            const r2 = 102;
            const x1 = 120 + r1 * Math.sin(angle);
            const y1 = 120 - r1 * Math.cos(angle);
            const x2 = 120 + r2 * Math.sin(angle);
            const y2 = 120 - r2 * Math.cos(angle);
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={isMajor ? '#D6BE91' : '#706B60'}
                strokeWidth={isMajor ? '2' : '1'}
              />
            );
          })}

          {/* Hour numerals */}
          {numerals.map((label, idx) => {
            const angle = (idx * 30 * Math.PI) / 180;
            const r = 77;
            const x = 120 + r * Math.sin(angle);
            const y = 120 - r * Math.cos(angle);
            return (
              <text
                key={label}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="#D6BE91"
                fontSize={numeralStyle === 'roman' ? '10.5' : '12'}
                fontFamily="Cinzel, Georgia, serif"
                fontWeight="600"
              >
                {label}
              </text>
            );
          })}

          {/* Date window at 6 o'clock */}
          <rect
            x="99"
            y="151"
            width="42"
            height="17"
            rx="2"
            fill="#0B0C0E"
            stroke="#8A6A33"
            strokeWidth="1"
          />
          <text
            x="120"
            y="160"
            textAnchor="middle"
            dominantBaseline="central"
            fill="#F3EBDD"
            fontSize="9.5"
            fontFamily="JetBrains Mono, monospace"
          >
            {parts.hours}:{parts.minutes}
          </text>

          {/* Hour hand */}
          <g transform={`rotate(${hourAngle} 120 120)`}>
            <polygon
              points="120,64 124,124 120,132 116,124"
              fill="#F3EBDD"
              stroke="#C49A52"
              strokeWidth="1"
            />
          </g>

          {/* Minute hand */}
          <g transform={`rotate(${minuteAngle} 120 120)`}>
            <polygon
              points="120,40 123,125 120,134 117,125"
              fill="#D6BE91"
              stroke="#8A6A33"
              strokeWidth="0.8"
            />
          </g>

          {/* Second hand */}
          {showSeconds && (
            <g transform={`rotate(${secondAngle} 120 120)`}>
              <line x1="120" y1="142" x2="120" y2="34" stroke="#C97B42" strokeWidth="1.5" />
              <circle cx="120" cy="140" r="3" fill="#C97B42" />
            </g>
          )}

          {/* Center brass pinion */}
          <circle cx="120" cy="120" r="5.5" fill="#C49A52" stroke="#15171B" strokeWidth="1.5" />
        </svg>
      </div>

      <div className="flex w-full items-center justify-between border-t border-[#C49A52]/15 pt-2 text-xs text-[#948D80]">
        <span className="tabular-nums text-[#D6BE91]">{parts.dateLabel}</span>
        <span>{parts.weekdayLabel}</span>
      </div>
    </div>
  );
}
