import { useCallback, useEffect, useState } from 'react';

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(
    () => typeof document !== 'undefined' && Boolean(document.fullscreenElement)
  );
  const [fullscreenError, setFullscreenError] = useState<string | null>(null);

  useEffect(() => {
    const handleChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleChange);
    return () => document.removeEventListener('fullscreenchange', handleChange);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    setFullscreenError(null);
    try {
      if (!document.fullscreenElement) {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        } else {
          setFullscreenError('目前瀏覽器環境不支援全螢幕模式。');
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch {
      setFullscreenError('瀏覽器安全限制或內嵌視窗阻擋了全螢幕切換。');
    }
  }, []);

  return { isFullscreen, toggleFullscreen, fullscreenError, clearFullscreenError: () => setFullscreenError(null) };
}
