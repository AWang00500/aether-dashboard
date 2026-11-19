import { useEffect, useState } from 'react';
import { stockService } from '../services/stockService';
import type { StockHistorySeries, StockQuote } from '../types/stock';

export function useStockQuote(symbol: string, refreshTick: number) {
  const [quote, setQuote] = useState<StockQuote | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    stockService
      .fetchQuote(symbol)
      .then((res) => {
        if (!cancelled) {
          setQuote(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, refreshTick]);

  return { quote, loading };
}

export function useStockWatchlistQuotes(symbols: string[], refreshTick: number) {
  const [quotes, setQuotes] = useState<StockQuote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const symbolsKey = symbols.join(',');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    stockService
      .fetchQuotesBatch(symbols)
      .then((results) => {
        if (!cancelled) {
          setQuotes(results);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbolsKey, refreshTick]);

  return { quotes, loading };
}

export function useStockHistory(symbol: string, days: number, refreshTick: number) {
  const [series, setSeries] = useState<StockHistorySeries | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    stockService
      .fetchHistory(symbol, days)
      .then((res) => {
        if (!cancelled) {
          setSeries(res);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [symbol, days, refreshTick]);

  return { series, loading };
}
