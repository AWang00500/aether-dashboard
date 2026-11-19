import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  fetchAllCwaWeather,
  fetchTwseAllQuotes,
  fetchTwseRealtimeQuotes,
  fetchTwseStockHistory,
} from '../lib/opendata.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../public/data');

const DEFAULT_CHART_SYMBOLS = [
  '2330',
  '2317',
  '2454',
  '0050',
  '0056',
  '2881',
  '2308',
  '2603',
  '2382',
  '2412',
  '00878',
];
const CORE_REQUIRED_SYMBOLS = ['2330', '0050', '2412'];

async function main() {
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // 1. Central Weather Administration (CWA) - fail fast if CWA_API_KEY missing or upstream fails
  const cwaKey = process.env.CWA_API_KEY?.trim() || '';
  if (!cwaKey) {
    console.error(
      '::error::未設定 CWA_API_KEY 環境變數或 GitHub Repository Secret，無法抓取中央氣象署資料，已中止更新。'
    );
    process.exit(1);
  }

  let hasFatalError = false;

  try {
    const weatherPayload = await fetchAllCwaWeather(cwaKey);
    if (!weatherPayload.configured || Object.keys(weatherPayload.locations || {}).length === 0) {
      throw new Error(weatherPayload.errorMessage || '中央氣象署回傳空縣市資料');
    }
    fs.writeFileSync(
      path.join(DATA_DIR, 'weather.json'),
      JSON.stringify(weatherPayload, null, 2),
      'utf8'
    );
    console.log(
      `[CWA] Wrote weather.json (${Object.keys(weatherPayload.locations).length} locations)`
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`::error::[CWA] 氣象資料擷取失敗：${msg}`);
    hasFatalError = true;
  }

  const envSymbols = process.env.TWSE_CHART_SYMBOLS
    ? process.env.TWSE_CHART_SYMBOLS.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean)
    : [];
  const symbols = Array.from(new Set([...DEFAULT_CHART_SYMBOLS, ...envSymbols]));

  // 2. Taiwan Stock Exchange (TWSE) All Daily Quotes + Fresh MIS Quotes
  try {
    const twseQuotes = await fetchTwseAllQuotes();
    try {
      const misQuotes = await fetchTwseRealtimeQuotes(symbols);
      for (const [sym, misQ] of Object.entries(misQuotes)) {
        const existing = twseQuotes.quotesBySymbol[sym];
        if (!existing || (misQ.quoteDate && (!existing.quoteDate || misQ.quoteDate >= existing.quoteDate))) {
          twseQuotes.quotesBySymbol[sym] = misQ;
        }
      }
    } catch (misErr) {
      console.warn('[TWSE] MIS merge skipped:', misErr instanceof Error ? misErr.message : misErr);
    }

    if (Object.keys(twseQuotes.quotesBySymbol || {}).length === 0) {
      throw new Error('證交所報價筆數為 0');
    }

    fs.writeFileSync(
      path.join(DATA_DIR, 'stocks.json'),
      JSON.stringify(twseQuotes),
      'utf8'
    );
    console.log(`[TWSE] Wrote stocks.json (${Object.keys(twseQuotes.quotesBySymbol).length} symbols)`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`::error::[TWSE] 全市場報價擷取失敗：${msg}`);
    hasFatalError = true;
  }

  // 3. Taiwan Stock Exchange (TWSE) Historical Daily Series for watchlist/chart symbols
  const historyBySymbol = {};
  for (const sym of symbols) {
    let series = null;
    let lastErr = null;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        series = await fetchTwseStockHistory(sym, 90);
        break;
      } catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 800 * (attempt + 1)));
      }
    }
    if (series && Array.isArray(series.points) && series.points.length > 0) {
      historyBySymbol[sym] = series;
      console.log(`[TWSE] Fetched 90d history for ${sym} (${series.points.length} trading days)`);
    } else {
      console.warn(
        `[TWSE] History skipped for ${sym}:`,
        lastErr instanceof Error ? lastErr.message : lastErr || '無交易點位'
      );
    }
    await new Promise((r) => setTimeout(r, 350));
  }

  const missingCoreHistory = CORE_REQUIRED_SYMBOLS.filter((sym) => !historyBySymbol[sym]);
  if (Object.keys(historyBySymbol).length === 0 || missingCoreHistory.length > 0) {
    console.error(
      `::error::[TWSE] 個股歷史走勢擷取不完整（缺少核心標的：${missingCoreHistory.join(', ') || '全部'}），已中止更新。`
    );
    hasFatalError = true;
  } else {
    fs.writeFileSync(
      path.join(DATA_DIR, 'stock-history.json'),
      JSON.stringify({
        fetchedAt: new Date().toISOString(),
        historyBySymbol,
      }),
      'utf8'
    );
    console.log(
      `[TWSE] Wrote stock-history.json (${Object.keys(historyBySymbol).length} symbols)`
    );
  }

  if (hasFatalError) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('::error::資料擷取腳本發生未預期錯誤：', err);
  process.exit(1);
});
