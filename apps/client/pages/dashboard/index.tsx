import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dollarFormat } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import tradingV2Service, { TradingV2ActionError } from "../../services/tradingV2Service";
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
import {
  BotReviewReadinessV2,
  BotReviewV2,
  FleetHealthV2,
  PortfolioMetricsV2,
  RecommendationV2Progress,
  TradingStatusV2,
} from "../../types/tradingV2";
import { chipClass, statusChips } from "../../lib/tradingV2Status";
import useOpenPositions from "../../lib/hooks/useOpenPositions";
import useBook from "../../lib/hooks/useBook";
import usePoll, { POLL } from "../../lib/hooks/usePoll";
import { useRevalidateEffect } from "../../lib/hooks/useRevalidate";
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
import { error, success } from "../../components/alert/Toast";
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
  pnlCellParts,
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

/* The fallback bar, used only until `review-readiness` answers with the real
   one. The threshold is an entitlement — a plan can set its own — so the
   response's `closed_trades_needed` always wins over this. Same constant, and
   same reasoning, as the bot detail page. */
const REVIEW_AT = 20;

const DashboardPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore((state) => state);

  const { bots, botsLoaded, botsError, trades, tradesLoaded, tradesError } = useSelector(
    (state: RootState) => state.tradingV2,
  );
  const { balance } = useSelector((state: RootState) => state.user);
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange);
  /* Every figure on this page answers for ONE book — the Settings switch.
     Flipping it re-runs the fetch effect below and `useOpenPositions`, and
     clears the cached trades and bots (see `useBookSync`), so nothing from
     the other book survives the switch. */
  const book = useBook();
  /* Setup step 1 is "subscribe to a plan" — a new account has no subscription
     at all (even the free plan has to be chosen), so this is a real step
     rather than a formality. `isLivePlan` counts any plan, free included,
     and still counts one cancelled at period end because it grants until it
     actually ends. */
  const { subscription, meLoaded } = useSelector((state: RootState) => state.subscriptionV2);
  const hasPlan = isLivePlan(subscription);
  /* The book it last fetched for, not a bare boolean: flipping the switch has
     to re-ask, and "already fetched" would strand the other book's figures on
     screen. */
  const fetchedRef = useRef<string | null>(null);

  const [fleet, setFleet] = useState<FleetHealthV2 | null>(null);

  /* ---- the momentum section's review readiness ----
     `GET /bots/{id}/review-readiness/` for the featured bot. The bar is
     CLOSED TRADES on the bot's current prompt, both books counted — not
     decisions, which is a different and much easier bar, and not anything
     dated from `updated_at`, which moves when the bot is merely renamed.
     `closed_trades_needed` is the plan's own threshold, so the "of 20" is
     read from the response and never asserted locally. */
  const [readiness, setReadiness] = useState<BotReviewReadinessV2 | null>(null);
  const [readinessAsked, setReadinessAsked] = useState(false);
  const [readinessFailed, setReadinessFailed] = useState(false);

  /* "Review suggestions applied" — `progress` off
     `GET /bots/{id}/recommendations/`, which is the endpoint that tile was
     waiting for. It counts every completed review's recommendations, not
     just the latest one's. */
  const [recProgress, setRecProgress] = useState<RecommendationV2Progress | null>(null);

  /* A review this page started, or found already running. Polled while it is
     SENDING/SENT so the button can say where it got to instead of going
     quiet after the one click that matters. */
  const [review, setReview] = useState<BotReviewV2 | null>(null);
  const [launching, setLaunching] = useState(false);
  /* 503 means reviews are switched off server-side — the one refusal where
     the button should disappear rather than explain itself. */
  const [reviewsOff, setReviewsOff] = useState(false);

  /* Portfolio money and risk — `GET /trading_v2/metrics/`, which fills the
     hero's four substats, the delta pill and the "Risk right now" card.
     Local state next to the figures it sits beside: nothing else reads it,
     and a stale PnL is worse than no PnL. */
  const [metrics, setMetrics] = useState<PortfolioMetricsV2 | null>(null);
  const [metricsAsked, setMetricsAsked] = useState(false);
  const [balanceAsked, setBalanceAsked] = useState(false);
  const [status, setStatus] = useState<TradingStatusV2 | null>(null);
  const [statusAsked, setStatusAsked] = useState(false);
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

  /* The two reads that keep going after the page has loaded. They are
     callbacks rather than lines in the mount effect because both are polled
     and both are re-run when a notification says they moved — and re-running
     the mount effect to refresh a figure would re-dispatch the bots, the
     trades and the balance along with it.

     A refresh only ever sets `asked` to true, never back to false: a figure
     that is already on screen must not flicker to "reading…" because a
     background poll went out behind it. */
  const loadMetrics = useCallback(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    return tradingV2Service
      .getPortfolioMetrics(axiosToken, { book, window_days: DEFAULT_WINDOW_DAYS })
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setMetricsAsked(true));
  }, [axiosToken, book]);

  /* The hero's chips — `GET /trading_v2/status/`. Kept separate from the
     metrics call so a failure in one does not blank the other: a broken
     status must not hide the equity, and unknown equity must not make the
     chips claim everything is fine. */
  const loadStatus = useCallback(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    return tradingV2Service
      .getStatus(axiosToken)
      .then((st) => {
        setStatus(st);
        setStatusFailed(false);
      })
      .catch(() => {
        setStatus(null);
        setStatusFailed(true);
      })
      .finally(() => setStatusAsked(true));
  }, [axiosToken]);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current === book) return;
    fetchedRef.current = book;
    /* Back to "reading…" rather than leaving the other book's figures up
       while the new ones are in the air. */
    setMetricsAsked(false);
    setStatusAsked(false);
    dispatch(tradingV2Service.listBots(axiosToken));
    dispatch(tradingV2Service.listTrades({ api: axiosToken, book }));
    /* The balance is the hero figure's fallback while `account_equity` stays
       null, so the hero has to know whether it is still in flight — otherwise
       an empty `balance` and a failed one look identical and both print a
       dash the moment the bots land. */
    if (!balance || balance.length === 0) {
      dispatch(userService.getBalance(axiosToken)).finally(() => setBalanceAsked(true));
    } else {
      setBalanceAsked(true);
    }
    if (exchangeRecord.length === 0) dispatch(exchangeServices.getExchangeRecords(axiosToken));
    if (!meLoaded) dispatch(subscriptionV2Service.getMe(axiosToken));
    tradingV2Service
      .getFleetHealth(axiosToken)
      .then(setFleet)
      .catch(() => setFleet(null));
    loadMetrics();
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch, book]);

  /* ---- keeping the hero current ----
     Two mechanisms, and the notification one does the real work: a fill or a
     close refetches these the moment the poll sees it. The intervals are the
     net under anything that arrives without a notification — a mark price
     drifting, an exchange key revoked, a worker that stopped beating. */
  const reloadTrades = useCallback(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    dispatch(tradingV2Service.listTrades({ api: axiosToken, book }));
  }, [axiosToken, dispatch, book]);

  useRevalidateEffect("metrics", loadMetrics);
  useRevalidateEffect("status", loadStatus);
  useRevalidateEffect("trades", reloadTrades);

  usePoll(loadMetrics, POLL.metrics);
  usePoll(loadStatus, POLL.status);
  usePoll(reloadTrades, POLL.trades);

  /* The bot the momentum section is "about" (and named in its heading) — the
     healthiest working one: ACTIVE before PAUSED before FAILING, then the most
     running trades, then the fewest consecutive failed calls. */
  const featuredBot = useMemo(() => {
    if (!bots.length) return null;
    const running = new Map<number, number>();
    trades.forEach((t) => {
      if (t.status === "ACTIVE" && t.bot != null) running.set(t.bot, (running.get(t.bot) || 0) + 1);
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

  /* Its id alone, so the loaders below re-run when the section changes which
     bot it is about but NOT every time the bots list is re-fetched with the
     same one in front. */
  const featuredBotId = featuredBot?.id ?? null;

  /* ---- review readiness, for the momentum meter ----
     Keyed on the featured bot: which bot the section is about can change when
     the bots list arrives or a trade is re-pointed, and the meter has to
     follow its heading rather than keep counting the first bot it saw. */
  const loadReadiness = useCallback(() => {
    if (featuredBotId == null || !isAuthorizationHeaderSet(axiosToken)) return;
    setReadinessFailed(false);
    tradingV2Service
      .getBotReviewReadiness(axiosToken, featuredBotId)
      .then((r) => {
        setReadiness(r);
        setReadinessFailed(false);
      })
      .catch(() => {
        setReadiness(null);
        setReadinessFailed(true);
      })
      .finally(() => setReadinessAsked(true));
  }, [axiosToken, featuredBotId]);

  const loadRecProgress = useCallback(() => {
    if (featuredBotId == null || !isAuthorizationHeaderSet(axiosToken)) return;
    tradingV2Service
      .listBotRecommendations(axiosToken, featuredBotId)
      .then((r) => setRecProgress(r.progress ?? null))
      .catch(() => setRecProgress(null));
  }, [axiosToken, featuredBotId]);

  useEffect(() => {
    /* A different bot means the old bot's figures are wrong, not merely
       stale, so they go before the new ones are asked for. */
    setReadiness(null);
    setReadinessAsked(false);
    setRecProgress(null);
    setReview(null);
    loadReadiness();
    loadRecProgress();
  }, [loadReadiness, loadRecProgress]);

  /* Both are on triggers only, per §9: the bar counts closed trades, so
     nothing but a position closing can move it — and that arrives as a
     notification. A timer would re-ask a question whose answer cannot have
     changed. Editing the bot's prompt restarts the count, which is the other
     thing that bumps `reviewReadiness`. */
  useRevalidateEffect("reviewReadiness", () => {
    loadReadiness();
    loadRecProgress();
  });

  /* ---- a review in flight ----
     Polled at the doc's 10–20s while it is SENDING or SENT, and stopped the
     moment it is not: a finished review cannot change again, and this is the
     only timer on the page that exists to be turned off. */
  const reviewId = review?.id ?? null;
  const reviewPending = review?.status === "SENDING" || review?.status === "SENT";
  useEffect(() => {
    if (reviewId == null || !reviewPending || !isAuthorizationHeaderSet(axiosToken)) return;
    const tick = setInterval(() => {
      tradingV2Service
        .getBotReview(axiosToken, reviewId)
        .then((r) => {
          setReview(r);
          /* A finished review has spent a review and may have produced
             recommendations, so both tiles beside it are now wrong. */
          if (r.status === "COMPLETED" || r.status === "FAILED") {
            loadReadiness();
            loadRecProgress();
          }
        })
        .catch(() => {
          /* Leave the last known state on screen: a dropped poll is not
             evidence the review failed, and saying so would be a lie the
             next tick corrects. */
        });
    }, 15000);
    return () => clearInterval(tick);
  }, [reviewId, reviewPending, axiosToken, loadReadiness, loadRecProgress]);

  const launchReview = async () => {
    if (featuredBotId == null) return;
    setLaunching(true);
    try {
      const { review: started, alreadyRunning } = await tradingV2Service.startBotReview(
        axiosToken,
        featuredBotId,
      );
      setReview(started);
      /* A review was spent, so what is left to spend has changed. */
      loadReadiness();
      success(
        alreadyRunning
          ? "A review of this bot is already running."
          : "Review started — it reads this bot's closed trades against its prompt.",
      );
    } catch (e: any) {
      const err = e as TradingV2ActionError;
      /* Reviews switched off server-side: the button goes, because there is
         nothing the user can do about it. */
      if (err.httpStatus === 503) {
        setReviewsOff(true);
        error(err.message || "Bot review is switched off at the moment.");
      } else if (err.code === "NOT_READY") {
        /* The bar disagreed with the server. The server is right, so re-read
           rather than leave a button offering something it will refuse. */
        loadReadiness();
        error(err.blockers?.[0]?.message || err.message);
      } else {
        error(err.message);
      }
    } finally {
      setLaunching(false);
    }
  };

  /* Every figure read once, here, so the hero and the risk card cannot
     disagree about what the same response said. `metricRead` is what honours
     `unavailable`: a field named there renders the backend's own reason and
     never a zero — `account_equity`, `change_today` and `max_drawdown` are in
     it on every response today. */
    const equity = metricRead(metrics, "account_equity", metricNum(metrics?.account_equity));
  const changeToday = metricRead(metrics, "change_today", metricNum(metrics?.change_today));
  const changePct = metricRead(metrics, CHANGE_TODAY_PCT_FIELDS, changeTodayPct(metrics));
  const drawdown = metricRead(
    metrics,
    ["max_drawdown_pct", "max_drawdown"],
    metricNum(metrics?.max_drawdown_pct),
  );
  const openPnl = metricRead(metrics, UNREALISED_FIELDS, unrealisedPnl(metrics));
  const realisedAmt = metricRead(metrics, REALISED_FIELDS, realisedPnl(metrics));
  const realised = metricRead(metrics, REALISED_PCT_FIELDS, realisedPct(metrics));
  const atRisk = riskNowParts(metrics);
  const atRiskShare = metricRead(metrics, AT_RISK_PCT_FIELDS, atRiskPct(metrics));
  const closed = closedCount(metrics);
  const openPositions = openPositionCount(metrics);

  /* A figure the backend could not measure is null here, never 0: a real
     0.00% and "not measured" are different states. The reason stays on the
     element's `title`. */
  const todayMoney = changeToday.available ? changeToday.value : null;
  const todayPct = changePct.available ? changePct.value : null;
  const drawdownPct = drawdown.available ? drawdown.value : null;
  const realisedPctVal = realised.available ? realised.value : null;

  /* Zero is only honest when nothing is exposed AND nothing is unprotected:
     an unprotected position adds nothing to the figure, so it stays unknown. */
  const atRiskAmt = atRisk.read.available ? atRisk.read.value : null;
  const nothingAtRisk = atRiskAmt === 0 && atRisk.unprotected === 0;
  const atRiskPctVal =
    atRiskShare.available && atRiskShare.value != null
      ? atRiskShare.value
      : nothingAtRisk
        ? 0
        : null;

  /* "Not provided" is a verdict — the backend answered and had nothing. A
     request that has not come back yet has made no such claim, and printing
     the verdict early is what made a loading dashboard read like a broken
     one. Every hero slot below asks the same question before it renders:
     is this null only because nothing has answered yet? If so it shimmers
     (`.fx-skel`, sized to the figure it will become, so nothing jumps) and
     its caption says "reading…" instead. */
  const metricsPending = !metricsAsked;
  const equityPending =
    !(equity.available && equity.value != null) &&
    !(balance && balance.length) &&
    (metricsPending || !balanceAsked);
  const todayPending = todayMoney == null && metricsPending;
  const realisedPending = realisedPctVal == null && metricsPending;
  const drawdownPending = drawdownPct == null && metricsPending;
  const atRiskPending = atRiskPctVal == null && metricsPending;

  const ddRange = (() => {
    const a = metrics?.max_drawdown_peak_at;
    const b = metrics?.max_drawdown_trough_at;
    if (!a || !b) return null;
    const pa = new Date(a);
    const pb = new Date(b);
    const day = (d: Date) => d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
    if (day(pa) === day(pb)) {
      const h = Math.max(1, Math.round((pb.getTime() - pa.getTime()) / 3600000));
      return `${day(pa)} · ${h}h`;
    }
    return `${day(pa)}–${day(pb)}`;
  })();

  const curveRead = metricRead(metrics, "equity_curve", null);
  const heroPath =
    (curveRead.available ? equityCurvePath(metrics?.equity_curve) : null) ?? HERO_PATH;

  const totalBalance = useMemo(
    () =>
      (balance || [])
        .filter((b: BalanceProp) => b.name?.toLowerCase() !== "cde")
        .reduce((s: number, b: BalanceProp) => s + (Number(b.balance) || 0), 0),
    [balance],
  );

  const runningTrades = trades.filter((t) => t.status === "ACTIVE").length;
  const activeBots = bots.filter((b) => b.status === "ACTIVE").length;
  const failingBots = bots.filter((b) => b.status === "FAILING");

  /* Open positions — `GET /positions/?status=open`. The rows, the hero's
     open-PnL caption and the whole risk card all read from this ONE response,
     so no two of them can disagree about what is open. */
  const {
    rows: positions,
    asked: positionsAsked,
    failed: positionsFailed,
  } = useOpenPositions(axiosToken, { status: "open", book });
  const risk = riskRollup(positions);
  const positionsOpenPnl = openPnlTotal(positions);
  const positionsPending = !positionsAsked && !positionsFailed;
  /* Open PnL can be answered by either response, so it is only still loading
     while neither has landed. */
  const openPnlPending =
    positionsOpenPnl == null && !openPnl.available && (positionsPending || metricsPending);

  /* `botsNotResponding` is the local fallback: if the endpoint does not break
     bots out, the page already knows which of its own bots are failing. */
  const chips = statusChips(status, {
    failed: statusFailed,
    botsNotResponding: failingBots.length,
  });

  /* ---- what the review meter shows ----
     `closed_trades_needed` is the plan's own threshold, so the "of 20" comes
     from the response; REVIEW_AT is only the fallback for a response that
     has not landed yet. */
  const reviewNeeded = readiness?.closed_trades_needed ?? REVIEW_AT;
  const closedOnPrompt = readiness?.closed_trades_on_prompt ?? null;
  /* Clamped: a plan whose threshold drops, or a bot that closed more while
     the response was in flight, can put the count past the bar, and a 21st
     segment would overflow the row. */
  const filledSegments =
    closedOnPrompt == null ? 0 : Math.max(0, Math.min(reviewNeeded, closedOnPrompt));
  /* `eligible` is the server's own answer to "has this bot what a review
     needs", and it outranks the arithmetic: a bot can hit 20 closed trades
     and still be short a stored prompt. The count is the fallback for a
     response that does not carry the flag. */
  const reviewEligible = readiness
    ? (readiness.eligible ?? (closedOnPrompt != null && closedOnPrompt >= reviewNeeded))
    : false;
  const reviewsLeft = readiness?.reviews_available ?? null;
  /* `ready` is `eligible` AND a review left to spend. Launch is offered on
     `eligible` alone, because "none left" is worth saying with a link to buy
     more rather than hiding the whole thing. */
  const canLaunch = reviewEligible && !reviewsOff && featuredBotId != null;
  const outOfReviews = reviewEligible && reviewsLeft === 0;
  /* The first recommendation of a finished review, which is the page this
     section hands off to. */
  const firstRecommendation = review?.recommendations?.[0]?.id ?? null;

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
    /* Cleared rather than set to the current book: the effect skips when the
       two match, so writing `book` here would make "Try again" a no-op. */
    fetchedRef.current = null;
    dispatch(tradingV2Service.listBots(axiosToken));
    dispatch(tradingV2Service.listTrades({ api: axiosToken, book }));
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
                  See `statusChips`.

                  While the call is still in flight those same chips would read
                  "Exchange not reported" — a claim about an answer that has
                  not arrived. Until it does they hold the row's size and say
                  what they are waiting on instead. */}
              <div className="fx-chips">
                {!statusAsked
                  ? ["exchange", "monitoring"].map((k) => (
                      <span key={k} className="fx-chip ld4">
                        <i />
                        reading {k}…
                      </span>
                    ))
                  : chips.map((c) => (
                      <span key={c.key} className={`fx-chip ${chipClass(c.tone)}`} title={c.title}>
                        <i />
                        {c.label}
                      </span>
                    ))}
              </div>

              <div className="fx-hero-chart">
                <HeroChart path={heroPath} />
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
                  {equityPending ? (
                    <i className="fx-skel eq" aria-label="Reading your balance" />
                  ) : equity.available && equity.value != null ? (
                    plainMoney(equity.value)
                  ) : balance && balance.length ? (
                    dollarFormat(totalBalance)
                  ) : (
                    "—"
                  )}
                </p>

                {/* The delta pill: money and percentage together, per the
                    design ("+$96.40 today · +1.16%"). `change_today` is in
                    `unavailable` today, so the fallback prints the backend's
                    own sentence. `.fx-delta` carries its own 15px top margin,
                    so only the fallback needs a wrapper. */}
                <span
                  className={`fx-delta ${
                    todayPending ? "ld2" : todayMoney != null && todayMoney < 0 ? "dn2" : ""
                  }`}
                  title={todayPending || changeToday.available ? undefined : changeToday.reason}
                >
                  {todayPending ? (
                    "reading today's change…"
                  ) : todayMoney == null ? (
                    "today's change not provided"
                  ) : (
                    `${todayMoney < 0 ? "↘" : "↗"} ${signedMoney(todayMoney)} today${
                      todayPct != null ? ` · ${pctLabel(todayPct)}` : ""
                    }`
                  )}
                </span>

                {/* The design's four: Open PnL, Realised · 30d, Max drawdown,
                    At risk now. The trade/bot counts that used to sit here are
                    in the chips above and the bots strip below. */}
                <div className="fx-substat">
                  <div className="fx-ss">
                    <span className="fx-kase">OPEN PnL</span>
                    <b
                      className={
                        openPnlPending
                          ? "mut2"
                          : toneClass(
                              positionsOpenPnl ?? (openPnl.available ? openPnl.value : null),
                              "up3",
                              "dn3",
                            )
                      }
                    >
                      {openPnlPending ? (
                        <i className="fx-skel" aria-label="Reading open PnL" />
                      ) : positionsOpenPnl != null ? (
                        posMoney(positionsOpenPnl, commonQuote(positions))
                      ) : openPnl.available ? (
                        signedMoney(openPnl.value)
                      ) : (
                        "—"
                      )}
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
                          : positionsPending || metricsPending
                            ? "reading…"
                            : "unrealised"}
                    </i>
                  </div>

                  {/* Realised · 30d — percentage only. No percentage, no figure. */}
                  <div className="fx-ss">
                    <span>Realised · {DEFAULT_WINDOW_DAYS}d</span>
                    <b
                      className={realisedPctVal != null ? toneClass(realisedPctVal, "up3", "dn3") : "mut2"}
                      title={realisedPending || realisedPctVal != null ? undefined : realised.reason}
                    >
                      {realisedPending ? (
                        <i className="fx-skel" aria-label="Reading realised PnL" />
                      ) : realisedPctVal != null ? (
                        pctLabel(realisedPctVal)
                      ) : (
                        "—"
                      )}
                    </b>
                    <i>
                      {realisedPending
                        ? "reading…"
                        : realisedPctVal == null
                          ? closed === 0
                            ? "no closed trades"
                            : "not provided"
                          : closed != null
                            ? `${closed.toLocaleString()} closed`
                            : realisedAmt.available && realisedAmt.value != null
                              ? signedMoney(realisedAmt.value)
                              : "from fills"}
                    </i>
                  </div>

                  <div className="fx-ss">
                    <span>Max drawdown</span>
                    <b
                      className={drawdownPct != null && drawdownPct < 0 ? "dn3" : "mut2"}
                      title={drawdownPending || drawdown.available ? undefined : drawdown.reason}
                    >
                      {drawdownPending ? (
                        <i className="fx-skel" aria-label="Reading max drawdown" />
                      ) : drawdownPct != null ? (
                        pctLabel(drawdownPct)
                      ) : (
                        "—"
                      )}
                    </b>
                    <i>
                      {drawdownPending
                        ? "reading…"
                        : drawdownPct == null
                          ? "not provided"
                          : ddRange ?? "peak to trough"}
                    </i>
                  </div>
                  {/* `at_risk_now` counts only stops ARMED on the venue, so a position with
                      no stop adds nothing. The percentage is the backend's own figure and is
                      never derived here. With no percentage, the cell says so rather than
                      showing a dollar fallback. */}
                  <div className="fx-ss">
                    <span>At risk now</span>
                    <b
                      className={atRiskPctVal != null ? "" : "mut2"}
                      title={atRiskPending || atRiskPctVal != null ? undefined : atRiskShare.reason}
                    >
                      {atRiskPending ? (
                        <i className="fx-skel" aria-label="Reading what is at risk" />
                      ) : atRiskPctVal != null ? (
                        `${Math.abs(atRiskPctVal).toFixed(2)}%`
                      ) : (
                        "—"
                      )}
                    </b>
                    <i>
                      {atRiskPending
                        ? "reading…"
                        : atRiskPctVal == null
                          ? atRisk.unprotected != null && atRisk.unprotected > 0
                            ? `not provided · ${atRisk.unprotected} unprotected`
                            : "not provided"
                          : atRiskAmt != null
                            ? `≈ ${plainMoney(atRiskAmt)}`
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

            {/* ---- momentum ---- the review meter is live on
                 `GET /bots/{id}/review-readiness/` for the featured bot. The
                 bar counts CLOSED TRADES on that bot's current prompt, both
                 books together; editing the prompt, model or decision style
                 restarts it, and renaming the bot does not. */}
            <section className="fx-mom rv">
              <div className="fx-sh">
                <h2>
                  {featuredBot ? `Your ${featuredBot.name}` : "Your momentum"} <span className="sub2">progress toward a system you can trust</span>
                </h2>
                {/* Only when the read actually failed. It used to say this
                    unconditionally, as a standing note that the endpoint did
                    not exist yet — it does now, so a permanent badge would be
                    claiming a fault that isn't there. */}
                {readinessFailed && (
                  <span className="fx-preview">
                    <i>◔</i> Couldn&rsquo;t read review readiness
                  </span>
                )}
              </div>
              <div className="fx-momgrid">
                <div>
                  <div className="fx-meter">
                    <div className="fx-mh">
                      <b>
                        {featuredBot ? `${featuredBot.name} — review readiness` : "Bot review readiness"}
                      </b>
                      {/* The counter becomes the action the moment the bar is
                          full: at that point "20 of 20 trades" is no longer
                          news, and what the user wants is the review it has
                          been counting toward. */}
                      {reviewPending ? (
                        <span>
                          {review?.status === "SENDING" ? "Sending to review…" : "Reviewing…"}
                        </span>
                      ) : review?.status === "COMPLETED" ? (
                        firstRecommendation != null ? (
                          <Link
                            className="fx-mini amber9"
                            href={`/dashboard/bots/${featuredBotId}/review/${review.id}/${firstRecommendation}`}
                          >
                            Read the review
                          </Link>
                        ) : (
                          <span>Review finished</span>
                        )
                      ) : review?.status === "FAILED" ? (
                        <span>Review failed — it was given back</span>
                      ) : canLaunch ? (
                        <button
                          type="button"
                          className="fx-mini amber9"
                          disabled={launching}
                          title={
                            outOfReviews
                              ? "You have no reviews left to spend."
                              : "Reads this bot's closed trades against its prompt."
                          }
                          onClick={launchReview}
                        >
                          {launching ? "Starting…" : "Launch review"}
                        </button>
                      ) : (
                        <span>
                          {closedOnPrompt == null
                            ? `— of ${reviewNeeded} trades`
                            : `${closedOnPrompt.toLocaleString()} of ${reviewNeeded} trades`}
                        </span>
                      )}
                    </div>
                    {/* `f` is a closed trade on the prompt, `nx` the one the
                        bar is waiting on — so the row reads as progress
                        rather than as a static pattern. */}
                    <div className="fx-seg">
                      {new Array(reviewNeeded).fill(0).map((_, i) => (
                        <i
                          key={i}
                          className={
                            i < filledSegments ? "f" : i === filledSegments ? "nx" : ""
                          }
                        />
                      ))}
                    </div>
                    <p className="fx-mnote">
                      Bot review reads a bot&rsquo;s closed trades against its prompt and tells you
                      which rule is costing money.{" "}
                      {!readinessAsked
                        ? `It needs ${reviewNeeded} closed trades on one prompt.`
                        : outOfReviews
                          ? "This bot is ready, but you have no reviews left to spend."
                          : reviewEligible
                            ? "This bot has what a review needs."
                            : closedOnPrompt == null
                              ? `It needs ${reviewNeeded} closed trades on one prompt.`
                              : closedOnPrompt >= reviewNeeded
                                ? /* The bar is full but the server still says
                                     no — a stored prompt is the usual reason.
                                     "0 to go" would be arithmetic that
                                     contradicts the blocker below it. */
                                  "The closed trades are there, but something else is still missing."
                                : `${(reviewNeeded - closedOnPrompt).toLocaleString()} to go — editing the prompt, model or decision style starts the count again.`}
                    </p>
                    {/* Everything still standing between this bot and a
                        review, in the backend's own words. `eligible` can be
                        false for a reason the bar cannot show — no stored
                        prompt, most often. */}
                    {readinessAsked && !reviewEligible && (readiness?.blockers ?? []).length > 0 && (
                      <p className="fx-mnote">{readiness?.blockers?.[0]?.message}</p>
                    )}
                    {outOfReviews && (
                      <p className="fx-mnote">
                        <Link className="fx-link" href="/dashboard/subscription">
                          Get a review pack →
                        </Link>
                      </p>
                    )}
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
                    {/* Live on `progress` from `GET /bots/{id}/recommendations/`
                        — the endpoint this tile used to be waiting for. It
                        counts across every completed review, not just the
                        latest, so it does not reset when a new one lands. */}
                    <div className="fx-stk2">
                      <span>Review suggestions applied</span>
                      {recProgress?.applied == null ? (
                        <b className="mut3">—</b>
                      ) : (
                        <>
                          <b>{recProgress.applied}</b>
                          {recProgress.total != null && <i>of {recProgress.total}</i>}
                        </>
                      )}
                      <span className="why3">
                        {recProgress?.total
                          ? "across this bot's reviews"
                          : "nothing reviewed yet"}
                      </span>
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
                        <b>Bot review</b> —{" "}
                        {reviewEligible
                          ? outOfReviews
                            ? "ready, once you have a review to spend"
                            : "ready to run"
                          : closedOnPrompt == null
                            ? `needs ${reviewNeeded} closed trades on one prompt`
                            : `${closedOnPrompt.toLocaleString()} of ${reviewNeeded} closed trades`}
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
                  book={book}
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
                      {positionsPending ? (
                        <i className="fx-skel" aria-label="Reading your risk" />
                      ) : risk.total != null ? (
                        `−${posMoneyPlain(risk.total, commonQuote(positions))}`
                      ) : (
                        "—"
                      )}
                    </b>
                  </div>
                  <div className="fx-riskline">
                    <span>Open positions with no stop</span>
                    {/* A 0 here would be a claim that every position is
                        covered — the one claim this card must not make before
                        the positions have been read. */}
                    <b className={!positionsPending && risk.unprotected > 0 ? "fx-dn" : ""}>
                      {positionsPending ? (
                        <i className="fx-skel" aria-label="Reading unprotected positions" />
                      ) : (
                        risk.unprotected
                      )}
                    </b>
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
                      {positionsPending ? (
                        <i className="fx-skel" aria-label="Reading the closest stop" />
                      ) : risk.closest ? (
                        `${pairLabel(risk.closest.position)} · ${risk.closest.gauge.label}`
                      ) : (
                        "—"
                      )}
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

/** SVG path for the hero chart from `equity_curve`, in the same 900×240
 *  space as the placeholder. Null when there is nothing real to draw. */
export const equityCurvePath = (
  curve: { t: string; equity: number | string }[] | null | undefined,
  width = 900,
  top = 30,
  bottom = 210,
  maxPoints = 60,
): string | null => {
  if (!curve || curve.length < 2) return null;
  const step = Math.max(1, Math.ceil(curve.length / maxPoints));
  const vals = curve
    .filter((_, i) => i % step === 0 || i === curve.length - 1)
    .map((p) => Number(p.equity))
    .filter(Number.isFinite);
  if (vals.length < 2) return null;
  const min = Math.min(...vals);
  const span = Math.max(...vals) - min;
  return vals
    .map((v, i) => {
      const x = (i / (vals.length - 1)) * width;
      const y = span === 0 ? (top + bottom) / 2 : bottom - ((v - min) / span) * (bottom - top);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");
};
