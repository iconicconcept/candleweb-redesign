import { StatusV2Issue, TradingStatusV2 } from "../types/tradingV2";

/**
 * The hero's status chips, from `GET /trading_v2/status/`.
 *
 * The response is documented as "No response body", so nothing here assumes a
 * field is present. The rule that matters is which way an unknown falls:
 *
 *   **A chip never claims the reassuring state it could not read.**
 *
 * "KuCoin connected" and "Monitoring active" are safety claims. If the call
 * failed, or the field is missing, the honest chip is "not reported" — a grey
 * chip the user can see is unknown — and never the green one. Getting this
 * backwards would tell someone their stops are being watched when nothing
 * checked, which is the one lie this page must not tell.
 */

export type ChipTone = "ok" | "warn" | "mute";

export type StatusChip = {
  key: string;
  label: string;
  tone: ChipTone;
  /** Hover text: the backend's own message when it sent one. */
  title?: string;
};

const bool = (v: unknown): boolean | null => (typeof v === "boolean" ? v : null);

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

/** The issues the backend listed, as plain sentences for a tooltip. */
export const issueMessages = (status: TradingStatusV2 | null | undefined): string[] => {
  const issues = status?.issues;
  if (!Array.isArray(issues)) return [];
  return issues
    .map((i: StatusV2Issue) => (i?.message || i?.code || "").toString().trim())
    .filter(Boolean);
};

/** Which venue the exchange chip should name. Falls back to the generic word
 *  rather than hard-coding KuCoin, since the account may be elsewhere. */
const venueName = (status: TradingStatusV2 | null | undefined): string => {
  const ex = status?.exchange;
  const named = (ex?.name || ex?.venue || "").toString().trim();
  return named || "Exchange";
};

/**
 * The three chips, in the design's order.
 *
 * `failed` is passed separately from a null `status` so a request that errored
 * reads differently from one that has not been made yet.
 */
export const statusChips = (
  status: TradingStatusV2 | null | undefined,
  opts: { failed?: boolean; botsNotResponding?: number } = {},
): StatusChip[] => {
  const issues = issueMessages(status);
  const hint = issues.length ? issues.join(" · ") : undefined;
  const chips: StatusChip[] = [];

  /* --- exchange --- */
  const connected = bool(status?.exchange?.connected);
  chips.push(
    connected == null
      ? {
          key: "exchange",
          label: opts.failed ? "Exchange unknown" : "Exchange not reported",
          tone: "mute",
          title: opts.failed
            ? "Couldn't reach the status endpoint, so this is unknown rather than fine."
            : hint,
        }
      : {
          key: "exchange",
          label: connected ? `${venueName(status)} connected` : `${venueName(status)} unreachable`,
          tone: connected ? "ok" : "warn",
          title: hint,
        },
  );

  /* --- monitoring --- */
  const active = bool(status?.monitoring?.active);
  chips.push(
    active == null
      ? {
          key: "monitoring",
          label: opts.failed ? "Monitoring unknown" : "Monitoring not reported",
          tone: "mute",
          title: opts.failed
            ? "Couldn't reach the status endpoint. This does NOT mean monitoring is fine."
            : hint,
        }
      : {
          key: "monitoring",
          label: active ? "Monitoring active" : "Monitoring down",
          tone: active ? "ok" : "warn",
          /* Spelled out because "active" is an all-or-nothing claim: the price
             monitor, the feed and the execution worker must all be beating,
             firing must not be paused, and every market holding a stop must be
             watched. Anything less is false, not a partial score. */
          title: active
            ? "Price monitor, feed and execution worker are all beating, and every market holding a stop is watched."
            : hint || "A stop could be missed while this is down.",
        },
  );

  /* --- bots --- */
  const notResponding = num(status?.bots?.not_responding) ?? opts.botsNotResponding ?? null;
  const answering = num(status?.bots?.answering);
  if (notResponding != null && notResponding > 0) {
    chips.push({
      key: "bots",
      label: `${notResponding} bot${notResponding === 1 ? "" : "s"} not responding`,
      tone: "warn",
      title: hint,
    });
  } else if (answering != null) {
    chips.push({
      key: "bots",
      label: `${answering} bot${answering === 1 ? "" : "s"} answering`,
      tone: "ok",
      title: hint,
    });
  }

  return chips;
};

/** `.fx-chip` modifier for a tone. "mute" takes no modifier — the base chip is
 *  already the neutral grey one. */
export const chipClass = (tone: ChipTone): string =>
  tone === "ok" ? "ok4" : tone === "warn" ? "warn4" : "";

/**
 * The one sentence worth putting above the fold when something is wrong.
 *
 * `down` means a stop could be missed or nothing can reach the venue, which is
 * a different order of problem from `degraded` and is worded as such.
 */
export const statusBanner = (
  status: TradingStatusV2 | null | undefined,
): { tone: "bad" | "warn"; text: string } | null => {
  const overall = status?.overall;
  if (overall !== "down" && overall !== "degraded") return null;
  const issues = issueMessages(status);
  const text = issues.length
    ? issues.join(" ")
    : overall === "down"
      ? "A stop could be missed, or nothing can reach your exchange right now."
      : "Something is wrong, though stops are still being watched.";
  return { tone: overall === "down" ? "bad" : "warn", text };
};
