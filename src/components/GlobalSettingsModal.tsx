import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Download,
  FileCode2,
  Link2,
  Plus,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { stockService } from '../services/stockService';
import { TAIWAN_LOCATIONS } from '../services/weatherService';
import type { RefreshIntervalSeconds, UserSettings } from '../types/dashboard';
import { cn } from '../utils/cn';
import { downloadStandaloneHtml } from '../utils/standaloneExport';
import { BrassSwitch } from './BrassSwitch';

interface GlobalSettingsModalProps {
  open: boolean;
  settings: UserSettings;
  onClose: () => void;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onResetDefault: () => void;
  onExportConfig: () => string;
  onGetSyncUrl: () => string;
  onImportConfig: (rawJson: string) => { ok: boolean; error?: string };
}

const REFRESH_OPTIONS: Array<{ value: RefreshIntervalSeconds; label: string }> = [
  { value: 10, label: '每 10 秒' },
  { value: 30, label: '每 30 秒' },
  { value: 60, label: '每 1 分鐘' },
  { value: 300, label: '每 5 分鐘' },
  { value: 0, label: '僅手動更新' },
];

export function GlobalSettingsModal({
  open,
  settings,
  onClose,
  onUpdateSettings,
  onResetDefault,
  onExportConfig,
  onGetSyncUrl,
  onImportConfig,
}: GlobalSettingsModalProps) {
  const [newSymbol, setNewSymbol] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [syncCopied, setSyncCopied] = useState(false);
  const [downloadingStandalone, setDownloadingStandalone] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const catalog = stockService.getQuickPickCatalog();

  const handleAddSymbol = (e: FormEvent) => {
    e.preventDefault();
    const cleaned = newSymbol.trim().toUpperCase();
    if (!cleaned) return;
    if (!settings.watchlist.includes(cleaned)) {
      onUpdateSettings({ watchlist: [...settings.watchlist, cleaned] });
    }
    setNewSymbol('');
  };

  const handleRemoveSymbol = (sym: string) => {
    onUpdateSettings({
      watchlist: settings.watchlist.filter((item) => item !== sym),
    });
  };

  const handleDownloadExport = () => {
    const json = onExportConfig();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-engine-config-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopySyncUrl = async () => {
    try {
      const url = onGetSyncUrl();
      await navigator.clipboard.writeText(url);
      setSyncCopied(true);
      window.setTimeout(() => setSyncCopied(false), 3000);
    } catch {
      setImportError('無法存取剪貼簿，請改用匯出 JSON 檔案方式同步。');
    }
  };

  const handleDownloadStandaloneHtml = async () => {
    setImportError(null);
    setImportSuccess(null);
    setDownloadingStandalone(true);
    try {
      await downloadStandaloneHtml(settings.watchlist);
      setImportSuccess('已產生並下載可單獨運行的 index.html（已內嵌最新氣象與觀察清單資料）。');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '下載獨立單檔失敗。');
    } finally {
      setDownloadingStandalone(false);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      const res = onImportConfig(content);
      if (res.ok) {
        setImportSuccess('設定檔已成功驗證並匯入套用。');
      } else {
        setImportError(res.error ?? '匯入失敗。');
      }
    } catch {
      setImportError('讀取設定檔失敗。');
    } finally {
      e.target.value = '';
    }
  };

  const handlePasteImport = () => {
    setImportError(null);
    setImportSuccess(null);
    if (!pasteText.trim()) {
      setImportError('請先貼上 JSON 設定檔內容或選擇檔案上傳。');
      return;
    }
    const res = onImportConfig(pasteText);
    if (res.ok) {
      setImportSuccess('設定檔已成功驗證並匯入套用。');
      setPasteText('');
    } else {
      setImportError(res.error ?? '匯入失敗。');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-settings-title"
    >
      <div className="flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-md border border-[#C49A52]/45 bg-[#15171B] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#C49A52]/25 bg-[#111317] px-5 py-4">
          <div>
            <h2
              id="global-settings-title"
              className="font-display text-lg font-bold tracking-wide text-[#F3EBDD]"
            >
              控制台個人化設定
            </h2>
            <p className="text-xs text-[#948D80]">
              資料來源為中央氣象署與臺灣證券交易所；配置自動保存於瀏覽器 LocalStorage。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉個人化設定"
            className="rounded border border-[#343840] p-2 text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          {/* 1. Location & Refresh */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold tracking-wider text-[#C49A52]">
              觀測地區與更新頻率
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-[#D6BE91]">所在地縣市</label>
                <select
                  value={settings.location}
                  onChange={(e) => onUpdateSettings({ location: e.target.value })}
                  className="h-9 w-full rounded border border-[#C49A52]/30 bg-[#0E1014] px-3 text-sm text-[#F3EBDD] focus:border-[#C49A52] focus:outline-none"
                >
                  {TAIWAN_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs text-[#D6BE91]">儀表資料更新頻率</label>
                <select
                  value={settings.refreshIntervalSec}
                  onChange={(e) =>
                    onUpdateSettings({
                      refreshIntervalSec: Number(e.target.value) as RefreshIntervalSeconds,
                    })
                  }
                  className="h-9 w-full rounded border border-[#C49A52]/30 bg-[#0E1014] px-3 text-sm text-[#F3EBDD] focus:border-[#C49A52] focus:outline-none"
                >
                  {REFRESH_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* 2. TWSE Stock Watchlist */}
          <section className="space-y-3 border-t border-[#C49A52]/15 pt-5">
            <h3 className="text-xs font-semibold tracking-wider text-[#C49A52]">
              臺灣證券交易所（上市）觀察清單
            </h3>

            <form onSubmit={handleAddSymbol} className="flex items-center gap-2">
              <input
                type="text"
                value={newSymbol}
                onChange={(e) => setNewSymbol(e.target.value)}
                placeholder="輸入上市股票代號（如 2330、0050、2412）"
                className="h-9 flex-1 rounded border border-[#C49A52]/30 bg-[#0E1014] px-3 font-mono-tabular text-xs text-[#F3EBDD] placeholder:text-[#706B60] focus:border-[#C49A52] focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex h-9 items-center gap-1 rounded border border-[#C49A52] bg-[#C49A52]/15 px-3 text-xs font-semibold text-[#F3EBDD] hover:bg-[#C49A52]/25 cursor-pointer shrink-0"
              >
                <Plus className="h-3.5 w-3.5" />
                加入清單
              </button>
            </form>

            <div className="space-y-1.5">
              {settings.watchlist.map((sym) => {
                const found = catalog.find((item) => item.symbol === sym);
                return (
                  <div
                    key={sym}
                    className="flex items-center justify-between rounded border border-[#C49A52]/15 bg-[#101216] px-3 py-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono-tabular font-bold text-[#C49A52]">{sym}</span>
                      <span className="text-[#F3EBDD]">{found?.name ?? '上市自訂標的'}</span>
                      <span className="text-[11px] text-[#948D80]">TWSE</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSymbol(sym)}
                      aria-label={`從觀察清單移除 ${sym}`}
                      className="p-1 text-[#706B60] hover:text-[#E05A47] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 3. Display & Mechanical Preferences */}
          <section className="space-y-3 border-t border-[#C49A52]/15 pt-5">
            <h3 className="text-xs font-semibold tracking-wider text-[#C49A52]">
              視覺與儀表顯示設定
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between rounded border border-[#C49A52]/15 bg-[#101216] px-3.5 py-2.5">
                <div>
                  <div className="text-xs font-medium text-[#F3EBDD]">機械齒輪緩慢旋轉動畫</div>
                  <div className="text-[11px] text-[#948D80]">
                    關閉可進一步降低長時間待機執行時的 GPU 重繪。
                  </div>
                </div>
                <BrassSwitch
                  checked={settings.enableGearAnimations}
                  onChange={(checked) => onUpdateSettings({ enableGearAnimations: checked })}
                  label="切換齒輪旋轉動畫"
                />
              </div>

              <div className="flex items-center justify-between rounded border border-[#C49A52]/15 bg-[#101216] px-3.5 py-2.5">
                <div>
                  <div className="text-xs font-medium text-[#F3EBDD]">緊湊儀表密度模式</div>
                  <div className="text-[11px] text-[#948D80]">
                    縮小網格行高與內距，於單一畫面容納更多資訊模組。
                  </div>
                </div>
                <BrassSwitch
                  checked={settings.compactDensity}
                  onChange={(checked) => onUpdateSettings({ compactDensity: checked })}
                  label="切換緊湊密度模式"
                />
              </div>
            </div>
          </section>

          {/* 4. Multi-device sync, Export / Import / Reset */}
          <section className="space-y-3 border-t border-[#C49A52]/15 pt-5">
            <div>
              <h3 className="text-xs font-semibold tracking-wider text-[#C49A52]">
                跨裝置同步、備份匯入與重置
              </h3>
              <p className="mt-0.5 text-[11px] text-[#948D80]">
                部署於 GitHub Pages 後，可使用「裝置同步連結」或 JSON 設定檔在不同電腦與行動裝置間同步您的個人配置。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handleCopySyncUrl}
                className="inline-flex items-center gap-1.5 rounded border border-[#C49A52] bg-[#C49A52]/15 px-3.5 py-2 text-xs font-semibold text-[#F3EBDD] hover:bg-[#C49A52]/25 cursor-pointer"
              >
                {syncCopied ? (
                  <Copy className="h-3.5 w-3.5 text-[#3FA776]" />
                ) : (
                  <Link2 className="h-3.5 w-3.5 text-[#C49A52]" />
                )}
                {syncCopied ? '已複製跨裝置同步連結' : '複製跨裝置同步連結'}
              </button>

              <button
                type="button"
                onClick={handleDownloadStandaloneHtml}
                disabled={downloadingStandalone}
                className="inline-flex items-center gap-1.5 rounded border border-[#C49A52] bg-[#C49A52]/20 px-3.5 py-2 text-xs font-semibold text-[#F3EBDD] hover:bg-[#C49A52]/30 disabled:opacity-60 cursor-pointer"
              >
                <FileCode2 className="h-3.5 w-3.5 text-[#C49A52]" />
                {downloadingStandalone ? '封裝獨立單檔中…' : '下載獨立單檔 (index.html)'}
              </button>

              <button
                type="button"
                onClick={handleDownloadExport}
                className="inline-flex items-center gap-1.5 rounded border border-[#343840] bg-[#181B20] px-3.5 py-2 text-xs font-medium text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                匯出設定檔 (.json)
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded border border-[#343840] bg-[#181B20] px-3.5 py-2 text-xs font-medium text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer"
              >
                <Upload className="h-3.5 w-3.5" />
                從檔案匯入
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                className="hidden"
              />

              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="ml-auto inline-flex items-center gap-1.5 rounded border border-[#343840] bg-[#181B20] px-3.5 py-2 text-xs font-medium text-[#D6BE91] hover:border-[#E05A47]/60 hover:text-[#E05A47] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  恢復預設版面
                </button>
              ) : (
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-[#E05A47]">確認重置？</span>
                  <button
                    type="button"
                    onClick={() => {
                      onResetDefault();
                      setConfirmReset(false);
                    }}
                    className="rounded border border-[#E05A47] bg-[#E05A47]/20 px-2.5 py-1.5 text-xs font-semibold text-[#F3EBDD] cursor-pointer"
                  >
                    確定恢復
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded border border-[#343840] px-2.5 py-1.5 text-xs text-[#948D80] cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-1">
              <label className="block text-[11px] text-[#948D80]">
                或貼上 JSON 設定內容進行格式驗證與匯入：
              </label>
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder='{"schemaVersion": 1, "widgets": [...], ...}'
                  className="min-w-0 flex-1 rounded border border-[#343840] bg-[#0E1014] p-2 font-mono-tabular text-[11px] text-[#F3EBDD] placeholder:text-[#706B60] focus:border-[#C49A52] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handlePasteImport}
                  className={cn(
                    'self-end rounded border border-[#C49A52]/40 bg-[#1B1E24] px-3 py-2 text-xs font-medium text-[#D6BE91] hover:border-[#C49A52] hover:text-[#F3EBDD] cursor-pointer shrink-0'
                  )}
                >
                  驗證並套用
                </button>
              </div>

              {importError && (
                <div className="flex items-start gap-2 rounded border border-[#E05A47]/40 bg-[#2A1513] px-3 py-2 text-xs text-[#F3EBDD]">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#E05A47]" />
                  <span>{importError}</span>
                </div>
              )}

              {importSuccess && (
                <div className="flex items-start gap-2 rounded border border-[#3FA776]/40 bg-[#13241B] px-3 py-2 text-xs text-[#F3EBDD]">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3FA776]" />
                  <span>{importSuccess}</span>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
