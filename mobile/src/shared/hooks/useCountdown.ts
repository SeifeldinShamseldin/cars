import { useEffect, useState } from "react";

export const useCountdown = (targetTime?: number): number => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!targetTime) {
      setNow(Date.now());
      return;
    }

    const timer = setInterval(() => {
      setNow(Date.now());
    }, 250);

    return () => clearInterval(timer);
  }, [targetTime]);

  if (!targetTime) {
    return 0;
  }

  return Math.max(0, targetTime - now);
};

export const formatCountdown = (remainingMs: number): string =>
  `${Math.ceil(remainingMs / 1000)}s`;

