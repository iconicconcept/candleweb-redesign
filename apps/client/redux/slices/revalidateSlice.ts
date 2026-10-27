import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

/**
 * "This data is stale — read it again."
 *
 * `trading_v2` has no push channel, so the dashboard learns that something
 * happened from the notification poll (see `useNotificationPoll`). The views
 * that need to react to a *Position closed* are spread across six pages and
 * several components, none of which can reach into each other's fetch state:
 * every one of them owns its figures in local state, deliberately, so a stale
 * PnL can never outlive the page showing it.
 *
 * So the signal goes through here instead of through props. Each resource is
 * a counter; bumping it is the whole of the message. A view adds the counter
 * to the dependency list of the effect that fetches, and re-reads when it
 * moves. No payloads, no cache, no invalidation graph to get wrong — the
 * counter says only "ask again", and the view still decides what to ask for,
 * which is what keeps a filtered or paged view from being yanked back to its
 * first page by a background event.
 *
 * It is deliberately NOT a request cache. Two views reading `positions` will
 * each issue their own request when it bumps. That is one more request than a
 * shared cache would make, and it keeps each view's reading of a response its
 * own — which is the rule the whole dashboard is built on.
 */

/** The things a notification can invalidate. Named after the data, not after
 *  the page, because several pages show the same data. */
export type RevalidateKey =
  | "positions"
  | "metrics"
  | "trades"
  | "botMetrics"
  | "botHealth"
  | "decisions"
  | "status"
  | "reviewReadiness"
  | "history"
  | "entitlements";

export const REVALIDATE_KEYS: RevalidateKey[] = [
  "positions",
  "metrics",
  "trades",
  "botMetrics",
  "botHealth",
  "decisions",
  "status",
  "reviewReadiness",
  "history",
  "entitlements",
];

export type RevalidateState = Record<RevalidateKey, number>;

const initialState: RevalidateState = REVALIDATE_KEYS.reduce((acc, key) => {
  acc[key] = 0;
  return acc;
}, {} as RevalidateState);

export const revalidateSlice = createSlice({
  name: "revalidate",
  initialState,
  reducers: {
    /** Mark one or more resources stale. Duplicates in the list are fine —
     *  each key is bumped once per call, not once per mention, so a trigger
     *  that names `positions` twice does not cause two refetches. */
    revalidate: (state, action: PayloadAction<RevalidateKey[]>) => {
      const seen = new Set(action.payload);
      seen.forEach((key) => {
        if (key in state) state[key] += 1;
      });
    },
    /** Everything. For a book change, where nothing on screen still applies. */
    revalidateAll: (state) => {
      REVALIDATE_KEYS.forEach((key) => {
        state[key] += 1;
      });
    },
  },
});

export const { revalidate, revalidateAll } = revalidateSlice.actions;
export default revalidateSlice.reducer;
