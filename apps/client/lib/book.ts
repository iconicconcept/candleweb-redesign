import { BookV2Param } from "../types/tradingV2";

/**
 * Which book — Demo (paper) or Live — every book-scoped call asks for.
 *
 * Every list and every figure in `trading_v2` answers for exactly ONE book.
 * Nothing mixes them: a Live dashboard must not list demo trades, and must
 * not fold their allocation into its capital either.
 *
 * The server will happily pick the book itself from the user's Settings
 * switch when no `book` is sent. We send it anyway, on every call, because
 * the two states that matter are otherwise indistinguishable from the
 * client's side:
 *
 *  - a response for the book we *meant* to ask about, and
 *  - a response for whatever the server's copy of the profile said.
 *
 * Sending it makes the request self-describing, and every response carries
 * its own `book` back, so `assertBook` can catch a disagreement instead of
 * letting demo figures render under a Live heading. The switch flipping is
 * exactly when that race is live, which is also when it would do the most
 * damage.
 *
 * Anything other than "demo" or "live" is a 400, so this is the only place
 * allowed to produce the value.
 */
export const bookOf = (isLive: boolean | null | undefined): BookV2Param =>
  isLive ? "live" : "demo";

/** How the response spells it back. */
export const bookLabel = (book: BookV2Param): "DEMO" | "LIVE" =>
  book === "live" ? "LIVE" : "DEMO";

/** For a heading or a chip — "Demo" / "Live". */
export const bookTitle = (book: BookV2Param): string => (book === "live" ? "Live" : "Demo");

/**
 * True when a response answered for a different book than we asked for.
 *
 * A response that names no book cannot disagree, so it passes: older
 * endpoints and bare arrays carry nothing to check, and treating silence as a
 * mismatch would blank working pages. Only an explicit contradiction counts.
 */
export const bookMismatch = (
  asked: BookV2Param,
  answered: string | null | undefined,
): boolean => !!answered && answered.toUpperCase() !== bookLabel(asked);
