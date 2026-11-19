import { useEffect, useState } from 'react';
import { ArrowLeftRight, Check, Sliders, X } from 'lucide-react';
import { WIDGET_CATALOG, WIDGET_CATALOG_LIST } from '../config/widgetRegistry';
import { stockService } from '../services/stockService';
import { TAIWAN_LOCATIONS } from '../services/weatherService';
import type { WidgetConfig, WidgetInstance, WidgetType } from '../types/dashboard';
import { cn } from '../utils/cn';

interface WidgetSettingsModalProps {
  widget: WidgetInstance | null;
  initialTab?: 'settings' | 'swap';
  watchlist: string[];
  onClose: () => void;
  onSaveConfig: (widgetId: string, partial: Partial<WidgetConfig>) => void;
  onSwapType: (widgetId: string, nextType: WidgetType) => void;
}

const TIMEZONES = [
  { value: '', label: '瀏覽器本地時間' },
  { value: 'Asia/Taipei', label: '台北 (Asia/Taipei)' },
  { value: 'Asia/Tokyo', label: '東京 (Asia/Tokyo)' },
  { value: 'Europe/London', label: '倫敦 (Europe/London)' },
  { value: 'America/New_York', label: '紐約 (America/New_York)' },
  { value: 'UTC', label: '協調世界時 (UTC)' },
];

export function WidgetSettingsModal({
  widget,
  initialTab = 'settings',
  watchlist,
  onClose,
  onSaveConfig,
  onSwapType,
}: WidgetSettingsModalProps) {
  const [tab, setTab] = useState<'settings' | 'swap'>(initialTab);
  const [draft, setDraft] = useState<WidgetConfig>({});

  useEffect(() => {
    if (widget) {
      setTab(initialTab);
      setDraft({ ...widget.config });
    }
  }, [widget, initialTab]);

  if (!widget) return null;

  const meta = WIDGET_CATALOG[widget.type];
  const catalogStocks = stockService.getQuickPickCatalog();

  const handleSave = () => {
    onSaveConfig(widget.id, draft);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="widget-settings-title"
    >
      <div className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-md border border-[#C49A52]/45 bg-[#15171B] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C49A52]/25 bg-[#111317] px-5 py-4">
          <div>
            <h2
              id="widget-settings-title"
              className="font-display text-base font-bold text-[#F3EBDD]"
            >
              單一儀表設定 · {meta.name}
            </h2>
            <p className="text-xs text-[#948D80]">
              識別碼 <span className="font-mono-tabular">{widget.id}</span> · 位置 ({widget.layout.x},{' '}
              {widget.layout.y}) · 尺寸 {widget.layout.w}×{widget.layout.h}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉儀表設定"
            className="rounded border border-[#343840] p-2 text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Mode Tabs: Settings vs Swap Module */}
        <div className="flex items-center gap-2 border-b border-[#C49A52]/15 bg-[#131519] px-5 py-2.5">
          <button
            type="button"
            onClick={() => setTab('settings')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              tab === 'settings'
                ? 'bg-[#C49A52] text-[#0B0C0E] font-semibold'
                : 'text-[#D6BE91] hover:text-[#F3EBDD]'
            )}
          >
            <Sliders className="h-3.5 w-3.5" />
            參數設定
          </button>
          <button
            type="button"
            onClick={() => setTab('swap')}
            className={cn(
              'inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer',
              tab === 'swap'
                ? 'bg-[#C49A52] text-[#0B0C0E] font-semibold'
                : 'text-[#D6BE91] hover:text-[#F3EBDD]'
            )}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" />
            更換儀表內容
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {tab === 'settings' ? (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-[#D6BE91]">
                  儀表標題名稱
                </label>
                <input
                  type="text"
                  value={typeof draft.title === 'string' ? draft.title : ''}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder={meta.name}
                  className="h-9 w-full rounded border border-[#C49A52]/30 bg-[#0E1014] px-3 text-sm text-[#F3EBDD] focus:border-[#C49A52] focus:outline-none"
                />
              </div>

              {(widget.type === 'digital-clock' || widget.type === 'analog-clock') && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#D6BE91]">
                      顯示時區
                    </label>
                    <select
                      value={typeof draft.timezone === 'string' ? draft.timezone : ''}
                      onChange={(e) => setDraft({ ...draft, timezone: e.target.value })}
                      className="h-9 w-full rounded border border-[#C49A52]/30 bg-[#0E1014] px-3 text-sm text-[#F3EBDD] focus:border-[#C49A52] focus:outline-none"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex cursor-pointer items-center justify-between rounded border border-[#C49A52]/20 bg-[#101216] px-3.5 py-2.5 text-xs text-[#F3EBDD]">
                    <span>顯示秒針／秒數</span>
                    <input
                      type="checkbox"
                      checked={draft.showSeconds !== false}
                      onChange={(e) => setDraft({ ...draft, showSeconds: e.target.checked })}
                      className="h-4 w-4 accent-[#C49A52]"
                    />
                  </label>
                </>
              )}

              {widget.type === 'digital-clock' && (
                <label className="flex cursor-pointer items-center justify-between rounded border border-[#C49A52]/20 bg-[#101216] px-3.5 py-2.5 text-xs text-[#F3EBDD]">
                  <span>使用 24 小時制</span>
                  <input
                    type="checkbox"
                    checked={draft.use24Hour !== false}
                    onChange={(e) => setDraft({ ...draft, use24Hour: e.target.checked })}
                    className="h-4 w-4 accent-[#C49A52]"
                  />
                </label>
              )}

              {widget.type === 'analog-clock' && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[#D6BE91]">
                    錶盤數字刻度樣式
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, numeralStyle: 'roman' })}
                      className={cn(
                        'rounded border py-2 text-xs font-medium cursor-pointer',
                        draft.numeralStyle !== 'arabic'
                          ? 'border-[#C49A52] bg-[#C49A52]/20 text-[#F3EBDD]'
                          : 'border-[#343840] bg-[#101216] text-[#948D80]'
                      )}
                    >
                      羅馬數字 (I – XII)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, numeralStyle: 'arabic' })}
                      className={cn(
                        'rounded border py-2 text-xs font-medium cursor-pointer',
                        draft.numeralStyle === 'arabic'
                          ? 'border-[#C49A52] bg-[#C49A52]/20 text-[#F3EBDD]'
                          : 'border-[#343840] bg-[#101216] text-[#948D80]'
                      )}
                    >
                      阿拉伯數字 (1 – 12)
                    </button>
                  </div>
                </div>
              )}

              {(widget.type === 'current-weather' ||
                widget.type === 'tomorrow-forecast' ||
                widget.type === 'sunset-countdown') && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#D6BE91]">
                      觀測所在地覆寫（留空則跟隨全域設定）
                    </label>
                    <select
                      value={typeof draft.locationOverride === 'string' ? draft.locationOverride : ''}
                      onChange={(e) => setDraft({ ...draft, locationOverride: e.target.value })}
                      className="h-9 w-full rounded border border-[#C49A52]/30 bg-[#0E1014] px-3 text-sm text-[#F3EBDD] focus:border-[#C49A52] focus:outline-none"
                    >
                      <option value="">跟隨控制台預設所在地</option>
                      {TAIWAN_LOCATIONS.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {widget.type !== 'sunset-countdown' && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#D6BE91]">
                        溫度單位
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, temperatureUnit: 'C' })}
                          className={cn(
                            'rounded border py-2 text-xs font-medium cursor-pointer',
                            draft.temperatureUnit !== 'F'
                              ? 'border-[#C49A52] bg-[#C49A52]/20 text-[#F3EBDD]'
                              : 'border-[#343840] bg-[#101216] text-[#948D80]'
                          )}
                        >
                          攝氏 (°C)
                        </button>
                        <button
                          type="button"
                          onClick={() => setDraft({ ...draft, temperatureUnit: 'F' })}
                          className={cn(
                            'rounded border py-2 text-xs font-medium cursor-pointer',
                            draft.temperatureUnit === 'F'
                              ? 'border-[#C49A52] bg-[#C49A52]/20 text-[#F3EBDD]'
                              : 'border-[#343840] bg-[#101216] text-[#948D80]'
                          )}
                        >
                          華氏 (°F)
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(widget.type === 'stock-quote' || widget.type === 'stock-chart') && (
                <>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-[#D6BE91]">
                      預設顯示台股代號
                    </label>
                    <input
                      type="text"
                      value={typeof draft.symbol === 'string' ? draft.symbol : '2330'}
                      onChange={(e) =>
                        setDraft({ ...draft, symbol: e.target.value.toUpperCase() })
                      }
                      placeholder="例如：2330、0050、8069"
                      className="h-9 w-full rounded border border-[#C49A52]/30 bg-[#0E1014] px-3 font-mono-tabular text-sm text-[#F3EBDD] focus:border-[#C49A52] focus:outline-none"
                    />
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {Array.from(new Set([...watchlist, ...catalogStocks.slice(0, 6).map((s) => s.symbol)])).map(
                        (sym) => {
                          const metaStock = catalogStocks.find((s) => s.symbol === sym);
                          return (
                            <button
                              key={sym}
                              type="button"
                              onClick={() => setDraft({ ...draft, symbol: sym })}
                              className={cn(
                                'rounded border px-2 py-1 text-[11px] font-mono-tabular cursor-pointer',
                                draft.symbol === sym
                                  ? 'border-[#C49A52] bg-[#C49A52]/20 text-[#F3EBDD]'
                                  : 'border-[#343840] bg-[#101216] text-[#D6BE91] hover:border-[#C49A52]/50'
                              )}
                            >
                              {sym} {metaStock?.name ?? ''}
                            </button>
                          );
                        }
                      )}
                    </div>
                  </div>

                  {widget.type === 'stock-quote' && (
                    <label className="flex cursor-pointer items-center justify-between rounded border border-[#C49A52]/20 bg-[#101216] px-3.5 py-2.5 text-xs text-[#F3EBDD]">
                      <span>於儀表下方顯示觀察清單</span>
                      <input
                        type="checkbox"
                        checked={draft.showWatchlist !== false}
                        onChange={(e) => setDraft({ ...draft, showWatchlist: e.target.checked })}
                        className="h-4 w-4 accent-[#C49A52]"
                      />
                    </label>
                  )}

                  {widget.type === 'stock-chart' && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[#D6BE91]">
                        預設走勢圖天數
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {([7, 30, 90] as const).map((days) => (
                          <button
                            key={days}
                            type="button"
                            onClick={() => setDraft({ ...draft, chartDays: days })}
                            className={cn(
                              'rounded border py-2 text-xs font-medium cursor-pointer',
                              (draft.chartDays ?? 30) === days
                                ? 'border-[#C49A52] bg-[#C49A52]/20 text-[#F3EBDD]'
                                : 'border-[#343840] bg-[#101216] text-[#948D80]'
                            )}
                          >
                            近 {days} 日
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {(widget.type === 'calendar' ||
                widget.type === 'countdown' ||
                widget.type === 'todo-list') && (
                <p className="rounded border border-[#C49A52]/15 bg-[#101216] p-3 text-xs leading-relaxed text-[#948D80]">
                  此模組的項目內容（行程、倒數事件或待辦事項）可直接於儀表卡片內即時新增、勾選與刪除，並自動保存至瀏覽器 LocalStorage。
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="text-xs text-[#948D80]">
                選擇欲替換的模組類型。替換後將保留此儀表目前的網格座標與位置。
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {WIDGET_CATALOG_LIST.map((entry) => {
                  const isCurrent = entry.type === widget.type;
                  return (
                    <button
                      key={entry.type}
                      type="button"
                      disabled={isCurrent}
                      onClick={() => {
                        onSwapType(widget.id, entry.type);
                        onClose();
                      }}
                      className={cn(
                        'flex flex-col items-start gap-1 rounded border p-3 text-left transition-colors',
                        isCurrent
                          ? 'border-[#C49A52] bg-[#C49A52]/15 cursor-default'
                          : 'border-[#343840] bg-[#101216] hover:border-[#C49A52]/60 cursor-pointer'
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <span className="text-xs font-semibold text-[#F3EBDD]">{entry.name}</span>
                        {isCurrent ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#C49A52]">
                            <Check className="h-3 w-3" />
                            目前使用
                          </span>
                        ) : (
                          <span className="text-[11px] text-[#948D80]">{entry.categoryLabel}</span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#948D80] line-clamp-2">
                        {entry.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'settings' && (
          <div className="flex items-center justify-end gap-2 border-t border-[#C49A52]/20 bg-[#111317] px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-[#343840] px-4 py-2 text-xs font-medium text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="rounded border border-[#C49A52] bg-[#C49A52] px-4 py-2 text-xs font-semibold text-[#0B0C0E] hover:bg-[#D6BE91] cursor-pointer"
            >
              儲存設定
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
