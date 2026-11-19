import {
  ArrowLeftRight,
  EyeOff,
  GripHorizontal,
  Settings2,
  Trash2,
} from 'lucide-react';
import { WIDGET_CATALOG } from '../config/widgetRegistry';
import type { UserSettings, WidgetConfig, WidgetInstance } from '../types/dashboard';
import { cn } from '../utils/cn';
import { WIDGET_COMPONENTS } from '../widgets';
import { SteampunkFrame } from './SteampunkFrame';

interface WidgetWrapperProps {
  widget: WidgetInstance;
  now: Date;
  settings: UserSettings;
  refreshTick: number;
  lastRefreshAt: string;
  isEditMode: boolean;
  onOpenSettings: (widgetId: string) => void;
  onOpenSwap: (widgetId: string) => void;
  onHide: (widgetId: string) => void;
  onDelete: (widgetId: string) => void;
  onUpdateConfig: (widgetId: string, partial: Partial<WidgetConfig>) => void;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
}

export function WidgetWrapper({
  widget,
  now,
  settings,
  refreshTick,
  lastRefreshAt,
  isEditMode,
  onOpenSettings,
  onOpenSwap,
  onHide,
  onDelete,
  onUpdateConfig,
  onUpdateSettings,
}: WidgetWrapperProps) {
  const meta = WIDGET_CATALOG[widget.type];
  const WidgetComponent = WIDGET_COMPONENTS[widget.type];
  const displayTitle =
    (typeof widget.config.title === 'string' && widget.config.title.trim()) || meta.name;

  return (
    <SteampunkFrame isEditMode={isEditMode}>
      {/* Instrument Title Plate / Drag Bar */}
      <div
        className={cn(
          'flex items-center justify-between gap-2 border-b px-3.5 py-2.5 transition-colors',
          isEditMode
            ? 'widget-drag-handle cursor-grab border-[#C49A52]/35 bg-[#1B1E24] active:cursor-grabbing'
            : 'border-[#C49A52]/15 bg-[#13161A]'
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          {isEditMode && (
            <GripHorizontal
              className="h-4 w-4 shrink-0 text-[#C49A52]"
              aria-hidden="true"
            />
          )}
          <h2 className="truncate font-display text-xs font-bold tracking-wider text-[#D6BE91] sm:text-sm">
            {displayTitle}
          </h2>
        </div>

        {isEditMode ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSwap(widget.id);
              }}
              title="更換儀表內容"
              aria-label={`更換 ${displayTitle} 儀表內容`}
              className="inline-flex h-7 items-center gap-1 rounded border border-[#C49A52]/30 bg-[#14161A] px-2 text-[11px] font-medium text-[#D6BE91] transition-colors hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer whitespace-nowrap"
            >
              <ArrowLeftRight className="h-3 w-3 text-[#C49A52]" />
              <span className="hidden sm:inline">更換</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSettings(widget.id);
              }}
              title="儀表設定"
              aria-label={`開啟 ${displayTitle} 設定`}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#343840] bg-[#14161A] text-[#D6BE91] transition-colors hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onHide(widget.id);
              }}
              title="隱藏儀表"
              aria-label={`隱藏 ${displayTitle}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#343840] bg-[#14161A] text-[#D6BE91] transition-colors hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
            >
              <EyeOff className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(widget.id);
              }}
              title="刪除儀表"
              aria-label={`刪除 ${displayTitle}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded border border-[#343840] bg-[#14161A] text-[#948D80] transition-colors hover:border-[#E05A47]/70 hover:text-[#E05A47] cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-[#706B60] whitespace-nowrap shrink-0">
            {meta.categoryLabel}
          </span>
        )}
      </div>

      {/* Widget Body */}
      <div
        className={cn(
          'min-h-0 flex-1 overflow-hidden',
          settings.compactDensity ? 'p-3' : 'p-4'
        )}
      >
        <WidgetComponent
          widget={widget}
          now={now}
          settings={settings}
          refreshTick={refreshTick}
          lastRefreshAt={lastRefreshAt}
          isEditMode={isEditMode}
          onUpdateConfig={(partial) => onUpdateConfig(widget.id, partial)}
          onUpdateSettings={onUpdateSettings}
        />
      </div>
    </SteampunkFrame>
  );
}
