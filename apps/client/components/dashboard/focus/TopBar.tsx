import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import useUserStore from "../../../lib/hooks/useUserStore";
import useDashboardTheme from "../../../lib/hooks/useDashboardTheme";
import useNotificationPoll from "../../../lib/hooks/useNotificationPoll";
import notificationService from "../../../services/notificationService";
import { setCurrentPlan, setSubscription, setSubscriptionHistory } from "../../../redux/slices/subscriptionSlice";
import { resetSubscriptionV2 } from "../../../redux/slices/subscriptionV2Slice";
import { setExchangeRecord } from "../../../redux/slices/exchangeSlice";
import { setNotification } from "../../../redux/slices/notificationSlice";
import {
  setSubscribedReferral,
  setUnsubscribedReferral,
  setUserRecord,
} from "../../../redux/slices/referralSlice";
import { setActiveTrade, setPortfolioTrade, setYearAnalysis, setYearList } from "../../../redux/slices/tradeSlice";
import { setBalance } from "../../../redux/slices/userSlice";
import { setIsSuccessful } from "../../../redux/slices/authSlice";
import { success } from "../../alert/Toast";
import Popover from "./Popover";
import Dialog from "./Dialog";
import {
  BellIcon,
  SignOutIcon,
  CheckIcon,
  SunIcon,
  MoonIcon,
  GridIcon,
  CardStackIcon,
  InviteIcon,
  AcademyIcon,
  GearIcon,
} from "./icons";

type Props = {
  crumb?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  /* A page-specific control (e.g. Exchanges' "Sync all") that belongs in the
     header row next to the theme/notifications/account buttons — per the
     design, not floating inside the page body. Rendered first, before them. */
  actions?: React.ReactNode;
  /* Pages with their own hero header (bot detail's avatar+name block) render
     that heading themselves, matching the design's fx-top — which is just
     the crumb there, no h1/subtitle. */
  hideHeading?: boolean;
};

/* Secondary destinations — not in the icon rail. Notifications has its own
   bell; these live only here in the account popover. */
const ACCOUNT_LINKS: { label: string; href: string; Icon: any }[] = [
  { label: "Portfolio", href: "/dashboard", Icon: GridIcon },
  { label: "Subscription", href: "/dashboard/subscription", Icon: CardStackIcon },
  { label: "Invite & earn", href: "/dashboard/invite", Icon: InviteIcon },
  { label: "Academy", href: "/dashboard/tutor", Icon: AcademyIcon },
  { label: "Settings", href: "/dashboard/settings", Icon: GearIcon },
];

export default function TopBar({ crumb, title, subtitle, actions, hideHeading }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  /* Portfolio / Subscription / Invite & earn / Notifications have no icon-rail
     slot (by design — see DashboardShell's RAIL comment), so unlike every
     other dashboard page they had no "you are here" marker anywhere at all.
     The mockups mark the current row in this popover with `.fx-an.on` +
     aria-current; match that here off the route instead of threading a prop
     through every page, since only this component needs to know it. */
  const isAccountLinkActive = (href: string) =>
    href === "/dashboard" ? router.pathname === "/dashboard" : router.pathname.startsWith(href);
  const axiosToken = useAxiosAuth();
  const { user, removeUser } = useUserStore((state) => state);
  const { notification } = useSelector((state: RootState) => state.notification);
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange);
  const { theme, toggle: toggleTheme } = useDashboardTheme();

  const exCount = exchangeRecord?.length ?? user?.user_exchanges?.length ?? 0;

  const [openPop, setOpenPop] = useState<"notif" | "account" | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const meRef = useRef<HTMLButtonElement>(null);

  const results = notification?.results ?? [];
  const unread = results.filter((r) => !r.is_read);
  const unreadCount = unread.length;

  /* The bell is the only place an unread count is shown, so it is the thing
     that has to stay live. Paused while "mark all read" is looping its
     per-id calls, so a poll landing mid-loop can't repaint rows it is part
     way through clearing. */
  useNotificationPoll(markingAll);

  /* A count that changes while you are looking elsewhere on the page is easy
     to miss, so the badge replays its entrance animation when the number
     goes UP. Not on the way down — clearing one you just read shouldn't
     draw the eye back — and not on first paint, where nothing is new. */
  const [badgePop, setBadgePop] = useState(false);
  const lastUnread = useRef(unreadCount);
  useEffect(() => {
    const grew = unreadCount > lastUnread.current;
    lastUnread.current = unreadCount;
    if (!grew) return;
    setBadgePop(true);
    const t = setTimeout(() => setBadgePop(false), 460);
    return () => clearTimeout(t);
  }, [unreadCount]);

  const initials = useMemo(() => {
    const source = user?.username || user?.first_name || user?.email || "";
    return source.slice(0, 2).toUpperCase() || "CW";
  }, [user]);

  const markRead = (id?: number) => {
    if (id == null) return;
    dispatch(notificationService.getMarkNotificationRead({ api: axiosToken, id })).then(() =>
      dispatch(notificationService.getNotifications({ api: axiosToken })),
    );
  };

  /* Was wired to the delete-everything endpoint under a "Clear all" label —
     too destructive for a one-click action in a quick-glance dropdown, and
     not what the design calls for here (that stays a deliberate, opt-in
     action on the full Notifications page). This loops the same per-id
     mark-read call that page's own "Mark all read" uses — no bulk endpoint
     exists yet (see BACKEND_API_REQUESTS.md §2.2). */
  const markAllRead = async () => {
    if (!unread.length || markingAll) return;
    setMarkingAll(true);
    try {
      for (const n of unread) {
        if (n.id == null) continue;
        await dispatch(notificationService.getMarkNotificationRead({ api: axiosToken, id: n.id })).unwrap();
      }
      await dispatch(notificationService.getNotifications({ api: axiosToken }));
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingAll(false);
    }
  };

  const signOut = () => {
    setConfirmSignOut(false);
    removeUser();
    dispatch(setIsSuccessful(false));
    dispatch(setSubscription([]));
    dispatch(setExchangeRecord([]));
    dispatch(setNotification({}));
    dispatch(setUserRecord({}));
    dispatch(setUnsubscribedReferral({}));
    dispatch(setSubscribedReferral({}));
    dispatch(setSubscriptionHistory([]));
    dispatch(resetSubscriptionV2());
    dispatch(setActiveTrade([]));
    dispatch(setPortfolioTrade({}));
    dispatch(setYearList({}));
    dispatch(setYearAnalysis([]));
    dispatch(setCurrentPlan({}));
    dispatch(setBalance(""));
    success("Signed out. Your trades keep running on the exchange.");
    router.push("/");
  };

  return (
    <>
      <div className="fx-top rv">
        <div>
          {crumb && <p className="fx-crumb">{crumb}</p>}
          {!hideHeading && (
            <>
              <h1 className="fx-title" style={crumb ? undefined : { marginTop: 0 }}>
                {title}
              </h1>
              {subtitle && <p className="fx-sub3">{subtitle}</p>}
            </>
          )}
        </div>
        <div className="fx-tools">
          {actions}
          <button
            className="fx-btn"
            type="button"
            aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
            onClick={toggleTheme}
          >
            {theme === "light" ? <SunIcon /> : <MoonIcon />}
          </button>
          <button
            ref={bellRef}
            className="fx-btn"
            type="button"
            aria-label={unreadCount ? `${unreadCount} unread notifications` : "Notifications"}
            aria-expanded={openPop === "notif"}
            aria-haspopup="dialog"
            onClick={() => setOpenPop((v) => (v === "notif" ? null : "notif"))}
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className={badgePop ? "cnt9 pop" : "cnt9"} aria-hidden="true">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            ref={meRef}
            className="fx-me"
            type="button"
            aria-label="Account menu"
            aria-expanded={openPop === "account"}
            aria-haspopup="dialog"
            onClick={() => setOpenPop((v) => (v === "account" ? null : "account"))}
          >
            {initials}
          </button>
        </div>
      </div>

      <Popover
        open={openPop === "notif"}
        onClose={() => setOpenPop(null)}
        anchorRef={bellRef}
        label="Notifications"
        title={
          <div>
            <b>Notifications</b>
            <span
              style={{
                display: "block",
                fontFamily: "var(--mono)",
                fontSize: "9.5px",
                color: "var(--fx-t3)",
                marginTop: 5,
              }}
            >
              {unread.length ? `${unread.length} unread` : "You're up to date"}
            </span>
          </div>
        }
        headerRight={
          unread.length > 0 && (
            <button className="fx-link" type="button" disabled={markingAll} onClick={markAllRead}>
              {markingAll ? "Marking…" : "Mark all read"}
            </button>
          )
        }
        footer={
          <Link href="/dashboard/notifications" className="fx-mini" onClick={() => setOpenPop(null)}>
            Open all notifications
          </Link>
        }
      >
        {results.length === 0 ? (
          <div className="fx-nempty">
            <i>
              <CheckIcon />
            </i>
            <b>You&apos;re up to date</b>
            <p>Nothing new right now.</p>
          </div>
        ) : (
          results.slice(0, 8).map((n) => (
            <button
              key={n.id}
              type="button"
              className={`fx-nt ${!n.is_read ? "unread9" : ""}`}
              onClick={() => markRead(n.id)}
            >
              <span className="fx-ni">
                <BellIcon />
              </span>
              <span className="fx-nb">
                <b>{n.notification_type || "Notification"}</b>
                <span>{n.message}</span>
                {n.created_at && <em>{new Date(n.created_at).toLocaleString()}</em>}
              </span>
              <i className="fx-nd" />
            </button>
          ))
        )}
      </Popover>

      <Popover
        open={openPop === "account"}
        onClose={() => setOpenPop(null)}
        anchorRef={meRef}
        label="Account menu"
      >
        <div className="fx-acch">
          <span className="fx-pav2">{initials}</span>
          <div>
            <b>{user?.username || "Your account"}</b>
            <span>{user?.email || user?.wallet_address}</span>
          </div>
        </div>

        <div className="fx-accmeta">
          <span>{user?.is_live_mode ? "Live mode" : "Demo mode"}</span>
          <span>
            {exCount} exchange{exCount === 1 ? "" : "s"}
          </span>
        </div>

        <nav className="fx-accnav">
          {ACCOUNT_LINKS.map((link) => {
            const active = isAccountLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`fx-an ${active ? "on" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => setOpenPop(null)}
              >
                <link.Icon />
                <span>{link.label}</span>
              </Link>
            );
          })}
          <button
            className="fx-an"
            type="button"
            onClick={toggleTheme}
          >
            {theme === "light" ? <SunIcon /> : <MoonIcon />}
            <span>Appearance</span>
            <em>{theme === "light" ? "Light" : "Dark"}</em>
          </button>
          <button
            className="fx-an out9"
            type="button"
            onClick={() => {
              setOpenPop(null);
              setConfirmSignOut(true);
            }}
          >
            <SignOutIcon />
            <span>Sign out</span>
          </button>
        </nav>
      </Popover>

      <Dialog
        open={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        icon={<CheckIcon />}
        title="Sign out?"
        subtitle="Your trades don't stop when you do"
        labelledBy="signout-title"
        footer={
          <>
            <button className="fx-cta ghost2" type="button" onClick={() => setConfirmSignOut(false)}>
              Stay
            </button>
            <button className="fx-cta main2" type="button" onClick={signOut}>
              Sign out
            </button>
          </>
        }
      >
        <p className="fx-dwarn">
          Anything running keeps running. Candleweb talks to your exchange whether or not
          you&apos;re signed in — that&apos;s the point of it. Pause a trade if you want it to stop.
        </p>
      </Dialog>
    </>
  );
}
