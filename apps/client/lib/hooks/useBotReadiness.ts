import { AxiosInstance } from "axios";
import { useEffect, useRef, useState } from "react";
import tradingV2Service from "../../services/tradingV2Service";
import { BotReviewReadinessV2 } from "../../types/tradingV2";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { useRevalidate } from "./useRevalidate";

/**
 * `GET /trading_v2/bots/{id}/review-readiness/` for a list of bots.
 *
 * The fleet's "Reviews waiting" tile and each row's review pill both need to
 * know, per bot, whether a review could be run on it — and there is no
 * fleet-wide endpoint that says so. `GET /bots/health/` carries a
 * `reviews_waiting`, but it has always answered null.
 *
 * Built as the readiness twin of `useBotMetrics`, capped the same way and for
 * the same reason: a bot list is short, and the cap turns a long one into
 * "not read" on the tail rather than fifty parallel requests.
 *
 * Two things differ from the metrics hook, both deliberate:
 *
 *  - **It is not book-scoped.** The bar is closed trades on the current
 *    prompt with BOTH books counted, so there is no `book` to pass and
 *    flipping the Demo/Live switch must not re-ask.
 *  - **There is no interval.** Per §9 readiness is triggers-only: nothing
 *    moves it but a position closing or the prompt being edited, and both
 *    arrive as notifications. A timer here would re-ask a question whose
 *    answer cannot have changed.
 */

/** Rows beyond this are not requested — the same cap, and the same reasoning,
 *  as `BOT_METRIC_CAP`. */
export const BOT_READINESS_CAP = 24;

export type BotReadinessMap = {
  /** This bot's readiness, or null when the request failed. `undefined`
   *  means it was never asked for — beyond the cap. */
  forBot: (id: number) => BotReviewReadinessV2 | null | undefined;
  /** True once the batch has landed. */
  asked: boolean;
  /** Whether this bot was within the cap, so a row can say which it is. */
  requested: (id: number) => boolean;
  /** Bots that have what a review needs — a stored prompt and enough closed
   *  trades on it. Counted off `eligible` rather than `ready`, because
   *  `ready` also requires a review left to spend: a user out of reviews
   *  still has bots waiting, and a 0 here would hide them. */
  eligibleCount: number;
  /** Reviews left to spend. An account-level pool, so it is read from
   *  whichever bot answered first rather than summed. Null when nothing
   *  answered. */
  reviewsLeft: number | null;
};

export const useBotReadiness = (
  api: AxiosInstance,
  botIds: number[],
): BotReadinessMap => {
  const [rows, setRows] = useState<Record<number, BotReviewReadinessV2 | null>>({});
  const [asked, setAsked] = useState(false);
  const askedRef = useRef<string>("");
  /* A position closing moves the bar; editing a bot's prompt, model or
     decision style restarts it. Both bump `reviewReadiness`. */
  const stale = useRevalidate("reviewReadiness");

  /* The ids actually requested, as a stable string, so a caller can pass a
     fresh array every render without re-fetching: the VALUES are the
     identity, not the array. */
  const capped = botIds.slice(0, BOT_READINESS_CAP);
  const key = `${stale}:${capped.join(",")}`;

  useEffect(() => {
    if (!isAuthorizationHeaderSet(api)) return;
    if (askedRef.current === key) return;
    askedRef.current = key;

    /* The id list is the LAST segment — the one before it is the staleness
       counter, which only exists to make this key change. */
    const ids = key
      .split(":")
      .pop()!
      .split(",")
      .filter(Boolean)
      .map(Number);
    if (!ids.length) {
      setRows({});
      setAsked(true);
      return;
    }

    let live = true;
    let landed = false;
    Promise.all(
      ids.map((id) =>
        tradingV2Service
          .getBotReviewReadiness(api, id)
          .then((r) => [id, r] as const)
          .catch(() => [id, null] as const),
      ),
    ).then((pairs) => {
      if (!live) return;
      landed = true;
      const next: Record<number, BotReviewReadinessV2 | null> = {};
      pairs.forEach(([id, r]) => {
        next[id] = r;
      });
      setRows(next);
      setAsked(true);
    });

    return () => {
      live = false;
      /* Released only when the reply was thrown away — see the same guard in
         `useBotMetrics`. StrictMode's mount/unmount/mount makes a re-run
         before the answer lands the common case, not the rare one. */
      if (!landed && askedRef.current === key) askedRef.current = "";
    };
  }, [api, key]);

  const requestedSet = new Set(capped);
  const answered = capped
    .map((id) => rows[id])
    .filter((r): r is BotReviewReadinessV2 => !!r);

  return {
    forBot: (id: number) => (requestedSet.has(id) ? rows[id] ?? null : undefined),
    asked,
    requested: (id: number) => requestedSet.has(id),
    eligibleCount: answered.filter((r) => r.eligible === true).length,
    reviewsLeft:
      answered.find((r) => r.reviews_available != null)?.reviews_available ?? null,
  };
};

export default useBotReadiness;
