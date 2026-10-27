import { TradeV2 } from "../types/tradingV2";

/**
 * Reading a trade's own fields — its name, its confidence gate and the record
 * it now carries on the list row.
 */

/**
 * What to call a trade on screen.
 *
 * `display_name` is the field to show: it is `name` when the user gave one
 * and "ETHUSDT · 15m" when they did not, so it is never blank. `name` itself
 * is empty on most trades and showing it directly leaves a hole where the
 * title should be. The pair is kept as a last resort for a row that predates
 * the field.
 */
export const tradeTitle = (trade: TradeV2 | null | undefined): string => {
  if (!trade) return "Trade";
  const display = trade.display_name?.trim();
  if (display) return display;
  const named = trade.name?.trim();
  if (named) return named;
  return trade.pair_name || `Pair #${trade.pair}`;
};

/** The pair and timeframe, for the line under a title that may be a name. */
export const tradeSubtitle = (trade: TradeV2): string =>
  `${trade.pair_name || `Pair #${trade.pair}`} · ${trade.timeframe}`;

/** True when the title above is the user's own words rather than the pair,
 *  so the pair still has to be said somewhere. */
export const hasOwnName = (trade: TradeV2 | null | undefined): boolean =>
  !!trade?.name?.trim();

/* ------------------------------------------------------------------ *
 * The confidence gate
 * ------------------------------------------------------------------ */

/** The code's long-standing default, and what existing trades were given. */
export const DEFAULT_MIN_CONFIDENCE = 50;

/** Highest value the field accepts. 100 is refused: a gate at 100 could never
 *  open, since a decision has to score ABOVE the number to be acted on. */
export const MAX_MIN_CONFIDENCE = 99;

/**
 * The gate, as a sentence.
 *
 * "Above" is the whole point and the easy thing to get wrong: at 60, a
 * decision scoring exactly 60 is held and only 61 trades. It applies both
 * ways — to a BUY opening a position and a SELL closing one — so a high gate
 * can leave a position open as well as keep one from being opened.
 */
export const confidenceRule = (min: number | null | undefined): string => {
  if (min == null || !Number.isFinite(min)) return "Acts on any confidence your bot sends.";
  return `Acts only on decisions above ${min} — a ${min} is held, a ${min + 1} can trade.`;
};

/** Valid input, or the reason it is not. Mirrors the server's own 400 so the
 *  form can refuse before the round trip rather than after it. */
export const confidenceError = (raw: string): string | null => {
  const trimmed = raw.trim();
  if (trimmed === "") return "Required — a whole number from 0 to 99.";
  if (!/^\d+$/.test(trimmed)) return "Must be a whole number from 0 to 99.";
  const n = Number(trimmed);
  if (n > MAX_MIN_CONFIDENCE) return "Must be a whole number from 0 to 99.";
  return null;
};

/* ------------------------------------------------------------------ *
 * The trade's own record
 * ------------------------------------------------------------------ */

/**
 * The win-rate caption on a trade row: "11.1% · 2 won · 16 lost".
 *
 * `win_rate` is null until something has closed, and that is a different
 * state from 0% — a trade that has lost everything it closed, and one that
 * has closed nothing, must not read the same. The null case returns the count
 * instead so the row still says something true.
 */
export const tradeRecord = (
  trade: TradeV2,
): { rate: number | null; caption: string } => {
  const closed = trade.closed_trades ?? null;
  const wins = trade.wins ?? null;
  const losses = trade.losses ?? null;
  const rate = trade.win_rate ?? null;

  if (rate == null) {
    if (closed === 0) return { rate: null, caption: "nothing closed yet" };
    if (closed == null) return { rate: null, caption: "no record yet" };
    return { rate: null, caption: `${closed.toLocaleString()} closed` };
  }
  if (wins != null && losses != null) {
    return { rate, caption: `${wins} won · ${losses} lost` };
  }
  return { rate, caption: closed == null ? "of closed trades" : `of ${closed} closed` };
};
