import Link from "next/link";
import BrandLogo from "./BrandLogo";

type Props = {
  /** Short blurb under the logo. */
  description?: React.ReactNode;
  /** Legal disclaimer at the foot of the footer. */
  disclaimer?: React.ReactNode;
};

const COLUMNS: { heading: string; items: string[] }[] = [
  {
    heading: "Product",
    items: ["Bring your bot", "CandleAI", "Dashboard", "What we run"],
  },
  { heading: "Learn", items: ["Academy", "Docs", "API reference", "Blog"] },
  { heading: "Company", items: ["About", "Contact", "Status"] },
  { heading: "Legal", items: ["Terms", "Privacy", "Risk disclosure"] },
];

const HREFS: Record<string, string> = {
  "Bring your bot": "/",
  CandleAI: "/candleai",
  Dashboard: "/dashboard",
  Academy: "/tutor",
  Docs: "/docs",
  "API reference": "/docs",
  // About: "/about",
  Blog: "/blog",
  Terms: "/terms",
  Privacy: "/privacy",
};

const DEFAULT_DESCRIPTION =
  "Infrastructure for agentic trading - for people who build their own agents, and for those who would rather not. Built in Africa.";
const DEFAULT_DISCLAIMER =
  "Candleweb is infrastructure for agentic trading, providing trade execution and monitoring. It is not an investment adviser, fund manager or broker, and it does not hold, pool or manage customer funds. Trading digital assets carries substantial risk, including the total loss of your capital. Nothing here is financial advice.";

export default function PublicFooter({
  description = DEFAULT_DESCRIPTION,
  disclaimer = DEFAULT_DISCLAIMER,
}: Props) {
  return (
    <footer className="pub-footer pub-wrap">
      <div className="pub-footer-brand">
        <Link href="/" className="pub-brand">
          <BrandLogo className="pub-logo" height={18} />
        </Link>
        <p>{description}</p>
      </div>
      {COLUMNS.map((column) => (
        <div key={column.heading}>
          <h4>{column.heading}</h4>
          {column.items.map((item) => (
            <Link key={item} href={HREFS[item] || "#"}>
              {item}
            </Link>
          ))}
        </div>
      ))}
      <p className="pub-disclaimer">{disclaimer}</p>
    </footer>
  );
}
