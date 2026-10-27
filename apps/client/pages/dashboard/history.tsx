import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import tradingV2Service from "../../services/tradingV2Service";
import subscriptionV2Service from "../../services/subscriptionV2Service";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useBook from "../../lib/hooks/useBook";
import useRevalidate from "../../lib/hooks/useRevalidate";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import { isUnavailable, unavailableReason } from "../../lib/botHealthV2";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import { error as toastError } from "../../components/alert/Toast";
import { LockIcon } from "../../components/dashboard/focus/icons";
import { HistoryV2, HistoryV2ExitReason, HistoryV2Query } from "../../types/tradingV2";
import {
  metricNum,
  pctLabel,
  plainMoney,
  signedMoney,
  toneClass,
  winRateLabel,
  winRatePct,
} from "../../lib/tradingV2Metrics";
import {
  DAY_OPTIONS,
  HISTORY_PAGE_SIZE,
  browserTz,
  closedAtClock,
  dayHeading,
  groupByDay,
  heldLabel,
  missingFills,
  rowDecider,
  windowCaption,
} from "../../lib/tradingV2History";

/**
 * History — every position that has closed, from `GET /trading_v2/history/`.
 *
 * The page waited on this endpoint for its whole life and showed a preview
 * ribbon over placeholder dashes. Three rules now shape it:
 *
 *  - **The summary is not derived from the rows.** `summary`, `by_bot` and
 *    `days` cover everything the filters match; `results` is one page of 25.
 *    Totalling the page would report "last 25 closes" under a 30-day heading
 *    and would change every time someone paged.
 *  - **A row with no recorded sale is a dash, not a zero.** It comes back
 *    with `exit_reason: "UNKNOWN"` and `unavailable.realised_pnl`, and the
 *    backend already excludes it from the totals. Printing $0.00 would drag a
 *    win rate down with trades nobody can price.
 *  - **The plan caps the window.** Asking for more than it keeps answers with
 *    what it keeps plus `record_limited`, not an error — so the banner
 *    explains the gap rather than the page pretending nothing is missing.
 */

/* The design's three coloured exit labels. Anything else stays neutral rather
   than being forced into one of them. */
const EXIT_TONE: Record<string, string> = {
  STOP_HIT: "st3",
  SYSTEM_CLOSED: "st3",
  TRAILING_STOP: "tr3",
  TAKE_PROFIT: "tr3",
  BOT_CLOSED: "bc3",
  MANUAL: "bc3",
};

const DashboardHistoryPage = () => {
  const axiosToken = useAxiosAuth();
  const dispatch = useDispatch<AppDispatch>();
  const book = useBook();
  const { entitlements, meLoaded } = useSelector((state: RootState) => state.subscriptionV2);

  /* The browser's zone decides which day a close lands on, so it is read once
     and sent on every call — the server's default is UTC, which would regroup
     an evening's trades under the next day for anyone east of it. */
  const tz = useMemo(() => browserTz(), []);

  const [days, setDays] = useState<number | "all">(30);
  const [bot, setBot] = useState<string>("");
  const [trade, setTrade] = useState<string>("");
  const [pair, setPair] = useState<string>("");
  const [exit, setExit] = useState<string>("");
  const [offset, setOffset] = useState(0);

  /**
   * History is on triggers only — no interval, per §9.
   *
   * Nothing but a position CLOSING can add a row here, and that always
   * arrives as a notification. A timer would be re-asking a question whose
   * answer cannot have changed, on the heaviest query the dashboard makes.
   *
   * The counter is folded into the request key rather than calling a refresh
   * function, so the refetch reproduces the filters and the page the user is
   * actually on. A new row appearing must not silently move someone reading
   * page three back to page one.
   */
  const stale = useRevalidate("history");

  const [data, setData] = useState<HistoryV2 | null>(null);
  const [asked, setAsked] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const query = useMemo<HistoryV2Query>(
    () => ({
      book,
      days,
      tz,
      bot: bot === "" ? undefined : bot === "candleai" || bot === "none" ? bot : Number(bot),
      trade: trade === "" ? undefined : Number(trade),
      pair: pair || undefined,
      exit: (exit || undefined) as HistoryV2ExitReason | undefined,
      limit: HISTORY_PAGE_SIZE,
      offset,
    }),
    [book, days, tz, bot, trade, pair, exit, offset],
  );

  /* Serialised, so the effect keys on the VALUES rather than on a fresh
     object every render. */
  const queryKey = JSON.stringify({ ...query, stale });
  const askedRef = useRef<string>("");
  /* The filters alone, without `stale`. It tells a background revalidation
     apart from a filter change, which matters only when one FAILS: new
     filters with no answer must blank the page, but a failed refresh of
     filters already on screen must not throw away rows that were true when
     they were read. */
  const filterKey = JSON.stringify(query);
  const shownFilterKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    if (askedRef.current === queryKey) return;
    askedRef.current = queryKey;

    let live = true;
    let landed = false;
    tradingV2Service
      /* `stale` rides along in the key only to force a re-run; it is not a
         query parameter and must not be sent. */
      .getHistory(axiosToken, query)
      .then((page) => {
        if (!live) return;
        landed = true;
        setData(page);
        shownFilterKey.current = filterKey;
        setFailed(null);
        setAsked(true);
      })
      .catch((err: any) => {
        if (!live) return;
        landed = true;
        /* Only blank for filters nothing has answered for yet. */
        if (shownFilterKey.current !== filterKey) setData(null);
        setFailed(err?.message || "Couldn't load your history.");
        setAsked(true);
      });

    return () => {
      live = false;
      /* Released only when the reply was discarded, or the next run skips the
         request as "already asked" and the page reads as loading for good. */
      if (!landed && askedRef.current === queryKey) askedRef.current = "";
    };
    /* `query` and `filterKey` are both derived from the same values as
       `queryKey`, so they cannot be stale when it changes. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, queryKey]);

  /* Entitlements decide whether Export is offered at all. The server refuses
     it anyway with the sentence to show; this only keeps a Desk-only button
     from looking available on every plan. */
  const meRef = useRef(false);
  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || meRef.current || meLoaded) return;
    meRef.current = true;
    dispatch(subscriptionV2Service.getMe(axiosToken));
  }, [axiosToken, dispatch, meLoaded]);

  /* Any filter change starts again at the first page: keeping the offset
     would land someone on "showing 51–75 of 12" and an empty list. */
  const setFilter = (apply: () => void) => {
    apply();
    setOffset(0);
  };

  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      const { blob, filename } = await tradingV2Service.exportHistory(axiosToken, query);
      /* The endpoint needs the auth header, so the browser cannot simply be
         sent to the URL — the file arrives as a blob and is handed to a
         temporary link instead. */
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      toastError(err?.message || "Couldn't export your history.");
    } finally {
      setExporting(false);
    }
  }, [axiosToken, query]);

  const summary = data?.summary;
  const byBot = data?.by_bot ?? [];
  const filters = data?.filters;
  const count = data?.count ?? 0;
  /* Memoised off `data` rather than off a fresh `?? []` each render, which
     would rebuild the groups on every keystroke elsewhere on the page. */
  const rows = useMemo(() => data?.results ?? [], [data]);
  const grouped = useMemo(() => groupByDay(rows, data?.days ?? []), [rows, data?.days]);

  const winRate = metricNum(summary?.win_rate);
  const netPct = metricNum(summary?.net_return_pct);
  const netPnl = metricNum(summary?.realised_pnl);
  const avgWinPct = metricNum(summary?.avg_win_pct);
  const avgLossPct = metricNum(summary?.avg_loss_pct);
  const bestDayPnl = metricNum(summary?.best_day?.net_pnl);
  const missingCount = summary?.positions_missing_fills ?? 0;

  const caption = windowCaption(query, data?.record_days ?? null);
  const canExport = entitlements?.record_export !== false;
  const loading = !asked;

  /* The plan's own sentence when it shortened the window, which is the one
     worth showing — it names the number of days and what lifts it. */
  const limitNote = data?.record_limited
    ? isUnavailable(data.unavailable, "earlier_history")
      ? unavailableReason(data.unavailable, "earlier_history")
      : `Your plan keeps ${data.record_days ?? 30} days of history. Upgrade to see further back.`
    : null;

  /**
   * A figure slot that is still in flight shimmers rather than printing a
   * dash, which would read as "nothing closed".
   *
   * It returns the value BARE, never wrapped in a `<span>`. `.fx-sm span` is
   * the tile's LABEL rule — 9px, uppercase, mono, muted — so a span around
   * the number inherits the label's styling and silently shrinks a 31px
   * figure down to the size of the word above it. That is what made this row
   * render as five lines of small grey text instead of the design's
   * headline figures.
   */
  const figure = (value: string) =>
    loading ? <i className="fx-skel" aria-label="Reading" /> : value;

  /**
   * Which way a win rate leans.
   *
   * Unlike the figures beside it, a win rate carries no sign — so the tone
   * comes from the only boundary it has: more won than lost, or fewer. The
   * caption directly beneath spells out the counts it is read from, so the
   * colour never has to be taken on trust.
   */
  const winRateTone = (() => {
    const pct = winRatePct(winRate);
    if (pct == null) return "mut2";
    if (pct > 50) return "up3";
    if (pct < 50) return "dn3";
    return "";
  })();

  return (
    <>
      <Head>
        <title>History | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="history">
        <TopBar
          crumb="Dashboard / History"
          title="History"
          subtitle="Every position your bots have opened and closed."
        />

        {limitNote && (
          <div className="fx-inuse" style={{ marginTop: "clamp(16px,2vw,24px)" }}>
            <i>◔</i>
            <p>
              <b>Showing what your plan keeps.</b> {limitNote}{" "}
              <Link href="/dashboard/subscription" style={{ color: "var(--fx-teal2)" }}>
                See plans
              </Link>
            </p>
          </div>
        )}

        {failed && (
          <div className="fx-failmsg" style={{ marginTop: "clamp(16px,2vw,24px)" }}>
            <b>Couldn&rsquo;t load your history.</b> {failed} Nothing on your account has changed —
            this is only what this page could read just now.
          </div>
        )}

        {/* ---- summary ---- over everything the filters match, NOT over the
             page of rows below. */}
        <div className="fx-summary rv" style={{ marginTop: "clamp(16px,2vw,22px)" }}>
          {/* A count is not a result — it has no direction to colour, so it
              stays in the plain text colour the design gives it. */}
          <div className="fx-sm">
            <span>Closed trades</span>
            <b className={summary?.closed_trades ? undefined : "mut2"}>
              {figure((summary?.closed_trades ?? 0).toLocaleString())}
            </b>
            <i>{caption}</i>
          </div>
          <div className="fx-sm">
            <span>Win rate</span>
            <b className={winRateTone}>
              {figure(winRate == null ? "—" : winRateLabel(winRate))}
            </b>
            <i>
              {loading
                ? "reading…"
                : winRate == null
                  ? "nothing closed yet"
                  : `${summary?.wins ?? 0} won · ${summary?.losses ?? 0} lost`}
            </i>
          </div>
          {/* An average winner is positive by definition, but it is toned
              from its own sign rather than assumed green — a figure that
              came back negative would be worth seeing, not painting over. */}
          <div className="fx-sm">
            <span>Average win</span>
            <b className={toneClass(avgWinPct, "up3", "dn3")}>
              {figure(avgWinPct == null ? "—" : pctLabel(avgWinPct))}
            </b>
            <i>
              {loading
                ? "reading…"
                : avgLossPct == null
                  ? "vs. average loss"
                  : `avg loss ${pctLabel(avgLossPct)}`}
            </i>
          </div>
          <div className="fx-sm">
            <span>Net · {caption.replace("last ", "")}</span>
            <b className={toneClass(netPct ?? netPnl, "up3", "dn3")}>
              {figure(
                netPct != null ? pctLabel(netPct) : netPnl != null ? signedMoney(netPnl) : "—",
              )}
            </b>
            <i>
              {loading
                ? "reading…"
                : netPnl != null
                  ? signedMoney(netPnl)
                  : "no closed trades in this window"}
            </i>
          </div>
          {/* The best day can still be a loss — on a losing stretch it is the
              least bad one. It is toned from its own figure so a red "best
              day" reads as the warning it is. */}
          <div className="fx-sm">
            <span>Best day</span>
            <b className={toneClass(bestDayPnl, "up3", "dn3")}>
              {figure(bestDayPnl == null ? "—" : signedMoney(bestDayPnl))}
            </b>
            <i>
              {loading
                ? "reading…"
                : summary?.best_day?.date
                  ? dayHeading(summary.best_day.date)
                  : "nothing closed yet"}
            </i>
          </div>
        </div>

        {/* ---- filters ---- every option comes from the response, so a
             filter can never offer something that would return nothing. */}
        <div className="fx-filters rv">
          <select
            className={`fx-fs ${days !== 30 ? "act2" : ""}`}
            value={String(days)}
            aria-label="Date range"
            onChange={(e) =>
              setFilter(() => setDays(e.target.value === "all" ? "all" : Number(e.target.value)))
            }
          >
            {DAY_OPTIONS.map((o) => (
              <option key={String(o.key)} value={String(o.key)}>
                {o.label}
              </option>
            ))}
          </select>

          <select
            className={`fx-fs ${bot ? "act2" : ""}`}
            value={bot}
            aria-label="Bot"
            onChange={(e) => setFilter(() => setBot(e.target.value))}
          >
            <option value="">All bots</option>
            {(filters?.bots ?? []).map((o) => (
              <option key={String(o.key)} value={String(o.key)}>
                {o.name}
              </option>
            ))}
          </select>

          <select
            className={`fx-fs ${trade ? "act2" : ""}`}
            value={trade}
            aria-label="Trade"
            onChange={(e) => setFilter(() => setTrade(e.target.value))}
          >
            <option value="">All trades</option>
            {(filters?.trades ?? []).map((o) => (
              <option key={String(o.key)} value={String(o.key)}>
                {o.name}
              </option>
            ))}
          </select>

          <select
            className={`fx-fs ${pair ? "act2" : ""}`}
            value={pair}
            aria-label="Pair"
            onChange={(e) => setFilter(() => setPair(e.target.value))}
          >
            <option value="">All pairs</option>
            {(filters?.pairs ?? []).map((o) => (
              <option key={String(o.key)} value={String(o.key)}>
                {o.name}
              </option>
            ))}
          </select>

          <select
            className={`fx-fs ${exit ? "act2" : ""}`}
            value={exit}
            aria-label="Exit reason"
            onChange={(e) => setFilter(() => setExit(e.target.value))}
          >
            <option value="">All exits</option>
            {(filters?.exit_reasons ?? []).map((o) => (
              <option key={String(o.key)} value={String(o.key)}>
                {o.name}
              </option>
            ))}
          </select>

          {/* Desk only — but always present, as the design has it. Hiding it
              on other plans meant the row simply ended after the filters,
              which reads as a feature that does not exist rather than one
              this plan does not include. Locked states the truth and offers
              the way out of it; the server refuses the call regardless. */}
          {canExport ? (
            <button
              type="button"
              className="fx-exp"
              disabled={exporting || !count}
              title={count ? "Download these rows as CSV" : "Nothing to export in this window"}
              onClick={onExport}
            >
              {exporting ? "Preparing…" : "Export"}
            </button>
          ) : (
            <Link
              href="/dashboard/subscription"
              className="fx-exp lock9"
              title="Exporting your history is part of the Desk plan."
            >
              <LockIcon />
              Export
            </Link>
          )}
        </div>

        {/* ---- per-bot strip ---- each bot's own slice of the same filters.
             `key` is what the bot filter takes, so clicking one narrows the
             page to it. */}
        {byBot.length > 0 && (
          <div className="fx-bbar rv">
            {byBot.slice(0, 4).map((b) => {
              const net = metricNum(b.net_return_pct);
              const money = metricNum(b.realised_pnl);
              const rate = metricNum(b.win_rate);
              const active = bot === String(b.key);
              return (
                <button
                  type="button"
                  className="fx-bb"
                  key={String(b.key)}
                  aria-pressed={active}
                  onClick={() => setFilter(() => setBot(active ? "" : String(b.key ?? "")))}
                >
                  <div className="bt2">
                    <i />
                    <b>{b.name}</b>
                  </div>
                  <div className="bnums">
                    <span>
                      Closed
                      <b className={b.closed_trades ? undefined : "mut2"}>
                        {(b.closed_trades ?? 0).toLocaleString()}
                      </b>
                    </span>
                    <span>
                      Win rate
                      <b className={rate == null ? "mut2" : undefined}>
                        {rate == null ? "—" : winRateLabel(rate)}
                      </b>
                    </span>
                    <span>
                      Net
                      <b className={toneClass(net ?? money, "up3", "dn3")}>
                        {net != null ? pctLabel(net) : money != null ? signedMoney(money) : "—"}
                      </b>
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* ---- the rows, grouped by day ---- */}
        {loading && (
          <p className="fx-hint" style={{ padding: "28px 4px" }}>
            Loading your history…
          </p>
        )}

        {!loading && !failed && rows.length === 0 && (
          <div className="fx-flat2" style={{ marginTop: "18px" }}>
            <b>Nothing closed in this window.</b> A position lands here when it closes — by its
            stop, its trail, or a decision from your bot.
          </div>
        )}

        {grouped.map((group) => {
          const dayNet = metricNum(group.day?.net_pnl);
          return (
            <div key={group.date}>
              <div className="fx-day">
                <h3>
                  {dayHeading(group.date)}{" "}
                  {/* The whole day's figures, from `days[]` — not a total of
                      the rows on this page, which may be a slice of it. */}
                  <span className="dn4">
                    · {(group.day?.closed ?? group.rows.length).toLocaleString()} closed
                  </span>
                </h3>
                <span className={`dt2 ${dayNet == null ? "mut2" : toneClass(dayNet, "up3", "dn3")}`}>
                  {dayNet == null ? "—" : signedMoney(dayNet)}
                </span>
              </div>

              {group.rows.map((r, i) => {
                const unpriced = missingFills(r);
                const pct = metricNum(r.return_pct);
                const money = metricNum(r.realised_pnl);
                const entry = metricNum(r.entry_price);
                const exitPrice = metricNum(r.exit_price);
                const tone = unpriced ? "mut2" : toneClass(pct ?? money, "up3", "dn3");
                return (
                  <div className="fx-hrow" key={r.position_id ?? `${group.date}-${i}`}>
                    <div className="fx-tm">{closedAtClock(r.closed_at)}</div>
                    <div className="fx-hp">
                      <b>{r.pair || "—"}</b>
                      {/* Spot is long-only, so this is always BUY. It is kept
                          because the row reads oddly without it, not because
                          a SELL can appear. */}
                      <span className="fx-side b2">{(r.side || "buy").toLowerCase()}</span>
                    </div>
                    <div className="fx-hmeta">
                      <em>{rowDecider(r)}</em>
                      {r.trade?.name ? ` · ${r.trade.name}` : ""}
                      <br />
                      {entry == null || exitPrice == null
                        ? "price not recorded"
                        : `${plainMoney(entry)} → ${plainMoney(exitPrice)}`}{" "}
                      · held {heldLabel(r.held_seconds)}
                    </div>
                    <div className={`fx-exit ${EXIT_TONE[String(r.exit_reason)] ?? ""}`}>
                      {r.exit_reason_label || "Unknown"}
                    </div>
                    {/* A sale that was never recorded is a dash, never $0.00:
                        the backend keeps it out of every total above, and a
                        zero here would contradict them. */}
                    <div className={`fx-hres ${tone}`}>
                      {unpriced ? "—" : pct != null ? pctLabel(pct) : money != null ? signedMoney(money) : "—"}
                      <small>
                        {unpriced
                          ? unavailableReason(r.unavailable, "realised_pnl") || "sale not recorded"
                          : money != null
                            ? signedMoney(money)
                            : "after fees"}
                      </small>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}

        {count > 0 && (
          <div className="fx-more2">
            <span>
              Showing {offset + 1}–{offset + rows.length} of {count.toLocaleString()}
            </span>
            <div className="fx-pgb">
              <button
                type="button"
                disabled={offset === 0}
                aria-label="Previous page"
                onClick={() => setOffset((o) => Math.max(0, o - HISTORY_PAGE_SIZE))}
              >
                ‹
              </button>
              <button
                type="button"
                disabled={offset + rows.length >= count}
                aria-label="Next page"
                onClick={() => setOffset((o) => o + HISTORY_PAGE_SIZE)}
              >
                ›
              </button>
            </div>
          </div>
        )}

        {/* The one caveat the totals above depend on, said once and only when
            it applies. */}
        {missingCount > 0 && (
          <p className="fx-hint" style={{ marginTop: "18px" }}>
            {missingCount.toLocaleString()} closed position
            {missingCount === 1 ? " has" : "s have"} no recorded sale, so {missingCount === 1 ? "it is" : "they are"}{" "}
            shown as &ldquo;—&rdquo; and counted in none of the figures above. The position closed;
            only the fill that priced it is missing.
          </p>
        )}
      </DashboardShell>
    </>
  );
};

export default DashboardHistoryPage;
