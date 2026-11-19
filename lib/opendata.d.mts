import type { WeatherObservation } from '../src/types/weather';
import type { StockHistorySeries, StockQuote } from '../src/types/stock';

export const TAIWAN_LOCATIONS: string[];

export function getTaiwanDateString(offsetDays?: number): string;

export function fetchAllCwaWeather(apiKey: string): Promise<{
  configured: boolean;
  taiwanDate?: string;
  fetchedAt: string;
  locations: Record<string, WeatherObservation>;
  errorMessage?: string;
}>;

export function fetchTwseAllQuotes(): Promise<{
  fetchedAt: string;
  quotesBySymbol: Record<string, StockQuote>;
  catalog: Array<{ symbol: string; name: string; market: 'TWSE' }>;
}>;

export function fetchTwseRealtimeQuotes(
  symbols: string[]
): Promise<Record<string, StockQuote>>;

export function fetchTwseStockHistory(
  symbol: string,
  days?: number
): Promise<StockHistorySeries>;
