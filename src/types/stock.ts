import type { DataSourceMode } from './weather';

export type MarketQuoteType = 'intraday' | 'daily_close';

export interface StockQuote {
  symbol: string;
  name: string;
  market: 'TWSE';
  price: number | null;
  change: number | null;
  changePercent: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  prevClose: number | null;
  volumeLots: number | null;
  quoteDate: string;
  quoteTime?: string;
  updatedAt: string;
  quoteType: MarketQuoteType;
  sourceMode: DataSourceMode;
  sourceLabel: string;
  errorMessage?: string;
}

export interface StockHistoryPoint {
  date: string;
  close: number;
  volumeLots: number | null;
}

export interface StockHistorySeries {
  symbol: string;
  name: string;
  market: 'TWSE';
  days: number;
  points: StockHistoryPoint[];
  quoteType: MarketQuoteType;
  sourceMode: DataSourceMode;
  sourceLabel: string;
  updatedAt: string;
  errorMessage?: string;
}

export interface StockSymbolMeta {
  symbol: string;
  name: string;
  market: 'TWSE';
}
