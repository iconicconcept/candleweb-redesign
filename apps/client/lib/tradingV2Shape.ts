/**
 * `/api/trading_v2/` is not consistent about how it wraps a response:
 *
 *   GET /bots/            → a bare array
 *   GET /bots/<id>/       → a bare object
 *   GET /trades/          → a bare array
 *   GET /decisions/       → { status, message, count, results: [...] }
 *   GET /decisions/<id>/  → a bare object
 *   GET /bots/<id>/health/, /bots/health/, /limits/
 *                         → { status, message, data: {...} }
 *
 * One helper for all three shapes, rather than guessing per call. The
 * backend has this on its cleanup list; when it lands, this is the only
 * place that has to change.
 */

/** The envelope keys that mark a wrapped response, so a payload that happens
 *  to have its own `data` field isn't mistaken for one. */
const isEnvelope = (body: unknown): body is Record<string, unknown> =>
  !!body &&
  typeof body === "object" &&
  !Array.isArray(body) &&
  ("status" in (body as object) || "message" in (body as object));

/** Pull the useful part out of a `data` / `results` / bare response. */
export const unwrapV2 = <T>(body: any): T => {
  if (isEnvelope(body)) {
    if ("data" in body) return body.data as T;
    if ("results" in body) return body.results as T;
  }
  return body as T;
};

/**
 * The `{ data: ... }` wrapper, with or without a `status`/`message` envelope.
 *
 * `GET /positions/{id}/` answers `{ "data": { ... } }` and nothing else, so
 * `unwrapV2` leaves it wrapped: its envelope test deliberately requires
 * `status` or `message` so a payload with its own `data` field is not
 * unwrapped by accident. This is for endpoints documented as putting the
 * object inside `data` — the caller knows, so it does not have to guess.
 */
export const unwrapDataV2 = <T>(body: any): T => {
  if (body && typeof body === "object" && !Array.isArray(body) && "data" in body) {
    return (body as Record<string, unknown>).data as T;
  }
  return body as T;
};

/**
 * A paged list: `count` is the TOTAL, not the page size — page off it, never
 * off `results.length`. A bare array (no envelope) counts as one full page.
 *
 * `results` is looked for on the body FIRST, before the envelope test, because
 * newer endpoints page without one: `GET /positions/` answers
 * `{ book, as_of, count, results }` with no `status` or `message`. Going
 * through the envelope test alone returned `results: []` and `count: 0` for
 * those — an empty list that looks like "no positions" rather than a parse
 * miss, which is the worst way for this to fail.
 */
export const unwrapPageV2 = <T>(body: any): { count: number; results: T[] } => {
  if (Array.isArray(body)) return { count: body.length, results: body as T[] };
  if (body && typeof body === "object") {
    const rows = Array.isArray(body.results)
      ? body.results
      : Array.isArray(body.data)
        ? body.data
        : null;
    if (rows) {
      return {
        count: typeof body.count === "number" ? body.count : rows.length,
        results: rows as T[],
      };
    }
  }
  const results = unwrapV2<T[]>(body);
  const list = Array.isArray(results) ? results : [];
  const count =
    isEnvelope(body) && typeof body.count === "number" ? (body.count as number) : list.length;
  return { count, results: list };
};
