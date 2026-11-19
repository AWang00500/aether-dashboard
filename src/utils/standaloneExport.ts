import { shouldUseBackendApi } from './runtimeEnv';

export async function downloadStandaloneHtml(watchlist: string[]): Promise<void> {
  const query = encodeURIComponent(watchlist.join(','));
  let htmlText: string | null = null;

  if (shouldUseBackendApi()) {
    try {
      const res = await fetch(`/api/export-standalone?symbols=${query}`, {
        cache: 'no-store',
      });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('text/html')) {
        htmlText = await res.text();
      }
    } catch {
      // Server export endpoint unavailable; try static built HTML fallback below
    }
  }

  if (!htmlText) {
    try {
      const staticRes = await fetch('./index.html', { cache: 'no-store' });
      const contentType = staticRes.headers.get('content-type') || '';
      if (staticRes.ok && contentType.includes('text/html')) {
        const candidate = await staticRes.text();
        if (!/<script[^>]+src=["']\/src\/main\.tsx["']/i.test(candidate)) {
          htmlText = candidate;
        }
      }
    } catch {
      // Ignore static fallback error
    }
  }

  if (!htmlText) {
    throw new Error('無法取得可單獨運行的 index.html，請先執行建置或確認伺服器運作中。');
  }

  const blob = new Blob([htmlText], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'index.html';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
