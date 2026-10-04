import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import useSiteTheme from "../../lib/hooks/useSiteTheme";
import useUserStore from "../../lib/hooks/useUserStore";
import { useHydration } from "../../lib/hooks/useHydration";
import { signInPath } from "../../lib/authRedirect";
import BrandLogo from "./BrandLogo";

/**
 * Light/dark toggle. Renders both icons and lets CSS show the right one based
 * on `<html data-site-theme>` — avoids an SSR/hydration icon mismatch and the
 * flash that a JS-decided icon would cause.
 */
function ThemeToggle({
  className,
  withLabel = false,
  onToggle,
}: {
  className: string;
  withLabel?: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className={className}
      aria-label="Switch between light and dark theme"
      onClick={onToggle}
    >
      <svg
        className="pub-i-sun"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="4.2" />
        <path d="M12 2.6v2.4M12 19v2.4M4.4 4.4l1.7 1.7M17.9 17.9l1.7 1.7M2.6 12H5M19 12h2.4M4.4 19.6l1.7-1.7M17.9 6.1l1.7-1.7" />
      </svg>
      <svg
        className="pub-i-moon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.5 14.5A8.6 8.6 0 019.5 3.5a8.6 8.6 0 1011 11z" />
      </svg>
      {withLabel && <span>Theme</span>}
    </button>
  );
}

export type PublicNavKey =
  | "home"
  | "candleai"
  | "academy"
  | "pricing"
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
  { label: "Pricing", href: "/pricing", key: "pricing" },
  { label: "Docs", href: "/docs", key: "docs" },
  { label: "Blog", href: "/blog", key: "blog" },
  // { label: "About", href: "/about", key: "about" },
];

/**
 * Signed-in replacement for the "Log in" + CTA pair.
 *
 * The session lives in a persisted zustand store (localStorage), so the server
 * cannot know about it. The caller only renders this once `useHydration()` is
 * true, which keeps the first client paint identical to the SSR markup.
 */
function AccountMenu({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const initials =
    (name || "")
      .split(/[\s_@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "ME";

  return (
    <div className="pub-acct" ref={boxRef}>
      <button
        type="button"
        className="pub-avatar"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${name || "your account"}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true">{initials}</span>
      </button>
      {open && (
        <div className="pub-acctpop" role="menu">
          <p className="pub-acctwho">
            <b>{name || "Signed in"}</b>
            <span>Signed in</span>
          </p>
          <Link href="/dashboard" role="menuitem" onClick={() => setOpen(false)}>
            Dashboard
          </Link>
          <Link href="/dashboard/tutor" role="menuitem" onClick={() => setOpen(false)}>
            Academy
          </Link>
          <button type="button" role="menuitem" className="pub-acctout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function PublicHeader({
  active,
  announcement = "Your keys, your exchange. Candleweb never holds your funds.",
  cta,
  onLogin,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [stuck, setStuck] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [headH, setHeadH] = useState(0);
  const headRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => setMenuOpen(false);
  const { toggle: toggleTheme } = useSiteTheme();

  /* Session. `hydrated` gates the swap so the first client render still matches
     the static HTML — the store only exists in localStorage. */
  const router = useRouter();
  const hydrated = useHydration();
  const { user, removeUser } = useUserStore((state: any) => state);
  const signedIn = hydrated && !!user && Object.keys(user).length > 0;
  const accountName = user?.username || user?.first_name || user?.email || "";

  const signOut = () => {
    removeUser();
    closeMenu();
    router.push("/");
  };

  /* Logged out, no override: go to /login and come back to this page after. */
  const loginHref = signInPath(router.asPath || "");

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

  // The header is fixed (sticky is unreliable inside the clipped card shell on
  // mobile Safari). This measures it so a spacer can reserve the same height.
  useEffect(() => {
    const el = headRef.current;
    if (!el) return;
    const measure = () => setHeadH(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Lock the page while the mobile menu is open — no scrolling the background,
  // no content bleeding through.
  useEffect(() => {
    if (!menuOpen) return;
    const root = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevRoot = root.style.overflow;
    document.body.style.overflow = "hidden";
    root.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      root.style.overflow = prevRoot;
    };
  }, [menuOpen]);

  return (
    <>
      <div className={`pub-announcement ${menuOpen ? "pub-hide-m" : ""}`}>
        {announcement}
      </div>
      <div
        className={`pub-wrap pub-nav-wrap ${
          stuck && !menuOpen ? "is-stuck" : ""
        } ${menuOpen ? "menu-open" : ""}`}
      >
        <nav className="pub-nav" aria-label="Main navigation">
          <Link href="/" className="pub-brand" onClick={closeMenu}>
            <BrandLogo className="pub-logo" height={18} priority />
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
            {signedIn ? (
              <>
                <Link href="/dashboard" onClick={closeMenu}>
                  Dashboard
                </Link>
                <Link href="/dashboard/tutor" onClick={closeMenu}>
                  Academy
                </Link>
                <button className="pub-m-login" onClick={signOut}>
                  Sign out
                </button>
              </>
            ) : onLogin ? (
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
              <Link href={loginHref} className="pub-m-login" onClick={closeMenu}>
                Log in
              </Link>
            )}
            <ThemeToggle
              className="pub-m-theme"
              withLabel
              onToggle={toggleTheme}
            />
          </div>
          <div className="pub-nav-end">
            <ThemeToggle className="pub-theme" onToggle={toggleTheme} />
            {signedIn ? (
              <AccountMenu name={accountName} onSignOut={signOut} />
            ) : (
              <>
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
                    href={loginHref}
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
              </>
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
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span aria-hidden="true">↑</span>
      </button>
    </>
  );
}
