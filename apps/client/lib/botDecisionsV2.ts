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
 *    keys are named nowhere in the schema. It carries the gate's verdict, the
 *    order, a condition id and the position that became. Only the position's
 *    realised PnL is read (`outcomePnl`); rendering the whole map buried that
 *    one figure under ids and JSON. Keys are still matched tolerantly, since
 *    none of them is in the schema. (§3.M13)
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

/* ------------------------------------------------------------------ *
 * Outcome
 * ------------------------------------------------------------------ */

/**
 * `outcome` carries the gate's verdict, the order it placed and the position
 * that became — nested objects with ids, a condition uuid, fill prices and
 * timestamps. Dumping all of it into the dialog buried the one thing a person
 * reads a decision for: whether it made or lost money.
 *
 * So only that is read. Everything else stays in the response, unrendered.
 */

const POSITION_KEYS = ["position", "position_detail", "pos"];
const PNL_KEYS = ["realised_pnl", "realized_pnl", "pnl", "net_pnl", "realised", "realized"];
const STATUS_KEYS = ["status", "position_status", "state"];

const asRecord = (v: unknown): Record<string, unknown> | null =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;

const pick = (bag: Record<string, unknown> | null, keys: string[]): unknown => {
  if (!bag) return undefined;
  for (const k of keys) if (bag[k] !== undefined && bag[k] !== null) return bag[k];
  return undefined;
};

export type OutcomePnl = {
  /** True when this decision actually became a position. */
  placed: boolean;
  /** "OPEN" / "CLOSED", upper-cased, or null. */
  status: string | null;
  /** Realised PnL, or null while the position is still open. */
  value: number | null;
};

/**
 * What the position this decision opened has realised.
 *
 * null while it is still OPEN: an open position has realised nothing yet, and
 * reporting 0 for one would read as a flat result rather than an unfinished
 * one.
 */
export const outcomePnl = (
  d: Pick<BotDecisionV2, "outcome"> | null | undefined,
): OutcomePnl => {
  const outcome = asRecord(d?.outcome);
  const position = asRecord(pick(outcome, POSITION_KEYS));
  if (!position) return { placed: false, status: null, value: null };

  const rawStatus = pick(position, STATUS_KEYS);
  const status = typeof rawStatus === "string" ? rawStatus.toUpperCase() : null;

  const rawPnl = pick(position, PNL_KEYS);
  const n = typeof rawPnl === "number" ? rawPnl : Number(rawPnl);
  const value = Number.isFinite(n) && status !== "OPEN" ? n : null;

  return { placed: true, status, value };
};

/** The one caption the dialog shows for a decision's result. */
export const outcomePnlCaption = (o: OutcomePnl): string => {
  if (!o.placed) return "no position opened";
  if (o.status === "OPEN") return "still open";
  if (o.value == null) return "not reported";
  return "realised, after fees";
};

/**
 * Who answered this decision.
 *
 * `bot_name` is null on a CandleAI row — there is no bot — and it was being
 * rendered straight into a sentence, so those rows read " saw 14 candles"
 * with no subject. Who decided is the DECISION's own and never the trade's
 * decider now: a trade switched from a bot to CandleAI keeps its older rows
 * naming the bot, and that is correct, so this reads the row and nothing
 * else.
 */
export const decisionDecider = (
  d: Pick<BotDecisionV2, "bot_name" | "decider"> | null | undefined,
): string => {
  const named = d?.bot_name?.trim();
  if (named) return named;
  if (d?.decider === "CANDLEAI") return "CandleAI";
  return "Its decider";
};

/* ------------------------------------------------------------------ *
 * Why an entry did not happen
 * ------------------------------------------------------------------ */

export type EntryOutcome = {
  /** The verdict, upper-cased — "REFUSED", "PLACED", … — or null. */
  code: string | null;
  /** True when the gate turned this decision away. */
  refused: boolean;
  /**
   * True when a limit entry was never reached and was cancelled.
   *
   * Not a refusal and not a failure: the decider named an entry price, the
   * market did not come to it within 5 candles of the trade's timeframe, and
   * the order was cancelled. Nothing was bought and nothing went wrong, so it
   * is styled neutral — see `ENTRY_OUTCOME_CHIP`.
   */
  expired: boolean;
  /** True while a limit entry is still waiting for its price. */
  armed: boolean;
  /** The backend's own sentence for why. */
  detail: string | null;
};

/**
 * How each verdict reads on a row.
 *
 * `EXPIRED` is the one that has to be got right: it is the commonest outcome
 * that is neither a fill nor a fault, and leaving it unlabelled — which is
 * what this did while only `REFUSED` had a branch — showed the user a
 * decision that visibly did nothing with no stated reason. "Not reached" in
 * neutral grey says what happened without implying the bot or the gate
 * misbehaved.
 */
export const ENTRY_OUTCOME_CHIP: Record<string, { label: string; cls: string }> = {
  ARMED: { label: "Waiting for price", cls: "" },
  EXPIRED: { label: "Not reached", cls: "" },
  REFUSED: { label: "Refused", cls: "dgr" },
  PLACED: { label: "Order placed", cls: "go" },
  FILLED: { label: "Filled", cls: "go" },
};

/** The chip for a verdict, or null for one with nothing to add. */
export const entryOutcomeChip = (
  o: EntryOutcome,
): { label: string; cls: string } | null => (o.code ? ENTRY_OUTCOME_CHIP[o.code] ?? null : null);

/**
 * The gate's verdict on a decision that wanted to open a position.
 *
 * "No position opened" is true of a HOLD, of a BUY the gate refused, and of a
 * BUY that simply failed — three different things that the caption alone
 * cannot tell apart. A refusal in particular is not a fault in the bot: the
 * commonest one now is a live BUY on a plan without live trading, and the
 * backend writes the reason out in full. Showing that sentence is the
 * difference between "your bot did nothing" and "your plan stopped it".
 */
export const entryOutcome = (
  d: Pick<BotDecisionV2, "outcome"> | null | undefined,
): EntryOutcome => {
  const outcome = asRecord(d?.outcome);
  if (!outcome) return { code: null, refused: false, expired: false, armed: false, detail: null };
  const raw = outcome.entry_outcome;
  const code = typeof raw === "string" ? raw.toUpperCase() : null;
  const rawDetail = outcome.entry_outcome_detail;
  const detail = typeof rawDetail === "string" && rawDetail.trim() ? rawDetail.trim() : null;
  return {
    code,
    refused: code === "REFUSED",
    expired: code === "EXPIRED",
    armed: code === "ARMED",
    detail,
  };
};

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
