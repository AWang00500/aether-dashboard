import { useCallback, useEffect, useState } from 'react';
import type { Layout } from 'react-grid-layout';
import { createDefaultDashboardConfig } from '../config/defaultDashboard';
import { WIDGET_CATALOG } from '../config/widgetRegistry';
import type {
  ConsoleMode,
  DashboardConfigV1,
  UserSettings,
  WidgetConfig,
  WidgetInstance,
  WidgetType,
} from '../types/dashboard';
import {
  buildDeviceSyncUrl,
  exportDashboardConfigJson,
  loadDashboardConfig,
  saveDashboardConfig,
  validateDashboardConfig,
} from '../utils/storage';

export interface ToastNotice {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'error';
  undoWidget?: WidgetInstance;
}

export function useDashboardStore() {
  const [initialState] = useState(() => loadDashboardConfig());
  const [config, setConfig] = useState<DashboardConfigV1>(initialState.config);
  const [mode, setMode] = useState<ConsoleMode>('standby');
  const [refreshTick, setRefreshTick] = useState<number>(0);
  const [lastRefreshAt, setLastRefreshAt] = useState<string>(() => new Date().toISOString());
  const [notice, setNotice] = useState<ToastNotice | null>(() =>
    initialState.syncedFromUrl
      ? {
          id: `${Date.now()}`,
          message: '已從同步連結載入個人儀表配置並保存至本機裝置。',
          tone: 'success',
        }
      : null
  );

  // Persist every config change immediately to LocalStorage
  useEffect(() => {
    saveDashboardConfig(config);
  }, [config]);

  // Auto-refresh interval timer based on user settings
  useEffect(() => {
    const sec = config.settings.refreshIntervalSec;
    if (sec <= 0) return;
    const id = window.setInterval(() => {
      setRefreshTick((t) => t + 1);
      setLastRefreshAt(new Date().toISOString());
    }, sec * 1000);
    return () => window.clearInterval(id);
  }, [config.settings.refreshIntervalSec]);

  const showNotice = useCallback(
    (message: string, tone: ToastNotice['tone'] = 'info', undoWidget?: WidgetInstance) => {
      setNotice({
        id: `${Date.now()}`,
        message,
        tone,
        undoWidget,
      });
    },
    []
  );

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const triggerManualRefresh = useCallback(() => {
    setRefreshTick((t) => t + 1);
    setLastRefreshAt(new Date().toISOString());
    showNotice('已重新同步所有儀表資料。', 'success');
  }, [showNotice]);

  const addWidget = useCallback(
    (type: WidgetType) => {
      const entry = WIDGET_CATALOG[type];
      const newId = `w-${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

      setConfig((prev) => {
        const visibleWidgets = prev.widgets.filter((w) => !w.hidden);
        const maxBottom = visibleWidgets.reduce(
          (maxY, w) => Math.max(maxY, w.layout.y + w.layout.h),
          0
        );

        const newWidget: WidgetInstance = {
          id: newId,
          type,
          layout: {
            x: 0,
            y: maxBottom,
            w: entry.defaultSize.w,
            h: entry.defaultSize.h,
          },
          hidden: false,
          config: entry.createDefaultConfig(),
          lastUpdated: new Date().toISOString(),
        };

        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          widgets: [...prev.widgets, newWidget],
        };
      });

      showNotice(`已新增「${entry.name}」儀表至控制台。`, 'success');
    },
    [showNotice]
  );

  const removeWidget = useCallback(
    (widgetId: string) => {
      let removed: WidgetInstance | undefined;
      setConfig((prev) => {
        removed = prev.widgets.find((w) => w.id === widgetId);
        return {
          ...prev,
          updatedAt: new Date().toISOString(),
          widgets: prev.widgets.filter((w) => w.id !== widgetId),
        };
      });
      if (removed) {
        const entry = WIDGET_CATALOG[removed.type];
        showNotice(`已移除「${removed.config.title || entry.name}」。`, 'info', removed);
      }
    },
    [showNotice]
  );

  const restoreRemovedWidget = useCallback((widget: WidgetInstance) => {
    setConfig((prev) => {
      if (prev.widgets.some((w) => w.id === widget.id)) return prev;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        widgets: [...prev.widgets, widget],
      };
    });
    setNotice(null);
  }, []);

  const toggleHideWidget = useCallback((widgetId: string, hide?: boolean) => {
    setConfig((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      widgets: prev.widgets.map((w) =>
        w.id === widgetId ? { ...w, hidden: hide ?? !w.hidden } : w
      ),
    }));
  }, []);

  const swapWidgetType = useCallback(
    (widgetId: string, nextType: WidgetType) => {
      const nextEntry = WIDGET_CATALOG[nextType];
      setConfig((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        widgets: prev.widgets.map((w) => {
          if (w.id !== widgetId) return w;
          const nextW = Math.max(nextEntry.minSize.minW, Math.min(nextEntry.maxSize.maxW, w.layout.w));
          const nextH = Math.max(nextEntry.minSize.minH, Math.min(nextEntry.maxSize.maxH, w.layout.h));
          return {
            ...w,
            type: nextType,
            layout: {
              ...w.layout,
              w: nextW,
              h: nextH,
            },
            config: nextEntry.createDefaultConfig(),
            lastUpdated: new Date().toISOString(),
          };
        }),
      }));
      showNotice(`已更換儀表模組為「${nextEntry.name}」。`, 'success');
    },
    [showNotice]
  );

  const updateWidgetConfig = useCallback(
    (widgetId: string, partialConfig: Partial<WidgetConfig>) => {
      setConfig((prev) => ({
        ...prev,
        updatedAt: new Date().toISOString(),
        widgets: prev.widgets.map((w) =>
          w.id === widgetId
            ? {
                ...w,
                config: { ...w.config, ...partialConfig },
                lastUpdated: new Date().toISOString(),
              }
            : w
        ),
      }));
    },
    []
  );

  const updateGridLayouts = useCallback((nextLayout: Layout) => {
    setConfig((prev) => {
      let changed = false;
      const layoutMap = new Map(nextLayout.map((item) => [item.i, item]));

      const updatedWidgets = prev.widgets.map((w) => {
        if (w.hidden) return w;
        const item = layoutMap.get(w.id);
        if (!item) return w;
        if (
          w.layout.x === item.x &&
          w.layout.y === item.y &&
          w.layout.w === item.w &&
          w.layout.h === item.h
        ) {
          return w;
        }
        changed = true;
        return {
          ...w,
          layout: {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          },
        };
      });

      if (!changed) return prev;
      return {
        ...prev,
        updatedAt: new Date().toISOString(),
        widgets: updatedWidgets,
      };
    });
  }, []);

  const updateSettings = useCallback((partial: Partial<UserSettings>) => {
    setConfig((prev) => ({
      ...prev,
      updatedAt: new Date().toISOString(),
      settings: { ...prev.settings, ...partial },
    }));
    setRefreshTick((t) => t + 1);
    setLastRefreshAt(new Date().toISOString());
  }, []);

  const resetToDefault = useCallback(() => {
    const fresh = createDefaultDashboardConfig();
    setConfig(fresh);
    setRefreshTick((t) => t + 1);
    setLastRefreshAt(new Date().toISOString());
    showNotice('已恢復預設儀表配置與個人化設定。', 'success');
  }, [showNotice]);

  const exportConfig = useCallback(() => {
    return exportDashboardConfigJson(config);
  }, [config]);

  const getDeviceSyncUrl = useCallback(() => {
    return buildDeviceSyncUrl(config);
  }, [config]);

  const importConfig = useCallback(
    (rawJson: string): { ok: boolean; error?: string } => {
      try {
        const parsed: unknown = JSON.parse(rawJson);
        const validation = validateDashboardConfig(parsed);
        if (!validation.valid || !validation.config) {
          return { ok: false, error: validation.error || '設定檔格式驗證失敗。' };
        }
        setConfig(validation.config);
        setRefreshTick((t) => t + 1);
        setLastRefreshAt(new Date().toISOString());
        showNotice('設定檔已驗證並成功匯入套用。', 'success');
        return { ok: true };
      } catch {
        return { ok: false, error: '無法解析 JSON 檔案，請確認檔案格式是否正確。' };
      }
    },
    [showNotice]
  );

  return {
    config,
    mode,
    setMode,
    refreshTick,
    lastRefreshAt,
    notice,
    showNotice,
    dismissNotice,
    triggerManualRefresh,
    addWidget,
    removeWidget,
    restoreRemovedWidget,
    toggleHideWidget,
    swapWidgetType,
    updateWidgetConfig,
    updateGridLayouts,
    updateSettings,
    resetToDefault,
    exportConfig,
    getDeviceSyncUrl,
    importConfig,
  };
}
