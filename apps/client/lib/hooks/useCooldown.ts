import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A resend cooldown ("Resend in 0:42"). Counts from an end timestamp rather
 * than decrementing, so it stays right when the tab sleeps in the background.
 */
export default function useCooldown() {
  const [left, setLeft] = useState(0);
  const [total, setTotal] = useState(1);
  const endsAt = useRef(0);
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = useCallback(() => {
    if (tick.current) clearInterval(tick.current);
    tick.current = null;
  }, []);

  const render = useCallback(() => {
    const remaining = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000));
    setLeft(remaining);
    if (remaining <= 0) stop();
  }, [stop]);

  const start = useCallback(
    (seconds: number) => {
      const s = Math.max(1, Math.ceil(seconds));
      setTotal(s);
      endsAt.current = Date.now() + s * 1000;
      stop();
      render();
      tick.current = setInterval(render, 250);
    },
    [render, stop],
  );

  useEffect(() => stop, [stop]);

  const m = Math.floor(left / 60);
  const s = left % 60;
  return {
    running: left > 0,
    left,
    /** 0 → 1 as the cooldown runs down, for the ring. */
    progress: 1 - left / total,
    label: `${m}:${s < 10 ? "0" : ""}${s}`,
    start,
    stop: () => {
      stop();
      setLeft(0);
    },
  };
}
