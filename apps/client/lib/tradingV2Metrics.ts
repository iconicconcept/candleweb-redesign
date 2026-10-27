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
 *  - per-trade figures now count only the positions THAT TRADE opened, so two
 *    trades on one pair no longer report the same money and each figure can
 *    be read as that trade's own record. What is left over is
 *    `unattributed_positions` — see `unattributedNote`.
 *
 * Field names are the backend's documented ones. The tolerant candidate lists
 * that used to live here, from when both endpoints were documented as "no
 * response body", are gone: a confirmed name does not need guessing at, and a
 * list of near-misses hides a real rename behind a plausible dash. Where two
 * names are still read it is because the API documents both — `closed_trades`
 * and the older `closed_positions` are the same number.
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

/** First of the given keys that is actually present, as a number. Most
 *  figures pass a single documented name; the few that pass two do so because
 *  the API documents two names for one number. */
/* `source` is typed `object`, not `Record<string, unknown>`, so the metric
   types pass without a cast at every call site. They are interface types with
   no index signature, and TS refuses `PortfolioMetricsV2 as Record<string,
   unknown>` outright (TS2352) — the repo builds on that error even though the
   editor let it through. The assertion stays because reading a field by name
   is still what this does; what has changed is that the names are known. */
const pickNumber = (source: object | null | undefined, keys: string[]): number | null => {
  if (!source) return null;
  const bag = source as Record<string, MetricsV2Number | undefined>;
  for (const k of keys) {
    const raw = bag[k];
    if (raw !== undefined) {
      const n = metricNum(raw);
      if (n != null) return n;
    }
  }
  return null;
};

const REALISED_KEYS = ["realised_pnl"];
const UNREALISED_KEYS = ["unrealised_pnl", "open_pnl"];
const WIN_RATE_KEYS = ["win_rate"];
/* The design leads with a PERCENTAGE and puts the money underneath
   ("+2.84%" over "+$232.40"), so the return is a separate figure from the
   realised amount, not something to derive. It cannot be computed here
   either: percent of what — allocated capital, starting equity, deployed
   capital? — is the backend's call. */
const REALISED_PCT_KEYS = ["realised_return_pct"];

/** Realised PnL over the requested window. */
export const realisedPnl = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m, REALISED_KEYS);

/** Unrealised (open) PnL. */
export const unrealisedPnl = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m, UNREALISED_KEYS);

/** Win rate. May arrive 0–1 or 0–100; `winRateLabel` normalises. */
export const winRate = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m, WIN_RATE_KEYS);

/** Realised return as a percentage — the headline figure in the design, with
 *  `realisedPnl` as its caption. Never derived from the amount. */
export const realisedPct = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m, REALISED_PCT_KEYS);

/* The Overview hero captions each figure with a count or a second unit —
   "+$52.70 / 3 positions", "+2.84% / 41 closed", "18% / ≈ $151",
   "+$96.40 today · +1.16%". */
const CHANGE_TODAY_PCT_KEYS = ["change_today_pct"];
const AT_RISK_PCT_KEYS = ["at_risk_pct"];
/* `closed_trades` is the name across the API now; `closed_positions` is the
   same number under the older spelling and is still sent by the portfolio
   and per-trade endpoints. Both are documented, so both are read. */
const CLOSED_KEYS = ["closed_trades", "closed_positions"];
const OPEN_POSITIONS_KEYS = ["open_positions"];

/** Today's change as a percentage — the second half of the hero's delta pill. */
export const changeTodayPct = (m: PortfolioMetricsV2 | null | undefined) =>
  pickNumber(m, CHANGE_TODAY_PCT_KEYS);

/** `at_risk_now` as a share of the account, which is what the design leads
 *  with. Read, never derived: the denominator would be `account_equity`, and
 *  that is null today. */
export const atRiskPct = (m: PortfolioMetricsV2 | null | undefined) =>
  pickNumber(m, AT_RISK_PCT_KEYS);

/** Closed positions in the window — the "41 closed" caption. */
export const closedCount = (m: PortfolioMetricsV2 | TradeMetricsV2 | null | undefined) =>
  pickNumber(m, CLOSED_KEYS);

/** Open positions right now — the "3 positions" caption, as the METRICS
 *  endpoint counts them. `GET /positions/?status=open` is the list and the
 *  better source; pages that have both prefer the list, so the caption and
 *  the rows below it cannot disagree. */
export const openPositionCount = (m: PortfolioMetricsV2 | null | undefined) =>
  pickNumber(m, OPEN_POSITIONS_KEYS);

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
 * `field` still takes a list because one number can have two documented names
 * (`closed_trades` / `closed_positions`) and a reason may be filed under
 * either. The first name that appears in `unavailable` wins; everything else
 * passes a single name.
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
 * Positions on this trade's market that NO trade opened.
 *
 * This replaces the venue+symbol caveat that used to live here. A trade's
 * figures now count only the positions it opened ITSELF, so two trades on one
 * pair no longer report the same money and the numbers can finally be read as
 * this trade's own record. What is left over are positions nothing claims —
 * opened before the trade existed, or by hand on the venue. They are in no
 * trade's figures at all, which is worth saying exactly once, next to the
 * figures they are missing from.
 *
 * Returns null when there are none: silence is the correct output for a trade
 * whose market holds nothing unaccounted for.
 */
export const unattributedNote = (
  metrics: TradeMetricsV2 | null | undefined,
): string | null => {
  const n = metrics?.unattributed_positions;
  if (n == null || n <= 0) return null;
  const one = n === 1;
  return (
    `${n} position${one ? "" : "s"} on this market ${one ? "was" : "were"} opened by no trade, ` +
    `so ${one ? "it is" : "they are"} not in the figures above. ` +
    `Your account-wide totals still count ${one ? "it" : "them"}.`
  );
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
