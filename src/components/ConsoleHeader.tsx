import {
  Eye,
  Maximize2,
  Minimize2,
  Plus,
  RefreshCw,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';
import type { ConsoleMode } from '../types/dashboard';
import { cn } from '../utils/cn';
import { formatShortTimestamp, formatTimeParts } from '../utils/dateTime';
import { GearOrnament } from './GearOrnament';

interface ConsoleHeaderProps {
  now: Date;
  mode: ConsoleMode;
  onModeChange: (mode: ConsoleMode) => void;
  onOpenLibrary: () => void;
  onOpenSettings: () => void;
  onOpenHiddenManager: () => void;
  hiddenCount: number;
  onRefresh: () => void;
  lastRefreshAt: string;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  enableGearAnimations: boolean;
  locationLabel: string;
  onDownloadStandalone: () => void;
  downloadingStandalone?: boolean;
}

export function ConsoleHeader({
  now,
  mode,
  onModeChange,
  onOpenLibrary,
  onOpenSettings,
  onOpenHiddenManager,
  hiddenCount,
  onRefresh,
  lastRefreshAt,
  isFullscreen,
  onToggleFullscreen,
  enableGearAnimations,
  locationLabel,
  onDownloadStandalone,
  downloadingStandalone = false,
}: ConsoleHeaderProps) {
  const timeParts = formatTimeParts(now, { use24Hour: true });
  const isEdit = mode === 'edit';

  return (
    <header className="sticky top-0 z-30 border-b border-[#C49A52]/25 bg-[#0F1114]/95 backdrop-blur-sm">
      {/* Top brass piping hairline accent */}
      <div
        aria-hidden="true"
        className="h-0.5 w-full bg-gradient-to-r from-[#5A4320]/40 via-[#C49A52]/80 to-[#5A4320]/40"
      />

      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Zone 1: Brand Title & Clickable Mechanical Gear Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onDownloadStandalone}
            disabled={downloadingStandalone}
            title="點擊直接下載可單獨運行的 index.html"
            aria-label="點擊直接下載可單獨運行的 index.html"
            className="flex h-9 w-9 items-center justify-center rounded border border-[#C49A52]/40 bg-[#181B20] text-[#C49A52] transition-colors hover:border-[#C49A52] hover:bg-[#1E2228] hover:text-[#F3EBDD] active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            <GearOrnament size={24} teeth={10} animated={enableGearAnimations} />
          </button>
          <div>
            <h1 className="font-display text-base font-bold tracking-wider text-[#F3EBDD] whitespace-nowrap sm:text-lg">
              THE AETHER ENGINE
            </h1>
            <p className="text-xs text-[#948D80] whitespace-nowrap">
              以太資訊引擎 · {locationLabel} · 同步於{' '}
              <span className="font-mono-tabular text-[#D6BE91]">
                {formatShortTimestamp(lastRefreshAt)}
              </span>
            </p>
          </div>
        </div>

        {/* Zone 2: Live Browser Chronometer (Date + Weekday + Seconds) */}
        <div className="flex items-center gap-4 border-y border-[#C49A52]/15 py-1 md:border-y-0 md:border-x md:px-6">
          <div className="font-mono-tabular text-2xl font-semibold tracking-tight text-[#F3EBDD] sm:text-3xl">
            {timeParts.hours}
            <span className="text-[#C49A52]">:</span>
            {timeParts.minutes}
            <span className="text-[#C49A52]">:</span>
            <span className="text-[#D6BE91]">{timeParts.seconds}</span>
          </div>
          <div className="text-right text-xs leading-tight sm:text-left">
            <div className="font-medium text-[#D6BE91] tabular-nums whitespace-nowrap">
              {timeParts.dateLabel}
            </div>
            <div className="text-[#948D80] whitespace-nowrap">
              {timeParts.weekdayLabel} · 本地時間
            </div>
          </div>
        </div>

        {/* Zone 3: Mode Switch & Console Actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Segmented Mechanical Mode Switch */}
          <div
            role="group"
            aria-label="控制台操作模式"
            className="flex items-center rounded border border-[#C49A52]/30 bg-[#14161A] p-0.5"
          >
            <button
              type="button"
              onClick={() => onModeChange('standby')}
              className={cn(
                'min-h-9 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                !isEdit
                  ? 'bg-[#C49A52] text-[#0B0C0E] font-semibold'
                  : 'text-[#D6BE91] hover:text-[#F3EBDD]'
              )}
            >
              待機模式
            </button>
            <button
              type="button"
              onClick={() => onModeChange('edit')}
              className={cn(
                'inline-flex min-h-9 items-center gap-1.5 rounded-sm px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                isEdit
                  ? 'bg-[#C49A52] text-[#0B0C0E] font-semibold'
                  : 'text-[#D6BE91] hover:text-[#F3EBDD]'
              )}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              編輯模式
            </button>
          </div>

          {isEdit && (
            <button
              type="button"
              onClick={onOpenLibrary}
              className="inline-flex min-h-10 items-center gap-1.5 rounded border border-[#C49A52] bg-[#C49A52]/15 px-3.5 py-2 text-xs font-semibold text-[#F3EBDD] transition-colors hover:bg-[#C49A52]/25 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5 text-[#C49A52]" />
              新增儀表
            </button>
          )}

          {isEdit && hiddenCount > 0 && (
            <button
              type="button"
              onClick={onOpenHiddenManager}
              className="inline-flex min-h-10 items-center gap-1.5 rounded border border-[#C49A52]/35 bg-[#181B20] px-3 py-2 text-xs font-medium text-[#D6BE91] transition-colors hover:border-[#C49A52] hover:text-[#F3EBDD] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Eye className="h-3.5 w-3.5" />
              已隱藏 ({hiddenCount})
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            title="立即更新儀表資料"
            aria-label="立即更新儀表資料"
            className="inline-flex min-h-10 items-center gap-1.5 rounded border border-[#343840] bg-[#16191E] px-3 py-2 text-xs font-medium text-[#D6BE91] transition-colors hover:border-[#C49A52]/50 hover:text-[#F3EBDD] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">更新資料</span>
          </button>

          {isEdit && (
            <button
              type="button"
              onClick={onOpenSettings}
              title="控制台個人化設定"
              aria-label="控制台個人化設定"
              className="inline-flex min-h-10 items-center gap-1.5 rounded border border-[#343840] bg-[#16191E] px-3 py-2 text-xs font-medium text-[#D6BE91] transition-colors hover:border-[#C49A52]/50 hover:text-[#F3EBDD] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Settings className="h-3.5 w-3.5" />
              <span>設定</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? '退出全螢幕' : '進入全螢幕'}
            aria-label={isFullscreen ? '退出全螢幕' : '進入全螢幕'}
            className="inline-flex min-h-10 items-center gap-1.5 rounded border border-[#343840] bg-[#16191E] px-3 py-2 text-xs font-medium text-[#D6BE91] transition-colors hover:border-[#C49A52]/50 hover:text-[#F3EBDD] whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
            <span className="hidden lg:inline">
              {isFullscreen ? '退出全螢幕' : '全螢幕'}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
