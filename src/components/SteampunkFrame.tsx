import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface SteampunkFrameProps {
  children: ReactNode;
  className?: string;
  isEditMode?: boolean;
}

export function SteampunkFrame({
  children,
  className,
  isEditMode = false,
}: SteampunkFrameProps) {
  return (
    <div
      className={cn(
        'relative flex h-full w-full flex-col overflow-hidden rounded-md border bg-[#15171B] transition-colors duration-200',
        isEditMode
          ? 'border-[#C49A52]/55 shadow-[0_0_0_1px_rgba(196,154,82,0.12)]'
          : 'border-[#C49A52]/25',
        className
      )}
    >
      {/* Subtle 4-corner brass rivets */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1.5 top-1.5 z-10 h-1.5 w-1.5 rounded-full border border-[#5B4521] bg-[#A67F3E]/80"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-1.5 top-1.5 z-10 h-1.5 w-1.5 rounded-full border border-[#5B4521] bg-[#A67F3E]/80"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1.5 left-1.5 z-10 h-1.5 w-1.5 rounded-full border border-[#5B4521] bg-[#A67F3E]/80"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-1.5 right-1.5 z-10 h-1.5 w-1.5 rounded-full border border-[#5B4521] bg-[#A67F3E]/80"
      />

      {children}
    </div>
  );
}
