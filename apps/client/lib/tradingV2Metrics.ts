import {
  MetricsV2Number,
  MetricsV2Unavailable,
  PortfolioMetricsV2,
  TradeMetricsV2,
} from "../types/tradingV2";
import { isUnavailable, unavailableReason } from "./botHealthV2";

/**
 * Presentation rules for `/api/trading_v2/metrics/` and
 * `/trades/<id>/metrics/`.
 *
 * Everything these endpoints return is derived from recorded fills, so a
 * figure that is missing is genuinely unknown rather than zero. Each rule
 * below exists because the raw value would mislead on its own:
 *
 *  - a field named in `unavailable` has no measurement. It renders as the
 *    backend's own sentence — never 0, never a bare dash. `account_equity`,
 *    `change_today` and `max_drawdown` are in it on every response today.
 *  - `at_risk_now` counts only stops actually armed on the venue, so a
 *    position with no stop contributes nothing. Shown alone it understates
 *    the worst case, which is why `riskNowParts` always returns the
 *    `unprotected_positions` caveat with it.
 *  - PnL is signed, and `dollarFormat` from `ui` cannot be used for it: that
 *    helper counts the minus sign as a digit when it groups thousands, so a
 *    three-digit loss comes out as "$-,125.40". Money is formatted here
 *    instead, magnitude first and the sign reattached — which also keeps this
 *    module free of a `ui` dependency, like `subscriptionV2Format.ts`.
 *  - per-trade figures are matched to positions by venue and symbol, not by
 *    a foreign key, so two trades on one pair and venue report the SAME
 *    positions. They must never be summed — see `matchedByNote`.
 *
 * The OpenAPI entries for both endpoints document **no response body**. The
 * fields named in their descriptions are relied on directly; the PnL and
 * win-rate figures are named only in prose, so they are read through the
 * candidate lists below. When the backend confirms the real keys, those
 * lists are the only thing that has to change.
 */

/* ------------------------------------------------------------------ *
 * Reading values
 * ------------------------------------------------------------------ */

/** trading_v2 sends decimals as strings (`allocated_amount`, `risk_pct`), so
 *  a figure may arrive either way. An empty or non-numeric string is
 *  nothing, not 0 — a bad parse must not become a confident zero on screen. */
export const metricNum = (v: MetricsV2Number | undefined): number | null => {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

/** First candidate key that is actually present, as a number. Tries each
 *  spelling in turn: the response shape is undocumented, and British and
 *  American spellings both appear across this API. */
const pickNumber = (
  source: Record<string, unknown> | null | undefined,
  keys: string[],
): number | null => {
  if (!source) return null;
  for (const k of keys) {
    if (source[k] !== undefined) {
      const n = metricNum(source[k] as MetricsV2Number);
      if (n != null) return n;
    }
  }
  return null;
};

const REALISED_KEYS = [
  "realised_pnl",
  "realized_pnl",
  "realised",
  "realized",
  "pnl_realised",
  "pnl_realized",
];
const UNREALISED_KEYS = [
  "unrealised_pnl",
  "unrealized_pnl",
  "unrealised",
  "unrealized",
  "open_pnl",
  "pnl_unrealised",
  "pnl_unrealized",
];
const WIN_RATE_KEYS = ["win_rate", "winrate", "win_rate_pct", "win_pct"];
/* The design leads with a PERCENTAGE and puts the money underneath
   ("+2.84%" over "+$232.40"), so the return is a separate figure from the
   realised amount, not something to derive. It cannot be computed here
   either: percent of what — allocated capital, starting equity, deployed
   capital? — is the backend's call, and equity is null today anyway. */
const REALISED_PCT_KEYS = [
  "realised_pnl_pct",
  "realized_pnl_pct",
  "pnl_pct_30d",
  "pnl_pct",
  "realised_pct",
  "realized_pct",
  "return_pct",
  "net_pct",
  "roi_pct",
];

/** Realised PnL over the requested window. */
export const realisedPnl = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m as Record<string, unknown>, REALISED_KEYS);

/** Unrealised (open) PnL. */
export const unrealisedPnl = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m as Record<string, unknown>, UNREALISED_KEYS);

/** Win rate. May arrive 0–1 or 0–100; `winRateLabel` normalises. */
export const winRate = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m as Record<string, unknown>, WIN_RATE_KEYS);

/** Realised return as a percentage — the headline figure in the design, with
 *  `realisedPnl` as its caption. Never derived from the amount. */
export const realisedPct = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m as Record<string, unknown>, REALISED_PCT_KEYS);

/* The Overview hero captions each figure with a count or a second unit —
   "+$52.70 / 3 positions", "+2.84% / 41 closed", "18% / ≈ $151",
   "+$96.40 today · +1.16%". None of those companions are named in the
   endpoint description either, so they are resolved the same tolerant way.
   All of these lists are one P3 answer away from being deleted. */
const CHANGE_TODAY_PCT_KEYS = [
  "change_today_pct",
  "change_today_percent",
  "today_pct",
  "change_pct_today",
  "daily_pct",
];
const AT_RISK_PCT_KEYS = ["at_risk_now_pct", "at_risk_pct", "risk_pct_now", "exposure_pct"];
const CLOSED_KEYS = ["trades_closed", "closed_trades", "positions_closed", "closed_count"];
const OPEN_POSITIONS_KEYS = ["open_positions", "positions_open", "open_position_count"];

/** Today's change as a percentage — the second half of the hero's delta pill. */
export const changeTodayPct = (m: PortfolioMetricsV2 | null | undefined) =>
  pickNumber(m as Record<string, unknown>, CHANGE_TODAY_PCT_KEYS);

/** `at_risk_now` as a share of the account, which is what the design leads
 *  with. Read, never derived: the denominator would be `account_equity`, and
 *  that is null today. */
export const atRiskPct = (m: PortfolioMetricsV2 | null | undefined) =>
  pickNumber(m as Record<string, unknown>, AT_RISK_PCT_KEYS);

/** Closed positions in the window — the "41 closed" caption. */
export const closedCount = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m as Record<string, unknown>, CLOSED_KEYS);

/** Open positions right now — the "3 positions" caption. Not a list: there is
 *  no positions endpoint, only (perhaps) this count. */
export const openPositionCount = (m: PortfolioMetricsV2 | null | undefined) =>
  pickNumber(m as Record<string, unknown>, OPEN_POSITIONS_KEYS);

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

/** "$1,234.50" for a non-negative amount. Grouping is applied to the digits
 *  only, which is the bug in `ui`'s `dollarFormat`: it splits the string
 *  including a leading "-" and so counts the sign as a digit. */
const money = (magnitude: number): string => {
  const [whole, fraction] = magnitude.toFixed(2).split(".");
  return `$${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${fraction}`;
};

/** Signed money. A gain gets an explicit "+": these sit next to figures that
 *  are not PnL, and an unsigned number reads like a balance. */
export const signedMoney = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const body = money(Math.abs(value));
  if (value > 0) return `+${body}`;
  if (value < 0) return `-${body}`;
  return body;
};

/** Unsigned money, for an exposure or a balance rather than a result. */
export const plainMoney = (value: number | null | undefined): string =>
  value == null || !Number.isFinite(value) ? "—" : money(Math.abs(value));

/** Which way a signed figure went. Zero is neither: a flat day is not a win. */
export const pnlTone = (value: number | null | undefined): "up" | "dn" | null => {
  if (value == null || !Number.isFinite(value) || value === 0) return null;
  return value > 0 ? "up" : "dn";
};

/** Tone as a class for a given container, e.g. `toneClass(v, "up3", "dn3")`.
 *  The focus design system scopes its tones per block — `.fx-ss b.up3`,
 *  `.fx-v b.up5`, `.fx-cp b.up6` — so the caller names its own pair. */
export const toneClass = (
  value: number | null | undefined,
  up: string,
  down: string,
  muted = "mut2",
): string => {
  if (value == null || !Number.isFinite(value)) return muted;
  const tone = pnlTone(value);
  if (tone === "up") return up;
  if (tone === "dn") return down;
  return "";
};

/** A percentage that may arrive as a fraction or as whole percent. A value of
 *  exactly 1 is ambiguous; it is read as 100%, because a win rate of 1% would
 *  be extraordinary and 100% is the ordinary "won everything so far". */
export const winRatePct = (value: number | null | undefined): number | null => {
  if (value == null || !Number.isFinite(value)) return null;
  return value <= 1 ? value * 100 : value;
};

export const winRateLabel = (value: number | null | undefined): string => {
  const pct = winRatePct(value);
  if (pct == null) return "—";
  return `${pct.toFixed(pct >= 10 ? 0 : 1)}%`;
};

/** A drawdown or change percentage, signed. */
export const pctLabel = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${Math.abs(value).toFixed(2)}%`;
};

/* ------------------------------------------------------------------ *
 * The `unavailable` contract
 * ------------------------------------------------------------------ */

export type MetricRead = {
  /** The number, or null when there is nothing to show. */
  value: number | null;
  /** The backend's reason, when this field is in `unavailable`. */
  reason?: string;
  /** False when the field is named in `unavailable` — render `reason`. */
  available: boolean;
};

/**
 * Reads one numeric field against `unavailable`.
 *
 * A field named in `unavailable` returns `available: false` and the backend's
 * sentence, whatever happens to sit in the field itself — that is the whole
 * point of the contract, and it is why `account_equity: null` with a reason
 * never renders as "$0.00". A field with no value and no reason is simply
 * unknown, and gets a dash.
 *
 * `field` takes several names because the PnL and win-rate keys are not
 * documented: a reason filed under `realized_pnl` must still be found when we
 * read `realised_pnl`. The first name that appears in `unavailable` wins, and
 * the confirmed fields pass a single name as before.
 */
export const metricRead = (
  metrics: { unavailable?: MetricsV2Unavailable } | null | undefined,
  field: string | string[],
  value: number | null,
): MetricRead => {
  if (!metrics) return { value: null, available: true };
  const names = Array.isArray(field) ? field : [field];
  const named = names.find((f) => isUnavailable(metrics.unavailable, f));
  if (named) {
    return {
      value: null,
      available: false,
      reason: unavailableReason(metrics.unavailable, named),
    };
  }
  return { value, available: true };
};

/* The candidate lists, exported so a caller reading an undocumented figure
   can pass the same names to `metricRead` that the resolver searched. */
export const REALISED_FIELDS = REALISED_KEYS;
export const UNREALISED_FIELDS = UNREALISED_KEYS;
export const WIN_RATE_FIELDS = WIN_RATE_KEYS;
export const REALISED_PCT_FIELDS = REALISED_PCT_KEYS;
export const CHANGE_TODAY_PCT_FIELDS = CHANGE_TODAY_PCT_KEYS;
export const AT_RISK_PCT_FIELDS = AT_RISK_PCT_KEYS;

/**
 * The design's PnL cell: a percentage on top, the money underneath
 * ("+2.84%" / "+$232.40"). Both come from the response and neither is
 * derived from the other.
 *
 * The three states that matter, because the slot only holds one figure:
 *  - both known      → the design exactly.
 *  - percent missing → the money takes the figure slot rather than leaving
 *                      it empty, and the caption says what it is. Showing a
 *                      percent we do not have is the one thing not to do.
 *  - both missing    → a dash, captioned with whatever reason there is.
 */
export const pnlCellParts = (
  pct: MetricRead,
  amount: MetricRead,
): { figure: string; caption: string; tone: number | null } => {
  const havePct = pct.available && pct.value != null;
  const haveAmt = amount.available && amount.value != null;

  if (havePct) {
    return {
      figure: pctLabel(pct.value),
      caption: haveAmt ? signedMoney(amount.value) : "",
      tone: pct.value,
    };
  }
  if (haveAmt) {
    return { figure: signedMoney(amount.value), caption: "no percentage sent", tone: amount.value };
  }
  return {
    figure: "—",
    caption: metricCaption(pct.available ? amount : pct, ""),
    tone: null,
  };
};

/** The caption under a figure: the backend's reason when it has one, a
 *  fallback when the figure simply is not in yet, and `whenKnown` once there
 *  is a real number to caption. */
export const metricCaption = (
  read: MetricRead,
  whenKnown: string,
  whenUnknown = "not available yet",
): string => {
  if (!read.available) return read.reason || "not measured yet";
  if (read.value == null) return whenUnknown;
  return whenKnown;
};

/* ------------------------------------------------------------------ *
 * Risk
 * ------------------------------------------------------------------ */

/**
 * `at_risk_now` and the caveat that makes it honest, together.
 *
 * The figure is what the armed stops would cost if they all hit at once. A
 * position with NO stop armed contributes zero to it, so a portfolio of
 * entirely unprotected positions reports a reassuringly small number. That is
 * why this never returns the figure on its own: `unprotected` is part of the
 * reading, and `0` unprotected is itself worth saying.
 */
export const riskNowParts = (
  metrics: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined,
): { read: MetricRead; label: string; unprotected: number | null; caveat: string } => {
  const read = metricRead(metrics, "at_risk_now", metricNum(metrics?.at_risk_now));
  const unprotected = metrics?.unprotected_positions ?? null;

  let caveat: string;
  if (unprotected == null) {
    caveat = "Counts armed stops only — unprotected positions aren't reported yet.";
  } else if (unprotected === 0) {
    caveat = "Every open position has a stop armed on the venue.";
  } else {
    const s = unprotected === 1;
    caveat =
      `${unprotected} open position${s ? "" : "s"} ${s ? "has" : "have"} no stop armed, ` +
      `so ${s ? "it adds" : "they add"} nothing to this figure. The real worst case is larger.`;
  }

  return {
    read,
    label: read.available && read.value != null ? plainMoney(read.value) : "—",
    unprotected,
    caveat,
  };
};

/* ------------------------------------------------------------------ *
 * Per-trade attribution
 * ------------------------------------------------------------------ */

/**
 * The sentence that keeps a per-trade figure honest.
 *
 * `Position` has no foreign key to a v2 trade, so the endpoint matches by
 * venue and symbol and says so in `positions_matched_by`. Two trades on the
 * same pair and venue therefore report identical positions. Showing the
 * figure without this note invites exactly the wrong conclusion, and summing
 * the figures across trades double-counts.
 */
export const matchedByNote = (
  metrics: TradeMetricsV2 | null | undefined,
  duplicates = false,
): string | null => {
  if (!metrics) return null;
  const how = metrics.positions_matched_by;
  if (!how) return null;
  const base = `Positions matched by ${how} — this trade has no direct link to a position.`;
  return duplicates
    ? `${base} Another trade on the same pair and venue reports the same positions, so don't add them up.`
    : base;
};

/** Trades sharing a pair and venue get the same positions back, so the UI has
 *  to know which rows those are. Keyed on ids the trade row already carries. */
export const sharesPositionsWith = (
  trade: { id: number; pair: number; exchange_account: number },
  all: { id: number; pair: number; exchange_account: number }[],
): number[] =>
  all
    .filter(
      (t) =>
        t.id !== trade.id &&
        t.pair === trade.pair &&
        t.exchange_account === trade.exchange_account,
    )
    .map((t) => t.id);

type PositionKeyed = { id: number; pair: number; exchange_account: number };

const positionKey = (t: PositionKeyed) => `${t.exchange_account}:${t.pair}`;

/**
 * One trade per distinct (pair, exchange_account) — the unit a position
 * actually belongs to.
 *
 * Because positions are matched by venue and symbol, every trade sharing a
 * pair and account reports the **same** positions. Summing a bot's trades
 * raw therefore counts those positions once per trade; summing one
 * representative per group counts each set exactly once, which is the figure
 * that is actually true. This is what makes a per-bot total possible at all
 * without a per-bot endpoint.
 *
 * It does NOT fix attribution across deciders — see `foreignSharers`.
 */
export const positionGroups = <T extends PositionKeyed>(trades: T[]): T[] => {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const t of trades) {
    const k = positionKey(t);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
};

/**
 * Trades from OUTSIDE `mine` that sit on one of its (pair, account) groups.
 *
 * The limit of client-side de-duplication: if another bot — or a CandleAI
 * trade — runs the same pair on the same account, its positions come back
 * inside this group's figures and nothing here can separate them. The total
 * stops being "what this bot did" and becomes "what happened on these pairs".
 * Detectable, so it gets said rather than quietly shipped as a bot's record.
 */
export const foreignSharers = <T extends PositionKeyed>(mine: T[], all: T[]): T[] => {
  const keys = new Set(mine.map(positionKey));
  const ids = new Set(mine.map((t) => t.id));
  return all.filter((t) => !ids.has(t.id) && keys.has(positionKey(t)));
};

/** The window actually applied, for a "· 30d" style label. Falls back to what
 *  was asked for, since the response may not echo it. */
export const windowLabel = (
  metrics: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined,
  requested: number,
): string => `${metrics?.window_days ?? requested}d`;

/** The default realised window. Sent explicitly on every call so the figure
 *  and the "· 30d" labels on screen cannot drift apart if the server default
 *  ever changes. */
export const DEFAULT_WINDOW_DAYS = 30;
