import {
  BotReviewV2,
  RecommendationV2,
  RecommendationV2Bar,
  RecommendationV2Progress,
  RecommendationV2SettingTarget,
  RecommendationV2SettingTrade,
  RecommendationV2Trade,
} from "../types/tradingV2";
import { metricNum, pctLabel, signedMoney } from "./tradingV2Metrics";

/**
 * Reading one recommendation from a finished bot review.
 *
 * The rule behind every function here: **`impact`, `bars`, `trades` and
 * `change` can each be absent, and an absent part is hidden rather than
 * zeroed.** "Estimated cost $0.00" reads as "this rule costs you nothing",
 * which is the exact opposite of "we could not work out what it cost". So
 * each tile resolves to `null` and the page drops it, the same contract the
 * metrics tiles already follow.
 *
 * Nothing here recomputes a figure the backend sent. The percentages are its
 * own averages over the decisions it looked at; re-deriving them from the
 * five `trades` rows on screen would quietly report a different number from
 * the one the review actually reasoned about.
 */

/* ------------------------------------------------------------------ *
 * Severity
 * ------------------------------------------------------------------ */

/** The chip's colour, per the design: rose HIGH, amber MEDIUM, grey LOW. */
const SEVERITY_CLASS: Record<string, string> = {
  HIGH: "hi",
  MEDIUM: "mid",
  LOW: "lo",
};

/**
 * The severity chip.
 *
 * `severity_label` is the backend's own wording ("High impact") and is what
 * goes on screen; `severity` only picks the colour. An unrecognised severity
 * is styled grey rather than dropped — a new level must not make the chip
 * vanish, and grey is the one tone that cannot overstate it.
 */
export const severityMeta = (
  rec: RecommendationV2 | null | undefined,
): { label: string; cls: string } | null => {
  const label = rec?.severity_label?.trim();
  const severity = rec?.severity?.toUpperCase();
  if (!label && !severity) return null;
  return {
    label: label || `${severity?.charAt(0)}${severity?.slice(1).toLowerCase()} impact`,
    cls: (severity && SEVERITY_CLASS[severity]) || "lo",
  };
};

/* ------------------------------------------------------------------ *
 * Labels
 * ------------------------------------------------------------------ */

/* Quote assets, longest first, so "BTCUSDT" splits at USDT and not at a
   shorter suffix that also matches. `pairLabel` in `positionsV2` cannot do
   this job: it splits on a separator, and these symbols arrive with none. */
const QUOTES = ["USDT", "USDC", "BUSD", "TUSD", "USD", "EUR", "BTC", "ETH"];

/**
 * "ETHUSDT" as the design writes it: "ETH/USDT".
 *
 * A symbol that already carries a separator keeps its split, and one whose
 * quote is not in the list above is shown unchanged — a wrong split ("ETHU/SDT")
 * is worse than no split at all.
 */
export const pairSlash = (raw: string | null | undefined): string => {
  const sym = raw?.trim();
  if (!sym) return "—";
  if (/[-_/]/.test(sym)) return sym.replace(/[-_]/g, "/");
  const upper = sym.toUpperCase();
  for (const q of QUOTES) {
    if (upper.length > q.length && upper.endsWith(q)) {
      return `${upper.slice(0, upper.length - q.length)}/${q}`;
    }
  }
  return sym;
};

/** "18 Aug" — the date column on a trade row. */
export const recTradeDate = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

/** "2 August 2026" — for an applied / dismissed stamp. */
export const recStamp = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
};

/* ------------------------------------------------------------------ *
 * The comparison bars
 * ------------------------------------------------------------------ */

export type BarRow = {
  label: string;
  /** Null when the row carried no number — it is then dropped, not drawn
   *  at zero width, which would read as a real result of nothing. */
  value: number | null;
  /** Width as a percentage of the widest bar in the set. */
  width: number;
  /** `good3` (teal) or `bad3` (rose). */
  tone: string;
  figure: string;
};

/**
 * The bars, scaled against the largest `|value_pct|` in the set — so the
 * widths compare the rows with each other rather than against 100%, which
 * none of them is a share of.
 *
 * Colour: rose for a negative value, and rose for the WORST row in the set;
 * teal otherwise. The spec gives only the first half of that rule ("teal
 * above 0, rose below"), but the design marks the bot's own +0.58% rose
 * beside two higher bars in teal — the point of the block is that this row is
 * the poor one. Reading "worst in the set" off the values reproduces the
 * design exactly and still cannot mis-colour a loss, which stays rose under
 * either half of the rule.
 */
export const barRows = (bars: RecommendationV2Bar[] | null | undefined): BarRow[] => {
  if (!Array.isArray(bars) || bars.length === 0) return [];
  const rows = bars
    .map((b) => ({ label: b.label?.trim() || "—", value: metricNum(b.value_pct) }))
    .filter((r) => r.value != null) as { label: string; value: number }[];
  if (rows.length === 0) return [];

  const widest = Math.max(...rows.map((r) => Math.abs(r.value)));
  const worst = Math.min(...rows.map((r) => r.value));

  return rows.map((r) => ({
    label: r.label,
    value: r.value,
    /* A set where every bar is zero would divide by zero; they are all the
       same length in that case, which is the truth about them. */
    width: widest === 0 ? 100 : Math.round((Math.abs(r.value) / widest) * 100),
    tone: r.value < 0 || r.value === worst ? "bad3" : "good3",
    figure: pctLabel(r.value),
  }));
};

/* ------------------------------------------------------------------ *
 * The four impact tiles
 * ------------------------------------------------------------------ */

export type ImpactTile = {
  key: string;
  label: string;
  figure: string;
  /** `up5`, `dn5`, or "" for a plain count. */
  tone: string;
  caption: string;
};

/**
 * The tiles, in the design's order, with every one whose figure is missing
 * left out entirely.
 *
 * `actual_label` and `alternative_label` are the backend's own wording for
 * two of the headings, because what the alternative IS changes per
 * recommendation — "Trailing stop would have" on this one, something else on
 * the next. Hard-coding them would mislabel every recommendation but the one
 * the design was drawn from.
 */
export const impactTiles = (
  rec: RecommendationV2 | null | undefined,
  review: BotReviewV2 | null | undefined,
): ImpactTile[] => {
  const impact = rec?.impact;
  if (!impact) return [];
  const tiles: ImpactTile[] = [];

  const affected = impact.trades_affected ?? null;
  if (affected != null) {
    /* The denominator is the review's own sample — what it actually read.
       `closed_trades` is the rule a review runs on; `decisions_on_prompt` is
       the fallback for a review that only reports that. */
    const of = review?.closed_trades ?? review?.decisions_on_prompt ?? null;
    tiles.push({
      key: "affected",
      label: "Trades affected",
      figure: affected.toLocaleString(),
      tone: "",
      caption: of == null ? "on this prompt" : `of ${of.toLocaleString()} on this prompt`,
    });
  }

  const actual = metricNum(impact.actual_avg_pct);
  if (actual != null) {
    tiles.push({
      key: "actual",
      label: "Average result",
      figure: pctLabel(actual),
      tone: actual < 0 ? "dn5" : "up5",
      caption: impact.actual_label?.trim() || "what actually happened",
    });
  }

  const alternative = metricNum(impact.alternative_avg_pct);
  if (alternative != null) {
    tiles.push({
      key: "alternative",
      /* The heading IS the alternative's name, so it comes from the data;
         the caption then says what the figure is measured over. */
      label: impact.alternative_label?.trim() || "The alternative would have",
      figure: pctLabel(alternative),
      tone: alternative < 0 ? "dn5" : "up5",
      caption: "on the same trades",
    });
  }

  const cost = metricNum(impact.estimated_cost);
  if (cost != null) {
    tiles.push({
      key: "cost",
      label: "Estimated cost",
      /* Negative means money left on the table, and it is shown as the loss
         it is rather than flipped to a positive "saving". */
      figure: signedMoney(cost),
      tone: cost < 0 ? "dn5" : cost > 0 ? "up5" : "",
      caption: "left on the table",
    });
  }

  return tiles;
};

/* ------------------------------------------------------------------ *
 * A trade row
 * ------------------------------------------------------------------ */

export type TradeRow = {
  key: string;
  date: string;
  pair: string;
  rationale: string;
  actual: number | null;
  figure: string;
  tone: string;
  /** "would be +1.31%", or null when there is nothing to compare against. */
  alternative: string | null;
};

export const tradeRows = (rows: RecommendationV2Trade[] | null | undefined): TradeRow[] => {
  if (!Array.isArray(rows)) return [];
  return rows.map((t, i) => {
    const actual = metricNum(t.actual_pct);
    const alternative = metricNum(t.alternative_pct);
    return {
      key: String(t.decision_id ?? `row-${i}`),
      date: recTradeDate(t.decided_at),
      pair: pairSlash(t.pair),
      /* A decision need not carry a rationale — a bot does not have to send
         one — so the row says so rather than leaving the column blank. */
      rationale: t.rationale?.trim() || "No reasoning sent with this decision.",
      actual,
      figure: actual == null ? "—" : pctLabel(actual),
      tone: actual == null ? "" : actual < 0 ? "fx-dn" : "fx-up",
      alternative: alternative == null ? null : `would be ${pctLabel(alternative)}`,
    };
  });
};

/* ------------------------------------------------------------------ *
 * A setting change
 * ------------------------------------------------------------------ */

/** The spec's labels, exactly. A target with no entry falls back to its own
 *  key rather than being hidden: an unlabelled row still tells the truth. */
const TARGET_LABEL: Record<string, string> = {
  min_confidence: "Confidence bar",
  risk_pct: "Risk per trade (%)",
  max_size_pct: "Largest position (% of allocation)",
  trailing_stop: "Trailing stop",
  agent_exits: "Let SELL close positions",
  indicators: "Indicators",
  candle_history_len: "Candles sent",
  timeframe: "Timeframe",
};

export const settingTargetLabel = (
  target: RecommendationV2SettingTarget | null | undefined,
): string => {
  if (!target) return "This setting";
  return TARGET_LABEL[target] || target;
};

/**
 * A setting's value as the row shows it.
 *
 * A setting can be a number, a switch or a list, and each reads wrongly as
 * the others: `false` printed straight renders as nothing at all, and an
 * array of indicator names renders as "[object Object]" through a template.
 */
export const settingValueLabel = (v: unknown): string => {
  if (v == null || v === "") return "—";
  if (typeof v === "boolean") return v ? "On" : "Off";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "none";
  if (typeof v === "number") return String(v);
  if (typeof v === "string") return v;
  return String(v);
};

/** True when this change touches a trade that trades real money, so Apply
 *  has to be confirmed before it is sent. */
export const touchesLive = (rec: RecommendationV2 | null | undefined): boolean => {
  const change = rec?.change;
  if (!change) return false;
  if (change.touches_live) return true;
  return (change.trades ?? []).some((t) => t.mode === "LIVE");
};

/** Trades the change names that no longer exist. Only Dismiss is offered for
 *  a recommendation whose every trade is gone. */
export const deletedTrades = (
  rec: RecommendationV2 | null | undefined,
): RecommendationV2SettingTrade[] =>
  (rec?.change?.trades ?? []).filter((t) => t.exists === false);

export const allTradesGone = (rec: RecommendationV2 | null | undefined): boolean => {
  const rows = rec?.change?.trades ?? [];
  return rows.length > 0 && rows.every((t) => t.exists === false);
};

/* ------------------------------------------------------------------ *
 * Progress
 * ------------------------------------------------------------------ */

/** "3 of 6 suggestions applied", or null when there is nothing to count. */
export const appliedLine = (
  progress: RecommendationV2Progress | null | undefined,
): string | null => {
  const total = progress?.total ?? null;
  const applied = progress?.applied ?? null;
  if (total == null || applied == null || total === 0) return null;
  return `${applied} of ${total} suggestion${total === 1 ? "" : "s"} applied`;
};

/**
 * "Your win rate is up 4.2 points since you started applying them."
 *
 * Shown ONLY when `since_applying.enough` — each side needs at least 10
 * closed positions, and the backend is the one that decides that. Below it
 * the comparison is noise, so `note` is shown in its place and the claim is
 * not made at all. "Down" is said plainly when the number is negative: a
 * change that hurt is the thing a user most needs told.
 */
export const sinceApplyingLine = (
  progress: RecommendationV2Progress | null | undefined,
): string | null => {
  const since = progress?.since_applying;
  if (!since) return null;
  if (!since.enough) return since.note?.trim() || null;
  const points = metricNum(since.win_rate_change_points);
  if (points == null) return since.note?.trim() || null;
  if (points === 0) return "Your win rate is unchanged since you started applying them.";
  const dir = points > 0 ? "up" : "down";
  const n = Math.abs(points).toFixed(1).replace(/\.0$/, "");
  return `Your win rate is ${dir} ${n} point${n === "1" ? "" : "s"} since you started applying them.`;
};

/* ------------------------------------------------------------------ *
 * Status
 * ------------------------------------------------------------------ */

export const isApplied = (rec: RecommendationV2 | null | undefined): boolean =>
  rec?.status === "APPLIED";

export const isDismissed = (rec: RecommendationV2 | null | undefined): boolean =>
  rec?.status === "DISMISSED";

/** Nothing to act on: `change` is absent, so Apply is never offered — which
 *  is also why the server's `NOTHING_TO_APPLY` should never be reachable. */
export const hasChange = (rec: RecommendationV2 | null | undefined): boolean => {
  const change = rec?.change;
  if (!change) return false;
  if (change.kind === "PROMPT") return !!(change.remove?.trim() || change.replace?.trim());
  if (change.kind === "SETTING") return (change.trades ?? []).length > 0;
  return false;
};

/**
 * What to say when apply / dismiss / reopen is refused.
 *
 * The backend writes `message` for the user in every one of these cases, so
 * the message is what gets shown; this supplies only the short heading above
 * it, and a code with no entry still renders with its own message rather than
 * being swallowed.
 */
export const ACTION_ERROR_TITLE: Record<string, string> = {
  CONFIRM_LIVE: "This changes a live trade",
  ALREADY_APPLIED: "Already applied",
  ALREADY_DISMISSED: "Already dismissed",
  NOTHING_TO_APPLY: "Nothing to apply",
  TRADE_GONE: "This trade no longer exists",
  TRADE_CHANGED: "This trade has a different decider now",
  PROMPT_CHANGED: "Your prompt has changed since the review",
  INVALID: "That value was refused",
};

/** The codes that mean "refetch and show the state it is actually in" —
 *  usually because the user acted on it in another tab. */
export const isStaleStateCode = (code: string | undefined): boolean =>
  code === "ALREADY_APPLIED" || code === "ALREADY_DISMISSED";
