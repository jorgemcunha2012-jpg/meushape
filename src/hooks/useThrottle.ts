import { useState, useRef, useCallback } from "react";

/**
 * Hook that throttles a callback. Returns [wrappedFn, isThrottled, remainingSeconds].
 */
export function useThrottle(cooldownMs: number) {
  const [isThrottled, setIsThrottled] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const trigger = useCallback(() => {
    setIsThrottled(true);
    setRemaining(Math.ceil(cooldownMs / 1000));

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setIsThrottled(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [cooldownMs]);

  return { isThrottled, remaining, trigger };
}

/**
 * Hook to prevent double-clicks with a cooldown.
 */
export function useClickGuard(cooldownMs = 2000) {
  const [blocked, setBlocked] = useState(false);

  const guard = useCallback(
    (fn: () => void) => {
      if (blocked) return;
      setBlocked(true);
      fn();
      setTimeout(() => setBlocked(false), cooldownMs);
    },
    [blocked, cooldownMs]
  );

  return { blocked, guard };
}
