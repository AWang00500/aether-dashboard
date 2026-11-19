import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchAllCwaWeather,
  fetchTwseAllQuotes,
  fetchTwseRealtimeQuotes,
  fetchTwseStockHistory,
  getTaiwanDateString,
} from './lib/opendata.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

// Simple in-memory TTL caches so we respect upstream CWA / TWSE rate limits
let weatherCache: {
  taiwanDate: string;
  expiresAt: number;
  payload: Awaited<ReturnType<typeof fetchAllCwaWeather>>;
} | null = null;
let twseAllCache: { expiresAt: number; payload: Awaited<ReturnType<typeof fetchTwseAllQuotes>> } | null = null;
const twseMisCache = new Map<
  string,
  { expiresAt: number; quote: Awaited<ReturnType<typeof fetchTwseRealtimeQuotes>>[string] }
>();
const twseHistoryCache = new Map<
  string,
  { expiresAt: number; payload: Awaited<ReturnType<typeof fetchTwseStockHistory>> }
>();

async function getWeatherSnapshot() {
  const apiKey = process.env.CWA_API_KEY?.trim() || '';
  if (!apiKey) {
    return {
      configured: false,
      fetchedAt: new Date().toISOString(),
      locations: {},
      errorMessage: '尚未設定中央氣象署開放資料授權碼（CWA_API_KEY）。',
    };
  }

  const taiwanToday = getTaiwanDateString(0);
  if (weatherCache && weatherCache.taiwanDate === taiwanToday && Date.now() < weatherCache.expiresAt) {
    return weatherCache.payload;
  }

  const payload = await fetchAllCwaWeather(apiKey);
  weatherCache = {
    taiwanDate: payload.taiwanDate || taiwanToday,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    payload,
  };
  return payload;
}

async function getTwseAllSnapshot() {
  if (twseAllCache && Date.now() < twseAllCache.expiresAt) {
    return twseAllCache.payload;
  }
  const payload = await fetchTwseAllQuotes();
  twseAllCache = {
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 minutes
    payload,
  };
  return payload;
}

async function getFreshTwseQuotes(symbols: string[]) {
  const cleanSymbols = Array.from(
    new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))
  );
  const nowMs = Date.now();
  const result: Record<string, Awaited<ReturnType<typeof fetchTwseRealtimeQuotes>>[string]> = {};
  const missing: string[] = [];

  for (const sym of cleanSymbols) {
    const cached = twseMisCache.get(sym);
    if (cached && nowMs < cached.expiresAt) {
      result[sym] = cached.quote;
    } else {
      missing.push(sym);
    }
  }

  if (missing.length > 0) {
    try {
      const fresh = await fetchTwseRealtimeQuotes(missing);
      for (const [sym, q] of Object.entries(fresh)) {
        twseMisCache.set(sym, {
          expiresAt: nowMs + 15 * 1000, // 15 seconds for live MIS ticks
          quote: q,
        });
        result[sym] = q;
      }
    } catch {
      // Fall back to STOCK_DAY_ALL below
    }
  }

  const needsFallback = cleanSymbols.some((sym) => !result[sym]);
  const allSnapshot = needsFallback ? await getTwseAllSnapshot().catch(() => null) : null;

  for (const sym of cleanSymbols) {
    const misQuote = result[sym];
    const allQuote = allSnapshot?.quotesBySymbol?.[sym];
    if (misQuote && allQuote) {
      if (allQuote.quoteDate > misQuote.quoteDate) {
        result[sym] = allQuote;
      }
    } else if (!misQuote && allQuote) {
      result[sym] = allQuote;
    }
  }

  return result;
}

async function startServer() {
  const app = express();

  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/weather', async (req, res) => {
    try {
      const location = String(req.query.location || '高雄市').trim();
      const snapshot = await getWeatherSnapshot();
      if (!snapshot.configured) {
        return res.json({
          configured: false,
          location,
          errorMessage: snapshot.errorMessage,
        });
      }
      const obs = snapshot.locations[location];
      if (!obs) {
        return res.status(404).json({
          configured: true,
          location,
          errorMessage: `中央氣象署資料中找不到「${location}」的觀測與預報紀錄。`,
        });
      }
      return res.json({ configured: true, observation: obs });
    } catch (err) {
      const message = err instanceof Error ? err.message : '中央氣象署資料取得失敗。';
      return res.status(502).json({ configured: true, errorMessage: message });
    }
  });

  app.get('/api/stocks/all', async (_req, res) => {
    try {
      const snapshot = await getTwseAllSnapshot();
      return res.json(snapshot);
    } catch (err) {
      const message = err instanceof Error ? err.message : '臺灣證券交易所資料取得失敗。';
      return res.status(502).json({ errorMessage: message });
    }
  });

  app.get('/api/stocks/quote', async (req, res) => {
    try {
      const symbol = String(req.query.symbol || '2330').trim().toUpperCase();
      const quotesMap = await getFreshTwseQuotes([symbol]);
      const quote = quotesMap[symbol];
      if (!quote) {
        return res.status(404).json({
          errorMessage: `臺灣證券交易所（上市）查無股票代號 ${symbol}。`,
        });
      }
      return res.json({ quote });
    } catch (err) {
      const message = err instanceof Error ? err.message : '臺灣證券交易所報價取得失敗。';
      return res.status(502).json({ errorMessage: message });
    }
  });

  app.get('/api/stocks/quotes', async (req, res) => {
    try {
      const symbols = String(req.query.symbols || '')
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 25);
      const quotesMap = await getFreshTwseQuotes(symbols);
      return res.json({ quotesBySymbol: quotesMap });
    } catch (err) {
      const message = err instanceof Error ? err.message : '臺灣證券交易所批次報價取得失敗。';
      return res.status(502).json({ errorMessage: message });
    }
  });

  app.get('/api/stocks/history', async (req, res) => {
    try {
      const symbol = String(req.query.symbol || '2330').trim().toUpperCase();
      const days = Math.min(90, Math.max(5, Number(req.query.days) || 30));
      const cacheKey = `${symbol}:${days}`;
      const cached = twseHistoryCache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        return res.json({ series: cached.payload });
      }
      const series = await fetchTwseStockHistory(symbol, days);
      twseHistoryCache.set(cacheKey, {
        expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
        payload: series,
      });
      return res.json({ series });
    } catch (err) {
      const message = err instanceof Error ? err.message : '臺灣證券交易所歷史走勢取得失敗。';
      return res.status(502).json({ errorMessage: message });
    }
  });

  app.get('/api/export-standalone', async (req, res) => {
    try {
      const selfIndex = path.resolve(__dirname, 'SELF', 'index.html');
      const distIndex = path.resolve(__dirname, 'dist', 'index.html');
      const sourceFile = fs.existsSync(selfIndex)
        ? selfIndex
        : fs.existsSync(distIndex)
          ? distIndex
          : null;

      if (!sourceFile) {
        return res.status(404).json({
          errorMessage: '尚未產生建置檔案，請先執行 npm run build。',
        });
      }

      const rawSymbols = String(req.query.symbols || '2330,2317,2454,0050,2412')
        .split(',')
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean)
        .slice(0, 12);

      const [weatherResult, stocksResult, misQuotesResult] = await Promise.allSettled([
        getWeatherSnapshot(),
        getTwseAllSnapshot(),
        getFreshTwseQuotes(rawSymbols),
      ]);

      const mergedStocks =
        stocksResult.status === 'fulfilled'
          ? {
              ...stocksResult.value,
              quotesBySymbol: {
                ...stocksResult.value.quotesBySymbol,
                ...(misQuotesResult.status === 'fulfilled' ? misQuotesResult.value : {}),
              },
            }
          : misQuotesResult.status === 'fulfilled'
            ? { fetchedAt: new Date().toISOString(), quotesBySymbol: misQuotesResult.value, catalog: [] }
            : undefined;

      const historyBySymbol: Record<string, Awaited<ReturnType<typeof fetchTwseStockHistory>>> = {};
      for (const sym of rawSymbols) {
        const cacheKey = `${sym}:90`;
        const cached = twseHistoryCache.get(cacheKey);
        if (cached && Date.now() < cached.expiresAt) {
          historyBySymbol[sym] = cached.payload;
          continue;
        }
        try {
          const series = await fetchTwseStockHistory(sym, 90);
          twseHistoryCache.set(cacheKey, {
            expiresAt: Date.now() + 30 * 60 * 1000,
            payload: series,
          });
          historyBySymbol[sym] = series;
        } catch {
          // Skip unavailable symbol history
        }
      }

      const embeddedPayload = {
        weather: weatherResult.status === 'fulfilled' ? weatherResult.value : undefined,
        stocks: mergedStocks,
        stockHistory: {
          fetchedAt: new Date().toISOString(),
          historyBySymbol,
        },
      };

      const safeJson = JSON.stringify(embeddedPayload).replace(/</g, '\\u003c');
      const scriptTag = `<!--AETHER_EMBEDDED_START--><script>window.__AETHER_EMBEDDED_DATA__=${safeJson};</script><!--AETHER_EMBEDDED_END-->`;
      let html = fs.readFileSync(sourceFile, 'utf8');
      if (html.includes('<!--AETHER_EMBEDDED_START-->')) {
        html = html.replace(
          /<!--AETHER_EMBEDDED_START-->[\s\S]*?<!--AETHER_EMBEDDED_END-->/,
          () => scriptTag
        );
      } else {
        html = html.replace('<head>', () => `<head>\n    ${scriptTag}`);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="index.html"');
      return res.send(html);
    } catch (err) {
      const message = err instanceof Error ? err.message : '匯出獨立單檔失敗。';
      return res.status(500).json({ errorMessage: message });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found. Run npm run build first.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`THE AETHER ENGINE server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
