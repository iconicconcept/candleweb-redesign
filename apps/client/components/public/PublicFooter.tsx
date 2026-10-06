import Link from "next/link";
import BrandLogo from "./BrandLogo";

type Props = {
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
  /* Commented out when About came off the nav pill — but the page is still
     there and the footer still lists it, so the link just went to "#". The
     footer is where someone looks for it once it has left the nav. */
  About: "/about",
  Blog: "/blog",
  Terms: "/terms",
  Privacy: "/privacy",
};

/* One line for the whole site. It used to be a `description` prop, and four
   pages passed their own — so the blurb under the logo changed as you moved
   between the landing page, CandleAI, pricing and the Academy, reading like
   four different companies. The landing page's wording is the one that stands
   for all of them, so it lives here and nowhere else. */
const DESCRIPTION = "Trading infrastructure for people who build their own bots.";
const DEFAULT_DISCLAIMER =
  "Candleweb is infrastructure for agentic trading, providing trade execution and monitoring. It is not an investment adviser, fund manager or broker, and it does not hold, pool or manage customer funds. Trading digital assets carries substantial risk, including the total loss of your capital. Nothing here is financial advice.";

export default function PublicFooter({ disclaimer = DEFAULT_DISCLAIMER }: Props) {
  return (
    <footer className="pub-footer pub-wrap">
      <div className="pub-footer-brand">
        <Link href="/" className="pub-brand">
          <BrandLogo className="pub-logo" height={18} />
        </Link>
        <p>{DESCRIPTION}</p>
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
