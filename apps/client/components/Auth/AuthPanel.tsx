import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../redux/store";
import useEthereum from "../../lib/hooks/useEthereum";
import useUserStore from "../../lib/hooks/useUserStore";
import useGoogleAuth from "../../lib/hooks/useGoogleAuth";
import authService from "../../services/authService";
import { loginUser } from "../../utils/loginUser";
import { validateEmailAddress } from "../../utils/emailValidate";
import { error } from "../alert/Toast";
import Loader from "../Loader";
import type { RegisterProps } from "../../pages/auth/register";
/* eslint-disable react/no-unescaped-entities */

type Mode = "login" | "signup";

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 01-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0012 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.4 14.4a7.2 7.2 0 010-4.6V6.7H1.4a12 12 0 000 10.8l4-3.1z"
    />
    <path
      fill="#EA4335"
      d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 001.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
    />
  </svg>
);

const WALLETS = [
  { key: "mm", label: "MetaMask", cls: "mm" },
  { key: "tw", label: "Trust Wallet", cls: "tw" },
  { key: "cb", label: "Coinbase Wallet", cls: "cb" },
  { key: "wc", label: "Other (WalletConnect)", cls: "wc" },
] as const;

export default function AuthPanel({ initialMode }: { initialMode: Mode }) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { connectWallet, mobileConnectWallet } = useEthereum();
  const { googleAuth } = useGoogleAuth();
  const { setUser } = useUserStore((state) => state);

  const [mode, setMode] = useState<Mode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [signupForm, setSignupForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const redirect =
    typeof router.query.redirect === "string" ? router.query.redirect : "";
  const referral =
    typeof router.query.referral === "string" ? router.query.referral : "";

  useEffect(() => {
    if (router.query.tab === "signup") setMode("signup");
    if (router.query.tab === "login") setMode("login");
  }, [router.query.tab]);

  const goDashboard = () => router.push(redirect || "/dashboard");

  const finishWithWallet = (walletAddress: string, signMessage: string) =>
    loginUser({
      wallet: walletAddress,
      signerPassword: signMessage,
      setIsLoading: setBusy,
      onSuccess: (value, type) => {
        if (type === "success") {
          setUser(value);
          goDashboard();
        }
      },
    });

  // Email login rides the same POST /user/login/ endpoint as wallet login —
  // the email goes in the wallet_address field per the API docs.
  const finishWithEmail = (email: string, password: string) =>
    loginUser({
      wallet: email,
      signerPassword: password,
      setIsLoading: setBusy,
      onSuccess: (value, type) => {
        if (type === "success") {
          setUser(value);
          goDashboard();
        }
      },
    });

  const connect = (walletConnect: boolean) =>
    walletConnect ? mobileConnectWallet() : connectWallet();

  const handleGoogle = () => {
    setBusy(true);
    googleAuth(redirect || "/dashboard");
  };

  const handleWalletLogin = async (walletConnect: boolean) => {
    setWalletOpen(false);
    setBusy(true);
    try {
      const result = await connect(walletConnect);
      if (!result) {
        setBusy(false);
        return;
      }
      await finishWithWallet(result.walletAddress, result.signMessage);
    } catch (walletError) {
      error(String(walletError));
      setBusy(false);
    }
  };

  const handleWalletSignup = async (walletConnect: boolean) => {
    const username = signupForm.username.trim();
    const email = signupForm.email.trim();
    if (!username || !email) {
      error("Enter a username and email to continue");
      return;
    }
    if (!validateEmailAddress(email)) {
      error("Enter a valid email address");
      return;
    }
    setWalletOpen(false);
    setBusy(true);
    try {
      const result = await connect(walletConnect);
      if (!result) {
        setBusy(false);
        return;
      }
      const data: RegisterProps = {
        wallet_address: result.walletAddress,
        username,
        email,
        exchange: { id: 0, name: "" },
        apiKey: "",
        apiSecret: "",
        apiPassphrase: "",
        date: Date.now(),
        referral,
        password: result.signMessage,
      };
      await dispatch(
        authService.registerUser({
          data,
          onSucess: () =>
            finishWithWallet(result.walletAddress, result.signMessage),
        }),
      );
    } catch (signupError) {
      error(String(signupError));
    } finally {
      setBusy(false);
    }
  };

  const handleLoginSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const email = loginForm.email.trim();
    const password = loginForm.password;
    if (!email || !password) {
      error("Enter your email and password");
      return;
    }
    if (!validateEmailAddress(email)) {
      error("Enter a valid email address");
      return;
    }
    setBusy(true);
    finishWithEmail(email, password);
  };

  const handleSignupSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const username = signupForm.username.trim();
    const email = signupForm.email.trim();
    const password = signupForm.password;
    if (!username || !email || !password) {
      error("Enter a username, email and password");
      return;
    }
    if (!validateEmailAddress(email)) {
      error("Enter a valid email address");
      return;
    }
    if (password.length < 8) {
      error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    try {
      await dispatch(
        authService.createUserWithEmail({
          data: { username, email, password },
          onSucess: () => finishWithEmail(email, password),
        }),
      );
    } catch (signupError) {
      error(String(signupError));
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setWalletOpen(false);
  };

  return (
    <div className="auth-page">
      {busy && <Loader />}
      <div className="auth-aura">
        <b className="b1" />
        <b className="b2" />
        <b className="b3" />
      </div>
      <div className="auth-grid-tex" />

      <div className="auth-stage">
        <div className="auth-top">
          <Link href="/" className="auth-brand">
            <Image src="/logo.png" alt="Candleweb" width={128} height={17} />
          </Link>
          <p className="ask">
            {mode === "login" ? (
              <>
                New here?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchMode("signup");
                  }}
                >
                  Create an account
                </a>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    switchMode("login");
                  }}
                >
                  Log in
                </a>
              </>
            )}
          </p>
        </div>

        <div className="auth-layout">
          <div className="auth-aside">
            <p className="auth-eyebrow">Getting started</p>
            <h1>Three steps and your agent is trading.</h1>
            <p className="lede">
              Setting up takes about ten minutes. Here's the whole thing, so
              there are no surprises after you sign up.
            </p>
            <ol className="auth-flow">
              <li>
                <span className="n">1</span>
                <div>
                  <b>Create your account</b>
                  <span>
                    Use a Google account, or sign in with a wallet you already
                    have. Whichever is easiest.
                  </span>
                </div>
              </li>
              <li>
                <span className="n">2</span>
                <div>
                  <b>Connect your exchange</b>
                  <span>
                    Add trade-only API keys from KuCoin, Binance, Bybit or
                    BitMart. Your funds stay in your own account.
                  </span>
                </div>
              </li>
              <li>
                <span className="n">3</span>
                <div>
                  <b>Point your agent at us</b>
                  <span>
                    Copy your webhook URL into n8n, Make or your own code — or
                    switch on CandleAI and let ours trade instead.
                  </span>
                </div>
              </li>
            </ol>
            <p className="auth-assure">
              <i>✓</i>Candleweb never holds your money and never asks for
              withdrawal permission. You can revoke access from your exchange at
              any time.
            </p>
          </div>

          <div className="auth-card">
            <div className="auth-tabs" role="tablist">
              <button
                type="button"
                className="auth-tab"
                role="tab"
                aria-selected={mode === "login"}
                onClick={() => switchMode("login")}
              >
                Log in
              </button>
              <button
                type="button"
                className="auth-tab"
                role="tab"
                aria-selected={mode === "signup"}
                onClick={() => switchMode("signup")}
              >
                Create account
              </button>
            </div>

            <div className={`auth-pane ${mode === "login" ? "on" : ""}`}>
              <h2>Welcome back.</h2>
              <p className="say">Log in to your dashboard.</p>
              <WalletChoices
                mode="login"
                busy={busy}
                walletOpen={walletOpen}
                setWalletOpen={setWalletOpen}
                onGoogle={handleGoogle}
                onWallet={handleWalletLogin}
              />
              <div className="auth-or">or use your email</div>
              <form onSubmit={handleLoginSubmit}>
                <div className="auth-fld">
                  <label htmlFor="login-email">Email address</label>
                  <div className="in">
                    <input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={loginForm.email}
                      onChange={(e) =>
                        setLoginForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <div className="auth-fld">
                  <label htmlFor="login-password">Password</label>
                  <div className="in">
                    <input
                      id="login-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Your password"
                      value={loginForm.password}
                      onChange={(e) =>
                        setLoginForm((f) => ({ ...f, password: e.target.value }))
                      }
                    />
                    <button
                      type="button"
                      className="auth-peek"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <div className="auth-rowline">
                  <label className="auth-check">
                    <input type="checkbox" /> Keep me signed in
                  </label>
                  <Link href="/auth/forgot">Forgot password?</Link>
                </div>
                <button type="submit" className="auth-submit" disabled={busy}>
                  Log in <span>→</span>
                </button>
              </form>
            </div>

            <div className={`auth-pane ${mode === "signup" ? "on" : ""}`}>
              <h2>Create your account.</h2>
              <p className="say">
                Free to open. You only fund your own exchange account.
              </p>
              <WalletChoices
                mode="signup"
                busy={busy}
                walletOpen={walletOpen}
                setWalletOpen={setWalletOpen}
                onGoogle={handleGoogle}
                onWallet={handleWalletSignup}
              />
              <div className="auth-or">or use your email</div>
              <form onSubmit={handleSignupSubmit}>
                <div className="auth-fld">
                  <label htmlFor="signup-username">Username</label>
                  <div className="in">
                    <input
                      id="signup-username"
                      type="text"
                      placeholder="How you'll appear in Candleweb"
                      value={signupForm.username}
                      onChange={(e) =>
                        setSignupForm((f) => ({
                          ...f,
                          username: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="auth-fld">
                  <label htmlFor="signup-email">Email address</label>
                  <div className="in">
                    <input
                      id="signup-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={signupForm.email}
                      onChange={(e) =>
                        setSignupForm((f) => ({ ...f, email: e.target.value }))
                      }
                    />
                  </div>
                  <p className="auth-hint">
                    We'll send a verification code here.
                  </p>
                </div>
                <div className="auth-fld">
                  <label htmlFor="signup-password">Password</label>
                  <div className="in">
                    <input
                      id="signup-password"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      value={signupForm.password}
                      onChange={(e) =>
                        setSignupForm((f) => ({
                          ...f,
                          password: e.target.value,
                        }))
                      }
                    />
                    <button
                      type="button"
                      className="auth-peek"
                      onClick={() => setShowPw((v) => !v)}
                    >
                      {showPw ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
                <button type="submit" className="auth-submit" disabled={busy}>
                  Create account <span>→</span>
                </button>
                <p className="auth-legal">
                  By continuing you agree to our{" "}
                  <Link href="/terms">Terms</Link> and{" "}
                  <Link href="/privacy">Privacy Policy</Link>.
                </p>
              </form>
            </div>
          </div>
        </div>

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

function WalletChoices({
  mode,
  busy,
  walletOpen,
  setWalletOpen,
  onGoogle,
  onWallet,
}: {
  mode: Mode;
  busy: boolean;
  walletOpen: boolean;
  setWalletOpen: (value: boolean) => void;
  onGoogle: () => void;
  onWallet: (walletConnect: boolean) => void;
}) {
  return (
    <div className="auth-choices">
      <button
        type="button"
        className="auth-gbtn"
        disabled={busy}
        onClick={onGoogle}
      >
        <GoogleMark />
        {mode === "login" ? "Continue with Google" : "Sign up with Google"}
      </button>
      <div className="auth-wsel">
        <button
          type="button"
          className="auth-wbtn"
          aria-expanded={walletOpen}
          disabled={busy}
          onClick={() => setWalletOpen(!walletOpen)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="2.5" y="5.5" width="19" height="14" rx="3" />
            <path d="M2.5 10h19" />
            <circle cx="17" cy="14.5" r="1.3" />
          </svg>
          {mode === "login" ? "Continue with a wallet" : "Sign up with a wallet"}
          <em className="chev">▾</em>
        </button>
        {walletOpen && (
          <div className="auth-wallets">
            {WALLETS.map((wallet) => (
              <button
                key={wallet.key}
                type="button"
                className="auth-wal"
                onClick={() => onWallet(wallet.key === "wc")}
              >
                <i className={`auth-wi ${wallet.cls}`}>{wallet.label[0]}</i>
                {wallet.label}
              </button>
            ))}
            <p className="auth-wal-note">
              Signing with a wallet only proves the wallet is yours. It does not
              move funds, and it gives Candleweb no access to them.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
