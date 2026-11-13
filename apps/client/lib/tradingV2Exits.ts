import type { TradeV2, TradeV2ExitStyle, TradeV2StopTimeframe, TradeV2Timeframe } from "../types/tradingV2";

/**
 * Exit style — how a trade's stop moves after a position opens.
 *
 *  - STANDARD (default; what every trade had before): adapts to the market.
 *  - LET_RUN: a wide 3 × ATR stop that stays put until +3R, then trails 1R.
 *    On 1m/5m/15m trades the stop is sized from the 4h chart.
 *  - CUSTOM: the user sets the three numbers below (and optionally the chart).
 *
 * Separate from `agent_exits` (whether the decider's SELL may also close) and
 * from `trailing_stop` (off: the stop never moves, whatever the style).
 */

export const EXIT_STYLES: TradeV2ExitStyle[] = ["STANDARD", "LET_RUN", "CUSTOM"];

export const EXIT_STYLE_LABEL: Record<TradeV2ExitStyle, string> = {
  STANDARD: "Standard",
  LET_RUN: "Let winners run",
  CUSTOM: "Custom",
};

/** The API's ranges for the CUSTOM numbers. */
export const CUSTOM_FIELDS = {
  stop_atr_multiple: { min: 1.5, max: 4, def: "2.5", label: "Stop distance (ATR)" },
  trail_start_r: { min: 1, max: 5, def: "2", label: "Start trailing at (R)" },
  trail_distance_r: { min: 0.5, max: 2, def: "1", label: "Trail distance (R)" },
} as const;
export type CustomField = keyof typeof CUSTOM_FIELDS;

export const STOP_TIMEFRAMES: { v: TradeV2StopTimeframe; label: string }[] = [
  { v: "", label: "This trade’s chart" },
  { v: "1h", label: "1h chart" },
  { v: "4h", label: "4h chart" },
];

export const toExitStyle = (v: unknown): TradeV2ExitStyle =>
  v === "LET_RUN" || v === "CUSTOM" ? v : "STANDARD";

/** A stored decimal ("2.50", 2.5, null) as the form's input text ("2.5", ""). */
export const numText = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? String(n) : "";
};

/** Null when the value is fine, otherwise the message to show under it. */
export const customFieldError = (k: CustomField, raw: string): string | null => {
  const r = CUSTOM_FIELDS[k];
  if (!raw.trim()) return "Required when the exit style is Custom.";
  const n = Number(raw);
  if (!Number.isFinite(n)) return "Enter a number.";
  if (n < r.min || n > r.max) return `Set it between ${r.min} and ${r.max}.`;
  return null;
};

/* 1m, 5m and 15m candles are too small to hold a breakout, so LET_RUN sizes
   its stop from the 4h chart on those. */
const SHORT_TF = ["1m", "5m", "15m"];

type ExitShape = {
  exit_style: TradeV2ExitStyle;
  trailing_stop: boolean;
  timeframe: TradeV2Timeframe | string;
  stop_atr_multiple?: string;
  trail_start_r?: string;
  trail_distance_r?: string;
  stop_timeframe?: TradeV2StopTimeframe;
};

/**
 * The one-line description, worded like the API's `exit_summary`. Used while
 * the user is still choosing (nothing saved yet); a saved trade's own
 * `exit_summary` always wins where there is one.
 */
export const exitSummaryPreview = (f: ExitShape): string => {
  const atr = f.stop_atr_multiple || "?";
  const start = f.trail_start_r || "?";
  const dist = f.trail_distance_r || "?";
  const chart =
    f.exit_style === "CUSTOM" && f.stop_timeframe
      ? ` The stop is sized from the ${f.stop_timeframe} chart.`
      : f.exit_style === "LET_RUN" && SHORT_TF.includes(String(f.timeframe))
        ? " The stop is sized from the 4h chart."
        : "";

  if (!f.trailing_stop) {
    const where =
      f.exit_style === "CUSTOM"
        ? `${atr} x ATR below the entry`
        : f.exit_style === "LET_RUN"
          ? "3 x ATR below the entry"
          : "where Candleweb places it from the market";
    return `Fixed stop: ${where}. The trailing stop is off, so it does not move.${chart}`;
  }
  if (f.exit_style === "LET_RUN")
    return `Let winners run: stop 3 x ATR below the entry, held until the trade is up 3R, then following 1R behind the highest price.${chart}`;
  if (f.exit_style === "CUSTOM")
    return `Custom: stop ${atr} x ATR below the entry, held until the trade is up ${start}R, then following ${dist}R behind the highest price.${chart}`;
  return (
    "Standard: adapts to the market. While Bitcoin is more than 5% down over 30 days, the stop follows the price " +
    "from the start, and once the trade is up 1% (or half its stop distance, if more) it locks in the gain, staying " +
    "at most 0.2% below the best price plus half of any further rise. Otherwise it lets winners run: the stop sits " +
    "3 x ATR below the entry until the trade is up 3R, then follows 1R behind the highest price."
  );
};

/** For trade cards: the API's own line, or a short fallback for older rows. */
export const tradeExitLine = (t: Pick<TradeV2, "exit_summary" | "exit_style" | "trailing_stop">) =>
  t.exit_summary ||
  `${EXIT_STYLE_LABEL[toExitStyle(t.exit_style)]} exit · ${t.trailing_stop ? "trailing stop" : "fixed stop"}`;
