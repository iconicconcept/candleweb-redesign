import Head from "next/head";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getTimeAgo } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import notificationService from "../../services/notificationService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import { BellIcon, CheckIcon, SearchIcon } from "../../components/dashboard/focus/icons";

const PAGE_SIZE = 10;

/* Matches the design's "Today / Yesterday / Earlier" row grouping (`.fx-nday`)
   — computed from the real `created_at` on each notification, not the mock
   data's hand-picked buckets. */
const dayBucket = (date?: Date | string) => {
  if (!date) return "Earlier";
  const d = new Date(date);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return "Earlier";
};

export default function NotificationsDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { notification } = useSelector((state: RootState) => state.notification);

  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [cat, setCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const fetchedTokenRef = useRef<string | null>(null);
  const apiRef = useRef(axiosToken);
  apiRef.current = axiosToken;

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    const token = useUserStore.getState().user?.access_token;
    if (fetchedTokenRef.current === token) return;
    fetchedTokenRef.current = token || null;
    dispatch(notificationService.getNotifications({ api: axiosToken }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  const results = useMemo(() => notification?.results ?? [], [notification]);
  const total = notification?.count ?? results.length;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const unreadOnPage = results.filter((r) => !r.is_read);

  const categories = useMemo(() => {
    const set = new Set<string>();
    results.forEach((r) => r.notification_type && set.add(r.notification_type));
    return Array.from(set);
  }, [results]);

  const visible = results.filter((r) => {
    if (filter === "unread" && r.is_read) return false;
    if (cat !== "all" && r.notification_type !== cat) return false;
    if (query) {
      const hay = `${r.notification_type ?? ""} ${r.message ?? ""}`.toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });

  const refetch = () =>
    dispatch(notificationService.getNotifications({ api: apiRef.current, page }));

  const markRead = (id?: number) => {
    if (id == null) return;
    dispatch(notificationService.getMarkNotificationRead({ api: axiosToken, id })).then(refetch);
  };

  const markAllRead = async () => {
    if (!unreadOnPage.length || busy) return;
    setBusy(true);
    try {
      for (const n of unreadOnPage) {
        if (n.id == null) continue;
        await dispatch(
          notificationService.getMarkNotificationRead({ api: axiosToken, id: n.id }),
        ).unwrap();
      }
      await refetch();
    } catch (err) {
      console.error(err);
    } finally {
      setBusy(false);
    }
  };

  const clearAll = () => dispatch(notificationService.clearAllNotification(axiosToken));

  const goToPage = (next: number) => {
    if (next < 1 || next > pageCount || next === page) return;
    setPage(next);
    dispatch(notificationService.getNotifications({ api: axiosToken, page: next }));
  };

  return (
    <>
      <Head>
        <title>Notifications | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="notifications">
        <TopBar
          crumb="Dashboard / Notifications"
          title="Notifications"
          subtitle="Everything Candleweb has told you, and the handful of things still waiting on you."
        />

        <div className="fx-cap2 rv d1">
          <div className="fx-cp">
            <span>Unread</span>
            <b className="am6">{unreadOnPage.length}</b>
            <i>{unreadOnPage.length ? "on this page" : "nothing outstanding"}</i>
          </div>
          <div className="fx-cp">
            <span>Total</span>
            <b>{total}</b>
            <i>notifications kept</i>
          </div>
          <div className="fx-cp">
            <span>Showing</span>
            <b>{visible.length}</b>
            <i>
              page {page} of {pageCount}
            </i>
          </div>
        </div>

        <section className="fx-sec">
          <div className="fx-nctl">
            <div className="fx-search">
              <SearchIcon />
              <input
                type="search"
                placeholder="Search notifications"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="fx-tabs2">
              <button
                type="button"
                className={`fx-tab2 ${filter === "all" ? "on" : ""}`}
                onClick={() => setFilter("all")}
              >
                All <em>{results.length}</em>
              </button>
              <button
                type="button"
                className={`fx-tab2 ${filter === "unread" ? "on" : ""}`}
                onClick={() => setFilter("unread")}
              >
                Unread <em>{unreadOnPage.length}</em>
              </button>
            </div>
            {unreadOnPage.length > 0 && (
              <button className="fx-link" type="button" disabled={busy} onClick={markAllRead}>
                {busy ? "Marking…" : "Mark all read"}
              </button>
            )}
          </div>

          {categories.length > 1 && (
            <div className="fx-cats">
              <button
                type="button"
                className={`fx-mini ${cat === "all" ? "go" : ""}`}
                onClick={() => setCat("all")}
              >
                Everything
              </button>
              {categories.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`fx-mini ${cat === c ? "go" : ""}`}
                  onClick={() => setCat(c)}
                >
                  {c}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: 6 }}>
            {visible.length === 0 ? (
              <div className="fx-nempty2">
                <i>
                  <CheckIcon />
                </i>
                <b>{query || cat !== "all" ? "Nothing matches that" : "Nothing here"}</b>
                <p>
                  {query || cat !== "all"
                    ? "Try a shorter search, or a different category."
                    : filter === "unread"
                      ? "Every notification has been read. Nothing was deleted."
                      : "You have no notifications right now."}
                </p>
              </div>
            ) : (
              visible.map((n, i) => {
                const bucket = dayBucket(n.created_at);
                const showHeader = i === 0 || dayBucket(visible[i - 1].created_at) !== bucket;
                return (
                  <React.Fragment key={n.id}>
                    {showHeader && <div className="fx-nday">{bucket}</div>}
                    <div className={`fx-nrow ${!n.is_read ? "unread9" : ""}`}>
                      <span className="fx-ni">
                        <BellIcon />
                      </span>
                      <div className="fx-nmain">
                        <div className="fx-nhead">
                          {!n.is_read && <i className="fx-nudot" />}
                          <b>{n.notification_type || "Notification"}</b>
                          {n.notification_type && <span className="fx-ncat">{n.notification_type}</span>}
                        </div>
                        <p>{n.message}</p>
                        <div className="fx-nfoot">
                          {n.created_at && <time>{getTimeAgo(n.created_at)}</time>}
                          {!n.is_read && (
                            <button className="fx-mini" type="button" onClick={() => markRead(n.id)}>
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })
            )}
          </div>

          {pageCount > 1 && (
            <div className="fx-pager">
              <span>
                Page {page} of {pageCount}
              </span>
              <button
                className="fx-pg"
                type="button"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 5l-7 7 7 7" />
                </svg>
              </button>
              <button
                className="fx-pg"
                type="button"
                aria-label="Next page"
                disabled={page >= pageCount}
                onClick={() => goToPage(page + 1)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}

          {results.length > 0 && (
            <button
              className="fx-mini"
              type="button"
              style={{ marginTop: 16 }}
              onClick={clearAll}
            >
              Clear all notifications
            </button>
          )}
        </section>

        <div className="fx-caveat">
          <i>ⓘ</i>
          <p>
            <b>What we don&rsquo;t do.</b> Candleweb never messages you about a deposit, a bonus, or a
            link you need to click urgently. If you get something like that claiming to be us, it
            isn&rsquo;t — and no notice from us will ever ask for your API secret or your password.
          </p>
        </div>
      </DashboardShell>
    </>
  );
}
