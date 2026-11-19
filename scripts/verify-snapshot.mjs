import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getTaiwanDateString } from '../lib/opendata.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.resolve(ROOT_DIR, 'public/data');

const REQUIRED_WEATHER_COUNTIES = ['高雄市', '臺北市', '臺中市'];
const CORE_STOCK_SYMBOLS = ['2330', '0050', '2412', '2317', '2454'];
const CORE_HISTORY_SYMBOLS = ['2330', '0050', '2412'];
const MIN_STOCK_QUOTES = 800;
const MAX_QUOTE_AGE_DAYS = 14; // Covers long weekends / Lunar New Year holidays cleanly

function parseArgs(argv) {
  const args = {
    maxAgeMinutes: 60,
    htmlPath: null,
    skipFreshnessCheck: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--max-age-minutes' && argv[i + 1]) {
      args.maxAgeMinutes = Math.max(1, Number(argv[i + 1]) || 60);
      i += 1;
    } else if (arg === '--html' && argv[i + 1]) {
      args.htmlPath = path.resolve(ROOT_DIR, argv[i + 1]);
      i += 1;
    } else if (arg === '--skip-freshness-check') {
      args.skipFreshnessCheck = true;
    }
  }
  return args;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function readJsonFile(filePath, label) {
  assert(fs.existsSync(filePath), `找不到 ${label}：${path.relative(ROOT_DIR, filePath)}`);
  const raw = fs.readFileSync(filePath, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`${label} JSON 格式錯誤：${err instanceof Error ? err.message : String(err)}`);
  }
}

function assertFreshTimestamp(isoStr, label, maxAgeMinutes, skipFreshnessCheck) {
  assert(typeof isoStr === 'string' && isoStr.length > 0, `${label} 缺少 fetchedAt 時間戳記`);
  const parsed = Date.parse(isoStr);
  assert(Number.isFinite(parsed), `${label} 的 fetchedAt 格式無效：${isoStr}`);
  if (!skipFreshnessCheck) {
    const ageMs = Date.now() - parsed;
    assert(
      ageMs >= -5 * 60 * 1000 && ageMs <= maxAgeMinutes * 60 * 1000,
      `${label} 已過期或為舊快照（fetchedAt=${isoStr}，距今 ${Math.round(ageMs / 60000)} 分鐘，上限 ${maxAgeMinutes} 分鐘）`
    );
  }
}

function assertValidTimeHm(val, fieldLabel) {
  assert(
    typeof val === 'string' && /^\d{2}:\d{2}$/.test(val),
    `${fieldLabel} 格式錯誤或缺失（預期 HH:MM，實際：${String(val)}）`
  );
}

function validateWeatherPayload(weather, maxAgeMinutes, skipFreshnessCheck) {
  assert(weather && typeof weather === 'object', 'weather.json 內容為空');
  assert(
    weather.configured === true,
    `天氣資料未就緒（configured=${String(weather.configured)}）：${weather.errorMessage || '請確認 CWA_API_KEY'}`
  );
  assertFreshTimestamp(weather.fetchedAt, '天氣快照 (weather.json)', maxAgeMinutes, skipFreshnessCheck);

  const todayTaipei = getTaiwanDateString(0);
  if (!skipFreshnessCheck) {
    assert(
      weather.taiwanDate === todayTaipei,
      `天氣快照日期非台灣今日（taiwanDate=${String(weather.taiwanDate)}，預期=${todayTaipei}）`
    );
  }

  const locations = weather.locations || {};
  const countyNames = Object.keys(locations);
  assert(
    countyNames.length >= 10,
    `天氣縣市數量過少（僅 ${countyNames.length} 筆，預期至少 10 縣市）`
  );

  for (const county of REQUIRED_WEATHER_COUNTIES) {
    const obs = locations[county];
    assert(obs, `天氣快照缺少核心縣市「${county}」`);
    const hasTemp =
      (typeof obs.currentTempC === 'number' && Number.isFinite(obs.currentTempC)) ||
      (typeof obs.tempMinC === 'number' &&
        Number.isFinite(obs.tempMinC) &&
        typeof obs.tempMaxC === 'number' &&
        Number.isFinite(obs.tempMaxC));
    assert(hasTemp, `${county} 缺少有效溫度數值`);
    assert(typeof obs.condition === 'string' && obs.condition.trim().length > 0, `${county} 缺少天氣現象文字`);
    assertValidTimeHm(obs.sunriseTime, `${county} 今日日出`);
    assertValidTimeHm(obs.sunsetTime, `${county} 今日日落`);
    assertValidTimeHm(obs.yesterdaySunsetTime, `${county} 昨日日落`);
    assertValidTimeHm(obs.tomorrowSunriseTime, `${county} 隔日日出`);
  }

  const kh = locations['高雄市'];
  return {
    countyCount: countyNames.length,
    taiwanDate: weather.taiwanDate,
    sample: `高雄市 ${kh.currentTempC ?? `${kh.tempMinC}-${kh.tempMaxC}`}°C 日出 ${kh.sunriseTime} / 日落 ${kh.sunsetTime}`,
  };
}

function validateStocksPayload(stocks, maxAgeMinutes, skipFreshnessCheck) {
  assert(stocks && typeof stocks === 'object', 'stocks.json 內容為空');
  assertFreshTimestamp(stocks.fetchedAt, '台股報價 (stocks.json)', maxAgeMinutes, skipFreshnessCheck);

  const quotes = stocks.quotesBySymbol || {};
  const symbolCount = Object.keys(quotes).length;
  assert(
    symbolCount >= MIN_STOCK_QUOTES,
    `台股報價筆數過少（僅 ${symbolCount} 檔，預期至少 ${MIN_STOCK_QUOTES} 檔）`
  );

  const todayTaipei = getTaiwanDateString(0);
  const todayMs = Date.parse(`${todayTaipei}T00:00:00+08:00`);

  for (const sym of CORE_STOCK_SYMBOLS) {
    const q = quotes[sym];
    assert(q, `台股報價缺少核心標的 ${sym}`);
    assert(
      typeof q.price === 'number' && Number.isFinite(q.price) && q.price > 0,
      `核心標的 ${sym} 價格無效：${String(q.price)}`
    );
    assert(
      typeof q.quoteDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(q.quoteDate),
      `核心標的 ${sym} 交易日期格式無效：${String(q.quoteDate)}`
    );
    const quoteMs = Date.parse(`${q.quoteDate}T00:00:00+08:00`);
    assert(Number.isFinite(quoteMs), `核心標的 ${sym} 交易日期無法解析：${q.quoteDate}`);
    if (!skipFreshnessCheck) {
      const diffDays = (todayMs - quoteMs) / 86_400_000;
      assert(
        diffDays >= -1 && diffDays <= MAX_QUOTE_AGE_DAYS,
        `核心標的 ${sym} 交易日期過舊或異常（quoteDate=${q.quoteDate}，距台灣今日 ${diffDays.toFixed(1)} 天）`
      );
    }
  }

  return {
    symbolCount,
    sample: `2330=${quotes['2330'].price} (${quotes['2330'].quoteDate}), 0050=${quotes['0050'].price} (${quotes['0050'].quoteDate})`,
  };
}

function validateHistoryPayload(stockHistory, maxAgeMinutes, skipFreshnessCheck) {
  assert(stockHistory && typeof stockHistory === 'object', 'stock-history.json 內容為空');
  assertFreshTimestamp(
    stockHistory.fetchedAt,
    '個股歷史走勢 (stock-history.json)',
    maxAgeMinutes,
    skipFreshnessCheck
  );

  const historyBySymbol = stockHistory.historyBySymbol || {};
  const historySymbols = Object.keys(historyBySymbol);
  assert(historySymbols.length >= CORE_HISTORY_SYMBOLS.length, '個股歷史走勢數量不足');

  for (const sym of CORE_HISTORY_SYMBOLS) {
    const series = historyBySymbol[sym];
    assert(series, `個股歷史走勢缺少核心標的 ${sym}`);
    assert(
      Array.isArray(series.points) && series.points.length >= 5,
      `${sym} 歷史走勢點位不足（僅 ${series.points?.length ?? 0} 筆，預期至少 5 筆）`
    );
    for (const pt of series.points) {
      assert(
        pt && typeof pt.date === 'string' && pt.date.length > 0,
        `${sym} 歷史走勢包含無效日期點位`
      );
      assert(
        typeof pt.close === 'number' && Number.isFinite(pt.close) && pt.close > 0,
        `${sym} 歷史走勢包含無效收盤價：${String(pt?.close)}`
      );
    }
  }

  const s2330 = historyBySymbol['2330'];
  const latestPt = s2330.points[s2330.points.length - 1];
  return {
    historyCount: historySymbols.length,
    sample: `2330 共 ${s2330.points.length} 交易日 (最新 ${latestPt.date}: ${latestPt.close})`,
  };
}

function validateBuiltHtml(htmlPath, maxAgeMinutes, skipFreshnessCheck) {
  assert(fs.existsSync(htmlPath), `找不到建置後的單檔 HTML：${htmlPath}`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const byteSize = Buffer.byteLength(html, 'utf8');
  assert(byteSize > 300_000, `單檔 HTML 檔案過小（${byteSize} bytes），疑似建置不完整`);
  assert(
    !/<script[^>]+src=["']\/src\/main\.tsx["']/i.test(html),
    '單檔 HTML 仍包含開發環境 <script src="/src/main.tsx"> 參照'
  );

  const match = html.match(/window\.__AETHER_EMBEDDED_DATA__=(\{[\s\S]*?\});<\/script>/);
  assert(match, '單檔 HTML 中找不到內嵌的 window.__AETHER_EMBEDDED_DATA__ 資料區塊');

  let embedded;
  try {
    embedded = JSON.parse(match[1]);
  } catch (err) {
    throw new Error(
      `單檔 HTML 內嵌 JSON 解析失敗：${err instanceof Error ? err.message : String(err)}`
    );
  }

  const wSummary = validateWeatherPayload(embedded.weather, maxAgeMinutes, skipFreshnessCheck);
  const sSummary = validateStocksPayload(embedded.stocks, maxAgeMinutes, skipFreshnessCheck);
  const hSummary = validateHistoryPayload(
    embedded.stockHistory,
    maxAgeMinutes,
    skipFreshnessCheck
  );

  return { byteSize, wSummary, sSummary, hSummary };
}

function main() {
  const args = parseArgs(process.argv.slice(2));

  try {
    if (args.htmlPath) {
      const { byteSize, wSummary, sSummary, hSummary } = validateBuiltHtml(
        args.htmlPath,
        args.maxAgeMinutes,
        args.skipFreshnessCheck
      );
      console.log('[Verify HTML] 獨立單檔 HTML 驗證通過：');
      console.log(`  - 檔案大小：${(byteSize / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  - 氣象快照：${wSummary.countyCount} 縣市 (${wSummary.taiwanDate})｜${wSummary.sample}`);
      console.log(`  - 台股報價：${sSummary.symbolCount} 檔｜${sSummary.sample}`);
      console.log(`  - 歷史走勢：${hSummary.historyCount} 檔｜${hSummary.sample}`);
      return;
    }

    const weather = readJsonFile(path.join(DATA_DIR, 'weather.json'), 'weather.json');
    const stocks = readJsonFile(path.join(DATA_DIR, 'stocks.json'), 'stocks.json');
    const stockHistory = readJsonFile(
      path.join(DATA_DIR, 'stock-history.json'),
      'stock-history.json'
    );

    const wSummary = validateWeatherPayload(weather, args.maxAgeMinutes, args.skipFreshnessCheck);
    const sSummary = validateStocksPayload(stocks, args.maxAgeMinutes, args.skipFreshnessCheck);
    const hSummary = validateHistoryPayload(stockHistory, args.maxAgeMinutes, args.skipFreshnessCheck);

    console.log('[Verify Data] 快照資料驗證全部通過：');
    console.log(`  - 氣象快照：${wSummary.countyCount} 縣市 (${wSummary.taiwanDate})｜${wSummary.sample}`);
    console.log(`  - 台股報價：${sSummary.symbolCount} 檔｜${sSummary.sample}`);
    console.log(`  - 歷史走勢：${hSummary.historyCount} 檔｜${hSummary.sample}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`::error::[Verify] 快照驗證失敗，已中止流程：${message}`);
    process.exit(1);
  }
}

main();
