import { useMemo, useState } from 'react';
import {
  ResponsiveGridLayout,
  useContainerWidth,
  verticalCompactor,
  type Layout,
  type LayoutItem,
} from 'react-grid-layout';
import { Plus } from 'lucide-react';
import { WidgetWrapper } from '../components/WidgetWrapper';
import { WIDGET_CATALOG } from '../config/widgetRegistry';
import type { UserSettings, WidgetConfig, WidgetInstance } from '../types/dashboard';
import { cn } from '../utils/cn';

interface DashboardGridProps {
  widgets: WidgetInstance[];
  now: Date;
  settings: UserSettings;
  refreshTick: number;
  lastRefreshAt: string;
  isEditMode: boolean;
  onLayoutChange: (layout: Layout) => void;
  onOpenLibrary: () => void;
  onOpenSettings: (widgetId: string) => void;
  onOpenSwap: (widgetId: string) => void;
  onHideWidget: (widgetId: string) => void;
  onDeleteWidget: (widgetId: string) => void;
  onUpdateWidgetConfig: (widgetId: string, partial: Partial<WidgetConfig>) => void;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
}

const BREAKPOINTS = { lg: 1024, md: 768, sm: 480, xs: 0 } as const;
const COLS = { lg: 12, md: 8, sm: 4, xs: 2 } as const;

export function DashboardGrid({
  widgets,
  now,
  settings,
  refreshTick,
  lastRefreshAt,
  isEditMode,
  onLayoutChange,
  onOpenLibrary,
  onOpenSettings,
  onOpenSwap,
  onHideWidget,
  onDeleteWidget,
  onUpdateWidgetConfig,
  onUpdateSettings,
}: DashboardGridProps) {
  const { width, containerRef, mounted } = useContainerWidth({ initialWidth: 1280 });
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('lg');

  const visibleWidgets = useMemo(
    () => widgets.filter((w) => !w.hidden),
    [widgets]
  );

  const layouts = useMemo(() => {
    const lgItems: LayoutItem[] = visibleWidgets.map((w) => {
      const meta = WIDGET_CATALOG[w.type];
      return {
        i: w.id,
        x: w.layout.x,
        y: w.layout.y,
        w: w.layout.w,
        h: w.layout.h,
        minW: meta.minSize.minW,
        minH: meta.minSize.minH,
        maxW: meta.maxSize.maxW,
        maxH: meta.maxSize.maxH,
      };
    });

    const mdItems: LayoutItem[] = visibleWidgets.map((w) => {
      const meta = WIDGET_CATALOG[w.type];
      const clampedW = Math.min(8, Math.max(meta.minSize.minW, w.layout.w));
      const clampedX = Math.min(8 - clampedW, w.layout.x);
      return {
        i: w.id,
        x: Math.max(0, clampedX),
        y: w.layout.y,
        w: clampedW,
        h: w.layout.h,
        minW: Math.min(8, meta.minSize.minW),
        minH: meta.minSize.minH,
        maxW: 8,
        maxH: meta.maxSize.maxH,
      };
    });

    const smItems: LayoutItem[] = visibleWidgets.map((w, idx) => {
      const meta = WIDGET_CATALOG[w.type];
      return {
        i: w.id,
        x: 0,
        y: idx * w.layout.h,
        w: 4,
        h: w.layout.h,
        minW: 2,
        minH: meta.minSize.minH,
        maxW: 4,
        maxH: meta.maxSize.maxH,
      };
    });

    const xsItems: LayoutItem[] = visibleWidgets.map((w, idx) => {
      const meta = WIDGET_CATALOG[w.type];
      return {
        i: w.id,
        x: 0,
        y: idx * w.layout.h,
        w: 2,
        h: w.layout.h,
        minW: 2,
        minH: meta.minSize.minH,
        maxW: 2,
        maxH: meta.maxSize.maxH,
      };
    });

    return {
      lg: lgItems,
      md: mdItems,
      sm: smItems,
      xs: xsItems,
    };
  }, [visibleWidgets]);

  if (visibleWidgets.length === 0) {
    return (
      <div className="mx-auto flex min-h-[420px] max-w-xl flex-col items-center justify-center rounded-md border border-dashed border-[#C49A52]/35 bg-[#121418] p-8 text-center">
        <h2 className="font-display text-lg font-bold text-[#F3EBDD]">
          目前控制台沒有顯示中的儀表
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-[#948D80]">
          您可以切換至編輯模式新增資訊儀表，或從「已隱藏儀表」清單重新恢復顯示。
        </p>
        {isEditMode && (
          <button
            type="button"
            onClick={onOpenLibrary}
            className="mt-5 inline-flex items-center gap-1.5 rounded border border-[#C49A52] bg-[#C49A52] px-4 py-2 text-xs font-semibold text-[#0B0C0E] hover:bg-[#D6BE91] cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            從儀表庫新增模組
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'w-full rounded-md transition-colors duration-200',
        isEditMode && 'aether-blueprint-grid border border-[#C49A52]/20 p-2'
      )}
    >
      {mounted && (
        <ResponsiveGridLayout
          width={width}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          layouts={layouts}
          rowHeight={settings.compactDensity ? 56 : 66}
          margin={[14, 14]}
          containerPadding={[0, 0]}
          compactor={verticalCompactor}
          dragConfig={{
            enabled: isEditMode,
            handle: '.widget-drag-handle',
            bounded: false,
            threshold: 3,
          }}
          resizeConfig={{
            enabled: isEditMode,
            handles: ['se'],
          }}
          onBreakpointChange={(bp) => setCurrentBreakpoint(bp)}
          onDragStop={(layout) => {
            if (isEditMode) onLayoutChange(layout);
          }}
          onResizeStop={(layout) => {
            if (isEditMode) onLayoutChange(layout);
          }}
          onLayoutChange={(layout) => {
            if (isEditMode && currentBreakpoint === 'lg') {
              onLayoutChange(layout);
            }
          }}
        >
          {visibleWidgets.map((widget) => (
            <div key={widget.id} className="h-full w-full">
              <WidgetWrapper
                widget={widget}
                now={now}
                settings={settings}
                refreshTick={refreshTick}
                lastRefreshAt={lastRefreshAt}
                isEditMode={isEditMode}
                onOpenSettings={onOpenSettings}
                onOpenSwap={onOpenSwap}
                onHide={onHideWidget}
                onDelete={onDeleteWidget}
                onUpdateConfig={onUpdateWidgetConfig}
                onUpdateSettings={onUpdateSettings}
              />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}
    </div>
  );
}
