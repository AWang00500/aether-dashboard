import { useState, type FormEvent } from 'react';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { useStockQuote, useStockWatchlistQuotes } from '../hooks/useStockData';
import { cn } from '../utils/cn';
import { formatShortTimestamp } from '../utils/dateTime';
import type { WidgetRenderProps } from './types';

function formatPrice(val: number): string {
  if (val >= 1000) return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  return val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function StockQuoteWidget({
  widget,
  settings,
  refreshTick,
  onUpdateConfig,
  onUpdateSettings,
}: WidgetRenderProps) {
  const activeSymbol =
    (typeof widget.config.symbol === 'string' && widget.config.symbol.trim().toUpperCase()) ||
    settings.watchlist[0] ||
    '2330';
  const showWatchlist = widget.config.showWatchlist !== false;

  const [symbolInput, setSymbolInput] = useState('');
  const { quote, loading } = useStockQuote(activeSymbol, refreshTick);
  const { quotes: watchlistQuotes } = useStockWatchlistQuotes(
    settings.watchlist,
    refreshTick
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = symbolInput.trim().toUpperCase();
    if (!cleaned) return;
    onUpdateConfig({ symbol: cleaned });
    setSymbolInput('');
  };

  const handleAddToWatchlist = (sym: string) => {
    if (!settings.watchlist.includes(sym)) {
      onUpdateSettings({ watchlist: [...settings.watchlist, sym] });
    }
  };

  const change = quote?.change ?? null;
  const isUp = change !== null && change > 0;
  const isDown = change !== null && change < 0;

  return (
    <div className="flex h-full flex-col justify-between gap-2.5">
      {/* Symbol Search Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#948D80]" />
          <input
            type="text"
            value={symbolInput}
            onChange={(e) => setSymbolInput(e.target.value)}
            placeholder="輸入上市股號 (如 2330)"
            aria-label="查詢臺灣證券交易所上市股票代號"
            className="h-8 w-full rounded border border-[#C49A52]/30 bg-[#0E1014] pl-8 pr-2 font-mono-tabular text-xs text-[#F3EBDD] placeholder:text-[#706B60] focus:border-[#C49A52] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="h-8 rounded border border-[#C49A52]/40 bg-[#1E2127] px-2.5 text-xs font-medium text-[#D6BE91] transition-colors hover:border-[#C49A52] hover:text-[#F3EBDD] whitespace-nowrap shrink-0 cursor-pointer"
        >
          查詢
        </button>
      </form>

      {/* Main Quote Display */}
      {loading && !quote ? (
        <div className="flex flex-1 items-center justify-center text-xs text-[#948D80]">
          正在載入臺灣證券交易所行情…
        </div>
      ) : !quote || quote.sourceMode === 'unconfigured' || quote.sourceMode === 'error' ? (
        <div className="flex flex-1 items-center">
          <div className="flex w-full items-start gap-2.5 rounded border border-[#D99B26]/35 bg-[#231C11]/70 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D99B26]" />
            <div className="space-y-1">
              <div className="text-xs font-semibold text-[#F3EBDD]">
                {quote?.sourceLabel ?? '無法取得臺灣證券交易所資料'}
              </div>
              <div className="text-xs text-[#D6BE91]">
                {quote?.errorMessage ?? '行情來源暫時無法連線。'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-2 border-y border-[#C49A52]/15 py-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-mono-tabular text-sm font-bold text-[#C49A52]">
                  {quote.symbol}
                </span>
                <span className="text-base font-semibold text-[#F3EBDD]">{quote.name}</span>
              </div>
              <div className="text-[11px] text-[#948D80]">
                臺灣證交所 (TWSE) · {quote.quoteType === 'intraday' ? '盤中即時報價' : '每日收盤行情'}
                {quote.quoteDate && (
                  <>
                    {' '}
                    · <span className="font-mono-tabular">
                      {quote.quoteDate}
                      {quote.quoteTime ? ` ${quote.quoteTime}` : ''}
                    </span>
                  </>
                )}
              </div>
            </div>

            {!settings.watchlist.includes(quote.symbol) && (
              <button
                type="button"
                onClick={() => handleAddToWatchlist(quote.symbol)}
                className="inline-flex items-center gap-1 rounded border border-[#C49A52]/35 px-2 py-1 text-[11px] text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                加入清單
              </button>
            )}
          </div>

          <div className="flex items-baseline justify-between gap-2">
            <div className="font-mono-tabular text-3xl font-bold text-[#F3EBDD]">
              {quote.price !== null ? formatPrice(quote.price) : '無成交'}
            </div>

            {change !== null && (
              <div
                className={cn(
                  'font-mono-tabular text-sm font-semibold',
                  isUp && 'text-[#E05A47]',
                  isDown && 'text-[#3FA776]',
                  !isUp && !isDown && 'text-[#D6BE91]'
                )}
              >
                {isUp ? '▲' : isDown ? '▼' : '—'}{' '}
                {change > 0 ? `+${change.toFixed(2)}` : change.toFixed(2)}
                {quote.changePercent !== null && (
                  <>
                    {' '}
                    ({quote.changePercent > 0
                      ? `+${quote.changePercent.toFixed(2)}%`
                      : `${quote.changePercent.toFixed(2)}%`}
                    )
                  </>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-2 pt-1 text-[11px]">
            {quote.open !== null && (
              <div>
                <span className="block text-[#948D80]">開盤</span>
                <span className="font-mono-tabular text-[#D6BE91]">{formatPrice(quote.open)}</span>
              </div>
            )}
            {quote.high !== null && (
              <div>
                <span className="block text-[#948D80]">最高</span>
                <span className="font-mono-tabular text-[#D6BE91]">{formatPrice(quote.high)}</span>
              </div>
            )}
            {quote.low !== null && (
              <div>
                <span className="block text-[#948D80]">最低</span>
                <span className="font-mono-tabular text-[#D6BE91]">{formatPrice(quote.low)}</span>
              </div>
            )}
            {quote.volumeLots !== null && (
              <div className="text-right">
                <span className="block text-[#948D80]">成交量</span>
                <span className="font-mono-tabular text-[#D6BE91]">
                  {quote.volumeLots.toLocaleString()} 張
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Watchlist Compact Table */}
      {showWatchlist && watchlistQuotes.length > 0 && (
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="mb-1 text-[11px] font-medium text-[#948D80]">觀察清單快速切換</div>
          <div className="divide-y divide-[#C49A52]/10">
            {watchlistQuotes.map((item) => {
              const itemUp = item.change !== null && item.change > 0;
              const itemDown = item.change !== null && item.change < 0;
              const isSelected = item.symbol === activeSymbol;
              const hasPrice = item.price !== null && item.sourceMode !== 'error';

              return (
                <button
                  key={item.symbol}
                  type="button"
                  onClick={() => onUpdateConfig({ symbol: item.symbol })}
                  className={cn(
                    'flex w-full items-center justify-between px-1.5 py-1.5 text-left text-xs transition-colors cursor-pointer',
                    isSelected ? 'bg-[#C49A52]/12 text-[#F3EBDD]' : 'hover:bg-[#1E2127]/80'
                  )}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="font-mono-tabular font-semibold text-[#C49A52]">
                      {item.symbol}
                    </span>
                    <span className="truncate text-[#D6BE91]">{item.name}</span>
                  </span>
                  <span className="flex items-center gap-2.5 font-mono-tabular shrink-0">
                    <span className="text-[#F3EBDD]">
                      {hasPrice ? formatPrice(item.price!) : '查無'}
                    </span>
                    {hasPrice && item.changePercent !== null && (
                      <span
                        className={cn(
                          'w-16 text-right text-[11px]',
                          itemUp && 'text-[#E05A47]',
                          itemDown && 'text-[#3FA776]',
                          !itemUp && !itemDown && 'text-[#948D80]'
                        )}
                      >
                        {itemUp ? '▲' : itemDown ? '▼' : ''}
                        {item.changePercent > 0 ? '+' : ''}
                        {item.changePercent.toFixed(2)}%
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Truthful TWSE Quote Type & Timestamp Footer */}
      <div className="border-t border-[#C49A52]/15 pt-1.5 text-[11px] text-[#948D80]">
        {quote?.sourceLabel ?? '臺灣證券交易所行情'} · 更新{' '}
        <span className="font-mono-tabular">{formatShortTimestamp(quote?.updatedAt)}</span>
      </div>
    </div>
  );
}
