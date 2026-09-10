import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import useUserStore from "../../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import notificationService from "../../../services/notificationService";
import exchangeServices from "../../../services/exchangeService";
import CheckLogin from "../CheckLogin";
import AIAgentChat from "../AIAgentChat";
import Popover from "./Popover";
import {
  GridIcon,
  ChartIcon,
  TasksIcon,
  AcademyIcon,
  GearIcon,
  BotIcon,
  LedgerIcon,
  SwapIcon,
  MoreIcon,
} from "./icons";
import Image from "next/image";

export type DashboardSection =
  | "portfolio"
  | "trades"
  | "bots"
  | "history"
  | "exchanges"
  | "subscription"
  | "notifications"
  | "invite"
  | "tasks"
  | "academy"
  | "settings";

type RailItem = { key: DashboardSection; label: string; href: string; Icon: any };

/* Primary sections only. Notifications live in the header bell; Subscription
   and Invite & earn live in the account popover — not in the rail. */
const RAIL: RailItem[] = [
  { key: "portfolio", label: "Overview", href: "/dashboard", Icon: GridIcon },
  { key: "trades", label: "My trades", href: "/dashboard/trades", Icon: ChartIcon },
  { key: "bots", label: "My bots", href: "/dashboard/bots", Icon: BotIcon },
  { key: "history", label: "History", href: "/dashboard/history", Icon: LedgerIcon },
  { key: "exchanges", label: "Exchanges", href: "/dashboard/exchanges", Icon: SwapIcon },
  { key: "tasks", label: "Daily tasks", href: "/dashboard/tasks", Icon: TasksIcon },
];

/* Sits below the spacer, at the foot of the rail. */
const RAIL_FOOT: RailItem[] = [
  { key: "academy", label: "Academy", href: "/dashboard/tutor", Icon: AcademyIcon },
  { key: "settings", label: "Settings", href: "/dashboard/settings", Icon: GearIcon },
];

/* Mobile keeps four primary tabs; everything else lives behind "More". */
const MOBILE_TABS: RailItem[] = [
  { key: "portfolio", label: "Overview", href: "/dashboard", Icon: GridIcon },
  { key: "trades", label: "Trades", href: "/dashboard/trades", Icon: ChartIcon },
  { key: "bots", label: "Bots", href: "/dashboard/bots", Icon: BotIcon },
  { key: "exchanges", label: "Exchanges", href: "/dashboard/exchanges", Icon: SwapIcon },
];

const MORE_LINKS: { key: DashboardSection; label: string; href: string; Icon: any }[] = [
  { key: "history", label: "History", href: "/dashboard/history", Icon: LedgerIcon },
  { key: "tasks", label: "Daily tasks", href: "/dashboard/tasks", Icon: TasksIcon },
  { key: "academy", label: "Academy", href: "/dashboard/tutor", Icon: AcademyIcon },
  { key: "settings", label: "Settings", href: "/dashboard/settings", Icon: GearIcon },
];

type Props = {
  active: DashboardSection;
  children: React.ReactNode;
};

/**
 * Shared shell for the "dashboard-focus" redesign: floating icon rail (desktop)
 * + floating bottom tab bar with a "More" sheet (mobile).
 */
export default function DashboardShell({ active, children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);
  const { notification } = useSelector((state: RootState) => state.notification);
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange);

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const moreActive = MORE_LINKS.some((l) => l.key === active);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    if (user && Object.keys(notification).length < 1) {
      dispatch(notificationService.getNotifications({ api: axiosToken }));
    }
    // powers the account-menu meta chips (exchange count)
    if (!exchangeRecord || exchangeRecord.length === 0) {
      dispatch(exchangeServices.getExchangeRecords(axiosToken));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CheckLogin>
      <div className="fx-root">
        <div className="fx-app">
          <aside className="fx-rail">
            <div className="fx-rail-in">
              <Link href="/dashboard" className="fx-mark-link" aria-label="Candleweb">
                <Image src={"/favicon.ico"} alt="Candleweb" width={26} height={26} />
              </Link>
              {RAIL.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`fx-ic ${active === item.key ? "on" : ""}`}
                >
                  <item.Icon />
                  <span className="tip">{item.label}</span>
                </Link>
              ))}
              <span className="sp" />
              {RAIL_FOOT.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className={`fx-ic ${active === item.key ? "on" : ""}`}
                >
                  <item.Icon />
                  <span className="tip">{item.label}</span>
                </Link>
              ))}
            </div>
          </aside>
          <main className="fx-main">{children}</main>
        </div>

        <nav className="fx-tabs">
          {MOBILE_TABS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={active === item.key ? "on" : ""}
            >
              <item.Icon />
              {item.label}
            </Link>
          ))}
          <button
            ref={moreRef}
            type="button"
            className={moreActive ? "on" : ""}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            onClick={() => setMoreOpen((v) => !v)}
          >
            <MoreIcon />
            More
          </button>
        </nav>
      </div>

      <Popover
        open={moreOpen}
        onClose={() => setMoreOpen(false)}
        anchorRef={moreRef}
        label="More"
        title={<b>More</b>}
      >
        <nav className="fx-accnav" style={{ borderTop: 0 }}>
          {MORE_LINKS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`fx-an ${active === item.key ? "on" : ""}`}
              onClick={() => setMoreOpen(false)}
            >
              <item.Icon />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </Popover>

      <AIAgentChat />
    </CheckLogin>
  );
}
