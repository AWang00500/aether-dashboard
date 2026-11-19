import { cn } from '../utils/cn';

interface GearOrnamentProps {
  size?: number;
  teeth?: number;
  animated?: boolean;
  reverse?: boolean;
  className?: string;
}

export function GearOrnament({
  size = 28,
  teeth = 10,
  animated = false,
  reverse = false,
  className,
}: GearOrnamentProps) {
  const cx = 50;
  const cy = 50;
  const outerR = 44;
  const rootR = 35;
  const boreR = 12;

  const points: string[] = [];
  const step = (Math.PI * 2) / teeth;

  for (let i = 0; i < teeth; i += 1) {
    const a0 = i * step;
    const a1 = a0 + step * 0.18;
    const a2 = a0 + step * 0.34;
    const a3 = a0 + step * 0.66;
    const a4 = a0 + step * 0.82;

    points.push(`${(cx + rootR * Math.cos(a0)).toFixed(2)},${(cy + rootR * Math.sin(a0)).toFixed(2)}`);
    points.push(`${(cx + outerR * Math.cos(a1)).toFixed(2)},${(cy + outerR * Math.sin(a1)).toFixed(2)}`);
    points.push(`${(cx + outerR * Math.cos(a2)).toFixed(2)},${(cy + outerR * Math.sin(a2)).toFixed(2)}`);
    points.push(`${(cx + rootR * Math.cos(a3)).toFixed(2)},${(cy + rootR * Math.sin(a3)).toFixed(2)}`);
    points.push(`${(cx + rootR * Math.cos(a4)).toFixed(2)},${(cy + rootR * Math.sin(a4)).toFixed(2)}`);
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn(
        'shrink-0 select-none',
        animated && (reverse ? 'animate-gear-reverse' : 'animate-gear-slow'),
        className
      )}
    >
      <polygon
        points={points.join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      <circle cx={cx} cy={cy} r={24} fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0.65" />
      <circle cx={cx} cy={cy} r={boreR} fill="none" stroke="currentColor" strokeWidth="4" />
      <line x1="50" y1="26" x2="50" y2="38" stroke="currentColor" strokeWidth="3" />
      <line x1="50" y1="62" x2="50" y2="74" stroke="currentColor" strokeWidth="3" />
      <line x1="26" y1="50" x2="38" y2="50" stroke="currentColor" strokeWidth="3" />
      <line x1="62" y1="50" x2="74" y2="50" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
