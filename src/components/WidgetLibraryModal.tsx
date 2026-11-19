import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  WIDGET_CATALOG_LIST,
  WIDGET_CATEGORY_LABELS,
} from '../config/widgetRegistry';
import type { WidgetCategory, WidgetType } from '../types/dashboard';
import { cn } from '../utils/cn';

interface WidgetLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onAddWidget: (type: WidgetType) => void;
}

const CATEGORIES: Array<{ id: 'all' | WidgetCategory; label: string }> = [
  { id: 'all', label: '全部模組' },
  { id: 'time', label: WIDGET_CATEGORY_LABELS.time },
  { id: 'weather', label: WIDGET_CATEGORY_LABELS.weather },
  { id: 'finance', label: WIDGET_CATEGORY_LABELS.finance },
  { id: 'personal', label: WIDGET_CATEGORY_LABELS.personal },
];

export function WidgetLibraryModal({
  open,
  onClose,
  onAddWidget,
}: WidgetLibraryModalProps) {
  const [category, setCategory] = useState<'all' | WidgetCategory>('all');

  if (!open) return null;

  const filtered =
    category === 'all'
      ? WIDGET_CATALOG_LIST
      : WIDGET_CATALOG_LIST.filter((entry) => entry.category === category);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-library-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-md border border-[#C49A52]/45 bg-[#15171B] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C49A52]/25 bg-[#111317] px-5 py-4">
          <div>
            <h2
              id="widget-library-title"
              className="font-display text-lg font-bold tracking-wide text-[#F3EBDD]"
            >
              儀表模組庫
            </h2>
            <p className="text-xs text-[#948D80]">
              選擇欲新增至控制台的資訊儀表，每個模組皆可獨立配置、拖曳與調整尺寸。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉儀表模組庫"
            className="rounded border border-[#343840] p-2 text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-[#C49A52]/15 bg-[#131519] px-5 py-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={cn(
                'rounded px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer',
                category === cat.id
                  ? 'bg-[#C49A52] text-[#0B0C0E] font-semibold'
                  : 'border border-[#343840] bg-[#181B20] text-[#D6BE91] hover:border-[#C49A52]/50 hover:text-[#F3EBDD]'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Catalog Grid */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {filtered.map((entry) => (
              <div
                key={entry.type}
                className="flex flex-col justify-between gap-3 rounded border border-[#C49A52]/20 bg-[#101216] p-4 transition-colors hover:border-[#C49A52]/50"
              >
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[#F3EBDD]">{entry.name}</h3>
                    <span className="text-[11px] text-[#C49A52] whitespace-nowrap">
                      {entry.categoryLabel} · {entry.englishName}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#948D80]">
                    {entry.description}
                  </p>
                </div>

                <div className="flex items-center justify-between border-t border-[#C49A52]/15 pt-3">
                  <span className="font-mono-tabular text-[11px] text-[#706B60]">
                    預設格線：{entry.defaultSize.w} × {entry.defaultSize.h}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onAddWidget(entry.type);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1.5 rounded border border-[#C49A52] bg-[#C49A52]/15 px-3 py-1.5 text-xs font-semibold text-[#F3EBDD] transition-colors hover:bg-[#C49A52] hover:text-[#0B0C0E] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    新增儀表
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
