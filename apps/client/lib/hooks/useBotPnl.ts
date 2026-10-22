import { AxiosInstance } from "axios";
import { useEffect, useMemo, useRef, useState } from "react";
import tradingV2Service from "../../services/tradingV2Service";
import { TradeV2 } from "../../types/tradingV2";
import {
  DEFAULT_WINDOW_DAYS,
  REALISED_FIELDS,
  WIN_RATE_FIELDS,
  closedCount,
  metricRead,
  realisedPnl,
  winRate,
  winRatePct,
} from "../tradingV2Metrics";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";

/**
 * Realised PnL per bot, built from `GET /trading_v2/trades/{id}/metrics/`.
 *
 * There is no per-bot endpoint — `/bots/{id}/metrics/` does not exist and
 * `/metrics/` takes no `bot` filter — so a bot's figure has to be assembled
 * from its trades. Two things make that honest rather than a plausible wrong
 * number, and a third makes it affordable:
 *
 *  1. **De-duplicate by position.** Positions are matched to a trade by venue
 *     and symbol, so every trade on one `(pair, exchange_account)` returns the
 *     SAME positions. Summing a bot's trades raw counts that money once per
 *     trade. Counting each group once counts it exactly once.
 *  2. **Detect foreign deciders.** If another bot — or a CandleAI trade — sits
 *     on one of those groups, its fills are inside the figure and nothing here
 *     can separate them. `shared` says so, and the caller must surface it: the
 *     number stops being "what this bot did".
 *  3. **Fetch per GROUP, not per bot.** The account's distinct groups are
 *     collected across every trade and read once each, then attributed to
 *     whichever bots touch them. A pair two bots share costs one request, not
 *     two — which is what makes this usable on the bots LIST.
 *
 * A figure the backend lists in `unavailable` is unknown, not zero, so it is
 * excluded from the sum and the caller sees `read < of`.
 */

export type BotPnl = {
  /** Summed realised PnL, or null when nothing could be read. */
  total: number | null;
  /** Position-groups actually read, and how many this bot has. */
  read: number;
  of: number;
  /** True when something other than this bot trades one of its groups. */
  shared: boolean;
  /**
   * Win rate across the bot's groups, 0–100, **weighted by closed trades**.
   *
   * A plain mean of per-group win rates is wrong: a pair with 2 closed trades
   * would count as much as one with 50. So each group's rate is weighted by
   * its own closed count — which the same response carries — and the result
   * is null unless every contributing group supplied both numbers.
   */
  winRate: number | null;
  /** Closed trades behind that rate — the weight, and worth showing. */
  closed: number | null;
};

export const EMPTY_BOT_PNL: BotPnl = {
  total: null,
  read: 0,
  of: 0,
  shared: false,
  winRate: null,
  closed: null,
};

/** What one position-group contributed, kept so a bot can be re-summed
 *  without re-fetching when the trade list changes identity. */
type GroupRead = {
  realised: number | null;
  /** 0–100, already normalised off the response's 0–1 or 0–100. */
  winRate: number | null;
  closed: number | null;
};

/** One request per distinct group; a very wide account stops here rather than
 *  opening the page on a hundred calls. */
export const POSITION_GROUP_CAP = 24;

const keyOf = (t: Pick<TradeV2, "pair" | "exchange_account">) =>
  `${t.exchange_account}:${t.pair}`;

export const useBotPnl = (api: AxiosInstance, trades: TradeV2[]) => {
  /* One representative trade per distinct (pair, account), in a stable order
     so the fetch key below does not churn. */
  const groups = useMemo(() => {
    const seen = new Map<string, TradeV2>();
    for (const t of trades) if (!seen.has(keyOf(t))) seen.set(keyOf(t), t);
    return Array.from(seen.entries()).slice(0, POSITION_GROUP_CAP);
  }, [trades]);

  const [values, setValues] = useState<Record<string, GroupRead>>({});
  const [asked, setAsked] = useState(false);
  const askedRef = useRef<string>("");

  useEffect(() => {
    if (!isAuthorizationHeaderSet(api)) return;
    const fetchKey = groups.map(([k]) => k).join("|");
    if (askedRef.current === fetchKey) return;
    askedRef.current = fetchKey;
    if (!groups.length) {
      setValues({});
      setAsked(true);
      return;
    }

    let live = true;
    let landed = false;
    Promise.all(
      groups.map(([key, t]) =>
        tradingV2Service
          .getTradeMetrics(api, t.id, { window_days: DEFAULT_WINDOW_DAYS })
          .then((m) => {
            /* `unavailable` is honoured per figure: one the backend says it
               cannot measure is unknown, not zero, and must not be summed in
               as one. */
            const r = metricRead(m, REALISED_FIELDS, realisedPnl(m));
            const w = metricRead(m, WIN_RATE_FIELDS, winRate(m));
            const read: GroupRead = {
              realised: r.available ? r.value : null,
              winRate: w.available ? winRatePct(w.value) : null,
              closed: closedCount(m),
            };
            return [key, read] as const;
          })
          .catch(() => [key, { realised: null, winRate: null, closed: null }] as const),
      ),
    ).then((pairs) => {
      if (!live) return;
      const next: Record<string, GroupRead> = {};
      pairs.forEach(([k, v]) => {
        next[k] = v;
      });
      landed = true;
      setValues(next);
      setAsked(true);
    });
    return () => {
      live = false;
      /* A re-run before the answer lands discards the reply, and `trades`
         getting a fresh array identity from Redux is enough to cause one.
         The latch has to be released with it, or the next run skips the
         request as "already asked" while its only result was thrown away —
         which is what left the PnL tile shimmering until a page reload.
         Released only when nothing landed, so a completed read is not
         re-issued on every later re-render. */
      if (!landed && askedRef.current === fetchKey) askedRef.current = "";
    };
  }, [api, groups]);

  /** This bot's de-duplicated total, and whether anything else shares it. */
  const forBot = useMemo(() => {
    return (botId: number): BotPnl => {
      const mine = trades.filter((t) => t.bot === botId);
      if (!mine.length) return EMPTY_BOT_PNL;

      const keys = Array.from(new Set(mine.map(keyOf)));
      const shared = trades.some((t) => t.bot !== botId && keys.includes(keyOf(t)));

      let total: number | null = null;
      let read = 0;

      /* Win rate is weighted by closed trades, so it needs BOTH numbers from
         every group it covers. If one group reports a rate without a count
         there is no honest weight for it, and the whole figure is withheld
         rather than quietly averaged as though the pairs were equal. */
      let weighted = 0;
      let closedTotal = 0;
      let weightable = 0;

      for (const k of keys) {
        const v = values[k];
        if (!v) continue;
        if (v.realised != null) {
          total = (total ?? 0) + v.realised;
          read += 1;
        }
        if (v.winRate != null && v.closed != null && v.closed > 0) {
          weighted += v.winRate * v.closed;
          closedTotal += v.closed;
          weightable += 1;
        }
      }

      const everyGroupWeightable = weightable === keys.length && closedTotal > 0;

      return {
        total,
        read,
        of: keys.length,
        shared,
        winRate: everyGroupWeightable ? weighted / closedTotal : null,
        closed: everyGroupWeightable ? closedTotal : null,
      };
    };
  }, [trades, values]);

  return { forBot, asked };
};

export default useBotPnl;
