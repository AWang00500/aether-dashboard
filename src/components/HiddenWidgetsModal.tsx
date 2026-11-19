import { Eye, Trash2, X } from 'lucide-react';
import { WIDGET_CATALOG } from '../config/widgetRegistry';
import type { WidgetInstance } from '../types/dashboard';

interface HiddenWidgetsModalProps {
  open: boolean;
  hiddenWidgets: WidgetInstance[];
  onClose: () => void;
  onShowWidget: (widgetId: string) => void;
  onShowAll: () => void;
  onDeleteWidget: (widgetId: string) => void;
}

export function HiddenWidgetsModal({
  open,
  hiddenWidgets,
  onClose,
  onShowWidget,
  onShowAll,
  onDeleteWidget,
}: HiddenWidgetsModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hidden-widgets-title"
    >
      <div className="flex max-h-[80vh] w-full max-w-lg flex-col overflow-hidden rounded-md border border-[#C49A52]/45 bg-[#15171B] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#C49A52]/25 bg-[#111317] px-5 py-4">
          <div>
            <h2
              id="hidden-widgets-title"
              className="font-display text-base font-bold text-[#F3EBDD]"
            >
              已隱藏儀表清單
            </h2>
            <p className="text-xs text-[#948D80]">
              暫時隱藏的儀表仍保留其設定與資料，可隨時重新顯示於控制台。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉已隱藏儀表清單"
            className="rounded border border-[#343840] p-2 text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-5">
          {hiddenWidgets.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#948D80]">
              目前沒有隱藏的儀表模組。
            </div>
          ) : (
            hiddenWidgets.map((w) => {
              const meta = WIDGET_CATALOG[w.type];
              const title =
                (typeof w.config.title === 'string' && w.config.title.trim()) || meta.name;
              return (
                <div
                  key={w.id}
                  className="flex items-center justify-between gap-3 rounded border border-[#C49A52]/20 bg-[#101216] px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-[#F3EBDD]">{title}</div>
                    <div className="text-[11px] text-[#948D80]">
                      {meta.name} · 尺寸 {w.layout.w}×{w.layout.h}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onShowWidget(w.id)}
                      className="inline-flex items-center gap-1 rounded border border-[#C49A52] bg-[#C49A52]/15 px-2.5 py-1.5 text-xs font-medium text-[#F3EBDD] hover:bg-[#C49A52] hover:text-[#0B0C0E] cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      重新顯示
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteWidget(w.id)}
                      aria-label={`永久刪除 ${title}`}
                      className="rounded border border-[#343840] p-1.5 text-[#948D80] hover:border-[#E05A47] hover:text-[#E05A47] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {hiddenWidgets.length > 0 && (
          <div className="flex items-center justify-end gap-2 border-t border-[#C49A52]/20 bg-[#111317] px-5 py-3">
            <button
              type="button"
              onClick={() => {
                onShowAll();
                onClose();
              }}
              className="rounded border border-[#C49A52] bg-[#C49A52] px-3.5 py-1.5 text-xs font-semibold text-[#0B0C0E] hover:bg-[#D6BE91] cursor-pointer"
            >
              全部重新顯示
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
