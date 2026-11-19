export const TAIWAN_LOCATIONS = [
  '高雄市',
  '臺南市',
  '屏東縣',
  '嘉義市',
  '嘉義縣',
  '臺北市',
  '新北市',
  '桃園市',
  '新竹市',
  '臺中市',
  '宜蘭縣',
  '花蓮縣',
  '臺東縣',
];

export function getTaiwanDateString(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function getTaiwanTimeString() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Taipei',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '00';
  return `${get('hour')}:${get('minute')}:${get('second')}`;
}

function mapWxToCode(wxText, wxValue) {
  const codeNum = Number(wxValue);
  if (Number.isFinite(codeNum)) {
    if (codeNum === 1) return 'clear';
    if (codeNum >= 2 && codeNum <= 3) return 'partly-cloudy';
    if (codeNum >= 4 && codeNum <= 7) return 'cloudy';
    if ((codeNum >= 8 && codeNum <= 14) || (codeNum >= 19 && codeNum <= 22) || codeNum === 29 || codeNum === 30) {
      return 'rain';
    }
    if ((codeNum >= 15 && codeNum <= 18) || (codeNum >= 33 && codeNum <= 36)) {
      return 'thunderstorm';
    }
    if (codeNum >= 24 && codeNum <= 28) return 'fog';
  }
  const text = String(wxText || '');
  if (text.includes('雷')) return 'thunderstorm';
  if (text.includes('雨')) return 'rain';
  if (text.includes('霧')) return 'fog';
  if (text.includes('陰')) return 'cloudy';
  if (text.includes('多雲')) return 'partly-cloudy';
  if (text.includes('晴')) return 'clear';
  return 'partly-cloudy';
}

function parseValidNumber(val, minValid = -50) {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (!Number.isFinite(num) || num <= minValid) return null;
  return num;
}

function normalizeCountyName(name) {
  return String(name || '').replace(/^台/, '臺').trim();
}

function isRetryableStatus(status) {
  return status === 408 || status === 429 || (status >= 500 && status <= 599);
}

export async function fetchWithRetry(
  url,
  options = {},
  { timeoutMs = 15000, retries = 2, retryDelayMs = 1000, label = 'OpenData' } = {}
) {
  let lastError = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (res.ok || !isRetryableStatus(res.status) || attempt === retries) {
        return res;
      }
      lastError = new Error(`${label} HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
      if (attempt === retries) {
        throw err;
      }
    }
    const waitMs = retryDelayMs * (attempt + 1);
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  throw lastError || new Error(`${label} 請求失敗`);
}

export async function fetchAllCwaWeather(apiKey) {
  if (!apiKey || !String(apiKey).trim()) {
    return {
      configured: false,
      fetchedAt: new Date().toISOString(),
      locations: {},
      errorMessage: '尚未設定中央氣象署開放資料授權碼（CWA_API_KEY）。',
    };
  }

  const key = encodeURIComponent(String(apiKey).trim());
  const yesterdayIso = getTaiwanDateString(-1);
  const todayIso = getTaiwanDateString(0);
  const tomorrowIso = getTaiwanDateString(1);

  const [forecastRes, obsRes, obsHourlyRes, yesterdayAstroRes, astroRes, tomorrowAstroRes] =
    await Promise.allSettled([
      fetchWithRetry(
        `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${key}`,
        {},
        { timeoutMs: 15000, retries: 2, label: 'CWA F-C0032-001' }
      ),
      fetchWithRetry(
        `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0003-001?Authorization=${key}`,
        {},
        { timeoutMs: 15000, retries: 2, label: 'CWA O-A0003-001' }
      ),
      fetchWithRetry(
        `https://opendata.cwa.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${key}`,
        {},
        { timeoutMs: 15000, retries: 2, label: 'CWA O-A0001-001' }
      ),
      fetchWithRetry(
        `https://opendata.cwa.gov.tw/api/v1/rest/datastore/A-B0062-001?Authorization=${key}&Date=${yesterdayIso}`,
        {},
        { timeoutMs: 15000, retries: 2, label: 'CWA A-B0062-001 (昨日)' }
      ),
      fetchWithRetry(
        `https://opendata.cwa.gov.tw/api/v1/rest/datastore/A-B0062-001?Authorization=${key}&Date=${todayIso}`,
        {},
        { timeoutMs: 15000, retries: 2, label: 'CWA A-B0062-001 (今日)' }
      ),
      fetchWithRetry(
        `https://opendata.cwa.gov.tw/api/v1/rest/datastore/A-B0062-001?Authorization=${key}&Date=${tomorrowIso}`,
        {},
        { timeoutMs: 15000, retries: 2, label: 'CWA A-B0062-001 (明日)' }
      ),
    ]);

  if (forecastRes.status !== 'fulfilled' || !forecastRes.value.ok) {
    const status = forecastRes.status === 'fulfilled' ? forecastRes.value.status : 'NETWORK';
    throw new Error(`中央氣象署預報資料取得失敗 (${status})`);
  }

  const forecastJson = await forecastRes.value.json();
  if (forecastJson?.success !== 'true' && forecastJson?.success !== true) {
    throw new Error('中央氣象署回傳格式異常或授權碼無效。');
  }

  const obsStations = [];
  if (obsRes.status === 'fulfilled' && obsRes.value.ok) {
    const obsJson = await obsRes.value.json().catch(() => null);
    if (Array.isArray(obsJson?.records?.Station)) {
      obsStations.push(...obsJson.records.Station);
    }
  }
  if (obsHourlyRes.status === 'fulfilled' && obsHourlyRes.value.ok) {
    const obsHourlyJson = await obsHourlyRes.value.json().catch(() => null);
    if (Array.isArray(obsHourlyJson?.records?.Station)) {
      obsStations.push(...obsHourlyJson.records.Station);
    }
  }

  // Group best observation station per county
  const stationByCounty = new Map();
  for (const st of obsStations) {
    const county = normalizeCountyName(st?.GeoInfo?.CountyName);
    if (!county) continue;
    const temp = parseValidNumber(st?.WeatherElement?.AirTemperature);
    if (temp === null) continue;
    if (!stationByCounty.has(county)) {
      stationByCounty.set(county, st);
    }
  }

  // Parse sunrise/sunset from A-B0062-001 (today & tomorrow)
  const astroByCounty = new Map();
  const parseAstroResponse = async (resPromise, targetDateIso, fieldPrefix) => {
    if (resPromise.status !== 'fulfilled' || !resPromise.value.ok) return;
    const astroJson = await resPromise.value.json().catch(() => null);
    const astroLocs =
      astroJson?.records?.locations?.location ||
      astroJson?.records?.location ||
      [];
    if (!Array.isArray(astroLocs)) return;
    for (const loc of astroLocs) {
      const county = normalizeCountyName(loc?.CountyName || loc?.locationName);
      if (!county || !Array.isArray(loc?.time)) continue;
      const entry = loc.time.find((t) =>
        String(t?.Date || '').startsWith(targetDateIso)
      );
      if (entry) {
        const prev = astroByCounty.get(county) || {};
        astroByCounty.set(county, {
          ...prev,
          [`${fieldPrefix}Sunrise`]: entry.SunRiseTime || null,
          [`${fieldPrefix}Sunset`]: entry.SunSetTime || null,
        });
      }
    }
  };
  await Promise.all([
    parseAstroResponse(yesterdayAstroRes, yesterdayIso, 'yesterday'),
    parseAstroResponse(astroRes, todayIso, 'today'),
    parseAstroResponse(tomorrowAstroRes, tomorrowIso, 'tomorrow'),
  ]);

  const forecastLocs = forecastJson?.records?.location || [];
  const locations = {};

  for (const loc of forecastLocs) {
    const county = normalizeCountyName(loc?.locationName);
    if (!county) continue;

    const elements = new Map();
    for (const el of loc?.weatherElement || []) {
      elements.set(el.elementName, el.time || []);
    }

    const wxTimes = elements.get('Wx') || [];
    const popTimes = elements.get('PoP') || [];
    const minTTimes = elements.get('MinT') || [];
    const maxTTimes = elements.get('MaxT') || [];
    const ciTimes = elements.get('CI') || [];

    const todayWx = wxTimes[0]?.parameter;
    const todayPop = parseValidNumber(popTimes[0]?.parameter?.parameterName, -1);
    const todayMinT = parseValidNumber(minTTimes[0]?.parameter?.parameterName);
    const todayMaxT = parseValidNumber(maxTTimes[0]?.parameter?.parameterName);

    // Find tomorrow time slots (starting with tomorrowIso or fallback index 1/2)
    let tomorrowIdx = wxTimes.findIndex(
      (t) => String(t?.startTime || '').startsWith(tomorrowIso) && String(t?.startTime || '').includes('06:00')
    );
    if (tomorrowIdx < 0) {
      tomorrowIdx = wxTimes.findIndex((t) => String(t?.startTime || '').startsWith(tomorrowIso));
    }
    if (tomorrowIdx < 0) {
      tomorrowIdx = Math.min(2, Math.max(0, wxTimes.length - 1));
    }

    const tomWx = wxTimes[tomorrowIdx]?.parameter;
    const tomPop = parseValidNumber(popTimes[tomorrowIdx]?.parameter?.parameterName, -1);
    const tomMinT = parseValidNumber(minTTimes[tomorrowIdx]?.parameter?.parameterName);
    const tomMaxT = parseValidNumber(maxTTimes[tomorrowIdx]?.parameter?.parameterName);
    const tomCi = ciTimes[tomorrowIdx]?.parameter?.parameterName || null;

    const station = stationByCounty.get(county);
    const currentTempC = parseValidNumber(station?.WeatherElement?.AirTemperature);
    const humidityPercent = parseValidNumber(station?.WeatherElement?.RelativeHumidity, -1);
    const pressureHpa = parseValidNumber(station?.WeatherElement?.AirPressure, 0);
    const windSpeedMs = parseValidNumber(station?.WeatherElement?.WindSpeed, -0.01);
    const rawStationWx = station?.WeatherElement?.Weather;
    const stationWx =
      rawStationWx && rawStationWx !== 'X' && rawStationWx !== '-99' ? String(rawStationWx) : null;

    const astro = astroByCounty.get(county);
    const yesterdaySunsetTime = astro?.yesterdaySunset
      ? String(astro.yesterdaySunset).slice(0, 5)
      : null;
    const sunriseTime = astro?.todaySunrise ? String(astro.todaySunrise).slice(0, 5) : null;
    const sunsetTime = astro?.todaySunset ? String(astro.todaySunset).slice(0, 5) : null;
    const tomorrowSunriseTime = astro?.tomorrowSunrise
      ? String(astro.tomorrowSunrise).slice(0, 5)
      : null;
    const tomorrowSunsetTime = astro?.tomorrowSunset
      ? String(astro.tomorrowSunset).slice(0, 5)
      : null;

    locations[county] = {
      location: county,
      stationName: station?.StationName || null,
      currentTempC,
      tempMinC: todayMinT,
      tempMaxC: todayMaxT,
      condition: stationWx || todayWx?.parameterName || '未知',
      conditionCode: mapWxToCode(stationWx || todayWx?.parameterName, todayWx?.parameterValue),
      popPercent: todayPop,
      humidityPercent,
      pressureHpa,
      windSpeedMs,
      yesterdaySunsetTime,
      yesterdaySunsetIso: yesterdaySunsetTime
        ? `${yesterdayIso}T${yesterdaySunsetTime}:00+08:00`
        : null,
      sunriseTime,
      sunsetTime,
      sunriseIso: sunriseTime ? `${todayIso}T${sunriseTime}:00+08:00` : null,
      sunsetIso: sunsetTime ? `${todayIso}T${sunsetTime}:00+08:00` : null,
      tomorrowSunriseTime,
      tomorrowSunriseIso: tomorrowSunriseTime ? `${tomorrowIso}T${tomorrowSunriseTime}:00+08:00` : null,
      tomorrowSunsetTime,
      tomorrowSunsetIso: tomorrowSunsetTime ? `${tomorrowIso}T${tomorrowSunsetTime}:00+08:00` : null,
      tomorrow: {
        date: tomorrowIso,
        label: '明日預報',
        condition: tomWx?.parameterName || '未知',
        conditionCode: mapWxToCode(tomWx?.parameterName, tomWx?.parameterValue),
        tempMinC: tomMinT,
        tempMaxC: tomMaxT,
        popPercent: tomPop,
        comfortIndex: tomCi,
      },
      sourceMode: 'api',
      sourceLabel: '中央氣象署開放資料 (CWA)',
      isRealtime: true,
      observedAt: station?.ObsTime?.DateTime || new Date().toISOString(),
    };
  }

  return {
    configured: true,
    taiwanDate: todayIso,
    fetchedAt: new Date().toISOString(),
    locations,
  };
}

function parseRocDateToIso(rocDate) {
  const digits = String(rocDate || '').replace(/\D/g, '');
  if (digits.length === 7) {
    const year = Number(digits.slice(0, 3)) + 1911;
    const mm = digits.slice(3, 5);
    const dd = digits.slice(5, 7);
    return `${year}-${mm}-${dd}`;
  }
  return String(rocDate || '');
}

function parseTwseFloat(raw) {
  if (raw === null || raw === undefined) return null;
  const cleaned = String(raw).replace(/,/g, '').replace(/^\+/, '').trim();
  if (!cleaned || cleaned === '--' || cleaned === 'X' || cleaned.startsWith('X')) {
    return null;
  }
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : null;
}

export async function fetchTwseAllQuotes() {
  const res = await fetchWithRetry(
    'https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL',
    { headers: { Accept: 'application/json' } },
    { timeoutMs: 20000, retries: 2, retryDelayMs: 1500, label: 'TWSE STOCK_DAY_ALL' }
  );
  if (!res.ok) {
    throw new Error(`臺灣證券交易所 OpenAPI 回應失敗 (${res.status})`);
  }
  const rows = await res.json();
  if (!Array.isArray(rows)) {
    throw new Error('臺灣證券交易所回傳資料格式非預期陣列。');
  }

  const fetchedAt = new Date().toISOString();
  const quotesBySymbol = {};
  const catalog = [];

  for (const row of rows) {
    const symbol = String(row?.Code || '').trim().toUpperCase();
    const name = String(row?.Name || '').trim();
    if (!symbol || !name) continue;

    const price = parseTwseFloat(row?.ClosingPrice);
    const open = parseTwseFloat(row?.OpeningPrice);
    const high = parseTwseFloat(row?.HighestPrice);
    const low = parseTwseFloat(row?.LowestPrice);
    const change = parseTwseFloat(row?.Change);
    const volumeShares = parseTwseFloat(row?.TradeVolume);
    const volumeLots = volumeShares !== null ? Math.round(volumeShares / 1000) : null;

    let prevClose = null;
    let changePercent = null;
    if (price !== null && change !== null) {
      prevClose = Number((price - change).toFixed(2));
      if (prevClose > 0) {
        changePercent = Number(((change / prevClose) * 100).toFixed(2));
      }
    }

    const quoteDate = parseRocDateToIso(row?.Date);

    quotesBySymbol[symbol] = {
      symbol,
      name,
      market: 'TWSE',
      price,
      change,
      changePercent,
      open,
      high,
      low,
      prevClose,
      volumeLots,
      quoteDate,
      updatedAt: fetchedAt,
      quoteType: 'daily_close',
      sourceMode: 'api',
      sourceLabel: '臺灣證券交易所每日收盤行情',
    };

    catalog.push({ symbol, name, market: 'TWSE' });
  }

  return {
    fetchedAt,
    quotesBySymbol,
    catalog,
  };
}

function formatMisDateToIso(rawDate) {
  const digits = String(rawDate || '').replace(/\D/g, '');
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return String(rawDate || '');
}

export async function fetchTwseRealtimeQuotes(symbols) {
  const cleanSymbols = Array.from(
    new Set(
      (symbols || [])
        .map((s) => String(s || '').trim().toUpperCase())
        .filter(Boolean)
    )
  );
  if (cleanSymbols.length === 0) return {};

  const quotesBySymbol = {};
  const taiwanToday = getTaiwanDateString(0);
  const taiwanTime = getTaiwanTimeString();
  const fetchedAt = new Date().toISOString();

  // Query TWSE MIS in batches of up to 25 symbols
  for (let i = 0; i < cleanSymbols.length; i += 25) {
    const batch = cleanSymbols.slice(i, i + 25);
    const exCh = batch.map((s) => `tse_${s}.tw`).join('|');
    const url = `https://mis.twse.com.tw/stock/api/getStockInfo.jsp?ex_ch=${encodeURIComponent(exCh)}&json=1&delay=0`;

    const res = await fetchWithRetry(
      url,
      {
        headers: {
          Accept: 'application/json',
          Referer: 'https://mis.twse.com.tw/stock/fibest.jsp',
        },
      },
      { timeoutMs: 12000, retries: 1, retryDelayMs: 800, label: 'TWSE MIS' }
    ).catch(() => null);
    if (!res || !res.ok) continue;

    const json = await res.json().catch(() => null);
    if (!json || !Array.isArray(json.msgArray)) continue;

    for (const row of json.msgArray) {
      const symbol = String(row?.c || '').trim().toUpperCase();
      const name = String(row?.n || '').trim();
      if (!symbol || !name) continue;

      const rawPrice =
        row?.z && row.z !== '-' ? row.z : row?.trade?.z && row.trade.z !== '-' ? row.trade.z : null;
      const price = parseTwseFloat(rawPrice);
      const prevClose = parseTwseFloat(row?.y);
      const open = parseTwseFloat(row?.o);
      const high = parseTwseFloat(row?.h);
      const low = parseTwseFloat(row?.l);
      const volumeLots = parseTwseFloat(row?.v);

      if (price === null) continue;

      let change = null;
      let changePercent = null;
      if (prevClose !== null && prevClose > 0) {
        change = Number((price - prevClose).toFixed(2));
        changePercent = Number(((change / prevClose) * 100).toFixed(2));
      }

      const quoteDate = formatMisDateToIso(row?.d);
      const quoteTime = String(row?.t || '').trim();
      const isToday = quoteDate === taiwanToday;
      const isMarketHours =
        isToday && taiwanTime >= '09:00:00' && taiwanTime <= '13:35:00' && quoteTime < '13:30:00';

      quotesBySymbol[symbol] = {
        symbol,
        name,
        market: 'TWSE',
        price,
        change,
        changePercent,
        open,
        high,
        low,
        prevClose,
        volumeLots: volumeLots !== null ? Math.round(volumeLots) : null,
        quoteDate,
        quoteTime: quoteTime || undefined,
        updatedAt: fetchedAt,
        quoteType: isMarketHours ? 'intraday' : 'daily_close',
        sourceMode: 'api',
        sourceLabel: isMarketHours
          ? '臺灣證券交易所即時盤中行情 (MIS)'
          : isToday
            ? '臺灣證券交易所今日收盤行情 (MIS)'
            : '臺灣證券交易所最近交易日收盤 (MIS)',
      };
    }
  }

  return quotesBySymbol;
}

export async function fetchTwseStockHistory(symbol, days = 30) {
  const cleanSymbol = String(symbol || '').trim().toUpperCase();
  if (!cleanSymbol) {
    throw new Error('請指定臺灣證券交易所股票代號。');
  }

  // Need 1 month for 7 days, 2 months for 30 days, 4-5 months for 90 days
  const monthsNeeded = days <= 10 ? 2 : days <= 35 ? 3 : 5;
  const nowTaipei = getTaiwanDateString(0);
  const [baseYear, baseMonth] = nowTaipei.split('-').map(Number);

  const monthDates = [];
  for (let i = monthsNeeded - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(baseYear, baseMonth - 1 - i, 1));
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    monthDates.push(`${y}${m}01`);
  }

  const allPoints = [];
  let stockTitleName = cleanSymbol;

  for (const dateParam of monthDates) {
    const url = `https://www.twse.com.tw/exchangeReport/STOCK_DAY?response=json&date=${dateParam}&stockNo=${encodeURIComponent(cleanSymbol)}`;
    const res = await fetchWithRetry(
      url,
      { headers: { Accept: 'application/json' } },
      { timeoutMs: 15000, retries: 2, retryDelayMs: 1200, label: `TWSE STOCK_DAY ${cleanSymbol}` }
    ).catch(() => null);
    if (!res || !res.ok) continue;
    const json = await res.json().catch(() => null);
    if (!json || json.stat !== 'OK' || !Array.isArray(json.data)) continue;

    if (typeof json.title === 'string') {
      const parts = json.title.trim().split(/\s+/);
      if (parts.length >= 3) {
        stockTitleName = parts[2];
      }
    }

    for (const row of json.data) {
      // [日期, 成交股數, 成交金額, 開盤價, 最高價, 最低價, 收盤價, 漲跌價差, 成交筆數]
      const rawDate = String(row[0] || '');
      const close = parseTwseFloat(row[6]);
      const shares = parseTwseFloat(row[1]);
      if (close === null) continue;

      const dateParts = rawDate.split('/');
      const shortDate =
        dateParts.length === 3 ? `${dateParts[1]}/${dateParts[2]}` : rawDate;

      allPoints.push({
        date: shortDate,
        close,
        volumeLots: shares !== null ? Math.round(shares / 1000) : null,
      });
    }
  }

  if (allPoints.length === 0) {
    throw new Error(`無法從臺灣證券交易所取得 ${cleanSymbol} 之歷史日成交資訊。`);
  }

  const sliced = allPoints.slice(-days);

  return {
    symbol: cleanSymbol,
    name: stockTitleName,
    market: 'TWSE',
    days,
    points: sliced,
    quoteType: 'daily_close',
    sourceMode: 'api',
    sourceLabel: `臺灣證券交易所歷史日收盤（近 ${sliced.length} 交易日）`,
    updatedAt: new Date().toISOString(),
  };
}
