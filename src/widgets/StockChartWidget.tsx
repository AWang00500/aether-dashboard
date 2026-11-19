import { useState, type FormEvent } from 'react';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js';
import { AlertTriangle, Plus, Search } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { useStockHistory } from '../hooks/useStockData';
import { cn } from '../utils/cn';
import { formatShortTimestamp } from '../utils/dateTime';
import type { WidgetRenderProps } from './types';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
  Legend
);

const RANGE_OPTIONS: Array<7 | 30 | 90> = [7, 30, 90];

export function StockChartWidget({
  widget,
  settings,
  refreshTick,
  onUpdateConfig,
  onUpdateSettings,
}: WidgetRenderProps) {
  const symbol =
    (typeof widget.config.symbol === 'string' && widget.config.symbol.trim().toUpperCase()) ||
    settings.watchlist[0] ||
    '2330';
  const days =
    widget.config.chartDays === 7 || widget.config.chartDays === 90
      ? widget.config.chartDays
      : 30;

  const [symbolInput, setSymbolInput] = useState('');
  const { series, loading } = useStockHistory(symbol, days, refreshTick);

  const handleSymbolSubmit = (e: FormEvent) => {
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

  const points = series?.points ?? [];
  const closes = points.map((p) => p.close);
  const firstClose = closes[0] ?? 0;
  const lastClose = closes[closes.length - 1] ?? 0;
  const periodChangePct =
    firstClose > 0 ? (((lastClose - firstClose) / firstClose) * 100).toFixed(2) : '0.00';
  const isPositive = lastClose >= firstClose;

  const chartData = {
    labels: points.map((p) => p.date),
    datasets: [
      {
        label: `${symbol} 收盤價`,
        data: closes,
        borderColor: '#C49A52',
        backgroundColor: 'rgba(196, 154, 82, 0.14)',
        borderWidth: 2,
        pointRadius: days <= 14 ? 3 : 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#F3EBDD',
        fill: true,
        tension: 0.25,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#15171B',
        borderColor: 'rgba(196, 154, 82, 0.5)',
        borderWidth: 1,
        titleColor: '#D6BE91',
        bodyColor: '#F3EBDD',
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (ctx) => `收盤價：${Number(ctx.parsed.y).toLocaleString()} TWD`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(196, 154, 82, 0.08)',
        },
        ticks: {
          color: '#948D80',
          maxTicksLimit: 6,
          font: {
            family: 'JetBrains Mono, monospace',
            size: 10,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(196, 154, 82, 0.08)',
        },
        ticks: {
          color: '#948D80',
          font: {
            family: 'JetBrains Mono, monospace',
            size: 10,
          },
        },
      },
    },
  };

  return (
    <div className="flex h-full flex-col justify-between gap-2">
      {/* Row 1: Custom Symbol Input + Watchlist Selector + Day Range */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <select
            aria-label="從觀察清單選擇股票代號"
            value={settings.watchlist.includes(symbol) ? symbol : '__custom__'}
            onChange={(e) => {
              if (e.target.value !== '__custom__') {
                onUpdateConfig({ symbol: e.target.value });
              }
            }}
            className="h-8 rounded border border-[#C49A52]/30 bg-[#0E1014] px-2 font-mono-tabular text-xs text-[#F3EBDD] focus:border-[#C49A52] focus:outline-none"
          >
            {!settings.watchlist.includes(symbol) && (
              <option value="__custom__">{symbol}</option>
            )}
            {settings.watchlist.map((sym) => (
              <option key={sym} value={sym}>
                {sym}
              </option>
            ))}
          </select>

          <form onSubmit={handleSymbolSubmit} className="flex items-center gap-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-[#948D80]" />
              <input
                type="text"
                value={symbolInput}
                onChange={(e) => setSymbolInput(e.target.value)}
                placeholder="自訂代號"
                aria-label="自訂走勢圖上市股票代號"
                className="h-8 w-24 rounded border border-[#C49A52]/30 bg-[#0E1014] pl-6 pr-2 font-mono-tabular text-xs text-[#F3EBDD] placeholder:text-[#706B60] focus:border-[#C49A52] focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="h-8 rounded border border-[#C49A52]/40 bg-[#1E2127] px-2 text-xs font-medium text-[#D6BE91] transition-colors hover:border-[#C49A52] hover:text-[#F3EBDD] whitespace-nowrap shrink-0 cursor-pointer"
            >
              套用
            </button>
          </form>

          {!settings.watchlist.includes(symbol) && (
            <button
              type="button"
              onClick={() => handleAddToWatchlist(symbol)}
              title="將此代號加入觀察清單"
              className="inline-flex h-8 items-center gap-1 rounded border border-[#C49A52]/30 px-2 text-[11px] text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="h-3 w-3" />
              清單
            </button>
          )}
        </div>

        <div className="flex items-center rounded border border-[#C49A52]/25 bg-[#0E1014] p-0.5 shrink-0">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onUpdateConfig({ chartDays: opt })}
              className={cn(
                'rounded-sm px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap',
                days === opt
                  ? 'bg-[#C49A52] text-[#0B0C0E] font-semibold'
                  : 'text-[#948D80] hover:text-[#F3EBDD]'
              )}
            >
              {opt}日
            </button>
          ))}
        </div>
      </div>

      {/* Active Symbol Summary */}
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <div className="flex items-baseline gap-2 truncate">
          <span className="font-mono-tabular font-bold text-[#C49A52]">{symbol}</span>
          <span className="truncate font-semibold text-[#F3EBDD]">{series?.name ?? symbol}</span>
        </div>
        {points.length > 0 && (
          <div className="flex items-baseline gap-2 font-mono-tabular shrink-0">
            <span className="text-[#F3EBDD]">{lastClose.toLocaleString()}</span>
            <span
              className={cn(
                'font-medium',
                isPositive ? 'text-[#E05A47]' : 'text-[#3FA776]'
              )}
            >
              {isPositive ? '▲' : '▼'} {Number(periodChangePct) > 0 ? '+' : ''}
              {periodChangePct}%
            </span>
          </div>
        )}
      </div>

      {/* Chart Area */}
      <div className="relative min-h-[130px] flex-1">
        {loading && !series ? (
          <div className="flex h-full items-center justify-center text-xs text-[#948D80]">
            正在繪製臺灣證券交易所日線走勢…
          </div>
        ) : !series || series.sourceMode === 'unconfigured' || series.sourceMode === 'error' ? (
          <div className="flex h-full items-center">
            <div className="flex w-full items-start gap-2.5 rounded border border-[#D99B26]/35 bg-[#231C11]/70 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#D99B26]" />
              <div className="space-y-1">
                <div className="text-xs font-semibold text-[#F3EBDD]">
                  {series?.sourceLabel ?? '無法載入歷史走勢'}
                </div>
                <div className="text-xs text-[#D6BE91]">
                  {series?.errorMessage ?? '臺灣證券交易所歷史行情無法取得。'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <Line data={chartData} options={chartOptions} />
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[#C49A52]/15 pt-1.5 text-[11px] text-[#948D80]">
        <span className="truncate">
          {series?.sourceLabel ?? '臺灣證券交易所歷史日收盤'}
        </span>
        <span className="font-mono-tabular shrink-0">
          {formatShortTimestamp(series?.updatedAt)}
        </span>
      </div>
    </div>
  );
}
