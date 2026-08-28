import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { error } from "../alert/Toast";
import useEthereum from "../../lib/hooks/useEthereum";
import useUserStore from "../../lib/hooks/useUserStore";
import { loginUser } from "../../utils/loginUser";

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
   * Overrides the "Log in" button behaviour. When omitted, the wallet-connect
   * login flow is used (home / about / blog).
   */
  onLogin?: () => void;
};

const NAV_LINKS: { label: string; href: string; key: PublicNavKey }[] = [
  { label: "Bring your bot", href: "/", key: "home" },
  { label: "CandleAI", href: "/candleai", key: "candleai" },
  { label: "Academy", href: "/tutor", key: "academy" },
  { label: "Docs", href: "/whitepaper.pdf", key: "docs" },
  { label: "Blog", href: "/blog", key: "blog" },
  { label: "About", href: "/about", key: "about" },
];

export default function PublicHeader({
  active,
  announcement = "Your keys, your exchange. Candleweb never holds your funds.",
  cta,
  onLogin,
}: Props) {
  const router = useRouter();
  const { connectWallet } = useEthereum();
  const { setUser } = useUserStore((state) => state);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const walletLogin = async () => {
    try {
      const result = await connectWallet();
      if (!result) return;
      await loginUser({
        wallet: result.walletAddress,
        signerPassword: result.signMessage,
        setIsLoading,
        onSuccess: (value, type) =>
          type === "success"
            ? (setUser(value), router.push("/dashboard"))
            : router.push("/register"),
      });
    } catch (loginError) {
      error(String(loginError));
    }
  };
  const login = onLogin || walletLogin;
  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <div className="pub-announcement">{announcement}</div>
      <div className="pub-wrap pub-nav-wrap">
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
          </div>
          <div className="pub-nav-end">
            <button
              className="pub-btn pub-btn-glass pub-login"
              onClick={login}
              disabled={isLoading}
            >
              Log in
            </button>
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
    </>
  );
}
