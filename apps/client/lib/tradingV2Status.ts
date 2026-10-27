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

/**
 * The issues the backend listed, as plain sentences for a tooltip.
 *
 * `informational: true` marks a finding that is worth saying but is not a
 * fault — a bot quietly holding a position its own decision opened, or no
 * exchange on an account that does not need one. `overall` already ignores
 * those when deciding `degraded`, so a chip that folded them into its hover
 * text would be the only thing left calling them problems.
 */
export const issueMessages = (
  status: TradingStatusV2 | null | undefined,
  opts: { includeInformational?: boolean } = {},
): string[] => {
  const issues = status?.issues;
  if (!Array.isArray(issues)) return [];
  return issues
    .filter((i: StatusV2Issue) => (opts.includeInformational ? true : !i?.informational))
    .map((i: StatusV2Issue) => (i?.message || i?.code || "").toString().trim())
    .filter(Boolean);
};

/** One issue by code, whatever its severity — for a chip that wants to show
 *  the backend's own wording for the thing it is reporting. */
export const issueByCode = (
  status: TradingStatusV2 | null | undefined,
  ...codes: string[]
): StatusV2Issue | null => {
  const issues = status?.issues;
  if (!Array.isArray(issues)) return null;
  return issues.find((i) => i?.code && codes.includes(i.code)) ?? null;
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

  /* --- exchange ---
     `required` is false on a demo-only account: nothing on it needs a venue,
     so a missing exchange is a fact about the setup rather than a fault. The
     backend marks those issues informational and keeps `overall` out of
     "down" for them — an amber "KuCoin not connected" here would be the only
     thing on screen disagreeing, and it would send someone to fix a problem
     they do not have. */
  const connected = bool(status?.exchange?.connected);
  const required = bool(status?.exchange?.required);
  if (required === false && connected !== true) {
    chips.push({
      key: "exchange",
      label: "Demo — no exchange needed",
      tone: "mute",
      title:
        issueByCode(status, "NO_EXCHANGE", "EXCHANGE_NOT_CONNECTED")?.message ||
        "Paper orders never reach a venue, so this account needs no exchange keys.",
    });
  } else {
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
            label: connected
              ? `${venueName(status)} connected`
              : `${venueName(status)} unreachable`,
            tone: connected ? "ok" : "warn",
            title: hint,
          },
    );
  }

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

  /* --- bots holding positions ---
     A SEPARATE chip, and deliberately neutral. A bot that has gone quiet
     while holding a position its own decision opened is not the same as one
     that has gone quiet with nothing running: nothing is waiting on it, and
     the stop or trail manages the exit either way. The backend files this as
     an informational issue and keeps `overall` out of `degraded` for it, so
     styling it amber here would contradict the only authority on the
     question. */
  const holding = num(status?.bots?.with_open_positions);
  if (holding != null && holding > 0) {
    chips.push({
      key: "bots-holding",
      label: `${holding} bot${holding === 1 ? "" : "s"} with open position${
        holding === 1 ? "" : "s"
      }`,
      tone: "mute",
      title:
        issueByCode(status, "BOTS_HOLDING_POSITIONS")?.message ||
        "Quiet, but holding a position it opened. The stop or trail manages the exit — nothing is waiting on the bot.",
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
