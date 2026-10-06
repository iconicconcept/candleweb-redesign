/**
 * What a checkout we sent someone to was for — it has to survive the round
 * trip through the card processor, which comes back as a bare redirect.
 *
 * This lived inside the subscription page while that page was the only place a
 * plan could be bought. The pricing page now starts a checkout too, and the
 * processor returns to the dashboard either way, so the record has to be
 * written by whichever page sent them and read by the one they land on.
 */

export type Pending =
  | { kind: "plan"; plan: string }
  | { kind: "invoice"; number: string }
  /* `before` is the balance when they left, so a late webhook still reads as new reviews */
  | { kind: "reviews"; quantity: number; number: string | null; before: number };

const PENDING_KEY = "cw-sub-pending";

export const writePending = (p: Pending) => {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ ...p, at: Date.now() }));
  } catch {
    /* private mode — the query-string check still runs */
  }
};

export const readPending = (): Pending | null => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    /* a checkout abandoned hours ago isn't what this visit is about */
    if (!p?.at || Date.now() - p.at > 2 * 60 * 60 * 1000) {
      sessionStorage.removeItem(PENDING_KEY);
      return null;
    }
    return p as Pending;
  } catch {
    return null;
  }
};

export const clearPending = () => {
  try {
    sessionStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
};
