import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export type PublicNavKey =
  | "home"
  | "candleai"
  | "academy"
  | "docs"
  | "blog"
  | "about";

type Props = {
  /** Highlights the matching item in the nav. */
  active?: PublicNavKey;
  /** Copy shown in the announcement bar above the nav. */
  announcement?: React.ReactNode;
  /**
   * Primary (amber) call-to-action button. Defaults to "Get Started" → /register.
   * Pass `href` for a link or `onClick` for a handler.
   */
  cta?: { label: string; href?: string; onClick?: () => void };
  /**
   * Overrides the "Log in" button behaviour. When omitted, it links to /login.
   */
  onLogin?: () => void;
};

const NAV_LINKS: { label: string; href: string; key: PublicNavKey }[] = [
  { label: "Bring your bot", href: "/", key: "home" },
  { label: "CandleAI", href: "/candleai", key: "candleai" },
  { label: "Academy", href: "/tutor", key: "academy" },
  { label: "Docs", href: "/docs", key: "docs" },
  { label: "Blog", href: "/blog", key: "blog" },
  { label: "About", href: "/about", key: "about" },
];

export default function PublicHeader({
  active,
  announcement = "Your keys, your exchange. Candleweb never holds your funds.",
  cta,
  onLogin,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setStuck(y > 24);
      setShowTop(y > 700);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className={`pub-announcement ${menuOpen ? "pub-hide-m" : ""}`}>
        {announcement}
      </div>
      <div
        className={`pub-wrap pub-nav-wrap ${stuck ? "is-stuck" : ""}`}
      >
        <nav className="pub-nav" aria-label="Main navigation">
          <Link href="/" className="pub-brand" onClick={closeMenu}>
            <Image
              src="/logo.png"
              alt="Candleweb"
              width={136}
              height={18}
              className="pub-logo"
              priority
            />
          </Link>
          <div className={`pub-nav-mid ${menuOpen ? "is-open" : ""}`}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={active === link.key ? "here" : ""}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            ))}
            {onLogin ? (
              <button
                className="pub-m-login"
                onClick={() => {
                  closeMenu();
                  onLogin();
                }}
              >
                Log in
              </button>
            ) : (
              <Link href="/login" className="pub-m-login" onClick={closeMenu}>
                Log in
              </Link>
            )}
          </div>
          <div className="pub-nav-end">
            {onLogin ? (
              <button
                className="pub-btn pub-btn-glass pub-login"
                onClick={() => {
                  closeMenu();
                  onLogin();
                }}
              >
                Log in
              </button>
            ) : (
              <Link
                href="/login"
                className="pub-btn pub-btn-glass pub-login"
                onClick={closeMenu}
              >
                Log in
              </Link>
            )}
            {cta?.onClick ? (
              <button
                className="pub-btn pub-btn-amber"
                onClick={() => {
                  closeMenu();
                  cta.onClick?.();
                }}
              >
                {cta.label} <span>↗</span>
              </button>
            ) : (
              <Link
                href={cta?.href || "/register"}
                className="pub-btn pub-btn-amber"
                onClick={closeMenu}
              >
                {cta?.label || "Get Started"} <span>↗</span>
              </Link>
            )}
            <button
              className="pub-menu"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <i />
            </button>
          </div>
        </nav>
      </div>

      <button
        type="button"
        className={`pub-totop ${showTop && !menuOpen ? "is-on" : ""}`}
        aria-label="Back to top"
        aria-hidden={!showTop || menuOpen}
        tabIndex={showTop && !menuOpen ? 0 : -1}
        onClick={() =>
          window.scrollTo({ top: 0, behavior: "smooth" })
        }
      >
        <span aria-hidden="true">↑</span>
      </button>
    </>
  );
}
