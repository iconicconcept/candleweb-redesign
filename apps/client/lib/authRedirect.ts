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
const withReturn = (page: string, returnTo: string) =>
  returnTo ? `${page}?redirect=${encodeURIComponent(returnTo)}` : page;

/** For "enrol", "start free", "choose a plan" — someone who likely has no account. */
export const signUpPath = (returnTo: string) => withReturn("/register", returnTo);

/** For "Log in" and "Sign in" — someone who says they already have one. */
export const signInPath = (returnTo: string) => withReturn("/login", returnTo);
