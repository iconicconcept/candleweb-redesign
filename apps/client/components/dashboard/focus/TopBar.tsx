import Link from "next/link";
import { useRouter } from "next/router";
import { useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import useUserStore from "../../../lib/hooks/useUserStore";
import useDashboardTheme from "../../../lib/hooks/useDashboardTheme";
import notificationService from "../../../services/notificationService";
import { setCurrentPlan, setSubscription, setSubscriptionHistory } from "../../../redux/slices/subscriptionSlice";
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
import Popover from "./Popover";
import Dialog from "./Dialog";
import { BellIcon, SignOutIcon, CheckIcon, SunIcon, MoonIcon } from "./icons";

type Props = {
  crumb?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
};

const ACCOUNT_LINKS = [
  { label: "Portfolio", href: "/dashboard" },
  { label: "Trades", href: "/dashboard/trades" },
  { label: "Subscription", href: "/dashboard/subscription" },
  { label: "Invite & earn", href: "/dashboard/invite" },
  { label: "Academy", href: "/dashboard/tutor" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default function TopBar({ crumb, title, subtitle }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const axiosToken = useAxiosAuth();
  const { user, removeUser } = useUserStore((state) => state);
  const { notification } = useSelector((state: RootState) => state.notification);
  const { theme, toggle: toggleTheme } = useDashboardTheme();

  const [openPop, setOpenPop] = useState<"notif" | "account" | null>(null);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const bellRef = useRef<HTMLButtonElement>(null);
  const meRef = useRef<HTMLButtonElement>(null);

  const results = notification?.results ?? [];
  const unread = results.filter((r) => !r.is_read);

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

  const clearAll = () => {
    dispatch(notificationService.clearAllNotification(axiosToken));
    setOpenPop(null);
  };

  const signOut = () => {
    removeUser();
    dispatch(setIsSuccessful(false));
    dispatch(setSubscription([]));
    dispatch(setExchangeRecord([]));
    dispatch(setNotification({}));
    dispatch(setUserRecord({}));
    dispatch(setUnsubscribedReferral({}));
    dispatch(setSubscribedReferral({}));
    dispatch(setSubscriptionHistory([]));
    dispatch(setActiveTrade([]));
    dispatch(setPortfolioTrade({}));
    dispatch(setYearList({}));
    dispatch(setYearAnalysis([]));
    dispatch(setCurrentPlan({}));
    dispatch(setBalance(""));
    router.push("/");
  };

  return (
    <>
      <div className="fx-top rv">
        <div>
          {crumb && <p className="fx-crumb">{crumb}</p>}
          <h1 className="fx-title" style={crumb ? undefined : { marginTop: 0 }}>
            {title}
          </h1>
          {subtitle && <p className="fx-sub3">{subtitle}</p>}
        </div>
        <div className="fx-tools">
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
            aria-label={unread.length ? `${unread.length} unread notifications` : "Notifications"}
            aria-expanded={openPop === "notif"}
            aria-haspopup="dialog"
            onClick={() => setOpenPop((v) => (v === "notif" ? null : "notif"))}
          >
            <BellIcon />
            {unread.length > 0 && (
              <span className="cnt9">{unread.length > 9 ? "9+" : unread.length}</span>
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
        title={<b>Notifications</b>}
        headerRight={
          results.length > 0 && (
            <button className="fx-link" type="button" onClick={clearAll}>
              Clear all
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
        <nav className="fx-accnav">
          {ACCOUNT_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="fx-an"
              onClick={() => setOpenPop(null)}
            >
              <span>{link.label}</span>
            </Link>
          ))}
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
