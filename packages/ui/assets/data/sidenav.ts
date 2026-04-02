import { SvgIcons } from "../..";

export const sideNav: {
  title: string;
  icon: any;
  route: string;
}[] = [
  {
    title: "Portfolio",
    icon: SvgIcons.portfolio,
    route: "/dashboard",
  },
  {
    title: "Trades",
    icon: SvgIcons.trades,
    route: "/dashboard/trades",
  },
  {
    title: "Notifications",
    icon: SvgIcons.sideNotification,
    route: "/dashboard/notifications",
  },
  {
    title: "Subscription",
    icon: SvgIcons.subscription,
    route: "/dashboard/subscription",
  },
  {
    title: "Tutor",
    icon: SvgIcons.tutor,
    route: "/dashboard/tutor",
  },
  {
    title: "Invite & Earn",
    icon: SvgIcons.invite,
    route: "/dashboard/invite",
  },
  {
    title: "Daily Task",
    icon: SvgIcons.tasks,
    route: "/dashboard/tasks",
  },
  {
    title: "Settings",
    icon: SvgIcons.settingIcon,
    route: "/dashboard/settings",
  },
];
