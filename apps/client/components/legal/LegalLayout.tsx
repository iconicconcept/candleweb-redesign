import Link from "next/link";
import { useEffect, useState } from "react";
import PublicHeader from "../public/PublicHeader";
import PublicFooter from "../public/PublicFooter";

export type TocItem = { id: string; label: string };

type Props = {
  active: "terms" | "privacy";
  title: string;
  updated: string;
  effective?: string;
  intro: React.ReactNode;
  toc: TocItem[];
  children: React.ReactNode;
};

export default function LegalLayout({
  active,
  title,
  updated,
  effective = "Effective immediately",
  intro,
  toc,
  children,
}: Props) {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id || "");

  useEffect(() => {
    const headings = toc
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!headings.length) return;

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-15% 0px -75% 0px" },
    );
    headings.forEach((heading) => spy.observe(heading));
    return () => spy.disconnect();
  }, [toc]);

  return (
    <main className="legal-stage">
      <div className="legal-aura">
        <b className="b1" />
        <b className="b2" />
        <b className="b3" />
      </div>
      <div className="legal-grid" />

      <PublicHeader />

      <header className="landing-wrap legal-head" id="top">
        <p className="legal-eyebrow">Legal</p>
        <h1>{title}</h1>
        <div className="legal-meta">
          <span className="up">Last updated {updated}</span>
          <span>·</span>
          <span>{effective}</span>
        </div>
        <p className="legal-intro">{intro}</p>
        <div className="legal-toggle">
          <Link href="/terms" className={active === "terms" ? "on" : ""}>
            Terms
          </Link>
          <Link href="/privacy" className={active === "privacy" ? "on" : ""}>
            Privacy
          </Link>
        </div>
      </header>

      <div className="landing-wrap legal-grid-layout">
        <aside className="legal-toc">
          <span>On this page</span>
          {toc.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={activeId === item.id ? "is-active" : ""}
            >
              {item.label}
            </a>
          ))}
        </aside>
        <div className="legal-body">{children}</div>
      </div>

      <PublicFooter />
    </main>
  );
}
