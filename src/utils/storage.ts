import { createDefaultDashboardConfig, DEFAULT_USER_SETTINGS } from '../config/defaultDashboard';
import { isValidWidgetType } from '../config/widgetRegistry';
import type {
  DashboardConfigV1,
  UserSettings,
  WidgetInstance,
} from '../types/dashboard';

export const STORAGE_KEY = 'aether_engine_dashboard_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export interface ValidationResult {
  valid: boolean;
  config?: DashboardConfigV1;
  error?: string;
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function sanitizeWidget(raw: unknown, index: number): WidgetInstance | null {
  if (!isPlainObject(raw)) return null;
  if (typeof raw.id !== 'string' || raw.id.trim().length === 0) return null;
  if (!isValidWidgetType(raw.type)) return null;

  const rawLayout = isPlainObject(raw.layout) ? raw.layout : {};
  const x = typeof rawLayout.x === 'number' && Number.isFinite(rawLayout.x) ? Math.max(0, Math.floor(rawLayout.x)) : 0;
  const y = typeof rawLayout.y === 'number' && Number.isFinite(rawLayout.y) ? Math.max(0, Math.floor(rawLayout.y)) : index * 4;
  const w = typeof rawLayout.w === 'number' && Number.isFinite(rawLayout.w) ? Math.max(2, Math.min(12, Math.floor(rawLayout.w))) : 4;
  const h = typeof rawLayout.h === 'number' && Number.isFinite(rawLayout.h) ? Math.max(2, Math.min(16, Math.floor(rawLayout.h))) : 4;

  const config = isPlainObject(raw.config) ? { ...raw.config } : {};

  return {
    id: raw.id.trim(),
    type: raw.type,
    layout: { x, y, w, h },
    hidden: Boolean(raw.hidden),
    config,
    lastUpdated: typeof raw.lastUpdated === 'string' ? raw.lastUpdated : undefined,
  };
}

function sanitizeSettings(raw: unknown): UserSettings {
  if (!isPlainObject(raw)) return { ...DEFAULT_USER_SETTINGS };

  const validIntervals = new Set([0, 10, 30, 60, 300]);
  const rawInterval = Number(raw.refreshIntervalSec);
  const refreshIntervalSec = (validIntervals.has(rawInterval)
    ? rawInterval
    : DEFAULT_USER_SETTINGS.refreshIntervalSec) as UserSettings['refreshIntervalSec'];

  const watchlist = Array.isArray(raw.watchlist)
    ? raw.watchlist
        .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim().toUpperCase())
        .slice(0, 20)
    : [...DEFAULT_USER_SETTINGS.watchlist];

  return {
    location:
      typeof raw.location === 'string' && raw.location.trim().length > 0
        ? raw.location.trim()
        : DEFAULT_USER_SETTINGS.location,
    watchlist: watchlist.length > 0 ? watchlist : [...DEFAULT_USER_SETTINGS.watchlist],
    refreshIntervalSec,
    enableGearAnimations:
      typeof raw.enableGearAnimations === 'boolean'
        ? raw.enableGearAnimations
        : DEFAULT_USER_SETTINGS.enableGearAnimations,
    compactDensity:
      typeof raw.compactDensity === 'boolean'
        ? raw.compactDensity
        : DEFAULT_USER_SETTINGS.compactDensity,
  };
}

export function validateDashboardConfig(input: unknown): ValidationResult {
  if (!isPlainObject(input)) {
    return { valid: false, error: '設定檔格式錯誤：最外層必須為 JSON 物件。' };
  }

  if (input.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    return {
      valid: false,
      error: `設定檔版本不相容（收到版本 ${String(input.schemaVersion ?? '未知')}，僅支援版本 ${CURRENT_SCHEMA_VERSION}）。`,
    };
  }

  if (!Array.isArray(input.widgets)) {
    return { valid: false, error: '設定檔缺少有效的 widgets 陣列欄位。' };
  }

  const seenIds = new Set<string>();
  const widgets: WidgetInstance[] = [];

  for (let i = 0; i < input.widgets.length; i += 1) {
    const sanitized = sanitizeWidget(input.widgets[i], i);
    if (!sanitized) {
      return {
        valid: false,
        error: `第 ${i + 1} 個儀表設定格式不正確或包含未支援的儀表類型。`,
      };
    }
    if (seenIds.has(sanitized.id)) {
      return {
        valid: false,
        error: `儀表識別碼重複（${sanitized.id}），請檢查設定檔內容。`,
      };
    }
    seenIds.add(sanitized.id);
    widgets.push(sanitized);
  }

  const settings = sanitizeSettings(input.settings);

  return {
    valid: true,
    config: {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt:
        typeof input.updatedAt === 'string'
          ? input.updatedAt
          : new Date().toISOString(),
      widgets,
      settings,
    },
  };
}

function encodeBase64Utf8(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeBase64Utf8(b64url: string): string {
  const padded = b64url.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((b64url.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export function buildDeviceSyncUrl(config: DashboardConfigV1): string {
  const json = exportDashboardConfigJson(config);
  const token = encodeBase64Utf8(json);
  const baseUrl = `${window.location.origin}${window.location.pathname}`;
  return `${baseUrl}#sync=${token}`;
}

export function tryReadSyncHash(): DashboardConfigV1 | null {
  try {
    const hash = window.location.hash || '';
    if (!hash.startsWith('#sync=')) return null;
    const token = hash.slice(6);
    if (!token) return null;
    const json = decodeBase64Utf8(token);
    const parsed: unknown = JSON.parse(json);
    const result = validateDashboardConfig(parsed);
    if (result.valid && result.config) {
      return result.config;
    }
  } catch {
    // Ignore malformed sync hash
  }
  return null;
}

export function loadDashboardConfig(): { config: DashboardConfigV1; syncedFromUrl: boolean } {
  const synced = tryReadSyncHash();
  if (synced) {
    saveDashboardConfig(synced);
    try {
      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    } catch {
      // Ignore history errors
    }
    return { config: synced, syncedFromUrl: true };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial = createDefaultDashboardConfig();
      saveDashboardConfig(initial);
      return { config: initial, syncedFromUrl: false };
    }
    const parsed: unknown = JSON.parse(raw);
    const result = validateDashboardConfig(parsed);
    if (result.valid && result.config) {
      const migrationKey = 'aether_engine_migrated_south_v1';
      if (!window.localStorage.getItem(migrationKey)) {
        window.localStorage.setItem(migrationKey, '1');
        if (result.config.settings.location === '臺北市') {
          result.config.settings.location = '高雄市';
          saveDashboardConfig(result.config);
        }
      }
      const chartTitleMigrationKey = 'aether_engine_migrated_chart_title_v1';
      if (!window.localStorage.getItem(chartTitleMigrationKey)) {
        window.localStorage.setItem(chartTitleMigrationKey, '1');
        let titleChanged = false;
        result.config.widgets = result.config.widgets.map((w) => {
          if (w.type === 'stock-chart' && w.config.title === '台積電歷史走勢圖') {
            titleChanged = true;
            return { ...w, config: { ...w.config, title: '台股走勢圖' } };
          }
          return w;
        });
        if (titleChanged) {
          saveDashboardConfig(result.config);
        }
      }
      return { config: result.config, syncedFromUrl: false };
    }
  } catch {
    // Fallback to default config if LocalStorage is corrupted
  }
  return { config: createDefaultDashboardConfig(), syncedFromUrl: false };
}

export function saveDashboardConfig(config: DashboardConfigV1): void {
  try {
    const payload: DashboardConfigV1 = {
      ...config,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota exceptions silently
  }
}

export function exportDashboardConfigJson(config: DashboardConfigV1): string {
  return JSON.stringify(
    {
      ...config,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
    },
    null,
    2
  );
}
