import { AxiosInstance } from "axios";
import { useEffect, useRef, useState } from "react";
import tradingV2Service from "../../services/tradingV2Service";
import { BookV2Param, BotMetricsV2 } from "../../types/tradingV2";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { DEFAULT_WINDOW_DAYS } from "../tradingV2Metrics";
import usePoll, { POLL } from "./usePoll";
import { useRevalidateAny } from "./useRevalidate";

/**
 * `GET /trading_v2/bots/{id}/metrics/` for a list of bots.
 *
 * This replaces `useBotPnl`, which existed only because there was no per-bot
 * endpoint: it read `/trades/{id}/metrics/` once per distinct
 * `(pair, exchange_account)` group and attributed the result to whichever
 * bots touched that group. That was the best available answer and still a
 * wrong one — positions were matched by venue and symbol, so a pair two
 * deciders shared reported both their fills under each of them, and no
 * amount of client-side de-duplication could separate them. It also could
 * not produce an average winner or loser at all, which is why that cell on
 * the bot page stayed empty for so long.
 *
 * One request per bot, capped. A bot list is short — the cap is there so a
 * long one degrades into "not read" on the tail rather than into fifty
 * parallel requests, and `read` says exactly which bots were asked for so a
 * row left out says so instead of sitting on "reading…" forever.
 */

/** Rows beyond this are not requested. Fifty bots is not a list to fan out. */
export const BOT_METRIC_CAP = 24;

export type BotMetricsMap = {
  /** This bot's metrics, or null when the request failed. `undefined` means
   *  it was never asked for — beyond the cap. */
  forBot: (id: number) => BotMetricsV2 | null | undefined;
  /** True once the batch has landed. */
  asked: boolean;
  /** Whether this bot was within the cap, so a row can say which it is. */
  requested: (id: number) => boolean;
};

export const useBotMetrics = (
  api: AxiosInstance,
  botIds: number[],
  book: BookV2Param,
): BotMetricsMap => {
  const [rows, setRows] = useState<Record<number, BotMetricsV2 | null>>({});
  const [asked, setAsked] = useState(false);
  const [nonce, setNonce] = useState(0);
  const askedRef = useRef<string>("");
  /* A bot's money changes when one of its orders fills or its position
     closes — both arrive as notifications. */
  const stale = useRevalidateAny("botMetrics", "positions");

  /* The ids actually requested, as a stable string, so a caller can pass a
     fresh array every render without re-fetching: the VALUES are the
     identity, not the array. The book is part of it — flipping the switch has
     to re-ask. */
  const capped = botIds.slice(0, BOT_METRIC_CAP);
  const key = `${book}:${stale}:${nonce}:${capped.join(",")}`;

  useEffect(() => {
    if (!isAuthorizationHeaderSet(api)) return;
    if (askedRef.current === key) return;
    askedRef.current = key;

    /* The id list is the LAST segment — the ones before it are the book and
       the staleness counters, which only exist to make this key change. */
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
          .getBotMetrics(api, id, { book, window_days: DEFAULT_WINDOW_DAYS })
          .then((m) => [id, m] as const)
          .catch(() => [id, null] as const),
      ),
    ).then((pairs) => {
      if (!live) return;
      landed = true;
      const next: Record<number, BotMetricsV2 | null> = {};
      pairs.forEach(([id, m]) => {
        next[id] = m;
      });
      setRows(next);
      setAsked(true);
    });

    return () => {
      live = false;
      /* Released only when the reply was thrown away. A re-run before the
         answer lands — a fresh `bots` array from Redux is enough — would
         otherwise leave the guard set on a result nobody kept, and every
         cell would read "reading…" until a reload. StrictMode's
         mount/unmount/mount makes that the common case, not the rare one. */
      if (!landed && askedRef.current === key) askedRef.current = "";
    };
  }, [api, key, book]);

  /* Every minute, per §9's "bot page tiles". The figures here are realised
     PnL and win rate, which only move when something closes — so this is the
     safety net under the notification trigger, not the main mechanism. */
  usePoll(() => setNonce((n) => n + 1), POLL.botTiles, asked && capped.length > 0);

  const requestedSet = new Set(capped);
  return {
    forBot: (id: number) => (requestedSet.has(id) ? rows[id] ?? null : undefined),
    asked,
    requested: (id: number) => requestedSet.has(id),
  };
};

export default useBotMetrics;
