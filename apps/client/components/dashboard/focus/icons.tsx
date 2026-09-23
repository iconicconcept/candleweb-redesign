/* Shared icon set for the dashboard "focus" shell — kept as small stroke
   SVGs so every rebuilt dashboard page can pull from the same set. */
import type { SVGProps } from "react";

const base = (props: SVGProps<SVGSVGElement>) => ({
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  ...props,
});

export const GridIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const ChartIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 17l5-6 4 4 4-7 5 5" />
    <path d="M3 21h18" />
  </svg>
);

export const CardStackIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" />
  </svg>
);

export const BellIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M18 9a6 6 0 10-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M10.5 20a2 2 0 003 0" />
  </svg>
);

export const InviteIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="9" cy="9" r="4" />
    <path d="M2.5 20c.7-3 3-4.6 6.5-4.6s5.8 1.6 6.5 4.6" />
    <path d="M18 8v6M21 11h-6" />
  </svg>
);

export const TasksIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1.4" />
    <path d="M9 13l2 2 4-4" />
  </svg>
);

export const AcademyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 8l9-4 9 4-9 4-9-4z" />
    <path d="M7 11v5c0 1 2.5 2.5 5 2.5s5-1.5 5-2.5v-5" />
  </svg>
);

/* A real gear/cog — distinct from the sun/moon theme toggle it used to be
   mistaken for. */
export const GearIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const CheckIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 6.5 9.2 17.3 4 12.1" />
  </svg>
);

export const InfoIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </svg>
);

export const WarnIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 9v4.5" />
    <path d="M12 17.2h.01" />
    <path d="M10.3 4 2.5 17.9A2 2 0 0 0 4.2 21h15.6a2 2 0 0 0 1.7-3.1L13.7 4a2 2 0 0 0-3.4 0z" />
  </svg>
);

export const BadIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);

export const DocIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M14 3v5h5" />
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h9l5 5z" />
    <path d="M8 13h8M8 17h5" />
  </svg>
);

export const PlayIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10.2 8.6 15.6 12l-5.4 3.4z" />
  </svg>
);

export const LockIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4.5" y="10.5" width="15" height="9.5" rx="2.2" />
    <path d="M8.2 10.5V7.6a3.8 3.8 0 017.6 0v2.9" />
  </svg>
);

export const CalendarIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.4" />
    <path d="M8 3v4M16 3v4M3.5 10h17" />
  </svg>
);

export const SignOutIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M15 17l5-5-5-5" />
    <path d="M20 12H9" />
    <path d="M12 20H6a2 2 0 01-2-2V6a2 2 0 012-2h6" />
  </svg>
);

export const HeadsetIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 13v-1a8 8 0 0116 0v1" />
    <rect x="2.5" y="13" width="5" height="7" rx="2" />
    <rect x="16.5" y="13" width="5" height="7" rx="2" />
  </svg>
);

export const WalletIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="3" y="6" width="18" height="13" rx="2.6" />
    <path d="M3 10h18M16.5 14.5H18" />
  </svg>
);

export const ShieldIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 2.6l7.5 3.2v5.6c0 4.4-3.1 8.2-7.5 9.4-4.4-1.2-7.5-5-7.5-9.4V5.8z" />
    <path d="M9.3 12.2l1.9 1.9 3.6-3.8" />
  </svg>
);

export const TrashIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6" />
  </svg>
);

export const PlusIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const CopyIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="9" y="9" width="12" height="12" rx="2.4" />
    <path d="M6 15H5a2 2 0 01-2-2V5a2 2 0 012-2h8a2 2 0 012 2v1" />
  </svg>
);

export const ChevronDownIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 9l7 7 7-7" />
  </svg>
);

export const SwapIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h13l-3-3M20 17H7l3 3" />
  </svg>
);

export const SunIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="4.2" />
    <path d="M12 2.6v2.4M12 19v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.6 12H5M19 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
  </svg>
);

export const MoonIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20.5 14.5A8.6 8.6 0 019.5 3.5a8.6 8.6 0 1011 11z" />
  </svg>
);

export const CheckCircleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.2l2.4 2.4 4.6-4.9" />
  </svg>
);

export const BookIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 5.5A2 2 0 016 4h5v16H6a2 2 0 01-2-1.5z" />
    <path d="M20 5.5A2 2 0 0018 4h-5v16h5a2 2 0 002-1.5z" />
  </svg>
);

export const HelpIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.4a2.5 2.5 0 114 2.2c-.9.6-1.6 1-1.6 2M12 17h.01" />
  </svg>
);

export const HammerIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 20h16" />
    <path d="M6 20V9l6-5 6 5v11" />
    <path d="M10 20v-6h4v6" />
  </svg>
);

export const SearchIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </svg>
);

export const BotIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="8" width="16" height="12" rx="3" />
    <path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" />
  </svg>
);

export const RefreshIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M20 11A8 8 0 006.3 5.3L4 7.5" />
    <path d="M4 4v3.5H7.5" />
    <path d="M4 13a8 8 0 0013.7 5.7L20 16.5" />
    <path d="M20 20v-3.5H16.5" />
  </svg>
);

export const LedgerIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="3" width="16" height="18" rx="2.5" />
    <path d="M8 8h8M8 12h8M8 16h5" />
  </svg>
);

export const ClockIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.6" />
    <path d="M12 7.4V12l3 1.8" />
  </svg>
);

export const MoreIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="5" cy="12" r="1.5" />
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="19" cy="12" r="1.5" />
  </svg>
);
