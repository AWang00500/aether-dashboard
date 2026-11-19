import '../types/embedded';
import type {
  StockHistorySeries,
  StockQuote,
  StockSymbolMeta,
} from '../types/stock';
import { hasEmbeddedSnapshot, shouldUseBackendApi } from '../utils/runtimeEnv';

export interface StockDataProvider {
  readonly providerName: string;
  getQuickPickCatalog(): StockSymbolMeta[];
  fetchQuote(symbol: string): Promise<StockQuote>;
  fetchQuotesBatch(symbols: string[]): Promise<StockQuote[]>;
  fetchHistory(symbol: string, days: number): Promise<StockHistorySeries>;
}

const TWSE_QUICK_PICKS: StockSymbolMeta[] = [
  { symbol: '2330', name: '台積電', market: 'TWSE' },
  { symbol: '2317', name: '鴻海', market: 'TWSE' },
  { symbol: '2454', name: '聯發科', market: 'TWSE' },
  { symbol: '0050', name: '元大台灣50', market: 'TWSE' },
  { symbol: '0056', name: '元大高股息', market: 'TWSE' },
  { symbol: '2881', name: '富邦金', market: 'TWSE' },
  { symbol: '2882', name: '國泰金', market: 'TWSE' },
  { symbol: '2308', name: '台達電', market: 'TWSE' },
  { symbol: '2603', name: '長榮', market: 'TWSE' },
  { symbol: '2382', name: '廣達', market: 'TWSE' },
  { symbol: '2412', name: '中華電', market: 'TWSE' },
  { symbol: '00878', name: '國泰永續高股息', market: 'TWSE' },
];

interface StaticStocksSnapshot {
  fetchedAt?: string;
  quotesBySymbol?: Record<string, StockQuote>;
}

interface StaticHistorySnapshot {
  fetchedAt?: string;
  historyBySymbol?: Record<string, StockHistorySeries>;
}

export class TwseStockProvider implements StockDataProvider {
  readonly providerName = '臺灣證券交易所 (TWSE)';
  private staticQuotesCache: { expiresAt: number; data: StaticStocksSnapshot } | null = null;
  private staticHistoryCache: { expiresAt: number; data: StaticHistorySnapshot } | null = null;

  getQuickPickCatalog(): StockSymbolMeta[] {
    return TWSE_QUICK_PICKS;
  }

  private async loadStaticQuotes(): Promise<StaticStocksSnapshot | null> {
    if (this.staticQuotesCache && Date.now() < this.staticQuotesCache.expiresAt) {
      return this.staticQuotesCache.data;
    }
    const embedded =
      typeof window !== 'undefined' ? window.__AETHER_EMBEDDED_DATA__?.stocks : undefined;
    if (embedded) {
      this.staticQuotesCache = { expiresAt: Date.now() + 5 * 60 * 1000, data: embedded };
      return embedded;
    }
    if (!hasEmbeddedSnapshot()) {
      try {
        const res = await fetch('./data/stocks.json', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (res.ok) {
          const json = (await res.json()) as StaticStocksSnapshot;
          this.staticQuotesCache = { expiresAt: Date.now() + 5 * 60 * 1000, data: json };
          return json;
        }
      } catch {
        // Ignore fetch failure
      }
    }
    return null;
  }

  private async loadStaticHistory(): Promise<StaticHistorySnapshot | null> {
    if (this.staticHistoryCache && Date.now() < this.staticHistoryCache.expiresAt) {
      return this.staticHistoryCache.data;
    }
    const embedded =
      typeof window !== 'undefined' ? window.__AETHER_EMBEDDED_DATA__?.stockHistory : undefined;
    if (embedded) {
      this.staticHistoryCache = { expiresAt: Date.now() + 5 * 60 * 1000, data: embedded };
      return embedded;
    }
    if (!hasEmbeddedSnapshot()) {
      try {
        const res = await fetch('./data/stock-history.json', {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (res.ok) {
          const json = (await res.json()) as StaticHistorySnapshot;
          this.staticHistoryCache = { expiresAt: Date.now() + 5 * 60 * 1000, data: json };
          return json;
        }
      } catch {
        // Ignore fetch failure
      }
    }
    return null;
  }

  async fetchQuote(rawSymbol: string): Promise<StockQuote> {
    const symbol = rawSymbol.trim().toUpperCase() || '2330';

    // 1. Try live server proxy (/api/stocks/quote) only when backed by Node/Express server
    if (shouldUseBackendApi()) {
      try {
        const res = await fetch(
          `/api/stocks/quote?symbol=${encodeURIComponent(symbol)}`,
          { headers: { Accept: 'application/json' }, cache: 'no-store' }
        );
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = (await res.json()) as { quote?: StockQuote; errorMessage?: string };
          if (res.ok && json.quote) {
            return json.quote;
          }
          if (res.status === 404) {
            return {
              symbol,
              name: symbol,
              market: 'TWSE',
              price: null,
              change: null,
              changePercent: null,
              open: null,
              high: null,
              low: null,
              prevClose: null,
              volumeLots: null,
              quoteDate: '',
              updatedAt: new Date().toISOString(),
              quoteType: 'daily_close',
              sourceMode: 'error',
              sourceLabel: '臺灣證券交易所查無此代號',
              errorMessage:
                json.errorMessage ||
                `臺灣證券交易所（上市）查無股票代號 ${symbol}（不含上櫃標的）。`,
            };
          }
        }
      } catch {
        // Fall through to static snapshot
      }
    }

    // 2. Fallback to static GitHub Actions snapshot (./data/stocks.json)
    const snap = await this.loadStaticQuotes();
    const quote = snap?.quotesBySymbol?.[symbol];
    if (quote) {
      return {
        ...quote,
        sourceMode: 'snapshot',
        sourceLabel: '臺灣證券交易所每日收盤（靜態快照）',
      };
    }

    return {
      symbol,
      name: symbol,
      market: 'TWSE',
      price: null,
      change: null,
      changePercent: null,
      open: null,
      high: null,
      low: null,
      prevClose: null,
      volumeLots: null,
      quoteDate: '',
      updatedAt: new Date().toISOString(),
      quoteType: 'daily_close',
      sourceMode: 'error',
      sourceLabel: snap ? '臺灣證券交易所查無此代號' : '尚未取得臺灣證交所行情資料',
      errorMessage: snap
        ? `臺灣證券交易所（上市）查無股票代號 ${symbol}。`
        : '無法連線至臺灣證券交易所資料來源，請稍後再試或重新執行 GitHub Actions 資料更新。',
    };
  }

  async fetchQuotesBatch(symbols: string[]): Promise<StockQuote[]> {
    const clean = symbols.map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (clean.length === 0) return [];
    if (shouldUseBackendApi()) {
      try {
        const res = await fetch(
          `/api/stocks/quotes?symbols=${encodeURIComponent(clean.join(','))}`,
          { headers: { Accept: 'application/json' }, cache: 'no-store' }
        );
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          const json = (await res.json()) as {
            quotesBySymbol?: Record<string, StockQuote>;
          };
          if (json.quotesBySymbol) {
            return clean.map(
              (sym) =>
                json.quotesBySymbol?.[sym] ?? {
                  symbol: sym,
                  name: sym,
                  market: 'TWSE',
                  price: null,
                  change: null,
                  changePercent: null,
                  open: null,
                  high: null,
                  low: null,
                  prevClose: null,
                  volumeLots: null,
                  quoteDate: '',
                  updatedAt: new Date().toISOString(),
                  quoteType: 'daily_close',
                  sourceMode: 'error',
                  sourceLabel: '臺灣證券交易所查無此代號',
                  errorMessage: `臺灣證券交易所（上市）查無股票代號 ${sym}。`,
                }
            );
          }
        }
      } catch {
        // Fall through to individual fetchQuote fallback (static snapshot / offline)
      }
    }
    return Promise.all(clean.map((sym) => this.fetchQuote(sym)));
  }

  async fetchHistory(rawSymbol: string, days = 30): Promise<StockHistorySeries> {
    const symbol = rawSymbol.trim().toUpperCase() || '2330';

    // 1. Try live server proxy (/api/stocks/history) only when backed by Node/Express server
    if (shouldUseBackendApi()) {
      try {
        const res = await fetch(
          `/api/stocks/history?symbol=${encodeURIComponent(symbol)}&days=${days}`,
          { headers: { Accept: 'application/json' }, cache: 'no-store' }
        );
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const json = (await res.json()) as {
            series?: StockHistorySeries;
            errorMessage?: string;
          };
          if (res.ok && json.series) {
            return json.series;
          }
          if (!res.ok) {
            return {
              symbol,
              name: symbol,
              market: 'TWSE',
              days,
              points: [],
              quoteType: 'daily_close',
              sourceMode: 'error',
              sourceLabel: '臺灣證券交易所歷史走勢取得失敗',
              updatedAt: new Date().toISOString(),
              errorMessage: json.errorMessage || `查無 ${symbol} 之臺灣證券交易所歷史交易資料。`,
            };
          }
        }
      } catch {
        // Fall through to static snapshot
      }
    }

    // 2. Fallback to static GitHub Actions snapshot (./data/stock-history.json)
    const snap = await this.loadStaticHistory();
    const series = snap?.historyBySymbol?.[symbol];
    if (series && Array.isArray(series.points) && series.points.length > 0) {
      const sliced = series.points.slice(-days);
      return {
        ...series,
        days,
        points: sliced,
        sourceMode: 'snapshot',
        sourceLabel: `臺灣證券交易所歷史日收盤（近 ${sliced.length} 交易日 · 靜態快照）`,
      };
    }

    return {
      symbol,
      name: symbol,
      market: 'TWSE',
      days,
      points: [],
      quoteType: 'daily_close',
      sourceMode: 'error',
      sourceLabel: '尚未取得此代號的歷史走勢快照',
      updatedAt: new Date().toISOString(),
      errorMessage: `靜態快照中尚未收錄 ${symbol} 的歷史日線。可於 GitHub Repository Variables 設定 TWSE_CHART_SYMBOLS=${symbol} 並重新部署。`,
    };
  }
}

export const stockService: StockDataProvider = new TwseStockProvider();
