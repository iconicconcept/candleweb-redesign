import { HistoryV2Day, HistoryV2Query, HistoryV2Row } from "../types/tradingV2";
import { isUnavailable } from "./botHealthV2";

/**
 * Reading `GET /trading_v2/history/`.
 *
 * The one rule that shapes everything here: **a row whose sale was never
 * recorded is not a zero.** It arrives with `exit_reason: "UNKNOWN"`, null
 * results and `unavailable.realised_pnl`, and the backend keeps it out of
 * every total on purpose. Rendering it as "$0.00" would quietly drag a win
 * rate down and an average toward nothing, which is the one way this page can
 * lie about money.
 */

/** The browser's own zone. The day a position closed on — and therefore which
 *  group it lands in — depends on it, so it is sent on every call. UTC is the
 *  server's default and would silently regroup an evening's trades. */
export const browserTz = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

/** True when this row's result was never recorded — show a dash, and expect
 *  it to be missing from the summary totals. */
export const missingFills = (row: HistoryV2Row): boolean =>
  isUnavailable(row.unavailable, "realised_pnl") || row.exit_reason === "UNKNOWN";

/** "1h 35m" — how long the position was held. */
export const heldLabel = (seconds: number | null | undefined): string => {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return "—";
  const s = Math.round(seconds);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h < 24) return mins ? `${h}h ${mins}m` : `${h}h`;
  const d = Math.floor(h / 24);
  const hrs = h % 24;
  return hrs ? `${d}d ${hrs}h` : `${d}d`;
};

/** The clock on a row. `closed_at` already arrives in the requested zone, so
 *  it is formatted without re-applying one — doing so would shift it twice. */
export const closedAtClock = (iso: string | null | undefined): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
};

/** "Today" / "Yesterday" / "22 August" for a day heading. */
export const dayHeading = (date: string | null | undefined): string => {
  if (!date) return "—";
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return date;
  const today = new Date();
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (same(d, today)) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (same(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString(undefined, { day: "numeric", month: "long" });
};

/** Who opened the position. `bot` is null for CandleAI and for positions no
 *  trade opened, and `decider` is the backend's own word for those. */
export const rowDecider = (row: HistoryV2Row): string =>
  row.bot?.name || row.decider?.name || "No bot recorded";

/** Rows grouped under their own day, in the order they arrived (newest
 *  first). The day's OWN figures come from `days[]`, which covers the whole
 *  day rather than the slice of it on this page. */
export const groupByDay = (
  rows: HistoryV2Row[],
  days: HistoryV2Day[],
): { date: string; day: HistoryV2Day | null; rows: HistoryV2Row[] }[] => {
  const byDate = new Map<string, HistoryV2Row[]>();
  const order: string[] = [];
  for (const r of rows) {
    const date = r.date || r.closed_at?.slice(0, 10) || "—";
    if (!byDate.has(date)) {
      byDate.set(date, []);
      order.push(date);
    }
    byDate.get(date)!.push(r);
  }
  return order.map((date) => ({
    date,
    day: days.find((d) => d.date === date) ?? null,
    rows: byDate.get(date)!,
  }));
};

/** The window the page is showing, for the heading under each summary tile. */
export const windowCaption = (query: HistoryV2Query, recordDays: number | null): string => {
  if (query.from || query.to) {
    if (query.from && query.to) return `${query.from} → ${query.to}`;
    return query.from ? `since ${query.from}` : `up to ${query.to}`;
  }
  if (query.days === "all") {
    /* A plan that caps the record answers with its own window, so "all time"
       would be a claim the response has already contradicted. */
    return recordDays == null ? "all time" : `last ${recordDays} days`;
  }
  const days = query.days ?? 30;
  return `last ${days} days`;
};

/** The day ranges the filter offers, newest first. "All" is included even on
 *  a capped plan — the banner explains what came back instead of hiding the
 *  option, which is the thing that prompts an upgrade. */
export const DAY_OPTIONS: { key: number | "all"; label: string }[] = [
  { key: 7, label: "Last 7 days" },
  { key: 30, label: "Last 30 days" },
  { key: 90, label: "Last 90 days" },
  { key: 365, label: "Last year" },
  { key: "all", label: "All time" },
];

/** The page size, and the endpoint's documented maximum. */
export const HISTORY_PAGE_SIZE = 25;
export const HISTORY_PAGE_MAX = 100;
