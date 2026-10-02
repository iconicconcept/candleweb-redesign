import {
  BotDecisionV2,
  BotHealthV2,
  BotHealthV2Unavailable,
  FleetHealthV2,
} from "../types/tradingV2";

/**
 * Presentation rules for bot health and decisions. Every one of these exists
 * because the raw number on its own would mislead:
 *
 *  - anything listed in `unavailable` has no measurement yet. It renders as
 *    "Not measured yet" with the backend's own sentence — never as 0, and
 *    never as a green 100%. A bot nobody has called has not proved anything.
 *  - a field that *does* have a value is absent from `unavailable`, so there
 *    is no permanent "not measured" badge either.
 *  - `failed_7d` is meaningless without `calls_expected_7d` next to it.
 *  - `days_without_failure: 0` means two different things; `last_failure_at`
 *    tells them apart.
 */

export const NOT_MEASURED = "Not measured yet";

/** True when the backend says this field has nothing behind it yet. */
export const isUnavailable = (
  unavailable: BotHealthV2Unavailable | undefined,
  field: string,
): boolean => !!unavailable && field in unavailable;

/** The backend's own explanation for a missing field, for a tooltip. */
export const unavailableReason = (
  unavailable: BotHealthV2Unavailable | undefined,
  field: string,
): string | undefined => unavailable?.[field];

/** Pausing is only recorded from this release on, so a pause from last month
 *  still counts against uptime. Not a missing field — a caveat, and the
 *  answer when a user disputes their figure. */
export const pausesCaveat = (
  unavailable: BotHealthV2Unavailable | undefined,
): string | undefined => unavailable?.pauses_before_today;

/* ------------------------------------------------------------------ *
 * Connection
 * ------------------------------------------------------------------ */

export type ConnectionTone = "live" | "calm" | "new" | "bad";

/** `connected` means "answered in the last 6 hours and not paused". The six
 *  hours are deliberate — a 4h trade decides 4 times a day and is perfectly
 *  healthy — so the UI must not invent a tighter rule. A paused bot is NOT a
 *  fault, and a bot that has never answered is "Not connected yet", not
 *  "Offline". */
export const connectionState = (
  health: Pick<BotHealthV2, "connected" | "status" | "last_signal"> | null | undefined,
): { label: string; tone: ConnectionTone; cls: string } => {
  if (!health) return { label: NOT_MEASURED, tone: "new", cls: "pause4" };
  if (health.status === "PAUSED") return { label: "Paused", tone: "calm", cls: "pause4" };
  if (!health.last_signal) return { label: "Not connected yet", tone: "new", cls: "pause4" };
  if (health.connected) return { label: "Answering", tone: "live", cls: "live4" };
  return { label: "Not answering", tone: "bad", cls: "fail4" };
};

/* ------------------------------------------------------------------ *
 * Formatting
 * ------------------------------------------------------------------ */

/** "41s ago" / "6m ago" / "3h ago" / "2d ago". */
export const sinceLabel = (seconds: number | null | undefined): string => {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const s = Math.max(0, Math.round(seconds));
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.round(s / 60)}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

/** Reply / think time. Sub-second replies are the normal case, so keep the ms. */
export const secondsLabel = (value: number | null | undefined): string => {
  if (value == null || !Number.isFinite(value)) return "—";
  if (value < 1) return `${Math.round(value * 1000)}ms`;
  if (value < 10) return `${value.toFixed(2)}s`;
  return `${Math.round(value)}s`;
};

export const uptimeLabel = (pct: number | null | undefined): string =>
  pct == null || !Number.isFinite(pct) ? NOT_MEASURED : `${pct.toFixed(1)}%`;

/** "3 of 1,240" — a failure count on its own is alarming and uninformative. */
export const failedLabel = (
  failed: number | null | undefined,
  expected: number | null | undefined,
): string => {
  if (failed == null) return NOT_MEASURED;
  if (expected == null) return String(failed);
  return `${failed.toLocaleString()} of ${expected.toLocaleString()}`;
};

/** `days_without_failure: 0` reads very differently depending on whether
 *  anything has actually failed. `last_failure_at` is what separates them. */
export const failureStreakLabel = (
  days: number | null | undefined,
  lastFailureAt: string | null | undefined,
): string => {
  if (days == null) return NOT_MEASURED;
  if (days === 0) return lastFailureAt ? "Failed today" : "No failures yet";
  return `${days} day${days === 1 ? "" : "s"} clean`;
};

/** The same split, but as a short figure plus a caption, for the streak tiles
 *  whose `b` is a 26px number slot. `value: null` means there is no figure to
 *  put there and the caption should be rendered as small text instead. */
export const failureStreakParts = (
  days: number | null | undefined,
  lastFailureAt: string | null | undefined,
): { value: string | null; caption: string } => {
  if (days == null) return { value: null, caption: NOT_MEASURED };
  if (days === 0) {
    return lastFailureAt
      ? { value: "0", caption: "failed today" }
      : { value: "0", caption: "no failures yet" };
  }
  return { value: String(days), caption: days === 1 ? "day clean" : "days clean" };
};

/** A timestamp, or a dash — never "just now" for a null. */
export const whenLabel = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleString() : "—";

/** The timeout is clamped to 5s…6h server-side, so it can differ from what
 *  the user typed. Showing the difference prevents a support ticket. */
export const timeoutDiffers = (
  health: Pick<BotHealthV2, "reply_timeout_seconds"> | null | undefined,
  configured: number | null | undefined,
): boolean =>
  !!health &&
  health.reply_timeout_seconds != null &&
  configured != null &&
  health.reply_timeout_seconds !== configured;

/* ------------------------------------------------------------------ *
 * Daily replies — the 30-day bar chart
 * ------------------------------------------------------------------ */

/** `daily_replies` always arrives as exactly 30 zero-filled entries, so the
 *  bars never need gap-filling. The zero days are the interesting ones: that
 *  is what an outage looks like. Heights are relative to the busiest day. */
export const dailyReplyBars = (
  daily: BotHealthV2["daily_replies"] | null | undefined,
): { date: string; decisions: number; pct: number; cls: string }[] => {
  const rows = daily ?? [];
  const peak = rows.reduce((m, r) => Math.max(m, r.decisions), 0);
  return rows.map((r) => ({
    date: r.date,
    decisions: r.decisions,
    // a quiet day still gets a visible stub, so 30 slots always read as 30
    pct: peak > 0 ? Math.max(6, (r.decisions / peak) * 100) : 6,
    cls: r.decisions === 0 ? "miss2" : r.decisions < peak / 2 ? "low2" : "",
  }));
};

/* ------------------------------------------------------------------ *
 * Decisions
 * ------------------------------------------------------------------ */

export const DECISION_META: Record<string, { label: string; cls: string }> = {
  BUY: { label: "Buy", cls: "live4" },
  SELL: { label: "Sell", cls: "fail4" },
  HOLD: { label: "Hold", cls: "pause4" },
};

export const decisionMeta = (d: string) => DECISION_META[d] ?? { label: d || "—", cls: "pause4" };

/** Confidence is 0–100 and optional — a bot does not have to send it. */
export const confidenceLabel = (c: number | null | undefined): string =>
  c == null ? "—" : `${Math.round(c)}%`;

/** One line summarising a decision for a timeline row. `candles_seen` is the
 *  number users should see; `market_data_count` looks like a bug to them. */
export const decisionSummary = (d: BotDecisionV2): string =>
  `${decisionMeta(d.decision).label} on ${d.pair} · ${d.timeframe} · ${d.candles_seen} candles seen`;

/* ------------------------------------------------------------------ *
 * Fleet
 * ------------------------------------------------------------------ */

/** "3 of 3 answering" — who is in touch this minute. This is NOT uptime, and
 *  presenting it as uptime is the easiest mistake to make here. For "has it
 *  been reliable", use `uptime_30d` on the per-bot endpoint. */
export const answeringLabel = (fleet: FleetHealthV2 | null | undefined): string =>
  fleet ? `${fleet.answering} of ${fleet.answering_of} answering` : "—";
