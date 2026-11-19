import { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { ConsoleHeader } from '../components/ConsoleHeader';
import { GlobalSettingsModal } from '../components/GlobalSettingsModal';
import { HiddenWidgetsModal } from '../components/HiddenWidgetsModal';
import { WidgetLibraryModal } from '../components/WidgetLibraryModal';
import { WidgetSettingsModal } from '../components/WidgetSettingsModal';
import { useClock } from '../hooks/useClock';
import { useDashboardStore } from '../hooks/useDashboardStore';
import { useFullscreen } from '../hooks/useFullscreen';
import { cn } from '../utils/cn';
import { downloadStandaloneHtml } from '../utils/standaloneExport';
import { DashboardGrid } from './DashboardGrid';

export function AetherConsole() {
  const now = useClock(true);
  const { isFullscreen, toggleFullscreen, fullscreenError, clearFullscreenError } =
    useFullscreen();

  const {
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
  } = useDashboardStore();

  const [libraryOpen, setLibraryOpen] = useState(false);
  const [globalSettingsOpen, setGlobalSettingsOpen] = useState(false);
  const [hiddenModalOpen, setHiddenModalOpen] = useState(false);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [editingTab, setEditingTab] = useState<'settings' | 'swap'>('settings');
  const [downloadingStandalone, setDownloadingStandalone] = useState(false);

  const handleDownloadStandalone = async () => {
    if (downloadingStandalone) return;
    setDownloadingStandalone(true);
    showNotice('正在封裝並下載可單獨運行的 index.html…', 'info');
    try {
      const widgetSymbols = config.widgets
        .map((w) => (typeof w.config.symbol === 'string' ? w.config.symbol.trim().toUpperCase() : ''))
        .filter(Boolean);
      const allSymbols = Array.from(new Set([...config.settings.watchlist, ...widgetSymbols]));
      await downloadStandaloneHtml(allSymbols);
      showNotice('已開始下載可單獨運行的 index.html。', 'success');
    } catch (err) {
      showNotice(
        err instanceof Error ? err.message : '下載獨立單檔 index.html 失敗。',
        'error'
      );
    } finally {
      setDownloadingStandalone(false);
    }
  };

  const isEditMode = mode === 'edit';
  const hiddenWidgets = config.widgets.filter((w) => w.hidden);
  const editingWidget =
    config.widgets.find((w) => w.id === editingWidgetId) ?? null;

  // Auto-dismiss transient notifications after 6 seconds
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => dismissNotice(), 6000);
    return () => window.clearTimeout(timer);
  }, [notice, dismissNotice]);

  useEffect(() => {
    if (!fullscreenError) return;
    const timer = window.setTimeout(() => clearFullscreenError(), 5000);
    return () => window.clearTimeout(timer);
  }, [fullscreenError, clearFullscreenError]);

  return (
    <div className="aether-canvas-bg flex min-h-screen flex-col text-[#F3EBDD]">
      <ConsoleHeader
        now={now}
        mode={mode}
        onModeChange={setMode}
        onOpenLibrary={() => setLibraryOpen(true)}
        onOpenSettings={() => setGlobalSettingsOpen(true)}
        onOpenHiddenManager={() => setHiddenModalOpen(true)}
        hiddenCount={hiddenWidgets.length}
        onRefresh={triggerManualRefresh}
        lastRefreshAt={lastRefreshAt}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        enableGearAnimations={config.settings.enableGearAnimations}
        locationLabel={config.settings.location}
        onDownloadStandalone={handleDownloadStandalone}
        downloadingStandalone={downloadingStandalone}
      />

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-4 sm:px-6 sm:py-5">
        {isEditMode && (
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded border border-[#C49A52]/30 bg-[#15171B] px-4 py-2 text-xs text-[#D6BE91]">
            <span>
              編輯模式已啟用：拖曳儀表上方標題列可調整位置，拖曳右下角黃銅角標可調整寬度與高度，所有變動將自動保存。
            </span>
            <button
              type="button"
              onClick={() => setMode('standby')}
              className="font-semibold text-[#C49A52] hover:text-[#F3EBDD] cursor-pointer whitespace-nowrap"
            >
              完成編輯並切換待機模式
            </button>
          </div>
        )}

        <DashboardGrid
          widgets={config.widgets}
          now={now}
          settings={config.settings}
          refreshTick={refreshTick}
          lastRefreshAt={lastRefreshAt}
          isEditMode={isEditMode}
          onLayoutChange={updateGridLayouts}
          onOpenLibrary={() => setLibraryOpen(true)}
          onOpenSettings={(id) => {
            setEditingTab('settings');
            setEditingWidgetId(id);
          }}
          onOpenSwap={(id) => {
            setEditingTab('swap');
            setEditingWidgetId(id);
          }}
          onHideWidget={(id) => toggleHideWidget(id, true)}
          onDeleteWidget={removeWidget}
          onUpdateWidgetConfig={updateWidgetConfig}
          onUpdateSettings={updateSettings}
        />
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[#C49A52]/15 bg-[#0D0E11] px-4 py-3 text-center text-[11px] text-[#706B60]">
        THE AETHER ENGINE｜以太資訊引擎 · 氣象資料源自中央氣象署 · 股市行情源自臺灣證券交易所 · 個人配置儲存於瀏覽器 LocalStorage
      </footer>

      {/* Modals */}
      <WidgetLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onAddWidget={addWidget}
      />

      <WidgetSettingsModal
        widget={editingWidget}
        initialTab={editingTab}
        watchlist={config.settings.watchlist}
        onClose={() => setEditingWidgetId(null)}
        onSaveConfig={updateWidgetConfig}
        onSwapType={swapWidgetType}
      />

      <GlobalSettingsModal
        open={globalSettingsOpen}
        settings={config.settings}
        onClose={() => setGlobalSettingsOpen(false)}
        onUpdateSettings={updateSettings}
        onResetDefault={resetToDefault}
        onExportConfig={exportConfig}
        onGetSyncUrl={getDeviceSyncUrl}
        onImportConfig={importConfig}
      />

      <HiddenWidgetsModal
        open={hiddenModalOpen}
        hiddenWidgets={hiddenWidgets}
        onClose={() => setHiddenModalOpen(false)}
        onShowWidget={(id) => toggleHideWidget(id, false)}
        onShowAll={() => {
          hiddenWidgets.forEach((w) => toggleHideWidget(w.id, false));
        }}
        onDeleteWidget={removeWidget}
      />

      {/* Non-blocking Toast Notice */}
      {(notice || fullscreenError) && (
        <div className="fixed bottom-4 right-4 z-50 flex max-w-sm flex-col gap-2">
          {fullscreenError && (
            <div className="flex items-center justify-between gap-3 rounded border border-[#D99B26]/50 bg-[#1D1811] px-4 py-2.5 text-xs text-[#F3EBDD] shadow-xl">
              <span>{fullscreenError}</span>
              <button
                type="button"
                onClick={clearFullscreenError}
                aria-label="關閉提示"
                className="text-[#948D80] hover:text-[#F3EBDD] cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {notice && (
            <div
              className={cn(
                'flex items-center justify-between gap-3 rounded border px-4 py-2.5 text-xs text-[#F3EBDD] shadow-xl',
                notice.tone === 'error'
                  ? 'border-[#E05A47]/60 bg-[#261413]'
                  : 'border-[#C49A52]/55 bg-[#171A1F]'
              )}
            >
              <span>{notice.message}</span>
              <div className="flex items-center gap-2 shrink-0">
                {notice.undoWidget && (
                  <button
                    type="button"
                    onClick={() => restoreRemovedWidget(notice.undoWidget!)}
                    className="inline-flex items-center gap-1 font-semibold text-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    復原
                  </button>
                )}
                <button
                  type="button"
                  onClick={dismissNotice}
                  aria-label="關閉通知"
                  className="text-[#948D80] hover:text-[#F3EBDD] cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
