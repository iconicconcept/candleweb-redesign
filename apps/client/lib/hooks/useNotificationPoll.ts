"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import notificationService from "../../services/notificationService";
import useAxiosAuth from "./useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";

/**
 * Keeps the header bell's unread count live.
 *
 * Before this, nothing in the dashboard chrome ever re-read notifications.
 * `DashboardShell` fetches once on mount and only when the store is empty
 * (`Object.keys(notification).length < 1`) with an empty dep array, so once
 * the persisted slice had anything in it the bell never updated again — the
 * count only moved when something else happened to dispatch the same thunk
 * (`tradeService`, `subscriptionService`) or when the user opened the full
 * Notifications page, which fetches unconditionally. That is exactly the
 * "I only see it after visiting the notifications page" symptom.
 *
 * `/notification/unread/` is a plain GET with no cursor, so this is a poll.
 * At 4s that is ~900 requests an hour per open tab, which is why the guards
 * below matter more than the interval itself:
 *
 *  - a hidden tab polls nothing, and fetches once the moment it comes back,
 *    so returning to the tab is instant rather than up to 4s stale;
 *  - one request at a time — a slow reply never stacks up a queue;
 *  - nothing runs without a usable token, which is also what stops the poll
 *    after a session ends: `useRefreshToken` tears the session down on a
 *    rejected refresh cookie and the Authorization header goes back to
 *    "Bearer undefined", which this guard reads as "not signed in";
 *  - it stays off on the Notifications page itself. That page paginates
 *    through the SAME store slice (`setNotification` replaces it wholesale),
 *    so a background poll for page 1 would silently yank a user reading
 *    page 3 back to the first page's rows. It does its own fetching and
 *    refetches after every action, so there is nothing to add there.
 *
 * A failed poll is deliberately silent: the next tick retries, and a toast
 * every 4s on a flaky connection would be worse than a stale badge.
 */
export const NOTIFICATION_POLL_MS = 4000;

/** The one route that owns this slice's pagination — see the note above. */
const SELF_FETCHING_ROUTES = ["/dashboard/notifications"];

export default function useNotificationPoll(paused = false) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const router = useRouter();
  const inFlight = useRef(false);

  const ownsItsOwnFetch = SELF_FETCHING_ROUTES.includes(router.pathname);

  const poll = useCallback(async () => {
    if (inFlight.current) return;
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    if (typeof document !== "undefined" && document.hidden) return;
    inFlight.current = true;
    try {
      await dispatch(notificationService.getNotifications({ api: axiosToken })).unwrap();
    } catch {
      /* silent on purpose — see the note above */
    } finally {
      inFlight.current = false;
    }
  }, [axiosToken, dispatch]);

  useEffect(() => {
    if (paused || ownsItsOwnFetch) return;
    if (!isAuthorizationHeaderSet(axiosToken)) return;

    const timer = setInterval(poll, NOTIFICATION_POLL_MS);
    const onVisibility = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [paused, ownsItsOwnFetch, axiosToken, poll]);
}
