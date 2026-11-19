import { cn } from '../utils/cn';

interface BrassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  id?: string;
  disabled?: boolean;
}

export function BrassSwitch({
  checked,
  onChange,
  label,
  id,
  disabled = false,
}: BrassSwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'group relative inline-flex h-7 w-13 shrink-0 cursor-pointer items-center rounded border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C49A52]',
        checked
          ? 'border-[#C49A52] bg-[#3B2E1A]'
          : 'border-[#40444D] bg-[#101215]',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <span
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-sm border transition-transform duration-150',
          checked
            ? 'translate-x-7 border-[#E2C282] bg-[#C49A52]'
            : 'translate-x-1 border-[#6E737D] bg-[#343840]'
        )}
      >
        <span className="h-2 w-0.5 rounded-full bg-[#15171B]/70" />
      </span>
    </button>
  );
}
