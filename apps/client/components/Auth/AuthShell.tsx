import Link from "next/link";
import React from "react";
import useSiteTheme from "../../lib/hooks/useSiteTheme";
import BrandLogo from "../public/BrandLogo";

/**
 * The chrome every auth page shares — log in, create account, verify email,
 * forgot password, reset password: the aura + grid backdrop, the header (logo,
 * theme toggle, the "New here? / Already have an account?" line) and the
 * footer. Pages supply the header's right-hand line and the two-column body.
 */
export default function AuthShell({
  ask,
  children,
}: {
  /** The prompt beside the theme toggle. Defaults to "New here? Create an account". */
  ask?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { toggle: toggleTheme } = useSiteTheme();

  return (
    <div className="auth-page">
      <div className="auth-aura">
        <b className="b1" />
        <b className="b2" />
        <b className="b3" />
      </div>
      <div className="auth-grid-tex" />

      <div className="auth-stage">
        <div className="auth-top">
          <Link href="/" className="auth-brand">
            <BrandLogo height={17} />
          </Link>
          <div className="auth-top-end">
            <button
              type="button"
              className="auth-theme"
              aria-label="Switch between light and dark theme"
              onClick={toggleTheme}
            >
              <svg
                className="auth-i-sun"
                width="17"
                height="17"
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
                className="auth-i-moon"
                width="17"
                height="17"
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
            </button>
            <p className="ask">
              {ask ?? (
                <>
                  New here? <Link href="/register">Create an account</Link>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="auth-layout">{children}</div>

        <div className="auth-foot">
          <span>© Candleweb</span>
          <div className="lk">
            <Link href="/">Help centre</Link>
            <Link href="mailto:support@candleweb.io">Contact support</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/** The left-hand walkthrough column (desktop only, like the login page). */
export function AuthAside({
  eyebrow,
  title,
  lede,
  steps,
  assure,
}: {
  eyebrow: string;
  title: string;
  lede: React.ReactNode;
  steps: { title: string; body: React.ReactNode }[];
  assure: React.ReactNode;
}) {
  return (
    <div className="auth-aside">
      <p className="auth-eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="lede">{lede}</p>
      <ol className="auth-flow">
        {steps.map((step, i) => (
          <li key={step.title}>
            <span className="n">{i + 1}</span>
            <div>
              <b>{step.title}</b>
              <span>{step.body}</span>
            </div>
          </li>
        ))}
      </ol>
      <p className="auth-assure">
        <i>✓</i>
        {assure}
      </p>
    </div>
  );
}

/* ---- small shared bits for the card ---- */

export const BackToLogin = () => (
  <Link className="auth-back" href="/login">
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M15 5l-7 7 7 7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
    Back to log in
  </Link>
);

export const ErrorIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M12 7v6M12 16.5v.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

export const OkIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
    <path
      d="M7.5 12.5l3 3 6-6.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const MailIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <rect x="3" y="5" width="18" height="14" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
    <path d="M3.5 7l8.5 6 8.5-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

export const DoneBadge = () => (
  <div className="auth-done-badge" aria-hidden="true">
    <svg width="34" height="34" viewBox="0 0 24 24">
      <path
        d="M5.5 12.5l4 4 9-9.5"
        fill="none"
        stroke="#06201A"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export const ArrowIcon = () => (
  <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <path
      d="M5 12h13M13 6l6 6-6 6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const AuthHelp = () => (
  <p className="auth-help">
    Still stuck? <a href="mailto:support@candleweb.io">Contact support</a>
  </p>
);

/** Shows the first two characters of the name: da•••@example.com */
export const maskEmail = (value: string) => {
  const at = value.indexOf("@");
  if (at < 1) return value;
  return value.slice(0, Math.min(2, at)) + "•••" + value.slice(at);
};
