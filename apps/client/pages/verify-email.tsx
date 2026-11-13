import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";
import AuthShell, {
  ArrowIcon,
  AuthAside,
  AuthHelp,
  BackToLogin,
  DoneBadge,
  ErrorIcon,
  MailIcon,
  OkIcon,
  maskEmail,
} from "../components/Auth/AuthShell";
import ResendTimer from "../components/Auth/ResendTimer";
import { safeReturnTo } from "../lib/authRedirect";
import useCooldown from "../lib/hooks/useCooldown";
import useUserStore from "../lib/hooks/useUserStore";
import accountService, {
  ApiFailure,
  clearPendingVerification,
  readPendingVerification,
} from "../services/accountService";
/* eslint-disable react/no-unescaped-entities */

const CODE_LENGTH = 6;
const RESEND_SECONDS = 60;
const DEFAULT_ERROR = "That code doesn't match. Check the most recent email and try again.";

export default function VerifyEmailPage() {
  const router = useRouter();
  const { setUser } = useUserStore((state) => state);
  const cooldown = useCooldown();

  const [email, setEmail] = useState("");
  const [redirect, setRedirect] = useState("");
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [busy, setBusy] = useState(false);
  const [resending, setResending] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [resent, setResent] = useState(false);
  const [done, setDone] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  /* Who to verify. Signing up stores the address for this tab; ?email= is the
     fallback for browsers that refuse storage. Nothing to verify → sign-up. */
  useEffect(() => {
    if (!router.isReady) return;
    const pending = readPendingVerification();
    const fromQuery = typeof router.query.email === "string" ? router.query.email : "";
    const address = pending?.email || fromQuery;
    if (!address) {
      router.replace("/register");
      return;
    }
    setEmail(address);
    const queryRedirect = typeof router.query.redirect === "string" ? router.query.redirect : "";
    setRedirect(safeReturnTo(queryRedirect || pending?.redirect || ""));
    /* The code went out when the account was made (or the login was refused),
       so the cooldown starts from then, not from this page load. */
    const elapsed = pending?.at ? (Date.now() - pending.at) / 1000 : 0;
    const remaining = RESEND_SECONDS - elapsed;
    if (remaining > 0) cooldown.start(remaining);
    inputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady]);

  const showError = (text: string) => {
    setErrorText(text);
    setResent(false);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  const failureText = (f: ApiFailure) => {
    if (f.code === "OTP_WRONG") {
      const base = f.message || DEFAULT_ERROR;
      return typeof f.triesLeft === "number"
        ? `${base} ${f.triesLeft} ${f.triesLeft === 1 ? "try" : "tries"} left.`
        : base;
    }
    return f.message || DEFAULT_ERROR;
  };

  const submit = async (value = code) => {
    if (busy || value.length !== CODE_LENGTH || !email) return;
    setBusy(true);
    try {
      const user = await accountService.verifyOtp(email, value);
      if (user) setUser(user);
      clearPendingVerification();
      cooldown.stop();
      setDone(true);
      requestAnimationFrame(() => doneRef.current?.focus());
    } catch (err) {
      showError(failureText(err as ApiFailure));
    } finally {
      setBusy(false);
    }
  };

  const onChange = (raw: string) => {
    const clean = raw.replace(/\D/g, "").slice(0, CODE_LENGTH);
    setCode(clean);
    setErrorText("");
    /* Submit as soon as the last digit is typed or pasted. */
    if (clean.length === CODE_LENGTH) submit(clean);
  };

  const resend = async () => {
    setResending(true);
    try {
      const res = await accountService.resendOtp(email);
      setCode("");
      setErrorText("");
      setResent(!res.throttled);
      if (res.throttled) showError("You asked for a code very recently. Wait for the timer, then try again.");
      cooldown.start(res.retryAfter || RESEND_SECONDS);
      inputRef.current?.focus();
    } catch (err) {
      showError((err as ApiFailure).message || "We couldn't send a new code. Please try again in a moment.");
    } finally {
      setResending(false);
    }
  };

  const activeIndex = Math.min(code.length, CODE_LENGTH - 1);
  const dashboardHref = redirect || "/dashboard";

  return (
    <>
      <Head>
        <title>Verify your email | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </Head>
      <AuthShell>
        <AuthAside
          eyebrow="One last step"
          title="Enter the code and you're in."
          lede={
            <>
              We just emailed you a 6-digit code to make sure it's really you. It only works once and
              expires after 10 minutes.
            </>
          }
          steps={[
            {
              title: "Open the email from Candleweb",
              body: "It usually arrives within a minute. The code is in the first line.",
            },
            {
              title: "Can't find it?",
              body: "Check your spam or promotions folder, or request a new code once the timer runs out.",
            },
            {
              title: "Keep it to yourself",
              body: "Candleweb will never ask you for this code by phone, chat or email.",
            },
          ]}
          assure="Candleweb never holds your money and never asks for withdrawal permission. You can revoke access from your exchange at any time."
        />

        <div className="auth-card">
          {!done ? (
            <div className="auth-stack">
              <BackToLogin />
              <div className="auth-head">
                <div className="auth-badge" aria-hidden="true">
                  <MailIcon />
                </div>
                <h2>Check your email</h2>
                <p className="say">
                  Enter the 6-digit code we sent to <strong>{email ? maskEmail(email) : "your email"}</strong>.{" "}
                  <Link href="/register">Wrong email?</Link>
                </p>
              </div>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  submit();
                }}
              >
                <div className="auth-fld">
                  <label htmlFor="otpInput">Verification code</label>
                  <div className={`auth-otp ${errorText ? "error" : ""} ${busy ? "disabled" : ""}`}>
                    <div className="auth-otp-boxes" aria-hidden="true">
                      {Array.from({ length: CODE_LENGTH }).map((_, i) => {
                        const ch = code[i] || "";
                        return (
                          <div
                            key={i}
                            className={[
                              "auth-otp-box",
                              ch ? "filled" : "empty",
                              focused && i === activeIndex ? "active" : "",
                            ].join(" ")}
                          >
                            {ch}
                          </div>
                        );
                      })}
                    </div>
                    {/* One real input over the boxes, so paste, autofill
                        (one-time-code) and screen readers all work. */}
                    <input
                      ref={inputRef}
                      id="otpInput"
                      name="code"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={CODE_LENGTH}
                      spellCheck={false}
                      aria-describedby="otpHint otpStatus"
                      aria-invalid={errorText ? true : undefined}
                      required
                      value={code}
                      readOnly={busy}
                      onChange={(e) => onChange(e.target.value)}
                      onFocus={() => setFocused(true)}
                      onBlur={() => setFocused(false)}
                      onKeyDown={() => {
                        /* keep the caret at the end so typing always fills the next box */
                        setTimeout(() => {
                          const el = inputRef.current;
                          if (el) el.setSelectionRange(el.value.length, el.value.length);
                        }, 0);
                      }}
                    />
                  </div>
                  <p className="auth-hint" id="otpHint">
                    Tip: you can paste the whole code.
                  </p>
                </div>

                <div id="otpStatus" role="status" aria-live="polite">
                  {errorText && (
                    <p className="auth-status err">
                      <ErrorIcon />
                      <span>{errorText}</span>
                    </p>
                  )}
                  {resent && !errorText && (
                    <p className="auth-status ok">
                      <OkIcon />
                      <span>New code sent. Codes from earlier emails no longer work.</span>
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  className={`auth-submit ${busy ? "loading" : ""}`}
                  disabled={busy || code.length !== CODE_LENGTH}
                >
                  Verify and continue
                  <span className="auth-spinner" aria-hidden="true" />
                  <ArrowIcon />
                </button>
              </form>

              <ResendTimer
                prompt="Didn't get a code?"
                action="Resend code"
                cooldown={cooldown}
                sending={resending}
                onResend={resend}
              />
            </div>
          ) : (
            <div className="auth-done">
              <DoneBadge />
              <h2 ref={doneRef} tabIndex={-1}>
                Email verified
              </h2>
              <p>You're all set. Next, connect your exchange and point your agent at Candleweb.</p>
              <Link className="auth-submit" href={dashboardHref}>
                Go to my dashboard
              </Link>
            </div>
          )}
          <AuthHelp />
        </div>
      </AuthShell>
    </>
  );
}
