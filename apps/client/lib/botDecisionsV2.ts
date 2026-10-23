import { BotDecisionV2, BotDecisionV2Detail, BotDecisionV2Risk } from "../types/tradingV2";

/**
 * Presentation rules for `GET /trading_v2/decisions/` and `/decisions/{id}/`.
 *
 * Three of these fields mislead if rendered naively, so each one is resolved
 * here rather than in a component:
 *
 *  - **`risk`** is the bot's OWN rating. It is not Candleweb's judgement and
 *    not a measurement, so it is labelled as the bot's word, never as a
 *    verdict. A bot need not send one.
 *  - **`entry_price`** is the price the bot QUOTED when it decided. It is not
 *    a fill. Calling it one would invent a trade that may never have been
 *    placed.
 *  - **`outcome`** is documented as `additionalProperties` — an open map whose
 *    keys are named nowhere in the schema. So nothing here assumes a key:
 *    `outcomeEntries` renders whatever actually arrives. The design prints a
 *    fill, a stop and a fee under each decision, but inventing those key names
 *    would put a confident wrong number on screen the day the backend spells
 *    one differently. (§3.M13)
 */

/* ------------------------------------------------------------------ *
 * Risk
 * ------------------------------------------------------------------ */

export const RISK_META: Record<BotDecisionV2Risk, { label: string; cls: string }> = {
  LOW: { label: "Low risk", cls: "live4" },
  MEDIUM: { label: "Medium risk", cls: "warn4" },
  HIGH: { label: "High risk", cls: "fail4" },
};

export const riskMeta = (r: BotDecisionV2Risk | null | undefined) =>
  r ? RISK_META[r] ?? { label: r, cls: "pause4" } : null;

/** Short form for a dense row: "Low" rather than "Low risk". */
export const riskShort = (r: BotDecisionV2Risk | null | undefined): string =>
  r ? r.charAt(0) + r.slice(1).toLowerCase() : "—";

export const RISK_FILTERS: { value: BotDecisionV2Risk | "all"; label: string }[] = [
  { value: "all", label: "Any risk" },
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

/* ------------------------------------------------------------------ *
 * Entry price
 * ------------------------------------------------------------------ */

/** The quoted price as a number, or null. Arrives as a decimal STRING, so it
 *  is parsed rather than trusted to be numeric. */
export const entryPrice = (d: Pick<BotDecisionV2, "entry_price">): number | null => {
  const raw = d.entry_price;
  if (raw == null || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
};

/** Prices here span pairs worth cents and pairs worth tens of thousands, so
 *  the precision follows the magnitude rather than being fixed at 2. */
export const entryPriceLabel = (d: Pick<BotDecisionV2, "entry_price">): string => {
  const n = entryPrice(d);
  if (n == null) return "—";
  const abs = Math.abs(n);
  const dp = abs >= 1000 ? 2 : abs >= 1 ? 4 : 8;
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: dp });
};

/* ------------------------------------------------------------------ *
 * Outcome
 * ------------------------------------------------------------------ */

export type OutcomeEntry = { key: string; label: string; value: string };

/** `order_filled_price` -> "Order filled price". Keys are unknown ahead of
 *  time, so they are humanised generically rather than mapped one by one. */
const humanise = (key: string): string => {
  const words = key.replace(/[_-]+/g, " ").replace(/([a-z\d])([A-Z])/g, "$1 $2").trim();
  if (!words) return key;
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
};

const scalar = (v: unknown): string | null => {
  if (v == null || v === "") return null;
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return Number.isFinite(v) ? v.toLocaleString() : null;
  if (typeof v === "string") return v;
  return null;
};

/**
 * Whatever the backend actually put in `outcome`, as rows ready to render.
 *
 * Nested objects and arrays are JSON-stringified rather than dropped: an
 * unexpected shape should still be visible to whoever is debugging a bot, and
 * seeing it is how the real key names get documented. Empty values are
 * dropped, since a blank row says nothing.
 */
export const outcomeEntries = (
  d: Pick<BotDecisionV2, "outcome"> | null | undefined,
): OutcomeEntry[] => {
  const outcome = d?.outcome;
  if (!outcome || typeof outcome !== "object") return [];
  const out: OutcomeEntry[] = [];
  for (const [key, raw] of Object.entries(outcome)) {
    const flat = scalar(raw);
    if (flat != null) {
      out.push({ key, label: humanise(key), value: flat });
      continue;
    }
    if (raw != null && typeof raw === "object") {
      out.push({ key, label: humanise(key), value: JSON.stringify(raw) });
    }
  }
  return out;
};

/** True when the gate recorded something at all. A HOLD legitimately has
 *  nothing; a BUY or SELL with nothing means the order never happened. */
export const hasOutcome = (d: Pick<BotDecisionV2, "outcome"> | null | undefined): boolean =>
  outcomeEntries(d).length > 0;

/* ------------------------------------------------------------------ *
 * Candle records
 * ------------------------------------------------------------------ */

/**
 * `market_data_ids` as a list of ids.
 *
 * The prose calls it a list, oldest first; the schema renders it as a string.
 * Both are accepted, and anything else yields an empty list rather than a
 * crash — this is the only place that has to know.
 */
export const marketDataIds = (d: BotDecisionV2Detail | null | undefined): number[] => {
  const raw = d?.market_data_ids;
  if (!raw) return [];
  const parts: unknown[] = Array.isArray(raw) ? raw : String(raw).split(/[,\s]+/);
  const ids: number[] = [];
  for (const part of parts) {
    if (part === "" || part == null) continue;
    const n = Number(part);
    if (Number.isFinite(n)) ids.push(n);
  }
  return ids;
};

/**
 * True when fewer rows are still linked than the decision counted.
 *
 * That is market data having been pruned since, NOT a bot that saw less than
 * it claimed — a distinction worth stating wherever the two numbers disagree,
 * because the obvious reading of it is an accusation.
 */
export const idsTidied = (d: BotDecisionV2Detail | null | undefined): boolean =>
  !!d && marketDataIds(d).length < d.market_data_count;
