import Head from "next/head";
import Link from "next/link";
import { useRef, useState } from "react";
import AuthShell, {
  ArrowIcon,
  AuthAside,
  AuthHelp,
  BackToLogin,
  ErrorIcon,
  MailIcon,
  OkIcon,
  maskEmail,
} from "../components/Auth/AuthShell";
import ResendTimer from "../components/Auth/ResendTimer";
import useCooldown from "../lib/hooks/useCooldown";
import accountService, { ApiFailure, RESET_LINK_EXPIRY } from "../services/accountService";
import { validateEmailAddress } from "../utils/emailValidate";
/* eslint-disable react/no-unescaped-entities */

/* Security: the "sent" screen reads the same whether or not the address has an
   account ("If an account exists…"), and so does the API, so this page can't
   be used to find out who is registered. */

const RESEND_SECONDS = 60;

export default function ForgotPasswordPage() {
  const cooldown = useCooldown();

  const [email, setEmail] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [askError, setAskError] = useState("");
  const [sent, setSent] = useState(false);
  const [sentTo, setSentTo] = useState("");
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [resendError, setResendError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);
  const sentTitleRef = useRef<HTMLHeadingElement>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim();
    if (!validateEmailAddress(v)) {
      setInvalid(true);
      emailRef.current?.focus();
      return;
    }
    if (busy) return;
    setBusy(true);
    setAskError("");
    try {
      /* A 429 means a link went out moments ago — still the "sent" screen,
         with the cooldown the server asked for. */
      const res = await accountService.requestPasswordReset(v);
      setSentTo(v);
      setSent(true);
      setResent(false);
      setResendError("");
      cooldown.start(res.retryAfter || RESEND_SECONDS);
      requestAnimationFrame(() => sentTitleRef.current?.focus());
    } catch (err) {
      setAskError((err as ApiFailure).message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setResent(false);
    setResendError("");
    try {
      const res = await accountService.requestPasswordReset(sentTo);
      if (res.throttled) setResendError("You asked for a link very recently. Wait for the timer, then try again.");
      else setResent(true);
      cooldown.start(res.retryAfter || RESEND_SECONDS);
    } catch {
      setResendError("We couldn't send a new link. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  const changeEmail = () => {
    cooldown.stop();
    setSent(false);
    requestAnimationFrame(() => {
      emailRef.current?.focus();
      emailRef.current?.select();
    });
  };

  return (
    <>
      <Head>
        <title>Forgot password | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <AuthShell>
        <AuthAside
          eyebrow="Reset password"
          title="Forgot your password? It happens."
          lede="Enter the email you signed up with and we'll send you a secure link to choose a new password."
          steps={[
            { title: "Enter your email", body: "Use the address you log in with." },
            {
              title: "Open the link we send",
              body: `It works once and expires after ${RESET_LINK_EXPIRY}. Check spam if it doesn't arrive.`,
            },
            { title: "Choose a new password", body: "Then log in as usual with your new password." },
          ]}
          assure="Candleweb will never ask for your password by phone, chat or email."
        />

        <div className="auth-card">
          {!sent ? (
            <div className="auth-stack">
              <BackToLogin />
              <div className="auth-head">
                <div className="auth-badge" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24">
                    <circle cx="8" cy="15" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
                    <path
                      d="M11 12l8-8M16 7l2.5 2.5M14 9l2 2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h2>Reset your password</h2>
                <p className="say">Enter your account email and we'll send you a link to set a new password.</p>
              </div>

              <form noValidate onSubmit={onSubmit}>
                <div className={`auth-fld ${invalid ? "invalid" : ""}`}>
                  <label htmlFor="fp-email">Email address</label>
                  <div className="in">
                    <input
                      ref={emailRef}
                      id="fp-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="you@example.com"
                      required
                      aria-describedby="fp-email-msg"
                      aria-invalid={invalid || undefined}
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setAskError("");
                        if (invalid && validateEmailAddress(e.target.value.trim())) setInvalid(false);
                      }}
                    />
                  </div>
                  {invalid && (
                    <p className="auth-field-msg err" id="fp-email-msg">
                      <ErrorIcon size={14} />
                      <span>Enter a valid email address, like you@example.com.</span>
                    </p>
                  )}
                </div>

                <div role="status" aria-live="polite">
                  {askError && (
                    <p className="auth-status err">
                      <ErrorIcon />
                      <span>{askError}</span>
                    </p>
                  )}
                </div>

                <button type="submit" className={`auth-submit ${busy ? "loading" : ""}`} disabled={busy}>
                  Send reset link
                  <span className="auth-spinner" aria-hidden="true" />
                  <ArrowIcon />
                </button>
              </form>

              <p className="auth-alt">
                Signed up with Google? You don't have a Candleweb password. Use{" "}
                <strong>Continue with Google</strong> on the <Link href="/login">log-in page</Link> instead.
              </p>
            </div>
          ) : (
            <div className="auth-stack">
              <div className="auth-head">
                <div className="auth-badge" aria-hidden="true">
                  <MailIcon />
                </div>
                <h2 ref={sentTitleRef} tabIndex={-1}>
                  Check your email
                </h2>
                <p className="say">
                  If an account exists for <strong>{maskEmail(sentTo)}</strong>, we've sent a link to reset your
                  password. It expires after {RESET_LINK_EXPIRY}.
                </p>
              </div>

              <div role="status" aria-live="polite">
                {resent && (
                  <p className="auth-status ok">
                    <OkIcon />
                    <span>We've sent a new link. Earlier links no longer work.</span>
                  </p>
                )}
                {resendError && (
                  <p className="auth-status err">
                    <ErrorIcon />
                    <span>{resendError}</span>
                  </p>
                )}
              </div>

              <Link className="auth-submit" href="/login">
                Back to log in
              </Link>

              <ResendTimer
                prompt="Didn't get it?"
                action="Resend link"
                cooldown={cooldown}
                sending={resending}
                onResend={resend}
              />

              <p className="auth-help">
                <button type="button" className="auth-linkbtn plain" onClick={changeEmail}>
                  Use a different email
                </button>
              </p>
            </div>
          )}
          <AuthHelp />
        </div>
      </AuthShell>
    </>
  );
}
