import Head from "next/head";
import { maskString } from "ui";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import tradingV2Service from "../../../../services/tradingV2Service";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../../utils/check_auth";
import DashboardShell from "../../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../../components/dashboard/focus/TopBar";
import DecisionsFeed from "../../../../components/dashboard/focus/DecisionsFeed";
import { error } from "../../../../components/alert/Toast";
import {
  STATUS_META,
  platformLabel,
  decisionStyleLabel,
  onNoReplyLabel,
} from "../../../../lib/botV2Labels";
import {
  NOT_MEASURED,
  connectionState,
  dailyReplyBars,
  recentReplyDots,
  failedLabel,
  failureStreakParts,
  isUnavailable,
  pausesCaveat,
  secondsLabel,
  sinceLabel,
  timeoutDiffers,
  unavailableReason,
  uptimeLabel,
  whenLabel,
} from "../../../../lib/botHealthV2";
import useOpenPositions from "../../../../lib/hooks/useOpenPositions";
import useBook from "../../../../lib/hooks/useBook";
import usePoll, { POLL } from "../../../../lib/hooks/usePoll";
import { useRevalidateEffect } from "../../../../lib/hooks/useRevalidate";
import OpenPositionsList from "../../../../components/dashboard/focus/OpenPositionsList";
import { forBotId, riskRollup } from "../../../../lib/positionsV2";
import {
  DEFAULT_WINDOW_DAYS,
  metricNum,
  plainMoney,
  signedMoney,
  toneClass,
  winRateLabel,
} from "../../../../lib/tradingV2Metrics";
import { BotHealthV2, BotMetricsV2, BotReviewReadinessV2 } from "../../../../types/tradingV2";

/* The rich per-bot view. Live: the bot's own config, the trades that point
   at it, its reliability record (`GET /bots/<id>/health/`) and the decisions
   it has made (`GET /decisions/?bot=`). Money comes from
   `GET /bots/<id>/metrics/`, review readiness from
   `GET /bots/<id>/review-readiness/`, and what the bot holds right now from
   `GET /positions/?status=open`, attributed by each position's `bot_id`.

   `GET /bots/<id>/metrics/` now answers for the whole vitals row in one
   request — including "Avg win / loss", which could never be derived from a
   net total and so sat empty until the endpoint existed.

   The health block's one rule: a field named in `health.unavailable` has no
   measurement yet and renders as "Not measured yet" — never as 0, and never
   as a green 100%. A bot nobody has called has not proved anything. */

/* The fallback bar, used only until `review-readiness` answers with the real
   one. The threshold is an entitlement — a plan can set its own — so it is
   read from the response wherever there is one, and this number is never
   allowed to contradict it. */
const REVIEW_AT = 20;

/* Blockers arrive as a code plus the backend's own sentence. The sentence is
   what is shown; this supplies the short heading above it, so an unrecognised
   code still renders with its message rather than being dropped. */
const BLOCKER_TITLE: Record<string, string> = {
  NO_PROMPT: "No prompt stored",
  TOO_FEW_CLOSED_TRADES: "Not enough closed trades",
  NO_REVIEWS_LEFT: "No reviews left",
};

const BotDetailPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots, trades } = useSelector((state: RootState) => state.tradingV2);
  /* This bot's figures answer for one book — the Settings switch. The bot
     record itself is not book-scoped; everything attached to it is. */
  const book = useBook();

  const id = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const valid = id != null && !Number.isNaN(id);
  const bot = useMemo(() => bots.find((b) => b.id === id) || null, [bots, id]);

  const [busy, setBusy] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [health, setHealth] = useState<BotHealthV2 | null>(null);
  const [healthFailed, setHealthFailed] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const botFetchedRef = useRef<number | null>(null);
  const healthFetchedRef = useRef<number | null>(null);

  const copyField = async (field: string, value?: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((v) => (v === field ? null : v)), 1500);
    } catch {
      error("Couldn't copy — select it by hand");
    }
  };

  /* Health and decisions are re-read after a pause/resume, since both change
     what `connected` reports. A 404 from either means the bot does not exist
     or belongs to someone else — the message is "Not found." either way,
     deliberately, so ids cannot be probed. */
  const loadHealth = useCallback(async () => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    try {
      setHealth(await tradingV2Service.getBotHealth(axiosToken, id as number));
      setHealthFailed(null);
    } catch (err: any) {
      setHealth(null);
      setHealthFailed(err?.message || "Couldn't read this bot's health.");
    }
  }, [axiosToken, valid, id]);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      dispatch(tradingV2Service.listTrades({ api: axiosToken, book }));
      dispatch(tradingV2Service.listBots(axiosToken));
    }
    if (valid && !bot && botFetchedRef.current !== id) {
      botFetchedRef.current = id;
      dispatch(tradingV2Service.getBot({ api: axiosToken, id: id as number }));
    }
    if (valid && healthFetchedRef.current !== id) {
      healthFetchedRef.current = id;
      loadHealth();
    }
  }, [axiosToken, dispatch, valid, id, bot, loadHealth, book]);

  const linkedTrades = useMemo(
    () => trades.filter((t) => t.bot === id),
    [trades, id],
  );

  /* This bot's money — `GET /bots/{id}/metrics/`, one request.
     It replaces summing `/trades/{id}/metrics/` across the bot's trades in
     the browser, which double-counted any pair two trades shared, could not
     average a winner against a loser at all, and attributed every position on
     a pair to whichever bot happened to trade it. This counts the positions
     THIS BOT'S DECISIONS opened, so it survives a trade's bot being swapped. */
  const [metrics, setMetrics] = useState<BotMetricsV2 | null>(null);
  const [metricsAsked, setMetricsAsked] = useState(false);

  /* Whether this bot can be reviewed — `GET /bots/{id}/review-readiness/`.
     The bar is 20 CLOSED TRADES on the current prompt, both books counted.
     The meter here used to count decisions since `updated_at`, which was the
     wrong rule twice over: a HOLD is a decision that places nothing, and
     `updated_at` moves when the bot is renamed. */
  const [readiness, setReadiness] = useState<BotReviewReadinessV2 | null>(null);
  const [readinessAsked, setReadinessAsked] = useState(false);

  /* What this bot has open on the venue — `GET /positions/?status=open`,
     filtered to this bot by `bot_id`, which positions carry directly. */
  const {
    rows: allPositions,
    asked: positionsAsked,
    failed: positionsFailed,
  } = useOpenPositions(axiosToken, { status: "open", book });
  const botPositions = valid ? forBotId(allPositions, id as number) : [];
  const botRisk = riskRollup(botPositions);

  /* Both reads live here rather than in the mount effect above so a
     pause/resume — which changes what is open and so what is at risk — can
     re-run them, and so flipping the Demo/Live switch re-asks for the right
     book. Readiness takes no book: its bar counts closed trades across BOTH,
     which is the plan's own rule. */
  /**
   * `quiet` is the default because most calls are refreshes.
   *
   * Only a change of bot or book should put the vitals back to their loading
   * shimmer — there the figures on screen belong to something else entirely.
   * A 60s poll refreshing the same bot's figures must leave them up: flashing
   * five tiles to "reading…" once a minute, forever, would make a working
   * page look permanently unsettled.
   */
  const loadMetrics = useCallback((quiet = true) => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    if (!quiet) setMetricsAsked(false);
    return tradingV2Service
      .getBotMetrics(axiosToken, id as number, { book, window_days: DEFAULT_WINDOW_DAYS })
      .then(setMetrics)
      .catch(() => setMetrics(null))
      .finally(() => setMetricsAsked(true));
  }, [axiosToken, id, valid, book]);

  const loadReadiness = useCallback(() => {
    if (!valid || !isAuthorizationHeaderSet(axiosToken)) return;
    tradingV2Service
      .getBotReviewReadiness(axiosToken, id as number)
      .then(setReadiness)
      .catch(() => setReadiness(null))
      .finally(() => setReadinessAsked(true));
  }, [axiosToken, id, valid]);

  useEffect(() => {
    loadMetrics(false);
  }, [loadMetrics]);

  useEffect(() => {
    loadReadiness();
  }, [loadReadiness]);

  /* ---- keeping this bot's page current ----
     Readiness is on triggers only, per §9: its bar counts closed trades, so
     nothing can move it except a position closing — and that arrives as a
     notification. Polling it on a timer would be asking a question whose
     answer cannot have changed. */
  useRevalidateEffect(["botMetrics", "positions"], () => loadMetrics());
  useRevalidateEffect("botHealth", loadHealth);
  useRevalidateEffect("reviewReadiness", loadReadiness);

  usePoll(loadMetrics, POLL.botTiles);
  usePoll(loadHealth, POLL.botTiles);

  const toggleRun = async () => {
    if (!bot) return;
    setBusy(true);
    try {
      if (bot.status === "ACTIVE") {
        await dispatch(tradingV2Service.pauseBot({ api: axiosToken, id: bot.id }));
      } else {
        await dispatch(tradingV2Service.resumeBot({ api: axiosToken, id: bot.id }));
      }
      loadHealth();
      /* Pausing changes what is open and so what is at risk; it does not
         change the prompt, but the readiness call is cheap and a stale
         "ready to review" badge is worse than a second request. */
      loadMetrics();
      loadReadiness();
    } finally {
      setBusy(false);
    }
  };

  const meta = bot ? STATUS_META[bot.status] ?? STATUS_META.PAUSED : null;
  const conn = connectionState(health);
  /* `0` means two different things, and `last_failure_at` is what separates
     them — "failed today" vs "nothing has failed yet". Split into a figure
     plus a caption so the 26px `b` never holds a sentence. */
  const streak =
    !health || isUnavailable(health.unavailable, "days_without_failure")
      ? { value: null, caption: NOT_MEASURED }
      : failureStreakParts(health.days_without_failure, health.last_failure_at);
  /* Every vitals figure read once, here, so no two cells can disagree about
     what the same response said. A figure still in flight is NOT "not
     reported" — it shimmers and its caption says "reading…" instead. */
  const metricsPending = !metricsAsked;
  const netPnl = metricNum(metrics?.realised_pnl);
  const netPct = metricNum(metrics?.realised_return_pct);
  const winRateValue = metricNum(metrics?.win_rate);
  const closedInWindow = metrics?.closed_trades ?? null;
  const avgWin = metricNum(metrics?.avg_win);
  const avgLoss = metricNum(metrics?.avg_loss);
  const wins = metrics?.wins ?? null;
  const losses = metrics?.losses ?? null;
  const pairCount = metrics?.pairs?.length ?? 0;

  /* The milestones measure the bot's WHOLE record, not the 30-day window — a
     milestone must not un-reach itself when the window rolls past, which is
     exactly what reading the windowed count here would do. */
  const closedSoFar = metrics?.all_time?.closed_trades ?? null;
  const closedKnown = closedSoFar != null;
  const reached = (n: number) => closedKnown && (closedSoFar as number) >= n;
  const milestoneNote = (n: number) => {
    if (!closedKnown) return metricsPending ? "Reading…" : "No closed trades reported yet";
    const soFar = closedSoFar as number;
    if (soFar >= n) return "Reached";
    const left = n - soFar;
    return `${left.toLocaleString()} closed trade${left === 1 ? "" : "s"} to go`;
  };

  /* Review readiness, read once. `closed_trades_needed` is the plan's own
     threshold and wins over the local fallback whenever it is sent. */
  const reviewNeeded = readiness?.closed_trades_needed ?? REVIEW_AT;
  const promptStored = readiness?.prompt_stored ?? !!bot?.prompt;
  const closedOnPrompt = readiness?.closed_trades_on_prompt ?? null;
  const reviewsLeft = readiness?.reviews_available ?? null;
  const blockers = readiness?.blockers ?? [];

  /* "5 on demo · 9 live" — the split matters because both count toward the
     bar, which is not obvious from a single total. */
  const byBookNote = (() => {
    const by = readiness?.closed_trades_by_book;
    if (!by) return null;
    const parts: string[] = [];
    if (by.DEMO != null) parts.push(`${by.DEMO} on demo`);
    if (by.LIVE != null) parts.push(`${by.LIVE} live`);
    return parts.length ? parts.join(" · ") : null;
  })();

  const decisionKindNote = (() => {
    const by = readiness?.decisions_on_prompt_by_kind;
    if (!by) return null;
    const parts = (["BUY", "SELL", "HOLD"] as const)
      .filter((k) => by[k] != null)
      .map((k) => `${by[k]} ${k.toLowerCase()}`);
    return parts.length ? parts.join(" · ") : null;
  })();

  const bars = dailyReplyBars(health?.daily_replies);
  const dots = recentReplyDots(health?.daily_replies);

  return (
    <>
      <Head>
        <title>{bot ? bot.name : "Bot"} | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="bots">
        <TopBar
          crumb={
            <>
              <a href="/dashboard/bots">‹ My bots</a> / {bot ? bot.name : "Bot"}
            </>
          }
          title={bot ? bot.name : "Bot"}
          hideHeading
        />

        {!bot && (
          <p className="fx-hint" style={{ padding: "24px 4px" }}>
            {valid ? "Loading this bot…" : "Bot not found."}
          </p>
        )}

        {bot && meta && (
          <>
            {/* header */}
            <div className="fx-bh rv d1">
              <span className="fx-bavatar">{bot.name.slice(0, 2).toUpperCase()}</span>
              <div className="fx-bhead">
                <h1>{bot.name}</h1>
                <div className="row5">
                  <span className={`fx-st4 ${meta.cls}`}>{meta.label}</span>
                  {health && <span className={`fx-st4 ${conn.cls}`}>{conn.label}</span>}
                  <span className="fx-src">
                    {platformLabel(bot.platform)} · connected{" "}
                    {new Date(bot.created_at).toLocaleDateString()} ·{" "}
                    {bot.reach_mode === "PULL" ? "pull" : "push"}
                  </span>
                </div>
              </div>
              <div className="fx-bacts">
                {/* "Improve Bot" — first, primary (amber), same destination
                    the "Review" link used before: it runs the prompt +
                    performance review and returns recommendations. */}
                <Link
                  className="fx-cta live6"
                  href={`/dashboard/bots/${bot.id}/review`}
                  style={{ flex: "0 0 auto", padding: "12px 20px", fontSize: "13.5px" }}
                >
                  Improve Bot →
                </Link>
                <button
                  type="button"
                  className="fx-cta ghost2"
                  style={{ flex: "0 0 auto", padding: "12px 20px", fontSize: "13.5px" }}
                  disabled={busy}
                  onClick={toggleRun}
                >
                  {busy ? "…" : bot.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
                <Link
                  className="fx-cta ghost2"
                  href={`/dashboard/bots/${bot.id}/settings`}
                  style={{ flex: "0 0 auto", padding: "12px 18px", fontSize: "13.5px" }}
                >
                  Settings
                </Link>
              </div>
            </div>
            <p className="fx-hint" style={{ margin: "10px 0 0" }}>
              {/* `trades_using` counts the trades in THIS book that point at
                  the bot; the local list is the fallback before it lands. */}
              {(metrics?.trades_using ?? linkedTrades.length).toLocaleString()} trade
              {(metrics?.trades_using ?? linkedTrades.length) === 1 ? "" : "s"} use it · updated{" "}
              {new Date(bot.updated_at).toLocaleDateString()}
            </p>

            {meta.dead && (
              <p className="fx-failmsg">
                <b>Not responding.</b> Candleweb is not getting answers from this bot, so no orders
                are being placed for any trade it decides. Check it is running and reachable — fix
                it from{" "}
                <Link href={`/dashboard/bots/${bot.id}/settings`} style={{ color: "var(--fx-teal2)" }}>
                  settings
                </Link>
                , then resume. The failed-candle count below says how much it has missed.
              </p>
            )}
            {!meta.dead && bot.status === "PAUSED" && (
              <p className="fx-hint" style={{ marginTop: 10 }}>
                <b>Paused.</b> Its developer key is refused while it is paused, so both of its URLs
                answer 401. Time spent paused from now on is excluded from its uptime.
              </p>
            )}

            {/* vitals — design's 5-column stat row. Real data doesn't exist for
                any of these yet (needs per-trade PnL §1.4 + bot health §1.6),
                so each shows an honest "—" with what it's waiting on instead
                of the design's illustrative numbers. */}
            <div className="fx-vitals rv d1">
              {/* One `GET /bots/{id}/metrics/` fills this whole row. Every
                  figure counts the positions THIS BOT'S decisions opened, so
                  nothing here is an inference from the trades that point at
                  it. */}
              <div className="fx-v">
                <span>Net · {DEFAULT_WINDOW_DAYS}d</span>
                <b className={toneClass(netPnl, "up5", "dn5")}>
                  {metricsPending ? (
                    <i className="fx-skel" aria-label="Reading net PnL" />
                  ) : netPnl == null ? (
                    "—"
                  ) : (
                    signedMoney(netPnl)
                  )}
                </b>
                <i>
                  {metricsPending
                    ? "reading…"
                    : netPct != null
                      ? `${netPct > 0 ? "+" : netPct < 0 ? "-" : ""}${Math.abs(netPct).toFixed(2)}% on capital used`
                      : pairCount
                        ? `across ${pairCount} pair${pairCount === 1 ? "" : "s"}`
                        : "nothing closed yet"}
                </i>
              </div>
              <div className="fx-v">
                <span>Win rate</span>
                <b className={winRateValue == null ? "mut2" : undefined}>
                  {metricsPending ? (
                    <i className="fx-skel" aria-label="Reading win rate" />
                  ) : winRateValue == null ? (
                    "—"
                  ) : (
                    winRateLabel(winRateValue)
                  )}
                </b>
                <i>
                  {metricsPending
                    ? "reading…"
                    : closedInWindow == null
                      ? "nothing closed yet"
                      : `of ${closedInWindow.toLocaleString()} closed`}
                </i>
              </div>
              {/* Live at last: the endpoint reports the average winner and
                  the average loser, after fees. Neither can be derived from a
                  net total, which is why this cell sat empty for so long. */}
              <div className="fx-v">
                <span>Avg win / loss</span>
                <b className={avgWin == null && avgLoss == null ? "mut2" : undefined}>
                  {metricsPending ? (
                    <i className="fx-skel" aria-label="Reading average win and loss" />
                  ) : avgWin == null && avgLoss == null ? (
                    "—"
                  ) : (
                    <>
                      <span className="up5">{avgWin == null ? "—" : plainMoney(avgWin)}</span>
                      {" / "}
                      <span className="dn5">{avgLoss == null ? "—" : plainMoney(avgLoss)}</span>
                    </>
                  )}
                </b>
                <i>
                  {metricsPending
                    ? "reading…"
                    : avgWin == null && avgLoss == null
                      ? "needs a closed winner and loser"
                      : `${wins ?? "—"} won · ${losses ?? "—"} lost, after fees`}
                </i>
              </div>
              {/* Positions carry `bot_id`, so this is an exact count of what
                  THIS bot has on the venue right now — not an inference from
                  its trades. The list and the metrics endpoint agree; the
                  list wins because the rows below come from it. */}
              <div className="fx-v">
                <span>Open now</span>
                <b className={botPositions.length ? undefined : "mut2"}>
                  {!positionsAsked || positionsFailed ? "—" : botPositions.length}
                </b>
                <i>
                  {positionsFailed
                    ? "couldn't read positions"
                    : !positionsAsked
                      ? "reading…"
                      : botPositions.length === 0
                        ? "nothing on the venue"
                        : botRisk.unprotected > 0
                          ? `${botRisk.unprotected} with no stop`
                          : "all have a stop armed"}
                </i>
              </div>
              <div className="fx-v">
                <span>Reply time</span>
                <b className={health?.reply_time_seconds == null ? "mut2" : undefined}>
                  {health?.reply_time_seconds == null ? "—" : secondsLabel(health.reply_time_seconds)}
                </b>
                <i>
                  {health?.reply_time_seconds == null
                    ? "nothing to measure yet"
                    : "average over 7 days"}
                </i>
              </div>
            </div>
            <p className="fx-hint" style={{ marginTop: "10px" }}>


              . Answered <b>{health ? health.decisions_total.toLocaleString() : "—"}</b> times in
              all, <b>{health ? health.decisions_7d.toLocaleString() : "—"}</b> this week.
            </p>

            {/* Review readiness — `GET /bots/{id}/review-readiness/`.
                The bar counts CLOSED TRADES on the current prompt, which is
                the plan's own rule. It used to count decisions since
                `updated_at`, and that was wrong twice over: a HOLD is a
                decision that places nothing, and `updated_at` moves when the
                bot is renamed, so tidying a bot's note reset its progress.
                `prompt_changed_at` moves only for the prompt, the model or
                the decision style. */}
            <section
              className="fx-mom rv d2"
              style={{ marginTop: "clamp(26px,3.2vw,36px)", paddingTop: 24 }}
            >
              <div className="fx-sh">
                <h2>
                  Review readiness <span className="sub2">on the current prompt</span>
                </h2>
                {readinessAsked && !readiness && (
                  <span className="fx-preview">
                    <i>◔</i> Couldn&rsquo;t read review readiness
                  </span>
                )}
                {readiness?.ready && <span className="fx-st4 live4">Ready to review</span>}
              </div>
              <div className="fx-momgrid">
                <div>
                  <div className="fx-meter">
                    <div className="fx-mh">
                      <b>Closed trades on the current prompt</b>
                      <span className={closedOnPrompt == null ? "mut3" : undefined}>
                        {closedOnPrompt == null
                          ? readinessAsked
                            ? "—"
                            : "reading…"
                          : `${closedOnPrompt} of ${reviewNeeded}`}
                      </span>
                    </div>
                    {/* The meter is drawn to whatever the plan asks for, not
                        to a hard-coded 20: the threshold is an entitlement
                        and can differ per plan. */}
                    <div className="fx-seg">
                      {Array.from({ length: reviewNeeded }).map((_, i) => {
                        const done = closedOnPrompt ?? 0;
                        return <i key={i} className={i < done ? "f" : i === done ? "nx" : ""} />;
                      })}
                    </div>
                    <p className="fx-mnote">
                      {closedOnPrompt == null ? (
                        readinessAsked ? (
                          "Couldn't read this bot's review readiness just now."
                        ) : (
                          "Counting what this bot has closed on its current prompt."
                        )
                      ) : (
                        <>
                          A review reads this bot&rsquo;s closed trades against the prompt that
                          produced them, so it needs <b>{reviewNeeded}</b> on the same prompt.
                          Demo and live both count
                          {byBookNote ? <> — {byBookNote}</> : null}.
                          {readiness?.decisions_on_prompt != null && (
                            <>
                              {" "}
                              It has answered{" "}
                              <b>{readiness.decisions_on_prompt.toLocaleString()}</b> time
                              {readiness.decisions_on_prompt === 1 ? "" : "s"} on this prompt
                              {decisionKindNote ? <> ({decisionKindNote})</> : null} — a{" "}
                              <code>HOLD</code> is an answer but places nothing, which is why the
                              bar above counts closes instead.
                            </>
                          )}
                          {readiness?.prompt_changed_at && (
                            <>
                              {" "}
                              Counting from {whenLabel(readiness.prompt_changed_at)}, when the
                              prompt last changed. Renaming the bot or editing its note, webhook or
                              alerts does not reset it.
                            </>
                          )}
                        </>
                      )}
                    </p>
                  </div>

                  {/* Everything standing between this bot and a review, in
                      the backend's own words and its own order. */}
                  {blockers.length > 0 && (
                    <div className="fx-unlock" style={{ marginTop: "14px" }}>
                      <h4>Before a review can run</h4>
                      {blockers.map((b, i) => (
                        <div className="fx-ul" key={b.code ?? i}>
                          <i>{i + 1}</i>
                          <div>
                            <b>{BLOCKER_TITLE[b.code ?? ""] ?? "Not ready yet"}</b>
                            <span>{b.message}</span>
                            {b.code === "NO_PROMPT" && (
                              <span>
                                <Link
                                  href={`/dashboard/bots/${bot.id}/settings`}
                                  style={{ color: "var(--fx-teal2)" }}
                                >
                                  Add one in settings
                                </Link>
                              </span>
                            )}
                            {b.code === "NO_REVIEWS_LEFT" && (
                              <span>
                                <Link
                                  href="/dashboard/subscription"
                                  style={{ color: "var(--fx-teal2)" }}
                                >
                                  Get a review pack
                                </Link>
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="fx-streaks2">
                    <div className="fx-stk2">
                      {/* 0 means two different things, and `last_failure_at`
                          is what tells them apart — "failed today" vs
                          "nothing has failed yet". */}
                      <span>Days answering every candle</span>
                      {streak.value == null ? (
                        <b className="none3">{streak.caption}</b>
                      ) : (
                        <>
                          <b className={streak.caption === "failed today" ? "amb3" : ""}>
                            {streak.value}
                          </b>
                          <i>{streak.caption}</i>
                        </>
                      )}
                      <span
                        className="why3"
                        title={
                          streak.value == null
                            ? unavailableReason(health?.unavailable, "days_without_failure")
                            : undefined
                        }
                      >
                        {health == null
                          ? "Reading…"
                          : streak.value == null
                            ? "Nothing handed to it yet."
                            : health.last_failure_at
                              ? `Last miss ${whenLabel(health.last_failure_at)}.`
                              : "No misses on record."}
                      </span>
                      {dots.length > 0 && (
                        <div className="fx-dots2">
                          {dots.map((d) => (
                            <em
                              key={d.date}
                              className={d.cls}
                              title={`${d.date} — ${d.decisions} decision${d.decisions === 1 ? "" : "s"}`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="fx-stk2">
                      <span>Reviews available</span>
                      <b className={reviewsLeft == null ? "mut3" : reviewsLeft > 0 ? "" : "amb3"}>
                        {reviewsLeft == null ? "—" : reviewsLeft}
                      </b>
                      <span className="why3">
                        {reviewsLeft == null
                          ? readinessAsked
                            ? "not reported"
                            : "Reading…"
                          : reviewsLeft > 0
                            ? "on your plan this period"
                            : "none left this period"}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="fx-unlock">
                    <h4>This bot&rsquo;s milestones</h4>
                    <p className="us">
                      {closedKnown ? (
                        <>
                          Each one opens something real.{" "}
                          <b>{(closedSoFar as number).toLocaleString()}</b> closed trade
                          {closedSoFar === 1 ? "" : "s"} so far, all time.
                        </>
                      ) : (
                        "Each one opens something real. The closed-trade counts arrive with this bot's per-trade metrics."
                      )}
                    </p>
                    {/* `prompt_stored` is the backend's own answer to the
                        same question, and it is the one a review will
                        actually act on. */}
                    <div className={`fx-ul ${promptStored ? "got3" : ""}`}>
                      <i>{promptStored ? "✓" : "1"}</i>
                      <div>
                        <b>Prompt stored</b>
                        <span>{promptStored ? "Review can read it" : "Add one from settings"}</span>
                      </div>
                    </div>
                    <div className={`fx-ul ${reached(1) ? "got3" : ""}`}>
                      <i>{reached(1) ? "✓" : "2"}</i>
                      <div>
                        <b>First trade closed</b>
                        <span>{milestoneNote(1)}</span>
                      </div>
                    </div>
                    <div className={`fx-ul ${reached(100) ? "got3" : ""}`}>
                      <i>{reached(100) ? "✓" : "3"}</i>
                      <div>
                        <b>100 trades</b>
                        <span>{milestoneNote(100)}</span>
                      </div>
                    </div>
                    <div className="fx-ul">
                      <i>4</i>
                      <div>
                        <b>30 clean days</b>
                      </div>
                    </div>
                    <div className="fx-ul">
                      <i>{reached(250) ? "✓" : "🔒"}</i>
                      <div>
                        <b>Shareable record</b>
                        <span>{reached(250) ? "Unlocked" : milestoneNote(250)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* two-column layout matching the design: connection/endpoints/
                trades on the left, decisions/prompt on the right */}
            <div className="fx-two2">
              <section data-rv>
                {/* connection — GET /bots/<id>/health/. `failed_7d` is never
                    shown without `calls_expected_7d` next to it: "3 failed" is
                    alarming and meaningless, "3 of 1,240" is information. */}
                <div className="fx-sh">
                  <h2>Connection</h2>
                  <span className={`fx-st4 ${conn.cls}`}>{conn.label}</span>
                </div>

                {healthFailed && (
                  <div className="fx-failmsg" style={{ marginTop: 0 }}>
                    <b>Couldn&rsquo;t read this bot&rsquo;s health.</b> {healthFailed}{" "}
                    <button
                      type="button"
                      className="fx-mini"
                      style={{ marginLeft: 8 }}
                      onClick={loadHealth}
                    >
                      Try again
                    </button>
                  </div>
                )}

                <div className="fx-health">
                  <div className="fx-hz">
                    <span>Last signal</span>
                    <b className={health?.last_signal ? "" : "mut2"}>
                      {!health
                        ? "—"
                        : health.last_signal
                          ? sinceLabel(health.seconds_since_last_signal)
                          : "Never"}
                    </b>
                  </div>
                  <div className="fx-hz">
                    <span>Reply time</span>
                    <b className={health?.reply_time_seconds == null ? "mut2" : ""}>
                      {secondsLabel(health?.reply_time_seconds)}
                    </b>
                  </div>
                  <div className="fx-hz">
                    <span>Failed · 7d</span>
                    <b
                      className={
                        !health || isUnavailable(health.unavailable, "failed_7d")
                          ? "none3"
                          : health.failed_7d
                            ? "dn5"
                            : "up5"
                      }
                      title={unavailableReason(health?.unavailable, "failed_7d")}
                    >
                      {!health || isUnavailable(health.unavailable, "failed_7d")
                        ? NOT_MEASURED
                        : failedLabel(health.failed_7d, health.calls_expected_7d)}
                    </b>
                  </div>
                  <div className="fx-hz">
                    {/* A null reports as null, NOT 100%. A green "100% uptime"
                        badge on a bot that has never run is a lie the user
                        would act on. */}
                    <span>Uptime · 30d</span>
                    <b
                      className={
                        !health || isUnavailable(health.unavailable, "uptime_30d")
                          ? "none3"
                          : (health.uptime_30d ?? 0) >= 99
                            ? "up5"
                            : "dn5"
                      }
                      title={unavailableReason(health?.unavailable, "uptime_30d")}
                    >
                      {!health || isUnavailable(health.unavailable, "uptime_30d")
                        ? NOT_MEASURED
                        : uptimeLabel(health.uptime_30d)}
                    </b>
                  </div>
                </div>

                {/* 30 days of daily replies — always exactly 30 zero-filled
                    entries, oldest first, so nothing here fills gaps. The zero
                    days are the interesting ones: that is what an outage looks
                    like. */}
                {bars.length > 0 && (
                  <>
                    <div className="fx-uptime" aria-hidden="true">
                      {bars.map((b) => (
                        <i
                          key={b.date}
                          className={b.cls}
                          style={{ height: `${b.pct}%` }}
                          title={`${b.date} — ${b.decisions} decision${b.decisions === 1 ? "" : "s"}`}
                        />
                      ))}
                    </div>
                    <div className="fx-uplab">
                      <span>30 days ago</span>
                      <span>each bar = one day&rsquo;s replies</span>
                      <span>today</span>
                    </div>
                  </>
                )}

                <p className="fx-hint" style={{ marginTop: "14px" }}>
                  {/* The template carries no paragraph here. Only two things
                      earn a line: a timeout the backend clamped away from
                      what the user set, and the pauses caveat — and the
                      caveat is a tooltip, not a sentence. */}
                  <b>Silence is a failure; a hold is not.</b>
                  {timeoutDiffers(health, bot.reply_timeout_s) && (
                    <>
                      {" "}
                      Timeout in use is <b>{health?.reply_timeout_seconds}s</b>, not the{" "}
                      <b>{bot.reply_timeout_s}s</b> you set — it is clamped to 5s–6h.
                    </>
                  )}
                  {pausesCaveat(health?.unavailable) && (
                    <>
                      {" "}
                      <span title={pausesCaveat(health?.unavailable)} style={{ cursor: "help" }}>
                        Older pauses still count against uptime (?)
                      </span>
                    </>
                  )}
                </p>

                {/* endpoints — live */}
                <div style={{ marginTop: "26px" }}>
                  <div className="fx-sh">
                    <h2>Endpoints</h2>
                  </div>
                  {bot.reach_mode === "PUSH" && (
                    <div className="fx-ep2">
                      <div className="eh2">
                        <span className="fx-mv g4">POST</span>
                        <b>Candleweb → your bot</b>
                      </div>
                      <div className="eb2">
                        <code>{bot.webhook_url || "— not set —"}</code>
                        <button
                          className="fx-mini"
                          type="button"
                          onClick={() => copyField("webhook", bot.webhook_url ?? undefined)}
                        >
                          {copiedField === "webhook" ? "Copied" : "Copy"}
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="fx-ep2">
                    <div className="eh2">
                      <span className="fx-mv p4">KEY</span>
                      <b>Developer key · sent both ways</b>
                    </div>
                    <div className="eb2">
                      <code>{bot.dev_key ? maskString(bot.dev_key) : "— no key on this bot —"}</code>
                      {bot.dev_key && (
                        <button
                          className="fx-mini"
                          type="button"
                          onClick={() => copyField("key", bot.dev_key)}
                        >
                          {copiedField === "key" ? "Copied" : "Copy"}
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="fx-hint" style={{ marginTop: "10px" }}>
                    The bot sends this key on both of its calls as the header{" "}
                    <code>X-Candleweb-Key</code>. One key serves every trade this bot decides for,
                    so regenerating it breaks all of them at once — that is a settings action,{" "}
                    <Link href={`/dashboard/bots/${bot.id}/settings`} style={{ color: "var(--fx-teal2)" }}>
                      open settings
                    </Link>
                    . Each trade&rsquo;s own pull and decision URLs are on that trade&rsquo;s setup
                    screen.
                  </p>
                </div>

                {/* what this bot has on the venue right now. A trade is a
                    setup; a position is money — they are listed separately so
                    the two are never read as the same thing. */}
                <div style={{ marginTop: "26px" }}>
                  <div className="fx-sh">
                    <h2>
                      Open positions <span className="sub2">{botPositions.length}</span>
                    </h2>
                  </div>
                  {positionsFailed ? (
                    <div className="fx-failmsg" style={{ marginTop: 0 }}>
                      <b>Couldn&rsquo;t load positions.</b> {positionsFailed}
                    </div>
                  ) : !positionsAsked ? (
                    <p className="fx-hint" style={{ padding: "14px 4px" }}>
                      Loading…
                    </p>
                  ) : (
                    <OpenPositionsList
                      positions={botPositions}
                      empty={
                        <>
                          <b>Nothing open from this bot.</b> It opens a position when it answers
                          BUY and the gate lets the order through.
                        </>
                      }
                    />
                  )}
                </div>

                {/* trades this bot runs — live */}
                <div style={{ marginTop: "26px" }}>
                  <div className="fx-sh">
                    <h2>
                      Trades this bot runs <span className="sub2">{linkedTrades.length}</span>
                    </h2>
                    <Link className="fx-link" href="/dashboard/trades/new">
                      Assign another →
                    </Link>
                  </div>
                  {linkedTrades.length === 0 ? (
                    <div className="fx-flat2" style={{ marginTop: 0 }}>
                      <b>Not assigned to any trade yet.</b> Open a trade&rsquo;s setup and pick this bot
                      as the decider, or{" "}
                      <Link href="/dashboard/trades/new" style={{ color: "var(--fx-teal2)" }}>
                        create one
                      </Link>
                      .
                    </div>
                  ) : (
                    linkedTrades.map((t) => (
                      <div className="fx-bcard" key={t.id}>
                        <div className="fx-bl1">
                          <span className="nm4">{t.pair_name || `Pair #${t.pair}`}</span>
                          <span
                            className={`fx-st4 ${
                              t.status === "RUNNING"
                                ? "live4"
                                : t.status === "ERROR"
                                  ? "fail4"
                                  : "pause4"
                            }`}
                          >
                            {t.status === "RUNNING"
                              ? "Running"
                              : t.status === "ERROR"
                                ? "Not responding"
                                : "Paused"}
                          </span>
                          <span className="fx-src">
                            {t.timeframe} · {t.exchange_name || `Account #${t.exchange_account}`}
                          </span>
                        </div>
                        <div className="fx-bl3">
                          <Link className="fx-mini" href={`/dashboard/trades/new?id=${t.id}`}>
                            Open setup
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <section data-rv>
                {/* this bot's decisions — GET /decisions/?bot=<id>, listed in
                    place a few at a time. The feed pages itself and opens any
                    row in full. No order is placed from a decision: this is
                    the record of what the bot answered, nothing more. */}
                <div className="fx-sh">
                  <h2>Recent decisions</h2>
                  <span className="fx-src">newest first</span>
                </div>
                <DecisionsFeed
                  api={axiosToken}
                  book={book}
                  bot={bot.id}
                  pageSize={5}
                  empty={
                    <>
                      <b>No decisions from this bot yet.</b> It records one each time it fetches a
                      trade&rsquo;s candles and posts an answer back — including the times it
                      answers <code>HOLD</code>.
                    </>
                  }
                />

                {/* prompt — live, read-only */}
                <div style={{ marginTop: "26px" }}>
                  <div className="fx-sh">
                    <h2>Prompt in use</h2>
                    <Link className="fx-link" href={`/dashboard/bots/${bot.id}/settings`}>
                      Edit →
                    </Link>
                  </div>
                  {bot.prompt ? (
                    <pre className="fx-pre">{bot.prompt}</pre>
                  ) : (
                    <p className="fx-hint">
                      No prompt stored. Bots without a prompt can be monitored, but review can&rsquo;t
                      tell you <em>why</em> a decision was made — add one from settings.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* config — live. Not in the design's detail view (it splits
                webhook/key into Endpoints above), kept as its own section
                since it's real settings data with nowhere else on this page
                to live. */}
            <section className="fx-sec rv d3">
              <div className="fx-sh">
                <h2>Configuration</h2>
                <Link className="fx-link" href={`/dashboard/bots/${bot.id}/settings`}>
                  Edit →
                </Link>
              </div>

              <div className="fx-bl2">
                <div className="fx-bm">
                  <span>Platform</span>
                  <b>{platformLabel(bot.platform)}</b>
                </div>
                <div className="fx-bm">
                  <span>Reach mode</span>
                  <b>{bot.reach_mode === "PULL" ? "Bot pulls" : "We push"}</b>
                </div>
                <div className="fx-bm">
                  <span>Reply timeout</span>
                  <b>{bot.reply_timeout_s}s</b>
                </div>
                <div className="fx-bm">
                  <span>Model</span>
                  <b>{bot.model_name || "—"}</b>
                </div>
              </div>

              <div className="fx-bl3">
                <span className="fx-tr2">
                  <i />
                  {decisionStyleLabel(bot.decision_style)}
                </span>
                <span className="fx-tr2 none2">On no reply: {onNoReplyLabel(bot.on_no_reply)}</span>
                <span className="fx-tr2 none2">
                  Alerts:{" "}
                  {[
                    bot.alert_email_on_fail ? "email" : null,
                    bot.alert_push_on_fail ? "push" : null,
                  ]
                    .filter(Boolean)
                    .join(" + ") || "off"}
                </span>
              </div>
            </section>
          </>
        )}
      </DashboardShell>
    </>
  );
};

export default BotDetailPage;
