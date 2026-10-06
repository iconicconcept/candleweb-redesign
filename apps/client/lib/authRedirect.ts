/**
 * Where a landing-page call to action sends someone who isn't signed in.
 *
 * These used to call `googleAuth()`, which jumped straight to Google's consent
 * screen — wallet and email sign-in were unreachable from the public pages.
 * Sending people to the auth page instead lets them pick a method; `AuthPanel`
 * reads `redirect` and honours it for all three (for Google it hands the value
 * to `googleAuth`, so it survives the OAuth round trip).
 *
 * `returnTo` must be encoded: several of these point at `/tutor#courses`, and a
 * bare `#` would be read as the auth page's own fragment.
 */

/** Auth routes: returning to one of these after a sign-in would just loop. */
const NO_RETURN = ["/login", "/register", "/auth"];

/**
 * Drops return paths that shouldn't survive a sign-in.
 *
 * The header's "Log in" passes the page it was clicked on, which is right for
 * the Academy and pricing but wrong for the homepage: `/login?redirect=%2F`
 * sent a successful login straight back to the marketing page, which reads as
 * a failed login. The homepage is not somewhere anyone logs in to reach, so it
 * falls through to `/dashboard` like the auth pages do.
 *
 * Also the sanitiser for whatever arrives in `?redirect=` — only same-origin
 * paths are honoured, so a crafted link can't bounce a freshly signed-in user
 * off-site.
 */
export const safeReturnTo = (returnTo: string) => {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) return "";
  const path = returnTo.split(/[?#]/)[0].replace(/\/+$/, "");
  if (!path) return ""; // "/" and "///" — the homepage
  if (NO_RETURN.some((p) => path === p || path.startsWith(`${p}/`))) return "";
  return returnTo;
};

const withReturn = (page: string, returnTo: string) => {
  const safe = safeReturnTo(returnTo);
  return safe ? `${page}?redirect=${encodeURIComponent(safe)}` : page;
};

/** For "enrol", "start free", "choose a plan" — someone who likely has no account. */
export const signUpPath = (returnTo: string) => withReturn("/register", returnTo);

/** For "Log in" and "Sign in" — someone who says they already have one. */
export const signInPath = (returnTo: string) => withReturn("/login", returnTo);
