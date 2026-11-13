import { AxiosError } from "axios";
import { axiosApi } from "../lib/axiosApi";

/**
 * Email verification (one-time code) and password reset.
 *
 * Endpoints, as the API describes them (OPTIONS on each):
 *  - POST /user/verify-otp/             { email, otp }    → signs in (access_token + refresh cookie)
 *      400 OTP_WRONG (tries_left) | OTP_LOCKED (retry_after) | OTP_EXPIRED, 409 EMAIL_TAKEN
 *  - POST /user/resend-otp/             { email }         → 200, or 429 { retry_after }
 *  - POST /user/password-reset-request/ { email }         → 200, or 429 { retry_after }
 *      Same answer whether or not the address has an account.
 *  - POST /user/password-reset/         { token, new_password, confirm_password } → signs in
 *      400 LINK_EXPIRED | PASSWORDS_DIFFER
 *
 * These are plain promises rather than thunks: the pages keep their own state
 * and nothing else in the app needs to see it.
 */

/** Shown in the copy only — keep in step with the backend's link lifetime. */
export const RESET_LINK_EXPIRY = "10 minutes";

/** Password rules the reset page enforces. Keep in step with the backend. */
export const PASSWORD_RULES = {
  minLength: 8,
  requireMixedCase: true,
  requireNumber: true,
  requireSymbol: true,
};

export type ApiFailure = {
  status?: number;
  code?: string;
  message: string;
  triesLeft?: number;
  retryAfter?: number;
};

/** A sent-or-cooling-down answer from the two "send me another" endpoints. */
export type SendResult = { retryAfter?: number; throttled?: boolean };

const NETWORK = "Something went wrong. Check your connection and try again.";

const toFailure = (err: unknown): ApiFailure => {
  const e = err as AxiosError<any>;
  const body = e?.response?.data;
  if (!e?.response) return { message: NETWORK };
  return {
    status: e.response.status,
    code: body?.code,
    message:
      (typeof body?.message === "string" && body.message) ||
      (typeof body?.detail === "string" && body.detail) ||
      NETWORK,
    triesLeft: typeof body?.tries_left === "number" ? body.tries_left : undefined,
    retryAfter: Number(body?.retry_after) || undefined,
  };
};

/** Turns a login-shaped answer into the user object the store keeps. */
const sessionFrom = async (data: any) => {
  const token = data?.access_token;
  if (!token) return null;
  const { data: profile } = await axiosApi.get("/user/profile/", {
    headers: { Authorization: `Bearer ${token}` },
    withCredentials: true,
  });
  return { ...profile, access_token: token };
};

/** For the two endpoints that answer 429 + retry_after when asked too often. */
const send = async (url: string, email: string): Promise<SendResult> => {
  try {
    const { data } = await axiosApi.post(url, { email });
    return { retryAfter: Number(data?.retry_after) || undefined };
  } catch (err) {
    const failure = toFailure(err);
    if (failure.status === 429) return { retryAfter: failure.retryAfter, throttled: true };
    throw failure;
  }
};

const accountService = {
  /** Resolves with the signed-in user (or null if no token came back); rejects with ApiFailure. */
  verifyOtp: async (email: string, otp: string) => {
    try {
      const { data } = await axiosApi.post("/user/verify-otp/", { email, otp }, { withCredentials: true });
      return await sessionFrom(data);
    } catch (err) {
      throw toFailure(err);
    }
  },

  resendOtp: (email: string) => send("/user/resend-otp/", email),

  requestPasswordReset: (email: string) => send("/user/password-reset-request/", email),

  /** Resolves with the signed-in user (or null); rejects with ApiFailure. */
  resetPassword: async (token: string, password: string, confirm: string) => {
    try {
      const { data } = await axiosApi.post(
        "/user/password-reset/",
        { token, new_password: password, confirm_password: confirm },
        { withCredentials: true },
      );
      return await sessionFrom(data);
    } catch (err) {
      throw toFailure(err);
    }
  },
};

export default accountService;

/* ---- handing the address to the verify page ----
   Kept in sessionStorage, not the URL: the site loads Google Analytics, which
   records every page address, and an email in a query string would go with it.
   The ?email= fallback is only for browsers that refuse storage. */
const VERIFY_KEY = "cw-verify";

export const verifyPath = (email: string, redirect = "") => {
  let stored = false;
  try {
    sessionStorage.setItem(VERIFY_KEY, JSON.stringify({ email, redirect, at: Date.now() }));
    stored = true;
  } catch {
    /* private mode */
  }
  const params = new URLSearchParams();
  if (redirect) params.set("redirect", redirect);
  if (!stored) params.set("email", email);
  const qs = params.toString();
  return `/verify-email${qs ? `?${qs}` : ""}`;
};

export const readPendingVerification = (): { email: string; redirect: string; at: number } | null => {
  try {
    const raw = sessionStorage.getItem(VERIFY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearPendingVerification = () => {
  try {
    sessionStorage.removeItem(VERIFY_KEY);
  } catch {
    /* ignore */
  }
};
