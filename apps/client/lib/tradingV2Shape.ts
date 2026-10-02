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

/** A paged list: `count` is the TOTAL, not the page size — page off it, never
 *  off `results.length`. A bare array (no envelope) counts as one full page. */
export const unwrapPageV2 = <T>(body: any): { count: number; results: T[] } => {
  const results = unwrapV2<T[]>(body);
  const list = Array.isArray(results) ? results : [];
  const count =
    isEnvelope(body) && typeof body.count === "number" ? (body.count as number) : list.length;
  return { count, results: list };
};
