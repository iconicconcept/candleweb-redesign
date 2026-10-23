import { AxiosInstance } from "axios";
import { useEffect, useRef, useState } from "react";
import tradingV2Service from "../../services/tradingV2Service";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";

/**
 * How much this bot has actually decided — from `GET /decisions/?bot=<id>`.
 *
 * One request, not several. The endpoint returns `count` (the TOTAL, not the
 * page size) alongside a page of rows, so a single call with the maximum
 * limit answers both questions the review-readiness block asks: how many
 * decisions exist at all, and how many have landed since a given moment.
 *
 * `since` is counted CLIENT-SIDE because the list takes no date filter — only
 * `bot`, `trade`, `decision`, `risk`, `limit` and `offset`. Rows come newest
 * first, so counting forward until one falls before `since` is exact, with one
 * caveat it reports honestly: if every row on the page is newer than `since`,
 * the true figure may be larger than a page, and `sinceCapped` says so rather
 * than showing a page size as though it were a total.
 */

/** The endpoint's documented maximum. */
export const DECISION_PAGE_MAX = 100;

export type BotDecisionStats = {
  /** Every decision this bot has ever posted. */
  total: number | null;
  /** Decisions at or after `since`, or null when no `since` was given. */
  sinceCount: number | null;
  /** True when the page filled up, so `sinceCount` is a floor, not a total. */
  sinceCapped: boolean;
  asked: boolean;
  failed: boolean;
};

const EMPTY: BotDecisionStats = {
  total: null,
  sinceCount: null,
  sinceCapped: false,
  asked: false,
  failed: false,
};

export const useBotDecisionStats = (
  api: AxiosInstance,
  botId: number | null,
  since?: string | null,
): BotDecisionStats => {
  const [stats, setStats] = useState<BotDecisionStats>(EMPTY);
  const askedRef = useRef<string>("");

  useEffect(() => {
    if (!isAuthorizationHeaderSet(api) || botId == null) return;
    const key = `${botId}:${since ?? ""}`;
    if (askedRef.current === key) return;
    askedRef.current = key;

    let live = true;
    let landed = false;
    tradingV2Service
      .listDecisions(api, { bot: botId, limit: DECISION_PAGE_MAX })
      .then((page) => {
        if (!live) return;
        let sinceCount: number | null = null;
        let sinceCapped = false;
        if (since) {
          const from = new Date(since).getTime();
          if (Number.isFinite(from)) {
            /* Newest first, so the first row older than `since` ends it. */
            let n = 0;
            for (const d of page.results) {
              if (new Date(d.decided_at).getTime() < from) break;
              n += 1;
            }
            sinceCount = n;
            sinceCapped = n === page.results.length && page.count > page.results.length;
          }
        }
        landed = true;
        setStats({ total: page.count, sinceCount, sinceCapped, asked: true, failed: false });
      })
      .catch(() => {
        if (!live) return;
        landed = true;
        setStats({ ...EMPTY, asked: true, failed: true });
      });

    return () => {
      live = false;
      /* Released when the reply was discarded, or the next run would skip the
         request as "already asked" and the block would read as loading for
         good. StrictMode's mount/unmount/mount makes that the common case,
         not the rare one. */
      if (!landed && askedRef.current === key) askedRef.current = "";
    };
  }, [api, botId, since]);

  return stats;
};

export default useBotDecisionStats;
