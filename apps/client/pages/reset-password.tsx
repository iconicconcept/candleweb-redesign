import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import AuthShell, {
  ArrowIcon,
  AuthAside,
  AuthHelp,
  BackToLogin,
  DoneBadge,
  ErrorIcon,
  OkIcon,
} from "../components/Auth/AuthShell";
import useUserStore from "../lib/hooks/useUserStore";
import accountService, { ApiFailure, PASSWORD_RULES, RESET_LINK_EXPIRY } from "../services/accountService";
/* eslint-disable react/no-unescaped-entities */

/* Opened from the email link: /reset-password#token=XXXX
   The API has no "is this link still good?" check, so an expired or used link
   is found out on submit (LINK_EXPIRED) and swaps in the expired screen. */

type Step = "set" | "done" | "expired";

const RULES = [
  { id: "len", text: `${PASSWORD_RULES.minLength}+ characters`, test: (v: string) => v.length >= PASSWORD_RULES.minLength },
  ...(PASSWORD_RULES.requireMixedCase
    ? [{ id: "case", text: "Upper and lower case", test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) }]
    : []),
  ...(PASSWORD_RULES.requireNumber ? [{ id: "num", text: "A number", test: (v: string) => /\d/.test(v) }] : []),
  ...(PASSWORD_RULES.requireSymbol
    ? [{ id: "sym", text: "A symbol (!@#…)", test: (v: string) => /[^A-Za-z0-9]/.test(v) }]
    : []),
];

const LEVELS = [
  { label: "—", color: "" },
  { label: "Weak", color: "var(--au-red)" },
  { label: "Fair", color: "var(--au-amber)" },
  { label: "Good", color: "var(--au-teal)" },
  { label: "Strong", color: "var(--au-teal)" },
];

export default function ResetPasswordPage() {
  const router = useRouter();
  const { setUser } = useUserStore((state) => state);

  const [token, setToken] = useState("");
  const [step, setStep] = useState<Step>("set");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  const pwRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);
  const expiredRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (!router.isReady) return;
    /* The email links to /reset-password#token=… — a fragment never reaches
       the server, logs or analytics. ?token= is accepted too, just in case. */
    const fromHash = new URLSearchParams(window.location.hash.replace(/^#/, "")).get("token") || "";
    const fromQuery = typeof router.query.token === "string" ? router.query.token : "";
    const t = fromHash || fromQuery;
    if (!t) {
      setStep("expired");
      return;
    }
    setToken(t);
    /* Keep the token in memory only: take it out of the address bar so it
       isn't left in history or copied along with the URL. */
    window.history.replaceState(window.history.state, "", window.location.pathname);
    pwRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const show = (next: Step) => {
    setStep(next);
    requestAnimationFrame(() => (next === "done" ? doneRef : expiredRef).current?.focus());
  };

  const results = useMemo(() => RULES.map((r) => ({ ...r, met: r.test(pw) })), [pw]);
  const metCount = results.filter((r) => r.met).length;
  const allMet = metCount === RULES.length;

  /* Share of rules met, plus a bonus for length. */
  let score = 0;
  if (pw.length) {
    score = Math.max(1, Math.round((metCount / RULES.length) * 3));
    if (allMet && pw.length >= Math.max(12, PASSWORD_RULES.minLength + 4)) score = 4;
    if (!allMet) score = Math.min(score, 2);
  }
  const level = LEVELS[score];

  const match = pw2.length > 0 && pw2 === pw;
  const showMismatch = pw2.length > 0 && !match && (pw2.length >= pw.length || !confirmFocused);
  const canSubmit = !busy && allMet && match && !!token;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setErrorText("");
    try {
      /* The API signs the user in on success, as a login does. */
      const user = await accountService.resetPassword(token, pw, pw2);
      if (user) {
        setUser(user);
        setSignedIn(true);
      }
      show("done");
    } catch (err) {
      const f = err as ApiFailure;
      if (f.code === "LINK_EXPIRED") show("expired");
      else setErrorText(f.message || "We couldn't update your password. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Head>
        <title>Set a new password | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
        {/* the token is in the address: don't hand it to other sites */}
        <meta name="referrer" content="no-referrer" />
      </Head>
      <AuthShell>
        <AuthAside
          eyebrow="New password"
          title="Choose a new password."
          lede="You're one step away. Pick something you haven't used before, here or anywhere else."
          steps={[
            {
              title: "Go long",
              body: "Length beats complexity. A short phrase of four or five words is hard to guess and easy to remember.",
            },
            {
              title: "Don't reuse it",
              body: "If another site you use is ever breached, a reused password puts your Candleweb account at risk too.",
            },
            {
              title: "Let a password manager remember it",
              body: "Your browser or a password manager can save it, so you don't have to.",
            },
          ]}
          assure="Candleweb will never ask for your password by phone, chat or email."
        />

        <div className="auth-card">
          {step === "set" && (
            <div className="auth-stack">
              <BackToLogin />
              <div className="auth-head">
                <div className="auth-badge" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="12" cy="15.5" r="1.4" fill="currentColor" />
                  </svg>
                </div>
                <h2>Set a new password</h2>
              </div>

              <form noValidate onSubmit={onSubmit}>
                <div className="auth-fld">
                  <label htmlFor="pw">New password</label>
                  <div className="in">
                    <input
                      ref={pwRef}
                      id="pw"
                      name="new-password"
                      type={show1 ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Your new password"
                      required
                      aria-describedby="pwStrength pwRules"
                      value={pw}
                      onChange={(e) => {
                        setPw(e.target.value);
                        setErrorText("");
                      }}
                    />
                    <button
                      type="button"
                      className="auth-peek"
                      aria-label={show1 ? "Hide password" : "Show password"}
                      aria-pressed={show1}
                      onClick={() => setShow1((v) => !v)}
                    >
                      {show1 ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div className="auth-meter" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} style={i < score ? { backgroundColor: level.color } : undefined} />
                    ))}
                  </div>
                  <div className="auth-meter-row">
                    <span>Strength</span>
                    <strong id="pwStrength" aria-live="polite" style={score ? { color: level.color } : undefined}>
                      {level.label}
                    </strong>
                  </div>
                  <ul className="auth-rules" id="pwRules" aria-label="Password requirements">
                    {results.map((r) => (
                      <li key={r.id} className={r.met ? "met" : ""}>
                        <span className="dot" aria-hidden="true">
                          <svg width="10" height="10" viewBox="0 0 24 24">
                            <path
                              d="M5 12.5l4.5 4.5L19 7.5"
                              fill="none"
                              stroke="#06201A"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <span>{r.text}</span>
                        <span className="auth-sr">{r.met ? " (done)" : " (not yet)"}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={`auth-fld ${showMismatch ? "invalid" : ""}`}>
                  <label htmlFor="pw2">Confirm new password</label>
                  <div className="in">
                    <input
                      id="pw2"
                      name="confirm-password"
                      type={show2 ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Type it again"
                      required
                      aria-describedby="matchMsg"
                      aria-invalid={showMismatch || undefined}
                      value={pw2}
                      onChange={(e) => {
                        setPw2(e.target.value);
                        setErrorText("");
                      }}
                      onFocus={() => setConfirmFocused(true)}
                      onBlur={() => setConfirmFocused(false)}
                    />
                    <button
                      type="button"
                      className="auth-peek"
                      aria-label={show2 ? "Hide password" : "Show password"}
                      aria-pressed={show2}
                      onClick={() => setShow2((v) => !v)}
                    >
                      {show2 ? "Hide" : "Show"}
                    </button>
                  </div>
                  <div aria-live="polite" id="matchMsg">
                    {showMismatch && (
                      <p className="auth-field-msg err">
                        <ErrorIcon size={14} />
                        <span>Passwords don't match yet.</span>
                      </p>
                    )}
                    {match && (
                      <p className="auth-field-msg ok">
                        <OkIcon size={14} />
                        <span>Passwords match.</span>
                      </p>
                    )}
                  </div>
                </div>

                <div role="status" aria-live="polite">
                  {errorText && (
                    <p className="auth-status err">
                      <ErrorIcon />
                      <span>{errorText}</span>
                    </p>
                  )}
                </div>

                <button type="submit" className={`auth-submit ${busy ? "loading" : ""}`} disabled={!canSubmit}>
                  Update password
                  <span className="auth-spinner" aria-hidden="true" />
                  <ArrowIcon />
                </button>
              </form>
            </div>
          )}

          {step === "done" && (
            <div className="auth-done">
              <DoneBadge />
              <h2 ref={doneRef} tabIndex={-1}>
                Password updated
              </h2>
              {signedIn ? (
                <>
                  <p>Your new password is set and you're signed in. Use it the next time you log in.</p>
                  <Link className="auth-submit" href="/dashboard">
                    Go to my dashboard
                  </Link>
                </>
              ) : (
                <>
                  <p>Your new password is set. Use it the next time you log in.</p>
                  <Link className="auth-submit" href="/login">
                    Log in
                  </Link>
                </>
              )}
            </div>
          )}

          {step === "expired" && (
            <div className="auth-stack">
              <div className="auth-head">
                <div className="auth-badge warn" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <circle cx="12" cy="13" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M12 9v4.5l2.5 1.5M9.5 2.5h5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h2 ref={expiredRef} tabIndex={-1}>
                  This link has expired
                </h2>
                <p className="say">
                  Reset links work once and expire after {RESET_LINK_EXPIRY}. Request a new one and use the most
                  recent email.
                </p>
              </div>
              <Link className="auth-submit" href="/forgot-password">
                Send me a new link
              </Link>
              <Link className="auth-ghost" href="/login">
                Back to log in
              </Link>
            </div>
          )}

          <AuthHelp />
        </div>
      </AuthShell>
    </>
  );
}
