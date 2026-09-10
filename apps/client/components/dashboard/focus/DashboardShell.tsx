import Link from "next/link";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import useUserStore from "../../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import notificationService from "../../../services/notificationService";
import CheckLogin from "../CheckLogin";
import AIAgentChat from "../AIAgentChat";
import {
  GridIcon,
  ChartIcon,
  CardStackIcon,
  BellIcon,
  InviteIcon,
  TasksIcon,
  AcademyIcon,
  GearIcon,
  BotIcon,
} from "./icons";
import Image from "next/image";
import { MdSettings } from "react-icons/md";

export type DashboardSection =
  | "portfolio"
  | "trades"
  | "bots"
  | "subscription"
  | "notifications"
  | "invite"
  | "tasks"
  | "academy"
  | "settings";

const RAIL: { key: DashboardSection; label: string; href: string; Icon: any }[] = [
  { key: "portfolio", label: "Overview", href: "/dashboard", Icon: GridIcon },
  { key: "trades", label: "My trades", href: "/dashboard/trades", Icon: ChartIcon },
  { key: "bots", label: "My bots", href: "/dashboard/bots", Icon: BotIcon },
  { key: "subscription", label: "Subscription", href: "/dashboard/subscription", Icon: CardStackIcon },
  { key: "academy", label: "Academy", href: "/dashboard/tutor", Icon: AcademyIcon },
  { key: "notifications", label: "Notifications", href: "/dashboard/notifications", Icon: BellIcon },
  { key: "invite", label: "Invite & earn", href: "/dashboard/invite", Icon: InviteIcon },
  { key: "tasks", label: "Daily tasks", href: "/dashboard/tasks", Icon: TasksIcon },
];

const MOBILE_TABS: { key: DashboardSection; label: string; href: string; Icon: any }[] = [
  { key: "portfolio", label: "Overview", href: "/dashboard", Icon: GridIcon },
  { key: "trades", label: "Trades", href: "/dashboard/trades", Icon: ChartIcon },
  { key: "bots", label: "Bots", href: "/dashboard/bots", Icon: BotIcon },
  { key: "academy", label: "Academy", href: "/dashboard/tutor", Icon: AcademyIcon },
  { key: "settings", label: "Settings", href: "/dashboard/settings", Icon: GearIcon },
];

type Props = {
  active: DashboardSection;
  children: React.ReactNode;
};

/**
 * Shared shell for the "dashboard-focus" redesign: icon rail (desktop) +
 * bottom tabs (mobile). Every dashboard page gets rebuilt onto this same
 * shell over time — Academy is first, so keep this generic.
 */
export default function DashboardShell({ active, children }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);
  const { notification } = useSelector((state: RootState) => state.notification);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    if (user && Object.keys(notification).length < 1) {
      dispatch(notificationService.getNotifications({ api: axiosToken }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <CheckLogin>
      <div className="fx-root">
        <div className="fx-app">
          <aside className="fx-rail">
            <div className="fx-rail-in">
              {/* <span className="fx-mark" /> */}
              <Image src={"/favicon.ico"} alt="Candleweb" width={32} height={32} />
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
              <Link
                href="/dashboard/settings"
                className={`fx-ic ${active === "settings" ? "on" : ""}`}
              >
                <MdSettings />
                <span className="tip">Settings</span>
              </Link>
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
        </nav>
      </div>
      <AIAgentChat />
    </CheckLogin>
  );
}
