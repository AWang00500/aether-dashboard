import type { StockHistorySeries, StockQuote } from './stock';
import type { WeatherObservation } from './weather';

export interface EmbeddedOpenDataPayload {
  weather?: {
    configured: boolean;
    fetchedAt?: string;
    locations?: Record<string, WeatherObservation>;
    errorMessage?: string;
  };
  stocks?: {
    fetchedAt?: string;
    quotesBySymbol?: Record<string, StockQuote>;
  };
  stockHistory?: {
    fetchedAt?: string;
    historyBySymbol?: Record<string, StockHistorySeries>;
  };
}

declare global {
  interface Window {
    __AETHER_EMBEDDED_DATA__?: EmbeddedOpenDataPayload;
  }
}
