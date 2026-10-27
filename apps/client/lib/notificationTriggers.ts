import { REVALIDATE_KEYS, RevalidateKey } from "../redux/slices/revalidateSlice";

/**
 * Which views a notification makes stale.
 *
 * The dashboard has no push channel, so the unread-notification poll is also
 * the event bus: when it returns something new, the views that event touches
 * are re-read at once instead of waiting up to a minute for their own tick.
 *
 * ## Why the matching is loose
 *
 * The whole mechanism is a set of string comparisons against
 * `notification_type`, and the failure mode of getting one wrong is the worst
 * kind available here: **nothing happens.** No error, no console entry, no
 * visible difference from a backend that simply hasn't sent anything — the
 * page just sits there looking stale, which is exactly the symptom this
 * feature exists to fix. A typo would be indistinguishable from it working.
 *
 * The API documents these as display names ("Position closed"), and the
 * dashboard does render `notification_type` straight to the user as a heading
 * and a filter chip, which is good evidence they really are those strings.
 * But "good evidence" is not the same as a confirmed enum, and the cost of
 * being wrong is silence. So every key is normalised down to its letters and
 * digits before comparison: `Position closed`, `position_closed`,
 * `POSITION_CLOSED` and `Position Closed!` all collapse to `positionclosed`
 * and hit the same rule.
 *
 * `unmatchedType` is the other half: in development, a notification whose
 * type matches no rule says so once, by name. If the backend's spelling turns
 * out to differ, it announces itself in the console instead of quietly doing
 * nothing for the life of the feature.
 */

/** Letters and digits only, lower case. Everything else is spelling. */
export const normaliseType = (raw: string | null | undefined): string =>
  (raw ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

/**
 * The §9 trigger table, keyed by normalised type.
 *
 * Each entry names the data the event invalidates, not the pages — several
 * pages read the same data, and a page that is not mounted ignores the bump.
 */
const TRIGGERS: Record<string, RevalidateKey[]> = {
  /* An order reached the venue: there is new money on it, the portfolio
     totals moved, and the bot that decided it has a new fill to its name. */
  botorderplaced: ["positions", "metrics", "trades", "botMetrics", "decisions"],

  /* The widest one. A close changes everything a close can change — and it is
     the only event that adds a row to History or moves a bot nearer a
     review, since review readiness counts CLOSED trades. */
  positionclosed: [
    "positions",
    "metrics",
    "trades",
    "botMetrics",
    "reviewReadiness",
    "history",
    "decisions",
  ],

  /* Both of these are about a position whose protection is in doubt, so they
     refresh what is open and the chips that report on monitoring. */
  positionneedsattention: ["positions", "status"],
  positionstuckopen: ["positions", "status"],

  /* The gate turned an order away — the decision now carries the refusal and
     its reason, and a trade may have been stopped by it. */
  botentryrefused: ["decisions", "trades"],

  /* A trade stopped running — its row and the status chips change. */
  tradepaused: ["trades", "status"],

  /* A new answer from a bot, which is also evidence the bot is alive. */
  botdecisionreceived: ["decisions", "botHealth"],

  newtradecreated: ["trades", "status"],
};

/** The book changed under us — nothing currently on screen still applies. */
const MODE_CHANGED = normaliseType("Trading mode changed");

/**
 * What this notification invalidates, or null when it is not a trading event.
 *
 * Most notifications are not: referrals, subscriptions and course updates all
 * come through the same list and must not cause a round of dashboard
 * refetches.
 */
export const triggersFor = (type: string | null | undefined): RevalidateKey[] | null => {
  const key = normaliseType(type);
  if (!key) return null;
  if (key === MODE_CHANGED) return REVALIDATE_KEYS.slice();
  return TRIGGERS[key] ?? null;
};

/* Types already reported, so a repeating notification does not repeat its
   warning every fifteen seconds. */
const warned = new Set<string>();

/**
 * Say so, once, when a notification looks like a trading event but matches no
 * rule — the case that would otherwise be invisible.
 *
 * Deliberately conservative about what "looks like" means: it only speaks up
 * for types mentioning the things this dashboard is about, so a referral
 * notification never prompts anyone to go looking for a missing trigger.
 */
const TRADING_WORDS = ["position", "trade", "bot", "order", "decision", "stop"];

export const warnUnmatchedType = (type: string | null | undefined): void => {
  if (process.env.NODE_ENV === "production") return;
  const key = normaliseType(type);
  if (!key || warned.has(key) || TRIGGERS[key] || key === MODE_CHANGED) return;
  if (!TRADING_WORDS.some((w) => key.includes(w))) return;
  warned.add(key);
  // eslint-disable-next-line no-console
  console.warn(
    `[candleweb] Notification type "${type}" looks like a trading event but matches no ` +
      `refetch trigger, so nothing was re-read. If this should refresh the dashboard, ` +
      `add "${key}" to TRIGGERS in lib/notificationTriggers.ts.`,
  );
};
