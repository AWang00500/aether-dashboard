import { useEffect, useState } from 'react';

export function useClock(enabled = true): Date {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    if (!enabled) return;

    let timerId: number | undefined;
    let intervalId: number | undefined;

    const msToNextSecond = 1000 - (Date.now() % 1000);
    timerId = window.setTimeout(() => {
      setNow(new Date());
      intervalId = window.setInterval(() => {
        setNow(new Date());
      }, 1000);
    }, msToNextSecond);

    return () => {
      if (timerId !== undefined) window.clearTimeout(timerId);
      if (intervalId !== undefined) window.clearInterval(intervalId);
    };
  }, [enabled]);

  return now;
}
