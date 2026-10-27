import { PositionV2 } from "../types/tradingV2";
import { isUnavailable, unavailableReason } from "./botHealthV2";

/**
 * Presentation rules for `GET /trading_v2/positions/`.
 *
 * `unavailable` is PER POSITION here, not per response, and the distinction
 * this file exists to protect is:
 *
 *   **A position with no stop has `at_risk: null`, never 0.**
 *
 * Treating those nulls as zero makes a book of entirely unprotected positions
 * report a reassuringly small "if every stop hit at once" — the most
 * dangerous number this dashboard could print. `riskRollup` therefore returns
 * the count it could NOT measure alongside the sum, and every caller shows it.
 *
 * A second distinction, quieter but worth keeping: a null WITH a reason is
 * unknown, a null WITHOUT one does not apply. `exit_price` on an open
 * position is the latter — there is no exit yet, and that is not a gap.
 */

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** A field's value, honouring this position's own `unavailable`. */
export const posRead = (
  p: PositionV2 | null | undefined,
  field: keyof PositionV2 & string,
): { value: number | null; available: boolean; reason?: string } => {
  if (!p) return { value: null, available: true };
  if (isUnavailable(p.unavailable, field)) {
    return { value: null, available: false, reason: unavailableReason(p.unavailable, field) };
  }
  return { value: num(p[field]), available: true };
};

/* ------------------------------------------------------------------ *
 * Labels
 * ------------------------------------------------------------------ */

/** "ETH-USDT" as the design writes it: "ETH/USDT". */
export const pairLabel = (p: PositionV2): string =>
  (p.symbol || "").replace(/[-_]/g, "/") || "—";

/** Prices range from cents to tens of thousands, so precision follows size. */
export const priceLabel = (v: number | null | undefined): string => {
  const n = num(v);
  if (n == null) return "—";
  const abs = Math.abs(n);
  const dp = abs >= 1000 ? 2 : abs >= 1 ? 4 : 8;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: dp });
};

/** Size in the base currency: "0.412 ETH". */
export const sizeLabel = (p: PositionV2): string => {
  const q = num(p.qty);
  if (q == null) return "—";
  const unit = p.base_currency || "";
  return `${q.toLocaleString(undefined, { maximumFractionDigits: 8 })}${unit ? ` ${unit}` : ""}`;
};

/** "3,214.80 → 3,268.42", the design's second meta line. */
export const entryToMark = (p: PositionV2): string =>
  `${priceLabel(p.entry_price)} → ${priceLabel(p.mark_price)}`;

/** Money in the ROW's quote currency, which is not necessarily the account's.
 *  USDT and USD are shown with a `$`; anything else is suffixed instead, so a
 *  EUR-quoted row is never silently relabelled as dollars. */
export const posMoney = (v: number | null | undefined, quote?: string | null): string => {
  const n = num(v);
  if (n == null) return "—";
  const sign = n < 0 ? "-" : "+";
  const [whole, frac] = Math.abs(n).toFixed(2).split(".");
  const grouped = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
  const q = (quote || "").toUpperCase();
  if (!q || q === "USDT" || q === "USD" || q === "USDC") return `${sign}$${grouped}`;
  return `${sign}${grouped} ${q}`;
};

/** Unsigned form, for totals that are already described as a loss. */
export const posMoneyPlain = (v: number | null | undefined, quote?: string | null): string => {
  const n = num(v);
  if (n == null) return "—";
  const [whole, frac] = Math.abs(n).toFixed(2).split(".");
  const grouped = `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${frac}`;
  const q = (quote || "").toUpperCase();
  if (!q || q === "USDT" || q === "USD" || q === "USDC") return `$${grouped}`;
  return `${grouped} ${q}`;
};

export const pctLabel2 = (v: number | null | undefined): string => {
  const n = num(v);
  if (n == null) return "—";
  return `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(2)}%`;
};

/** `.fx-up` / `.fx-dn`, or neither when there is no figure. */
export const moveClass = (v: number | null | undefined): string => {
  const n = num(v);
  if (n == null) return "";
  return n > 0 ? "fx-up" : n < 0 ? "fx-dn" : "";
};

/* ------------------------------------------------------------------ *
 * The stop gauge
 * ------------------------------------------------------------------ */

export type StopGauge = {
  /** 0–100 for the track's width, or null when there is NO STOP AT ALL. */
  pct: number | null;
  /** True when price is close enough to the stop to warrant the rose track. */
  near: boolean;
  label: string;
  /** What the track spans, so its two ends can be labelled truthfully. */
  basis: "ENTRY" | "TRAIL_DISTANCE" | "LOCKED_IN";
  /** The stop is at or above the entry: if it fires, the position closes at
   *  or above what it cost. */
  lockedIn: boolean;
  /** What the far end of the track is — "entry", or where the trail started
   *  from once the stop has climbed past the entry. */
  farLabel: string;
};

/** Below this share of the stop→entry span the marker turns rose, matching
 *  the design's own BTC row (marker at 6 of 100). */
const NEAR_STOP = 0.25;

/**
 * The design's marker, read from `stop_gauge` and never re-derived.
 *
 * The backend clamps it — 0 at the stop, 1 at the safe end — and it knows
 * which stop actually fires first. Recomputing it from `entry_price` and
 * `stop_price` here would disagree the moment a trail moves.
 *
 * **A null gauge now means there is no stop AT ALL.** It used to also go null
 * whenever a trail climbed above the entry, because the old track could only
 * span stop→entry and that span had collapsed. The card read that as "NO
 * STOP" and shouted it over a position that was not merely protected but
 * protected *in profit* — the best state a position can be in, reported as
 * the worst. `stop_gauge_basis` is what fixed it: the track now says what its
 * far end is instead of assuming the entry.
 */
export const stopGauge = (p: PositionV2): StopGauge => {
  const basis = p.stop_gauge_basis ?? "ENTRY";
  const lockedIn = p.stop_locked_in === true || basis === "TRAIL_DISTANCE" || basis === "LOCKED_IN";
  /* The far end of the track. Calling it "entry" once the stop has climbed
     past the entry would put the marker's destination behind it. */
  const farLabel = basis === "ENTRY" ? "entry" : basis === "TRAIL_DISTANCE" ? "high" : "safe";

  const g = num(p.stop_gauge);
  if (g == null) {
    const why = isUnavailable(p.unavailable, "stop_gauge")
      ? unavailableReason(p.unavailable, "stop_gauge")
      : "No stop armed";
    return {
      pct: null,
      near: false,
      label: why || "No stop armed",
      basis,
      lockedIn: false,
      farLabel,
    };
  }
  const clamped = Math.max(0, Math.min(1, g));
  const dist = num(p.distance_to_stop_pct);
  const distLabel = dist == null ? "to stop" : `${Math.abs(dist).toFixed(1)}% to stop`;
  return {
    pct: clamped * 100,
    /* A stop sitting in profit is never "near" in the sense the rose track
       means. Price drifting toward it costs nothing that was not already
       banked, so colouring it like a loss about to happen would be alarming
       and wrong. */
    near: !lockedIn && clamped <= NEAR_STOP,
    label: lockedIn ? `${distLabel} · stop in profit` : distLabel,
    basis,
    lockedIn,
    farLabel,
  };
};

/**
 * True when this position has no stop resting on the venue.
 *
 * `stop_price` is null ONLY when there is no stop at all now, so this no
 * longer counts a trail that has climbed above the entry as unprotected —
 * which it was never doing anything but over-reporting.
 */
export const isUnprotected = (p: PositionV2): boolean =>
  num(p.stop_price) == null && num(p.derived_stop) == null;

/* ------------------------------------------------------------------ *
 * Rollups
 * ------------------------------------------------------------------ */

export type RiskRollup = {
  /** Summed `at_risk` over the positions that reported one. */
  total: number | null;
  /** How many positions reported a figure, and how many exist. */
  measured: number;
  of: number;
  /** Positions with no stop armed — their risk is unknown, not zero. */
  unprotected: number;
  /** The row sitting closest to its stop, for "Closest stop". */
  closest: { position: PositionV2; gauge: StopGauge } | null;
  /** True when every row was measurable, so `total` is the whole story. */
  complete: boolean;
};

/**
 * "If every stop hit at once", honestly.
 *
 * A position whose `at_risk` is null is EXCLUDED from the sum and counted, so
 * the caller can say "across 2 of 3 — one has no stop" rather than printing a
 * total that quietly assumes the unprotected ones cost nothing.
 */
export const riskRollup = (positions: PositionV2[]): RiskRollup => {
  let total: number | null = null;
  let measured = 0;
  let unprotected = 0;
  let closest: { position: PositionV2; gauge: StopGauge } | null = null;

  for (const p of positions) {
    const read = posRead(p, "at_risk");
    if (read.available && read.value != null) {
      total = (total ?? 0) + read.value;
      measured += 1;
    }
    if (isUnprotected(p)) unprotected += 1;

    const gauge = stopGauge(p);
    if (gauge.pct != null && (closest == null || gauge.pct < (closest.gauge.pct ?? Infinity))) {
      closest = { position: p, gauge };
    }
  }

  return {
    total,
    measured,
    of: positions.length,
    unprotected,
    closest,
    complete: measured === positions.length,
  };
};

/** Summed unrealised PnL. Before fees, like its parts. */
export const openPnlTotal = (positions: PositionV2[]): number | null => {
  let total: number | null = null;
  for (const p of positions) {
    const read = posRead(p, "open_pnl");
    if (read.available && read.value != null) total = (total ?? 0) + read.value;
  }
  return total;
};

/** The quote currency to label a rollup with, or null when the rows disagree
 *  and no single symbol would be truthful. */
export const commonQuote = (positions: PositionV2[]): string | null => {
  const seen = new Set(positions.map((p) => (p.quote_currency || "").toUpperCase()).filter(Boolean));
  return seen.size === 1 ? Array.from(seen)[0] : null;
};

/** Positions belonging to one trade. */
export const forTrade = (positions: PositionV2[], tradeId: number): PositionV2[] =>
  positions.filter((p) => p.trade_id === tradeId);

/** Positions opened by one bot. */
export const forBotId = (positions: PositionV2[], botId: number): PositionV2[] =>
  positions.filter((p) => p.bot_id === botId);

/** The caveat that travels with every risk figure. */
export const riskCaveat = (r: RiskRollup): string => {
  if (r.of === 0) return "Nothing is open.";
  if (r.unprotected > 0) {
    return `${r.unprotected} open position${r.unprotected === 1 ? " has" : "s have"} no stop armed, so ${r.unprotected === 1 ? "its" : "their"} risk is not counted here.`;
  }
  if (!r.complete) {
    return `Counted across ${r.measured} of ${r.of} positions — the rest could not be measured.`;
  }
  return "Every open position has a stop armed on the venue.";
};
