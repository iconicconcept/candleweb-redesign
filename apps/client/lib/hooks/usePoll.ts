import { useEffect, useRef } from "react";

/**
 * Run something on an interval, but only while the tab is being looked at.
 *
 * Every poll in the dashboard needs the same four guards, and getting any of
 * them wrong costs requests rather than correctness, which is why they live
 * here once instead of in each caller:
 *
 *  - **A hidden tab polls nothing.** A dashboard left open in a background
 *    tab overnight would otherwise make thousands of requests nobody reads.
 *  - **Coming back refetches immediately**, so returning to the tab shows
 *    current figures rather than up to a minute of staleness.
 *  - **One request at a time.** A reply slower than the interval would
 *    otherwise stack up a queue that never drains.
 *  - **A failure is silent.** The next tick retries; a toast every 15
 *    seconds on a flaky connection is worse than a slightly stale number.
 *
 * It deliberately does NOT fire on mount. The view that owns the data has
 * already fetched it — firing here too would double every page load.
 */
export const usePoll = (
  fn: () => void | Promise<unknown>,
  intervalMs: number | null,
  enabled = true,
): void => {
  /* The callback is read through a ref so a caller can pass an inline
     function without resetting the interval on every render — which would
     mean the timer never actually reaches the end of its period. */
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled || intervalMs == null || intervalMs <= 0) return;

    const run = async () => {
      if (inFlight.current) return;
      if (typeof document !== "undefined" && document.hidden) return;
      inFlight.current = true;
      try {
        await fnRef.current();
      } catch {
        /* silent on purpose — the next tick retries */
      } finally {
        inFlight.current = false;
      }
    };

    const timer = setInterval(run, intervalMs);
    const onVisibility = () => {
      if (!document.hidden) run();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled]);
};

/** The §9 intervals, in one place so a page and its comment cannot drift. */
export const POLL = {
  /** The notification poll, which is also the trigger bus. */
  notifications: 15_000,
  status: 30_000,
  metrics: 30_000,
  /** Open positions move with the mark and the trail, so they are read
   *  faster — but only while there is something open to move. */
  positionsOpen: 15_000,
  positionsIdle: 60_000,
  trades: 60_000,
  botTiles: 60_000,
  decisions: 30_000,
} as const;

export default usePoll;
