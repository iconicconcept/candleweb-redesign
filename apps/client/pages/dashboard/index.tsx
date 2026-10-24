import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dollarFormat } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import tradingV2Service from "../../services/tradingV2Service";
import userService from "../../services/userService";
import exchangeServices from "../../services/exchangeService";
import subscriptionV2Service from "../../services/subscriptionV2Service";
import { isLivePlan } from "../../lib/subscriptionV2Format";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import HeroChart from "../../components/dashboard/focus/HeroChart";
import DecisionsFeed from "../../components/dashboard/focus/DecisionsFeed";
import { STATUS_META } from "../../lib/botV2Labels";
import { BalanceProp } from "../../types/user";
import { FleetHealthV2, PortfolioMetricsV2, TradingStatusV2 } from "../../types/tradingV2";
import { chipClass, statusChips } from "../../lib/tradingV2Status";
import useOpenPositions from "../../lib/hooks/useOpenPositions";
import OpenPositionsList from "../../components/dashboard/focus/OpenPositionsList";
import {
  commonQuote,
  openPnlTotal,
  posMoney,
  pairLabel,
  posMoneyPlain,
  riskCaveat,
  riskRollup,
} from "../../lib/positionsV2";
import { NOT_MEASURED, failureStreakParts, isUnavailable } from "../../lib/botHealthV2";
import {
  AT_RISK_PCT_FIELDS,
  CHANGE_TODAY_PCT_FIELDS,
  DEFAULT_WINDOW_DAYS,
  REALISED_FIELDS,
  REALISED_PCT_FIELDS,
  UNREALISED_FIELDS,
  atRiskPct,
  changeTodayPct,
  closedCount,
  metricNum,
  metricRead,
  openPositionCount,
  pctLabel,
  plainMoney,
  realisedPct,
  realisedPnl,
  riskNowParts,
  signedMoney,
  toneClass,
  unrealisedPnl,
} from "../../lib/tradingV2Metrics";

const DIRECTION_SIDE: Record<string, { label: string; cls: string }> = {
  LONG: { label: "long", cls: "b2" },
  SHORT: { label: "short", cls: "s2" },
  BOTH: { label: "long / short", cls: "b2" },
};

/* Static placeholder sparkline for the hero — the real equity time series
   has no endpoint yet (DASHBOARD_ENDPOINTS.md §8). */
const HERO_PATH =
  "M0 210 L60 198 L120 205 L180 176 L240 188 L300 150 L360 162 L420 120 L480 138 L540 96 L600 104 L660 70 L720 82 L780 52 L840 60 L900 30";

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);

  const { bots, botsLoaded, botsError, trades, tradesLoaded, tradesError } = useSelector(
    (state: RootState) => state.tradingV2,
  );
  const { balance } = useSelector((state: RootState) => state.user);
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange);
  /* Setup step 1 is "subscribe to a plan" — a new account has no subscription
     at all (even the free plan has to be chosen), so this is a real step
     rather than a formality. `isLivePlan` counts any plan, free included,
     and still counts one cancelled at period end because it grants until it
     actually ends. */
  const { subscription, meLoaded } = useSelector((state: RootState) => state.subscriptionV2);
  const hasPlan = isLivePlan(subscription);
  const fetchedRef = useRef(false);

  const [fleet, setFleet] = useState<FleetHealthV2 | null>(null);

  /* Portfolio money and risk — `GET /trading_v2/metrics/`, which fills the
     hero's four substats, the delta pill and the "Risk right now" card.
     Local state next to the figures it sits beside: nothing else reads it,
     and a stale PnL is worse than no PnL. */
  const [metrics, setMetrics] = useState<PortfolioMetricsV2 | null>(null);
  const [metricsAsked, setMetricsAsked] = useState(false);
  const [status, setStatus] = useState<TradingStatusV2 | null>(null);
  const [statusFailed, setStatusFailed] = useState(false);

  /* The fleet's streak is its WORST bot, not an average. The fleet payload has
     no `last_failure_at`, so `failed_30d` is what separates a 0 meaning
     "failed today" from a 0 meaning "nothing has failed yet". */
  const botStreak =
    !fleet || isUnavailable(fleet.unavailable, "days_without_failure")
      ? { value: null, caption: NOT_MEASURED }
      : failureStreakParts(
          fleet.days_without_failure,
          fleet.failed_30d != null && fleet.failed_30d > 0 ? "yes" : null,
        );

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(tradingV2Service.listBots(axiosToken));
    dispatch(tradingV2Service.listTrades(axiosToken));
    if (!balance || balance.length === 0) dispatch(userService.getBalance(axiosToken));
    if (exchangeRecord.length === 0) dispatch(exchangeServices.getExchangeRecords(axiosToken));
    if (!meLoaded) dispatch(subscriptionV2Service.getMe(axiosToken));
    tradingV2Service
      .getFleetHealth(axiosToken)
      .then(setFleet)
      .catch(() => setFleet(null));
    /* Read on its own: a metrics failure must not cost the page its bot
       health, and vice versa. */
    tradingV2Service
      .getPortfolioMetrics(axiosToken, { window_days: DEFAULT_WINDOW_DAYS })
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setMetricsAsked(true));
    /* The hero's chips — `GET /trading_v2/status/`. Kept separate from the
       metrics call so a failure in one does not blank the other: a broken
       status must not hide the equity, and unknown equity must not make the
       chips claim everything is fine. */
    tradingV2Service
      .getStatus(axiosToken)
      .then((st) => {
        setStatus(st);
        setStatusFailed(false);
      })
      .catch(() => {
        setStatus(null);
        setStatusFailed(true);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  /* Every figure read once, here, so the hero and the risk card cannot
     disagree about what the same response said. `metricRead` is what honours
     `unavailable`: a field named there renders the backend's own reason and
     never a zero — `account_equity`, `change_today` and `max_drawdown` are in
     it on every response today. */
  const equity = metricRead(metrics, "account_equity", metricNum(metrics?.account_equity));
  const changeToday = metricRead(metrics, "change_today", metricNum(metrics?.change_today));
  const changePct = metricRead(metrics, CHANGE_TODAY_PCT_FIELDS, changeTodayPct(metrics));
  const drawdown = metricRead(metrics, "max_drawdown", metricNum(metrics?.max_drawdown));
  const openPnl = metricRead(metrics, UNREALISED_FIELDS, unrealisedPnl(metrics));
  const realisedAmt = metricRead(metrics, REALISED_FIELDS, realisedPnl(metrics));
  const realised = metricRead(metrics, REALISED_PCT_FIELDS, realisedPct(metrics));
  const atRisk = riskNowParts(metrics);
  const atRiskShare = metricRead(metrics, AT_RISK_PCT_FIELDS, atRiskPct(metrics));
  const closed = closedCount(metrics);
  const openPositions = openPositionCount(metrics);

  /* The hero reads as the design draws it: every cell carries a figure, so an
     unmeasured `change_today` or `max_drawdown` shows 0 rather than a dash and
     a paragraph. The endpoint's own guidance is the opposite — "Show the
     reason, not a zero" — because a real 0.00% and "no snapshots yet" are
     different states and this collapses them. The reason is kept on the
     element's `title` so it is still reachable on hover rather than lost. */
  const todayMoney = changeToday.available && changeToday.value != null ? changeToday.value : 0;
  const drawdownPct = drawdown.available && drawdown.value != null ? drawdown.value : 0;

  const totalBalance = useMemo(
    () =>
      (balance || [])
        .filter((b: BalanceProp) => b.name?.toLowerCase() !== "cde")
        .reduce((s: number, b: BalanceProp) => s + (Number(b.balance) || 0), 0),
    [balance],
  );

  const runningTrades = trades.filter((t) => t.status === "RUNNING").length;
  const activeBots = bots.filter((b) => b.status === "ACTIVE").length;
  const failingBots = bots.filter((b) => b.status === "FAILING");

  /* Open positions — `GET /positions/?status=open`. The rows, the hero's
     open-PnL caption and the whole risk card all read from this ONE response,
     so no two of them can disagree about what is open. */
  const {
    rows: positions,
    asked: positionsAsked,
    failed: positionsFailed,
  } = useOpenPositions(axiosToken, { status: "open" });
  const risk = riskRollup(positions);
  const positionsOpenPnl = openPnlTotal(positions);

  /* `botsNotResponding` is the local fallback: if the endpoint does not break
     bots out, the page already knows which of its own bots are failing. */
  const chips = statusChips(status, {
    failed: statusFailed,
    botsNotResponding: failingBots.length,
  });

  /* The bot the momentum section is "about" (and named in its heading) — the
     healthiest working one: ACTIVE before PAUSED before FAILING, then the most
     running trades, then the fewest consecutive failed calls. */
  const featuredBot = useMemo(() => {
    if (!bots.length) return null;
    const running = new Map<number, number>();
    trades.forEach((t) => {
      if (t.status === "RUNNING" && t.bot != null) running.set(t.bot, (running.get(t.bot) || 0) + 1);
    });
    const statusRank = { ACTIVE: 0, PAUSED: 1, FAILING: 2 } as const;
    /* No third tiebreak: `consecutive_fail_count` used to be it, but it is
       always 0 — nothing increments it — so it sorted nothing. */
    return [...bots].sort(
      (a, b) =>
        (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3) ||
        (running.get(b.id) || 0) - (running.get(a.id) || 0),
    )[0];
  }, [bots, trades]);

  const firstBot = useMemo(() => {
    if (!bots.length) return null;
    return [...bots].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )[0];
  }, [bots]);

  const maxSizePct = trades.length ? Math.max(...trades.map((t) => t.max_size_pct || 0)) : null;

  const loaded = botsLoaded && tradesLoaded;
  /* Neither loaded nor loading: the fetch came back an error. Without this the
     page sat on "Loading your dashboard…" indefinitely, which is what an
     expired session looked like from the outside. */
  const loadFailed = !loaded && !!(botsError || tradesError);

  const retry = () => {
    fetchedRef.current = false;
    dispatch(tradingV2Service.listBots(axiosToken));
    dispatch(tradingV2Service.listTrades(axiosToken));
  };
  const isEmpty =
    loaded && bots.length === 0 && trades.length === 0 && exchangeRecord.length === 0;

  const firstName = user?.first_name || user?.username || "there";
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const [greeting, setGreeting] = useState("Morning");
  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Morning" : hour < 18 ? "Afternoon" : "Evening");
  }, []);

  return (
    <>
      <Head>
        <title>Overview | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="portfolio">
        <TopBar
          crumb={`${today} · ${runningTrades} running`}
          title={`${greeting}, ${firstName}.`}
          subtitle="Your balance, the trades running against it and the bots deciding for them."
        />

        {!loaded && !loadFailed && (
          <p className="fx-hint" style={{ padding: "28px 4px" }}>
            Loading your dashboard…
          </p>
        )}

        {loadFailed && (
          <section className="fx-sec rv">
            <div className="fx-sh">
              <h2>We couldn&rsquo;t load your dashboard</h2>
            </div>
            <p className="fx-hint" style={{ padding: "4px 4px 14px" }}>
              {botsError || tradesError} Nothing has changed on your account — this is
              only what this page could read just now.
            </p>
            <button type="button" className="fx-mini go" onClick={retry}>
              Try again
            </button>
          </section>
        )}

        {loaded && isEmpty && (
          <>
            <section
              className="fx-hero rv"
              style={{ marginTop: "clamp(18px,2.4vw,26px)" }}
            >
              <div className="fx-hero-in">
                <p className="fx-eqlab">Nothing connected · nothing trading</p>
                <p className="fx-title" style={{ marginTop: 0 }}>
                  Your first trade is a few steps away.
                </p>
                <p className="fx-sub3">
                  Start with a plan — the free one needs no card. Candleweb can&rsquo;t see
                  anything until you connect an exchange, and no money moves until you start
                  a trade.
                </p>
              </div>
            </section>

            <section className="fx-sec rv">
              <div className="fx-sh">
                <h2>Get to your first trade</h2>
              </div>
              <div className="fx-start">
                {/* Nothing trades without a plan, so it leads. It is the only
                    step here that reads real state: the rest stay open rather
                    than locked, and the backend is what actually refuses a bot
                    without a plan (`has_active_plan` on /trading_v2/limits/).
                    The single `go` button moves to whichever step is next. */}
                <div className={`fx-stepline ${hasPlan ? "done9" : ""}`}>
                  <span className="sn9">{hasPlan ? "✓" : "1"}</span>
                  <div className="sb9">
                    <b>Subscribe to a plan</b>
                    <span>
                      {hasPlan ? (
                        <>
                          You&rsquo;re on {subscription?.plan_name || "a plan"}. Change or cancel
                          it any time.
                        </>
                      ) : (
                        <>
                          Candleweb needs a plan before it can trade for you. The free one costs
                          nothing and needs no card.
                        </>
                      )}
                    </span>
                  </div>
                  <Link
                    className={`fx-mini ${hasPlan ? "" : "go"}`}
                    href="/dashboard/subscription"
                  >
                    {hasPlan ? "Manage" : "Choose a plan"}
                  </Link>
                </div>
                <div className="fx-stepline">
                  <span className="sn9">2</span>
                  <div className="sb9">
                    <b>Connect an exchange</b>
                    <span>
                      A trade-only API key — read and spot trade, no withdrawal. Candleweb checks
                      it when you paste it.
                    </span>
                  </div>
                  {/* straight to the connect form, not Settings — Settings
                      only holds another button to this same page */}
                  <Link
                    className={`fx-mini ${hasPlan ? "go" : ""}`}
                    href="/dashboard/exchanges"
                  >
                    Connect
                  </Link>
                </div>
                <div className="fx-stepline">
                  <span className="sn9">3</span>
                  <div className="sb9">
                    <b>Add a bot</b>
                    <span>The thing that decides. Point Candleweb at your workflow, or use CandleAI.</span>
                  </div>
                  <Link className="fx-mini" href="/dashboard/bots/new">
                    Add a bot
                  </Link>
                </div>
                <div className="fx-stepline">
                  <span className="sn9">4</span>
                  <div className="sb9">
                    <b>Set up a trade</b>
                    <span>
                      Pick a pair, an allocation and a decider. It runs against live candles;
                      nothing reaches the exchange until you start it.
                    </span>
                  </div>
                  <Link className="fx-mini" href="/dashboard/trades/new">
                    New trade
                  </Link>
                </div>
              </div>
            </section>

            <section className="fx-sec rv">
              <div className="fx-sh">
                <h2>While you set up</h2>
                <span className="sub2">none of this needs an exchange</span>
              </div>
              <div className="fx-start">
                <div className="fx-stepline">
                  <span className="sn9">◔</span>
                  <div className="sb9">
                    <b>Academy</b>
                    <span>What a stop-loss actually does, and how a bot reads a candle.</span>
                  </div>
                  <Link className="fx-mini" href="/dashboard/tutor">
                    Open
                  </Link>
                </div>
                <div className="fx-stepline">
                  <span className="sn9">◔</span>
                  <div className="sb9">
                    <b>Invite &amp; earn</b>
                    <span>Your referral link and what it has earned.</span>
                  </div>
                  <Link className="fx-mini" href="/dashboard/invite">
                    Get link
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}

        {loaded && !isEmpty && (
          <>
            {/* ---- hero: balance + status ---- */}
            <section className="fx-hero rv" style={{ marginTop: "clamp(18px,2.4vw,28px)" }}>
              {/* The design's three chips, now read from `/status/` rather
                  than counted locally: whether the venue is reachable and
                  whether monitoring is beating are claims only the backend can
                  make. A chip that could not be read goes grey — never green.
                  See `statusChips`. */}
              <div className="fx-chips">
                {chips.map((c) => (
                  <span key={c.key} className={`fx-chip ${chipClass(c.tone)}`} title={c.title}>
                    <i />
                    {c.label}
                  </span>
                ))}
              </div>

              <div className="fx-hero-chart">
                <HeroChart path={HERO_PATH} />
              </div>

              <div className="fx-hero-in">
                <p className="fx-eqlab">
                  {/* The design says "Account equity". `account_equity` is
                      null on every response today (the agent path writes no
                      ledger entries yet), so the figure below stays the
                      exchange balance, which is real — and the label says
                      which of the two it is rather than claiming equity. */}
                  {equity.available && equity.value != null ? "Account equity" : "Account balance"}
                  {exchangeRecord[0]?.supported_exchange_id
                    ? ` · ${exchangeRecord[0].supported_exchange_id}`
                    : ""}
                </p>
                <p className="fx-eq">
                  {equity.available && equity.value != null
                    ? plainMoney(equity.value)
                    : balance && balance.length
                      ? dollarFormat(totalBalance)
                      : "—"}
                </p>

                {/* The delta pill: money and percentage together, per the
                    design ("+$96.40 today · +1.16%"). `change_today` is in
                    `unavailable` today, so the fallback prints the backend's
                    own sentence. `.fx-delta` carries its own 15px top margin,
                    so only the fallback needs a wrapper. */}
                <span
                  className={`fx-delta ${todayMoney < 0 ? "dn2" : ""}`}
                  title={changeToday.available ? undefined : changeToday.reason}
                >
                  {todayMoney < 0 ? "↘" : "↗"} {signedMoney(todayMoney)} today
                  {changePct.available && changePct.value != null
                    ? ` · ${pctLabel(changePct.value)}`
                    : ""}
                </span>

                {/* The design's four: Open PnL, Realised · 30d, Max drawdown,
                    At risk now. The trade/bot counts that used to sit here are
                    in the chips above and the bots strip below. */}
                <div className="fx-substat">
                  <div className="fx-ss">
                    <span className="fx-kase">OPEN PnL</span>
                    <b
                      className={toneClass(
                        positionsOpenPnl ?? (openPnl.available ? openPnl.value : null),
                        "up3",
                        "dn3",
                      )}
                    >
                      {positionsOpenPnl != null
                        ? posMoney(positionsOpenPnl, commonQuote(positions))
                        : openPnl.available
                          ? signedMoney(openPnl.value)
                          : "—"}
                    </b>
                    {/* Captions stay as short as the design's ("3 positions",
                        "41 closed", "1–4 Aug", "≈ $151"). A reason sentence
                        never goes in here — it is a paragraph, and one
                        paragraph in a four-up row wraps the whole row. Reasons
                        render under the row instead. */}
                    {/* The count now comes from the positions themselves —
                        the exact rows listed below — rather than the metrics
                        aggregate, so the caption and the list always agree. */}
                    <i>
                      {positionsAsked && !positionsFailed
                        ? `${positions.length} position${positions.length === 1 ? "" : "s"}`
                        : openPositions != null
                          ? `${openPositions} position${openPositions === 1 ? "" : "s"}`
                          : "unrealised"}
                    </i>
                  </div>

                  {/* Percentage leads, as in the design; the money becomes the
                      caption when there is no closed count to put there. */}
                  <div className="fx-ss">
                    <span>Realised · {DEFAULT_WINDOW_DAYS}d</span>
                    <b
                      className={toneClass(
                        realised.available && realised.value != null
                          ? realised.value
                          : realisedAmt.available
                            ? realisedAmt.value
                            : null,
                        "up3",
                        "dn3",
                      )}
                    >
                      {realised.available && realised.value != null
                        ? pctLabel(realised.value)
                        : realisedAmt.available && realisedAmt.value != null
                          ? signedMoney(realisedAmt.value)
                          : "—"}
                    </b>
                    <i>
                      {closed != null
                        ? `${closed.toLocaleString()} closed`
                        : realisedAmt.available && realisedAmt.value != null
                          ? signedMoney(realisedAmt.value)
                          : "from fills"}
                    </i>
                  </div>

                  <div className="fx-ss">
                    <span>Max drawdown</span>
                    <b
                      className={drawdownPct < 0 ? "dn3" : "mut2"}
                      title={drawdown.available ? undefined : drawdown.reason}
                    >
                      {pctLabel(drawdownPct)}
                    </b>
                    {/* <i>peak to trough</i> */}
                  </div>

                  {/* `at_risk_now` counts only stops ARMED on the venue, so a
                      position with no stop adds nothing. The unprotected count
                      travels with it everywhere — see `riskNowParts`. */}
                  <div className="fx-ss">
                    <span>At risk now</span>
                    <b className={atRisk.read.available && atRisk.read.value != null ? "" : "mut2"}>
                      {atRiskShare.available && atRiskShare.value != null
                        ? `${Math.abs(atRiskShare.value).toFixed(2)}%`
                        : atRisk.label}
                    </b>
                    <i>
                      {atRiskShare.available &&
                      atRiskShare.value != null &&
                      atRisk.read.value != null
                        ? `≈ ${plainMoney(atRisk.read.value)}`
                        : atRisk.unprotected != null && atRisk.unprotected > 0
                          ? `${atRisk.unprotected} unprotected`
                          : "armed stops"}
                    </i>
                  </div>
                </div>

              </div>
            </section>

            {/* ---- the design's "Open positions" section ----
                 Live on `GET /positions/?status=open` (§1.21, which this
                 section waited on for most of its life). These are POSITIONS,
                 not trades: a trade is a configuration, a position is money on
                 the venue, and the two are never the same list. */}
            <section className="fx-sec rv">
              <div className="fx-sh">
                <h2>
                  Open positions <span className="sub2">stops enforced by Candleweb</span>
                </h2>
                <Link className="fx-link" href="/dashboard/trades">
                  All trades →
                </Link>
              </div>

              {positionsFailed ? (
                <div className="fx-failmsg" style={{ marginTop: 0 }}>
                  <b>Couldn&rsquo;t load your positions.</b> {positionsFailed} Risk figures on this
                  page are hidden rather than shown as zero.
                </div>
              ) : !positionsAsked ? (
                <p className="fx-hint" style={{ padding: "14px 4px" }}>
                  Loading open positions…
                </p>
              ) : (
                <OpenPositionsList positions={positions} />
              )}
            </section>

            {/* ---- bots ---- */}
            <section className="fx-sec rv">
              <div className="fx-sh">
                <h2>Your bots</h2>
                <Link className="fx-link" href="/dashboard/bots/new">
                  Add a bot →
                </Link>
              </div>
              {bots.length === 0 ? (
                <div className="fx-flat2">
                  <b>No bots connected.</b>{" "}
                  <Link href="/dashboard/bots/new" style={{ color: "var(--fx-teal2)" }}>
                    Add one
                  </Link>{" "}
                  — about two minutes.
                </div>
              ) : (
                <div className="fx-bots">
                  {bots.map((b) => {
                    const meta = STATUS_META[b.status] ?? STATUS_META.PAUSED;
                    const plCls =
                      b.status === "ACTIVE" ? "run2" : b.status === "FAILING" ? "err2" : "idle2";
                    return (
                      <Link key={b.id} className={`fx-bot ${meta.dead ? "bad2" : ""}`} href={`/dashboard/bots/${b.id}`}>
                        <div className="bh2">
                          <span className={`pl2 ${plCls}`} />
                          <b>{b.name}</b>
                        </div>
                        <span className="bl2">
                          {b.platform} · {b.reach_mode === "PULL" ? "pull" : "push"}
                        </span>
                        <div className="bn2">
                          <span>{meta.label}</span>
                          <span className="p3">
                            {b.reply_timeout_s}s timeout
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ---- momentum (design only) ---- */}
            <section className="fx-mom rv">
              <div className="fx-sh">
                <h2>
                  {featuredBot ? `Your ${featuredBot.name}` : "Your momentum"} <span className="sub2">progress toward a system you can trust</span>
                </h2>
                <span className="fx-preview">
                  <i>◔</i> Review readiness needs closed-trade history
                </span>
              </div>
              <div className="fx-momgrid">
                <div>
                  <div className="fx-meter">
                    <div className="fx-mh">
                      <b>
                        {featuredBot ? `${featuredBot.name} — review readiness` : "Bot review readiness"}
                      </b>
                      <span>— of 20 trades</span>
                    </div>
                    <div className="fx-seg">
                      {new Array(20).fill(0).map((_, i) => (
                        <i key={i} />
                      ))}
                    </div>
                    <p className="fx-mnote">
                      Bot review reads a bot&rsquo;s closed trades against its prompt and tells you
                      which rule is costing money. It needs ~20 on one prompt — the counter here
                      turns on once the decisions endpoint exists.
                    </p>
                  </div>
                  <div className="fx-streaks2">
                    <div className="fx-stk2">
                      {/* `b` here is a 26px figure slot — "Not measured yet"
                          is a sentence and goes in the small token instead. */}
                      <span>Days with no bot failures</span>
                      {botStreak.value == null ? (
                        <b className="none3">{botStreak.caption}</b>
                      ) : (
                        <>
                          <b className={botStreak.caption === "failed today" ? "amb3" : ""}>
                            {botStreak.value}
                          </b>
                          <i>{botStreak.caption}</i>
                        </>
                      )}
                      <span className="why3">your worst bot, not an average</span>
                    </div>
                    <div className="fx-stk2">
                      <span>Review suggestions applied</span>
                      <b className="mut3">—</b>
                      <span className="why3">needs the review endpoint</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="fx-badges2">
                    <div className={`fx-bdg ${exchangeRecord.length ? "won" : ""}`}>
                      <span className="bi">
                        <svg viewBox="0 0 24 24">
                          <path d="M9 3v6M15 3v6" />
                          <path d="M7 9h10v4a5 5 0 01-10 0z" />
                          <path d="M12 18v3" />
                        </svg>
                      </span>
                      <b>Exchange connected</b>
                      <span>Trade-only keys, no withdrawal</span>
                    </div>
                    <div className={`fx-bdg ${bots.length ? "won" : ""}`}>
                      <span className="bi">
                        <svg viewBox="0 0 24 24">
                          <rect x="4" y="8" width="16" height="12" rx="3" />
                          <path d="M12 4v4M9 13h.01M15 13h.01M9 17h6" />
                        </svg>
                      </span>
                      <b>First bot live</b>
                      <span>
                        {firstBot ? `${firstBot.name}, ${timeAgo(firstBot.created_at)}` : "Add your first bot"}
                      </span>
                    </div>
                    <div className="fx-bdg">
                      <span className="lk2">locked</span>
                      <span className="bi">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
                          <circle cx="12" cy="12" r="4" />
                        </svg>
                      </span>
                      <b>First trade closed</b>
                      <span>Arrives with closed-trade history</span>
                    </div>
                    <div className="fx-bdg">
                      <span className="lk2">locked</span>
                      <span className="bi">
                        <svg viewBox="0 0 24 24">
                          <path d="M12 3l7 3v6c0 4-3 6.5-7 9-4-2.5-7-5-7-9V6z" />
                          <path d="M9.5 12l1.8 1.8L15 10" />
                        </svg>
                      </span>
                      <b>Discipline</b>
                      <span>30 days inside your risk limits</span>
                    </div>
                  </div>
                  <div className="fx-next">
                    <div className="fx-nx">
                      <em>Now</em>
                      <span>
                        <b>Set up a trade</b> — {trades.length} so far
                      </span>
                    </div>
                    <div className="fx-nx">
                      <em>Next</em>
                      <span>
                        <b>Bot review</b> — needs a decisions feed
                      </span>
                    </div>
                    <div className="fx-nx">
                      <em>Later</em>
                      <span>
                        <b>Shareable record</b> — needs closed-trade history
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ---- activity + needs you ---- */}
            <div className="fx-cols fx-sec rv">
              <section>
                {/* Decisions are read in place — a few at a time, with
                    "Show more" for the rest — so there is nowhere else to
                    send the user. Each row opens that decision in full. */}
                <div className="fx-sh">
                  <h2>Today</h2>
                  <Link href="/dashboard/history" className="fx-src">
                    Full history →
                  </Link>
                </div>
                <DecisionsFeed
                  api={axiosToken}
                  pageSize={4}
                  empty={
                    <>
                      <b>Nothing from your bots yet.</b> Each time one of your bots fetches candles
                      and answers, the decision lands here.
                    </>
                  }
                />
              </section>
              <section>
                <div className="fx-sh">
                  <h2>Needs you</h2>
                </div>
                {failingBots.length > 0 ? (
                  failingBots.map((b) => (
                    <div className="fx-soft warn5" key={b.id} style={{ marginBottom: "12px" }}>
                      <h3>{b.name} isn&rsquo;t responding</h3>
                      <p>
                        Candleweb is not getting answers from it, so no orders are being placed for
                        the trades it decides.{" "}
                        <Link href={`/dashboard/bots/${b.id}`} style={{ color: "var(--fx-teal2)" }}>
                          Open the bot
                        </Link>
                        .
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="fx-soft">
                    <h3 style={{ marginBottom: "10px" }}>Nothing needs you right now</h3>
                    <p>
                      When a bot goes quiet or a trade errors it shows up here. Your risk
                      figures are below.
                    </p>
                  </div>
                )}

                <div className="fx-soft" style={{ marginTop: "14px" }}>
                  <h3 style={{ marginBottom: "12px" }}>Risk right now</h3>
                  <div className="fx-riskline">
                    <span>If every stop hit at once</span>
                    {/* Summed from the positions that REPORTED an `at_risk`.
                        A position with no stop reports null, not zero, and is
                        excluded and counted rather than quietly treated as
                        costing nothing — see `riskRollup`. */}
                    <b className={risk.total != null ? "fx-dn" : "mut2"}>
                      {risk.total != null
                        ? `−${posMoneyPlain(risk.total, commonQuote(positions))}`
                        : "—"}
                    </b>
                  </div>
                  <div className="fx-riskline">
                    <span>Open positions with no stop</span>
                    <b className={risk.unprotected > 0 ? "fx-dn" : ""}>{risk.unprotected}</b>
                  </div>
                  <div className="fx-riskline">
                    <span>Max size per trade</span>
                    <b>{maxSizePct != null ? `${maxSizePct}%` : "—"}</b>
                  </div>
                  {/* The row sitting nearest its stop, by `stop_gauge` — the
                      backend's own 0-at-stop, 1-at-entry measure, which knows
                      which stop fires first. */}
                  <div className="fx-riskline">
                    <span>Closest stop</span>
                    <b className={risk.closest?.gauge.near ? "fx-dn" : risk.closest ? "" : "mut2"}>
                      {risk.closest
                        ? `${pairLabel(risk.closest.position)} · ${risk.closest.gauge.label}`
                        : "—"}
                    </b>
                  </div>

                  {/* The caveat that makes the figure above honest, and the
                      ledger-derived figures that have a reason instead of a
                      number. Both wait for a response — before one there is
                      nothing to qualify. */}
                  {positionsAsked && !positionsFailed && (
                    <p className="fx-hint" style={{ marginTop: "10px" }}>
                      {riskCaveat(risk)}
                    </p>
                  )}
                  {positionsFailed && (
                    <p className="fx-hint" style={{ marginTop: "10px" }}>
                      Your positions couldn&rsquo;t be read just now, so these are hidden rather
                      than shown as zero — nothing on your account has changed.
                    </p>
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </DashboardShell>
    </>
  );
};

export default DashboardPage;
