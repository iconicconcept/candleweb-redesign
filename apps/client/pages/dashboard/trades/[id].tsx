import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import tradingV2Service from "../../../services/tradingV2Service";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import DashboardShell from "../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../components/dashboard/focus/TopBar";
import TradeDecisionLog from "../../../components/dashboard/focus/TradeDecisionLog";
import OpenPositionsList from "../../../components/dashboard/focus/OpenPositionsList";
import useOpenPositions from "../../../lib/hooks/useOpenPositions";
import { indicatorChips } from "../../../lib/tradingV2Indicators";
import { TradeMetricsV2, TradeV2, TradeV2Status } from "../../../types/tradingV2";
import {
  DEFAULT_WINDOW_DAYS,
  REALISED_FIELDS,
  REALISED_PCT_FIELDS,
  WIN_RATE_FIELDS,
  closedCount,
  matchedByNote,
  metricRead,
  plainMoney,
  pnlCellParts,
  realisedPct,
  realisedPnl,
  riskNowParts,
  sharesPositionsWith,
  toneClass,
  winRate,
  winRateLabel,
} from "../../../lib/tradingV2Metrics";

const STATUS_META: Record<TradeV2Status, { label: string; cls: string }> = {
  RUNNING: { label: "Running", cls: "on5" },
  PAUSED: { label: "Paused", cls: "off6" },
  ERROR: { label: "Not responding", cls: "bad5" },
};

const DIRECTION_LABEL: Record<string, string> = {
  BOTH: "Long & short",
  LONG: "Long only",
  SHORT: "Short only",
};

/* The progress rail's thresholds, from the design. 20 is the same number the
   Overview's review-readiness meter uses — a bot review reads ~20 closed
   trades on one prompt — so they are deliberately the same figure. */
const ENOUGH_HISTORY = 20;
const COMPARISON_AT = 50;

const CTA_STYLE = { flex: "0 0 auto", padding: "11px 18px", fontSize: "13.5px" } as const;

/**
 * One trade, in full — built to `candleweb-trade-detail-focus.html`.
 *
 * `/dashboard/trades/new?id=<id>` remains the EDIT screen and both "Edit"
 * buttons go there; this is the read screen. `new.tsx` is a static route so
 * it keeps winning over this dynamic one — `/dashboard/trades/new` is never
 * parsed as an id.
 *
 * Every section of the design is present. The open position — size, entry,
 * mark, stop and unrealised, with the stop-distance track — is live on
 * `GET /positions/?trade=<id>`, an exact filter: positions carry `trade_id`,
 * unlike `/trades/{id}/metrics/`, which matches by venue and symbol and so
 * reports the same positions for two trades on one pair.
 *
 * Two things still cannot be filled and say so rather than showing an
 * invented number:
 *
 *  - **The order under each decision**, and the band's "N became orders".
 *    That is `outcome` on `GET /decisions/{id}/` — detail-only and typed
 *    `additionalProperties: {}`. P3 §3.M13.
 *  - **"Does confidence mean anything?"**, which buckets closed positions by
 *    confidence. Same `outcome` dependency, one request per decision, and
 *    bucket averages belong server-side. P3 §3.M14.
 *
 * The design's title is a trade *name* ("ETH momentum"). `TradeV2` has no
 * `name` field in the live schema, so the pair leads here exactly as it does
 * in the list. P3 §3.M12.
 */
const TradeDetailPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const router = useRouter();

  const { trades } = useSelector((state: RootState) => state.tradingV2);

  const id = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const valid = id != null && Number.isFinite(id);

  const [trade, setTrade] = useState<TradeV2 | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);
  const loadedRef = useRef<number | null>(null);

  /* Money and risk for this one trade. Local state — nothing else reads it. */
  const [metrics, setMetrics] = useState<TradeMetricsV2 | null>(null);
  const [metricsAsked, setMetricsAsked] = useState(false);

  /* Only for the band's "Decisions" tile. The log below does its own paging,
     so this asks for a single row and reads `count` off the envelope. */
  const [decisionCount, setDecisionCount] = useState<number | null>(null);

  /* Bumped after a pause/resume so the log re-reads. */
  const [refreshKey, setRefreshKey] = useState(0);

  // hydrate the trade: from the store if the list has been loaded, else fetch
  useEffect(() => {
    if (!valid || loadedRef.current === id) return;
    const fromStore = trades.find((t) => t.id === id);
    if (fromStore) {
      loadedRef.current = id;
      setTrade(fromStore);
      return;
    }
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    loadedRef.current = id;
    dispatch(tradingV2Service.getTrade({ api: axiosToken, id: id as number })).then((res: any) => {
      if (res?.payload?.id) setTrade(res.payload as TradeV2);
      else setNotFound(true);
    });
  }, [valid, id, trades, axiosToken, dispatch]);

  const loadMetrics = useCallback(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    tradingV2Service
      .getTradeMetrics(axiosToken, id as number, { window_days: DEFAULT_WINDOW_DAYS })
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setMetricsAsked(true));
  }, [axiosToken, id, valid]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    tradingV2Service
      .listDecisions(axiosToken, { trade: id as number, limit: 1 })
      .then((p) => setDecisionCount(p.count))
      .catch(() => setDecisionCount(null));
  }, [axiosToken, id, valid]);

  /* Each figure read once so no two places can disagree about what the same
     response said. A PnL cell is a percentage over an amount, per the
     design — `pnlCellParts` builds that pair. */
  const pct = metricRead(metrics, REALISED_PCT_FIELDS, realisedPct(metrics));
  const amount = metricRead(metrics, REALISED_FIELDS, realisedPnl(metrics));
  const net = pnlCellParts(pct, amount);
  const wins = metricRead(metrics, WIN_RATE_FIELDS, winRate(metrics));
  const risk = riskNowParts(metrics);

  /* This trade's open positions. `?trade=` is an EXACT filter — positions
     carry `trade_id` — unlike `/trades/{id}/metrics/`, which matches by venue
     and symbol and so reports the same positions for two trades on one pair. */
  const {
    rows: tradePositions,
    asked: tradePositionsAsked,
    failed: tradePositionsFailed,
  } = useOpenPositions(axiosToken, { status: "open", trade: valid ? (id as number) : undefined });
  const closed = closedCount(metrics);

  /* `closed` is null until the count is reported, and a null must not read as
     "not yet" — an unmet milestone and an unknown one say different things. */
  const hasEnoughHistory = closed != null && closed >= ENOUGH_HISTORY;
  const hasComparison = closed != null && closed >= COMPARISON_AT;

  /* Positions are matched by venue+symbol, so any other trade on this pair
     and account reports the SAME positions. */
  const twins = trade ? sharesPositionsWith(trade, trades) : [];
  const matchNote = matchedByNote(metrics, twins.length > 0);

  const chips = trade ? indicatorChips(trade.indicators) : [];
  const meta = trade ? STATUS_META[trade.status] ?? STATUS_META.PAUSED : null;
  const running = trade?.status === "RUNNING";
  const isAi = trade?.decider_type === "CANDLE_AI";
  const decider = isAi ? "CandleAI" : trade?.bot_name || "Own bot";

  /* The design writes the caps as "2.0% · $40" and "50% · $1,000" — the rule
     and what it comes to on this allocation, which is the number that
     actually tells you something. */
  const allocated = trade ? parseFloat(trade.allocated_amount) || 0 : 0;
  const riskPct = trade ? parseFloat(trade.risk_pct) || 0 : 0;
  const riskCash = allocated * (riskPct / 100);
  const maxCash = trade ? allocated * (trade.max_size_pct / 100) : 0;

  const toggleRun = async () => {
    if (!trade) return;
    setBusy(true);
    try {
      const action = running ? tradingV2Service.pauseTrade : tradingV2Service.startTrade;
      const res: any = await dispatch(action({ api: axiosToken, id: trade.id }));
      if (res?.payload?.id) setTrade(res.payload as TradeV2);
      /* Both are re-read: pausing changes what is at risk, and the log stops
         gaining rows. */
      loadMetrics();
      setRefreshKey((k) => k + 1);
    } finally {
      setBusy(false);
    }
  };

  const title = trade?.pair_name || (trade ? `Pair #${trade.pair}` : "Trade");

  return (
    <>
      <Head>
        <title>{trade ? `${title} | Candleweb` : "Trade | Candleweb"}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="trades">
        {/* The design puts Pause and Edit in the header row beside the
            theme/bell/account buttons, not floating in the page body. */}
        <TopBar
          crumb={
            <>
              <Link href="/dashboard/trades">‹ My trades</Link> / {title}
            </>
          }
          title={title}
          hideHeading
          actions={
            trade ? (
              <>
                <button
                  type="button"
                  className="fx-cta ghost2"
                  style={CTA_STYLE}
                  disabled={busy}
                  onClick={toggleRun}
                >
                  {busy ? "…" : running ? "Pause" : "Start"}
                </button>
                <Link
                  className="fx-cta ghost2"
                  href={`/dashboard/trades/new?id=${trade.id}`}
                  style={CTA_STYLE}
                >
                  Edit
                </Link>
              </>
            ) : undefined
          }
        />

        {!trade && (
          <p className="fx-hint" style={{ padding: "24px 4px" }}>
            {!valid || notFound ? "Trade not found." : "Loading this trade…"}
          </p>
        )}

        {trade && meta && (
          <>
            {/* ---- title block ---- */}
            <div className="rv">
              {/* `.fx-title` already carries the design's 9px top margin. */}
              <h1 className="fx-title">{title}</h1>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                  marginTop: "10px",
                }}
              >
                <span className={`fx-run2 ${meta.cls}`}>{meta.label}</span>
                <span className={`fx-byb ${isAi ? "ai2" : ""}`}>● {decider}</span>
                <span className="fx-src">
                  {title} · {trade.timeframe} ·{" "}
                  {trade.exchange_name || `Account #${trade.exchange_account}`}
                </span>
              </div>
            </div>

            {/* ---- the band, the design's five ---- */}
            <div className="fx-cap2 rv d1">
              <div className="fx-cp">
                <span>Allocated</span>
                <b>{plainMoney(allocated)}</b>
                {/* Allocation is a ceiling; a position is money actually on
                    the venue. The caption says which of the two is deployed. */}
                <i>
                  {!tradePositionsAsked || tradePositionsFailed
                    ? "the ceiling for this trade"
                    : tradePositions.length === 0
                      ? "none deployed yet"
                      : `${tradePositions.length} position${tradePositions.length === 1 ? "" : "s"} open`}
                </i>
              </div>
              <div className="fx-cp">
                <span>Closed trades</span>
                <b className={closed == null ? "mut2" : undefined}>
                  {closed == null ? "—" : closed.toLocaleString()}
                </b>
                <i>
                  {closed == null
                    ? "not reported yet"
                    : `since ${new Date(trade.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "long",
                      })}`}
                </i>
              </div>
              <div className="fx-cp">
                <span>Win rate</span>
                <b className={wins.available && wins.value != null ? undefined : "mut2"}>
                  {wins.available ? winRateLabel(wins.value) : "—"}
                </b>
                <i>
                  {wins.available && wins.value != null ? "of closed trades" : "not reported yet"}
                </i>
              </div>
              <div className="fx-cp">
                <span>Net · {DEFAULT_WINDOW_DAYS}d</span>
                <b className={toneClass(net.tone, "up6", "fx-dn")}>{net.figure}</b>
                <i>{net.caption}</i>
              </div>
              <div className="fx-cp">
                <span>Decisions</span>
                <b className={decisionCount == null ? "mut2" : undefined}>
                  {decisionCount == null ? "—" : decisionCount.toLocaleString()}
                </b>
                {/* The design reads "23 became orders". That count is in
                    `outcome`, which is detail-only — see §3.M13. */}
                <i>answers recorded</i>
              </div>
            </div>

            {matchNote && (
              <p className="fx-hint" style={{ marginTop: "12px" }}>
                {matchNote}
              </p>
            )}

            {/* ---- open position ---- live on `GET /positions/?trade=<id>`,
                 which is an exact filter: positions carry `trade_id`, unlike
                 the metrics endpoint's venue+symbol matching. */}
            <section className="fx-sec rv d2">
              <div className="fx-sh">
                <h2>
                  Open position
                  {tradePositions.length > 1 && (
                    <span className="sub2">{tradePositions.length} open</span>
                  )}
                </h2>
              </div>
              {tradePositionsFailed ? (
                <div className="fx-failmsg" style={{ marginTop: 0 }}>
                  <b>Couldn&rsquo;t load this trade&rsquo;s positions.</b> {tradePositionsFailed}
                </div>
              ) : !tradePositionsAsked ? (
                <p className="fx-hint" style={{ padding: "14px 4px" }}>
                  Loading…
                </p>
              ) : (
                <OpenPositionsList
                  positions={tradePositions}
                  empty={
                    <>
                      <b>Nothing open on this trade.</b> It opens a position when its decider says
                      so and the gate lets the order through — what the armed stops would cost is
                      below.
                    </>
                  }
                />
              )}
            </section>

            {/* ---- how this trade is configured ---- */}
            <section className="fx-sec rv">
              <div className="fx-sh">
                <h2>How this trade is configured</h2>
                <Link className="fx-link" href={`/dashboard/trades/new?id=${trade.id}`}>
                  Edit setup →
                </Link>
              </div>
              <div className="fx-cfg">
                <div className="fx-cg">
                  <span>Decided by</span>
                  <b className="tealb">{decider}</b>
                </div>
                <div className="fx-cg">
                  <span>Risk per trade</span>
                  <b>
                    {riskPct}% · {plainMoney(riskCash)}
                  </b>
                </div>
                <div className="fx-cg">
                  <span>Max position</span>
                  <b>
                    {trade.max_size_pct}% · {plainMoney(maxCash)}
                  </b>
                </div>
                <div className="fx-cg">
                  <span>Direction</span>
                  <b>{DIRECTION_LABEL[trade.direction] || trade.direction}</b>
                </div>
              </div>

              <div className="fx-ind2" style={{ marginTop: "12px" }}>
                {chips.length ? (
                  chips.map((c) => (
                    <span className="fx-ip" key={c}>
                      {c}
                    </span>
                  ))
                ) : (
                  <span className="fx-ip">no indicators</span>
                )}
                <span className="fx-ip">{trade.candle_history_len} candles</span>
                <span className="fx-ip">
                  {trade.trailing_stop ? "Trailing stop on" : "Fixed stop"}
                </span>
              </div>

              {/* `at_risk_now` counts only stops ARMED on the venue, so a
                  position with no stop adds nothing. The unprotected count
                  travels with it — see `riskNowParts`. */}
              <div className="fx-riskline" style={{ marginTop: "16px" }}>
                <span>If every stop hit at once</span>
                <b className={risk.read.available && risk.read.value != null ? "fx-dn" : "mut2"}>
                  {risk.read.available && risk.read.value != null
                    ? `−${plainMoney(risk.read.value)}`
                    : "—"}
                </b>
              </div>
              <div className="fx-riskline">
                <span>Open positions with no stop</span>
                <b
                  className={
                    risk.unprotected == null ? "mut2" : risk.unprotected > 0 ? "fx-dn" : ""
                  }
                >
                  {risk.unprotected == null ? "—" : risk.unprotected}
                </b>
              </div>
              {metricsAsked && metrics && (
                <p className="fx-hint" style={{ marginTop: "10px" }}>
                  {risk.caveat}
                </p>
              )}
              {metricsAsked && !metrics && (
                <p className="fx-hint" style={{ marginTop: "10px" }}>
                  This trade&rsquo;s figures couldn&rsquo;t be read just now.{" "}
                  <button type="button" className="fx-mini" onClick={loadMetrics}>
                    Try again
                  </button>
                </p>
              )}
            </section>

            {/* ---- decisions + the right rail, the design's two columns ---- */}
            <div className="fx-two2">
              <section data-rv>
                <div className="fx-sh">
                  <h2>
                    Decisions and orders{" "}
                    <span className="sub2">
                      {decisionCount == null
                        ? "what this trade's decider answered"
                        : `${decisionCount.toLocaleString()} decision${
                            decisionCount === 1 ? "" : "s"
                          }`}
                    </span>
                  </h2>
                </div>
                <TradeDecisionLog
                  api={axiosToken}
                  trade={trade.id}
                  pageSize={6}
                  refreshKey={refreshKey}
                />
              </section>

              <aside className="fx-side2" data-rv>
                {/* ---- does confidence mean anything? ----
                     The design buckets this trade's closed positions by the
                     bot's confidence and shows each bucket's average return.
                     `confidence` is on every decision; the RETURN is in
                     `outcome`, which is detail-only and undocumented — so the
                     buckets would be one request per decision against guessed
                     keys. Bucket averages also belong server-side. §3.M14. */}
                <div className="fx-sh">
                  <h2>Does confidence mean anything?</h2>
                </div>
                <div className="fx-cal">
                  <p className="fx-calnote" style={{ marginTop: 0 }}>
                    <b>Not yet.</b> Answering this means comparing what each decision scored itself
                    against what it actually returned. The score is on every decision; the return
                    lives with the order it became, which has no list endpoint — so the buckets
                    would mean one request per decision, against field names nobody has documented.
                  </p>
                  <p className="fx-calnote" style={{ marginTop: "10px" }}>
                    Confidence is self-reported by your bot and isn&rsquo;t calibrated by us — it
                    only ever means something because your own results say so. This panel turns on
                    with a calibration endpoint.
                  </p>
                </div>

                {/* ---- this trade's progress ----
                     Milestones that run off the closed-position count. The
                     design's middle row ("Never breached a limit · 1 order
                     refused, correctly") needs the gate's refusal verdict, so
                     it states what it is waiting for rather than claiming a
                     clean record nobody has checked. */}
                <div className="fx-unlock" style={{ marginTop: "14px" }}>
                  <h4>This trade&rsquo;s progress</h4>
                  <p className="us">
                    {closed == null
                      ? "Milestones turn on once closed positions are reported."
                      : closed >= ENOUGH_HISTORY
                        ? `${closed} of ${ENOUGH_HISTORY} closed — enough to draw conclusions.`
                        : `${closed} of ${ENOUGH_HISTORY} closed — ${
                            ENOUGH_HISTORY - closed
                          } to go before the numbers mean much.`}
                  </p>

                  <div className={`fx-ul ${hasEnoughHistory ? "got3" : ""}`}>
                    <i>{hasEnoughHistory ? "✓" : "1"}</i>
                    <div>
                      <b>Enough history</b>
                      <span>
                        {closed == null
                          ? "Needs a closed-position count"
                          : hasEnoughHistory
                            ? "Numbers are meaningful"
                            : `${ENOUGH_HISTORY - closed} more closed positions`}
                      </span>
                    </div>
                  </div>

                  <div className="fx-ul">
                    <i>◔</i>
                    <div>
                      <b>Never breached a limit</b>
                      <span>
                        Needs the gate&rsquo;s refusal count — a clean record isn&rsquo;t claimed
                        until it can be checked.
                      </span>
                    </div>
                  </div>

                  <div className={`fx-ul ${hasComparison ? "got3" : ""}`}>
                    <i>{hasComparison ? "✓" : "3"}</i>
                    <div>
                      <b>{COMPARISON_AT} closed</b>
                      <span>
                        {closed == null
                          ? "Unlocks pair comparison"
                          : hasComparison
                            ? "Pair comparison unlocked"
                            : `${COMPARISON_AT - closed} to go — unlocks pair comparison`}
                      </span>
                    </div>
                  </div>

                  <p className="fx-tip2">
                    <b style={{ color: "var(--fx-t2)" }}>Worth knowing.</b> A trade needs around{" "}
                    {ENOUGH_HISTORY} closed positions before its win rate or net figure says
                    anything about the strategy rather than about luck.
                  </p>
                </div>
              </aside>
            </div>
          </>
        )}
      </DashboardShell>
    </>
  );
};

export default TradeDetailPage;
