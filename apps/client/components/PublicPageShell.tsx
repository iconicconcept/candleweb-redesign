import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import { error } from "./alert/Toast";
import useEthereum from "../lib/hooks/useEthereum";
import useUserStore from "../lib/hooks/useUserStore";
import { loginUser } from "../utils/loginUser";

type Props = {
  children: React.ReactNode;
  active?: "home" | "about" | "blog";
  className: string;
  footerDescription?: string;
  showFooter?: boolean;
};

const links = [
  ["Bring your bot", "/", "home"],
  ["Academy", "/tutor", ""],
  ["Blog", "/blog", "blog"],
  ["About", "/about", "about"],
];

export default function PublicPageShell({
  children,
  active,
  className,
  footerDescription = "Infrastructure for agentic trading - for people who build their own agents, and for those who would rather not. Built in Africa.",
  showFooter = true,
}: Props) {
  const router = useRouter();
  const { connectWallet } = useEthereum();
  const { setUser } = useUserStore((state) => state);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const login = async () => {
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
  const closeMenu = () => setMenuOpen(false);

  return (
    <main className={`${className} public-page-shell`}>
      <div className="public-page-aura" />
      <div className="public-page-grid" />
      <div className="public-page-announcement">
        Your keys, your exchange. Candleweb never holds your funds.
      </div>
      <div className="public-page-wrap">
        <nav className="public-page-nav" aria-label="Main navigation">
          <Link href="/" className="public-page-brand">
            <Image
              src="/logo.png"
              alt="Candleweb"
              width={136}
              height={18}
              priority
            />
          </Link>
          <div className={`public-page-links ${menuOpen ? "is-open" : ""}`}>
            {links.map(([label, href, key]) => (
              <Link
                key={label}
                href={href}
                className={active === key ? "here" : ""}
                onClick={closeMenu}
              >
                {label}
              </Link>
            ))}
            <Link href="/whitepaper.pdf" onClick={closeMenu}>
              Docs
            </Link>
          </div>
          <div className="public-page-actions">
            <button
              className="public-page-button public-page-glass public-page-login"
              onClick={login}
              disabled={isLoading}
            >
              Log in
            </button>
            <Link
              href="/register"
              className="public-page-button public-page-amber"
            >
              Get Started <span>↗</span>
            </Link>
            <button
              className="public-page-menu"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <i />
            </button>
          </div>
        </nav>
        {children}
      </div>
      {showFooter && (
        <footer className="public-page-footer public-page-wrap">
          <div className="public-page-footer-brand">
            <Link href="/" className="public-page-brand">
              <Image src="/logo.png" alt="Candleweb" width={136} height={18} />
            </Link>
            <p>{footerDescription}</p>
          </div>
          {[
            ["Product", "Bring your bot", "Dashboard", "What we run"],
            ["Learn", "Academy", "Docs", "API reference"],
            ["Company", "About", "Contact", "Status"],
            ["Legal", "Terms", "Privacy", "Risk disclosure"],
          ].map(([heading, ...items]) => (
            <div key={heading}>
              <h4>{heading}</h4>
              {items.map((item) => (
                <Link
                  key={item}
                  href={
                    item === "Dashboard"
                      ? "/dashboard"
                      : item === "About"
                        ? "/about"
                        : item === "Academy"
                          ? "/tutor"
                          : item === "Terms"
                            ? "/terms"
                            : item === "Privacy"
                              ? "/privacy"
                              : item === "Blog"
                                ? "/blog"
                                : "#"
                  }
                >
                  {item}
                </Link>
              ))}
            </div>
          ))}
          <p className="public-page-disclaimer">
            Candleweb is infrastructure for agentic trading, providing trade
            execution and monitoring. It is not an investment adviser, fund
            manager or broker, and it does not hold, pool or manage customer
            funds. Trading digital assets carries substantial risk. Nothing here
            is financial advice.
          </p>
        </footer>
      )}
    </main>
  );
}
