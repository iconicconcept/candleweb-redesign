import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import tradingV2Service from "../../services/tradingV2Service";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import Dialog from "../../components/dashboard/focus/Dialog";
import { TrashIcon } from "../../components/dashboard/focus/icons";
import { BotV2, FleetHealthV2 } from "../../types/tradingV2";
import { STATUS_META, platformLabel } from "../../lib/botV2Labels";
import {
  NOT_MEASURED,
  answeringLabel,
  connectionState,
  failureStreakParts,
  isUnavailable,
  pausesCaveat,
  signalStamp,
  unavailableReason,
} from "../../lib/botHealthV2";
import useBotMetrics, { BOT_METRIC_CAP } from "../../lib/hooks/useBotMetrics";
import useOpenPositions from "../../lib/hooks/useOpenPositions";
import useBook from "../../lib/hooks/useBook";
import usePoll, { POLL } from "../../lib/hooks/usePoll";
import { useRevalidateEffect } from "../../lib/hooks/useRevalidate";
import { commonQuote, forBotId, openPnlTotal, posMoney } from "../../lib/positionsV2";
import {
  DEFAULT_WINDOW_DAYS,
  metricNum,
  signedMoney,
  toneClass,
  winRateLabel,
} from "../../lib/tradingV2Metrics";

const BotsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots, botsLoading, botsLoaded, trades } = useSelector(
    (state: RootState) => state.tradingV2,
  );

  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BotV2 | null>(null);
  const [fleet, setFleet] = useState<FleetHealthV2 | null>(null);
  /* The book it last fetched for, not a bare boolean — flipping the switch
     has to re-ask rather than leave the other book's figures up. */
  const fetchedRef = useRef<string | null>(null);
  const book = useBook();

  /* `GET /bots/health/` — one call for the whole fleet. A user with no bots
     gets zeroes and an empty `bots` array rather than an error, so a null
     here means the call itself failed and every tile falls back to "not
     measured" instead of to a zero. */
  const loadFleet = useCallback(async () => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    try {
      setFleet(await tradingV2Service.getFleetHealth(axiosToken));
    } catch {
      setFleet(null);
    }
  }, [axiosToken]);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current === book) return;
    fetchedRef.current = book;
    dispatch(tradingV2Service.listBots(axiosToken));
    dispatch(tradingV2Service.listTrades({ api: axiosToken, book }));
    loadFleet();
  }, [axiosToken, dispatch, loadFleet, book]);

  /* Fleet health is the one read on this page that is not inside a hook, so
     it gets its own poll. `useBotMetrics` and `useOpenPositions` keep
     themselves current. A bot answering or going quiet arrives as a
     notification; the minute interval covers the rest. */
  useRevalidateEffect(["botHealth", "botMetrics"], loadFleet);
  usePoll(loadFleet, POLL.botTiles);

  /* Pausing / resuming / removing a bot changes `connected` and `running`
     immediately, so the fleet numbers are re-read rather than left stale. */
  const fleetBot = (id: number) => fleet?.bots.find((b) => b.bot_id === id) ?? null;

  // The design's chips under each bot show the real pair/timeframe of every
  // trade currently pointed at it — not the bot's own config (decision style,
  // on-no-reply), which was shown here before real trade data was wired up.
  const tradesForBot = (botId: number) => trades.filter((t) => t.bot === botId);

  /* Each bot's own money — `GET /bots/{id}/metrics/` per row, capped. This
     replaces summing per-trade metrics across position groups: a pair two
     deciders shared used to report both their fills under each of them, and
     nothing client-side could separate them. */
  const {
    forBot: metricsForBot,
    asked: metricsAsked,
    requested: metricsRequested,
  } = useBotMetrics(
    axiosToken,
    bots.map((b) => b.id),
    book,
  );
  /* One positions request for the whole list, attributed per bot by `bot_id`
     rather than one request per row. */
  const {
    rows: positions,
    asked: positionsAsked,
    failed: positionsFailed,
  } = useOpenPositions(axiosToken, { status: "open", book });

  /* `running` = bots that are not paused; `connected` = bots actually
     answering. Both come from the fleet endpoint; the local status list is
     only the fallback for the moment before it resolves. */
  const runningCount = fleet ? fleet.running : bots.filter((b) => b.status === "ACTIVE").length;
  const connectedCount = fleet ? fleet.connected : null;
  const notAnswering = fleet ? Math.max(0, fleet.answering_of - fleet.answering) : 0;

  /* The fleet's `days_without_failure` is its WORST bot, not an average —
     four healthy bots must not hide one that failed this morning. The fleet
     endpoint carries no `last_failure_at`, so `failed_30d` is what separates
     a 0 that means "failed today" from a 0 that means "nothing has failed
     yet" (the same split the per-bot page makes with `last_failure_at`). */
  const streak =
    !fleet || isUnavailable(fleet.unavailable, "days_without_failure")
      ? { value: null, caption: NOT_MEASURED }
      : failureStreakParts(
          fleet.days_without_failure,
          fleet.failed_30d != null && fleet.failed_30d > 0 ? "yes" : null,
        );

  const toggleRun = async (b: BotV2) => {
    setBusyId(b.id);
    try {
      if (b.status === "ACTIVE") {
        await dispatch(tradingV2Service.pauseBot({ api: axiosToken, id: b.id }));
      } else {
        await dispatch(tradingV2Service.resumeBot({ api: axiosToken, id: b.id }));
      }
      loadFleet();
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setBusyId(confirmDelete.id);
    try {
      await dispatch(tradingV2Service.deleteBot({ api: axiosToken, id: confirmDelete.id }));
      setConfirmDelete(null);
      loadFleet();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Head>
        <title>My bots | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="bots">
        <TopBar
          crumb="Dashboard / My bots"
          title="My bots"
          subtitle="The agents that answer when Candleweb sends a candle."
        />

        {/* ---- CandleAI, built in ---- */}
        <section className="fx-hcard rv d1">
          <div className="fx-hcw">
            <span className="fx-hlogo">AI</span>
            <div className="ht">
              <b>CandleAI</b>
              <em>Built in · no setup</em>
            </div>
          </div>
          <p>
            Our own trading agent. Assign a trade to CandleAI and it decides for you — running on
            the same execution, monitoring and record-keeping as the bots you build. You still set
            the pair, the risk and the size.
          </p>
          <div className="fx-hbtns">
            <Link className="fx-cta main2" href="/dashboard/trades/new">
              Assign a trade →
            </Link>
          </div>
        </section>

        {/* ---- fleet status — GET /bots/health/ ---- */}
        {bots.length > 0 && (
          <section className="fx-mom rv d2" style={{ marginTop: "clamp(26px,3.4vw,38px)", paddingTop: 24 }}>
            <div className="fx-sh">
              <h2>
                Your bots at a glance{" "}
                <span className="sub2">
                  {fleet ? fleet.bots_total : bots.length} bot
                  {(fleet ? fleet.bots_total : bots.length) === 1 ? "" : "s"} · {runningCount} running
                  {connectedCount != null && ` · ${connectedCount} answering`}
                </span>
              </h2>
            </div>
            <div className="fx-momgrid">
              <div>
                <div className="fx-meter">
                  <div className="fx-mh">
                    <b>Fleet health — right now</b>
                    <span>{answeringLabel(fleet)}</span>
                  </div>
                  {/* One segment per bot, filled when that bot is actually
                      answering. A paused bot reads as not-answering here,
                      which is correct — it is just not a fault. */}
                  <div className="fx-seg">
                    {(fleet?.bots ?? bots.map((b) => ({ bot_id: b.id, connected: false }))).map(
                      (b: { bot_id: number; connected: boolean }) => (
                        <i key={b.bot_id} className={b.connected ? "f" : ""} />
                      ),
                    )}
                  </div>
                  <p className="fx-mnote">
                    {!fleet
                      ? "Reading the fleet…"
                      : notAnswering > 0
                        ? `${notAnswering} bot${notAnswering === 1 ? "" : "s"} not in touch right now — see below.`
                        : "Every bot is answering right now."}{" "}
                    Answering means a reply in the last six hours — wide enough that a 4-hour trade
                    still reads as healthy. This is right now, not uptime.
                  </p>
                </div>
                <div className="fx-streaks2">
                  <div className="fx-stk2">
                    <span>Days with no failures</span>
                    {/* The tile's `b` is a 26px figure slot, so a sentence
                        goes in the small caption instead of being blown up to
                        heading size. */}
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
                          ? unavailableReason(fleet?.unavailable, "days_without_failure")
                          : undefined
                      }
                    >
                      {streak.value == null ? (
                        "No bot has been asked anything yet."
                      ) : (
                        <>
                          Your <b>worst</b> bot, not an average.
                        </>
                      )}
                    </span>
                  </div>
                  <div className="fx-stk2">
                    <span>Reviews waiting</span>
                    {/* Always null — nothing spends a bot review yet, so none
                        can be waiting. Never render this as a 0. */}
                    <b className="none3">{NOT_MEASURED}</b>
                    <span
                      className="why3"
                      title={unavailableReason(fleet?.unavailable, "reviews_waiting")}
                    >
                      Nothing spends a review yet.
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <div className="fx-unlock">
                  <h4>The last 7 days</h4>
                  <p className="us">Measured by Candleweb, not reported by your bots.</p>
                  {/* No tick on a zero — the mark says "this is measured",
                      so it only goes on a figure that exists. */}
                  <div className={`fx-ul ${fleet && fleet.decisions_7d > 0 ? "got3" : ""}`}>
                    <i>{fleet && fleet.decisions_7d > 0 ? "✓" : "·"}</i>
                    <div>
                      <b>
                        {fleet ? fleet.decisions_7d.toLocaleString() : "—"} decision
                        {fleet?.decisions_7d === 1 ? "" : "s"} answered
                      </b>
                      <span>
                        {fleet && fleet.decisions_7d > 0
                          ? "Open a bot to read what it decided and why."
                          : "Nothing answered this week."}
                      </span>
                    </div>
                  </div>
                  <div className="fx-ul">
                    <i>{fleet?.failed_30d ? "!" : "·"}</i>
                    <div>
                      <b>
                        {fleet == null || fleet.failed_30d == null
                          ? NOT_MEASURED
                          : `${fleet.failed_30d.toLocaleString()} missed candle${fleet.failed_30d === 1 ? "" : "s"} in 30 days`}
                      </b>
                      <span>
                        {fleet?.failed_30d == null
                          ? "No bot has been asked anything yet."
                          : "Across every bot. A candle is missed when no decision came back inside that bot’s timeout."}
                      </span>
                    </div>
                  </div>
                  <p className="fx-tip2">
                    <b style={{ color: "var(--fx-t2)" }}>Worth knowing.</b> Silence is a failure;{" "}
                    <b>hold</b> is not.
                    {pausesCaveat(fleet?.unavailable) && (
                      <>
                        {" "}
                        <span title={pausesCaveat(fleet?.unavailable)} style={{ cursor: "help" }}>
                          Older pauses still count against uptime (?)
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ---- connected bots ---- */}
        <section className="fx-botlist">
          <div className="fx-sh">
            <h2>
              Connected bots{" "}
              <span className="sub2">
                {bots.length} bot{bots.length === 1 ? "" : "s"} · {runningCount} running
              </span>
            </h2>
            <Link className="fx-link" href="/dashboard/bots/new">
              Add a bot →
            </Link>
          </div>

          {botsLoading && !botsLoaded && (
            <p className="fx-hint" style={{ padding: "18px 4px" }}>
              Loading your bots…
            </p>
          )}

          {botsLoaded && bots.length === 0 && (
            <div className="fx-failmsg" style={{ marginTop: 0 }}>
              No bots connected yet. <Link href="/dashboard/bots/new" style={{ color: "var(--fx-teal2)" }}>
                Add one
              </Link>{" "}
              — it takes about two minutes.
            </div>
          )}

          {bots.map((b) => {
            const meta = STATUS_META[b.status] ?? STATUS_META.PAUSED;
            const running = b.status === "ACTIVE";
            const fb = fleetBot(b.id);
            /* "Paused" and "never answered yet" are not faults, so neither
               gets a red state — see connectionState. */
            const conn = connectionState(
              fb ? { connected: fb.connected, status: fb.status, last_signal: fb.last_signal } : null,
            );
            const botTrades = tradesForBot(b.id);
            /* `undefined` means this row was beyond the request cap and was
               never asked for — a different state from "asked and the figure
               is null", and it must say so rather than sit on "reading…". */
            const bm = metricsForBot(b.id);
            const pnlOutOfCap = !metricsRequested(b.id);
            const pnlLoading = !pnlOutOfCap && !metricsAsked;
            const netPnl = metricNum(bm?.realised_pnl);
            const botWinRate = metricNum(bm?.win_rate);
            const botClosed = bm?.closed_trades ?? null;
            const stamp = signalStamp(fb?.last_signal);
            const botOpen = forBotId(positions, b.id);
            const botOpenPnl = openPnlTotal(botOpen);
            return (
              <div key={b.id} className={`fx-bcard ${meta.dead ? "dead" : ""} ${b.status === "PAUSED" ? "off5" : ""}`}>
                <div className="fx-bl1">
                  <Link className="nm4" href={`/dashboard/bots/${b.id}`}>
                    {b.name}
                  </Link>
                  <span className={`fx-st4 ${meta.cls}`}>{meta.label}</span>
                  {fb && <span className={`fx-st4 ${conn.cls}`}>{conn.label}</span>}
                  <span className="fx-src">
                    {platformLabel(b.platform)} · {b.reach_mode === "PULL" ? "pull" : "push"}
                  </span>
                </div>

                <div className="fx-bl2">
                  <div className="fx-bm">
                    <span>Model</span>
                    <b>{b.model_name || "—"}</b>
                  </div>
                  <div className="fx-bm">
                    <span>Reply timeout</span>
                    <b>{b.reply_timeout_s}s</b>
                  </div>
                  {/* `consecutive_fail_count` used to sit here. It is always
                      0 — nothing increments it — so it is not displayed
                      anywhere; the health endpoint is the real source. */}
                  {/* Stacked, not inline. The locale's full timestamp was the
                      widest value in this row by a distance and was what bent
                      the grid out of shape; a day over a time costs one line
                      of height instead of a column of width. */}
                  <div className="fx-bm">
                    <span>Last signal</span>
                    <b className={fb?.last_signal ? "" : "mut"}>
                      {!fb ? "—" : stamp ? stamp.day : "Never"}
                    </b>
                    {stamp && <em className="sub6">{stamp.time}</em>}
                  </div>
                  <div className="fx-bm">
                    <span>Auto-pause at</span>
                    <b>{b.auto_pause_after_n_fails || "—"}</b>
                  </div>
                  {/* What this bot has on the venue right now. Positions carry
                      `bot_id`, so this is a count, not an inference. */}
                  <div className="fx-bm">
                    <span>Open now</span>
                    <b className={botOpen.length ? undefined : "mut"}>
                      {!positionsAsked || positionsFailed ? "—" : botOpen.length}
                    </b>
                    <div style={{ marginTop: 4, fontSize: "11px", color: "var(--fx-t3)" }}>
                      {positionsFailed
                        ? "couldn't read positions"
                        : !positionsAsked
                          ? "reading…"
                          : botOpen.length === 0
                            ? "nothing on the venue"
                            : `${botOpenPnl == null ? "—" : posMoney(botOpenPnl, commonQuote(botOpen))} unrealised`}
                    </div>
                  </div>
                  {/* This bot's own realised PnL, from `/bots/{id}/metrics/`.
                      It counts the positions THIS BOT'S decisions opened, so
                      there is no longer a "shares a pair with another
                      decider" caveat to make — a pair two bots trade now
                      reports each one's fills under that bot alone. */}
                  <div className="fx-bm">
                    <span className="fx-kase">PnL · {DEFAULT_WINDOW_DAYS}D</span>
                    <b className={pnlLoading ? "mut" : toneClass(netPnl, "up5", "dn5", "mut")}>
                      {pnlLoading ? (
                        <i className="fx-skel" aria-label="Reading PnL" />
                      ) : netPnl == null ? (
                        "—"
                      ) : (
                        signedMoney(netPnl)
                      )}
                    </b>
                    {/* a <div>, not a second `.fx-bm span` — that selector
                        would force its own uppercase/mono styling onto this
                        note regardless of the `.fx-preview` class */}
                    <div
                      style={{ marginTop: 4, fontSize: "11px", color: "var(--fx-t3)" }}
                    >
                      {pnlOutOfCap
                        ? `beyond the first ${BOT_METRIC_CAP} bots`
                        : pnlLoading
                          ? "reading…"
                          : botClosed === 0
                            ? "nothing closed yet"
                            : botWinRate != null
                              ? `${winRateLabel(botWinRate)} of ${(botClosed ?? 0).toLocaleString()} closed`
                              : botClosed != null
                                ? `${botClosed.toLocaleString()} closed`
                                : "not reported yet"}
                    </div>
                  </div>
                </div>

                {b.note && (
                  <p className="fx-hint" style={{ marginTop: "10px" }}>
                    {b.note}
                  </p>
                )}

                {meta.dead && (
                  <p className="fx-failmsg">
                    <b>Not responding.</b> Candleweb is not getting answers from this bot. Check it
                    is running and reachable, then resume it —{" "}
                    <Link href={`/dashboard/bots/${b.id}`} style={{ color: "var(--fx-teal2)" }}>
                      its reliability record
                    </Link>{" "}
                    shows which candles went unanswered.
                  </p>
                )}
                {!meta.dead && conn.tone === "bad" && (
                  <p className="fx-hint" style={{ marginTop: 10 }}>
                    <b>Nothing in the last six hours.</b> That is only a problem if this bot should
                    have been asked something in that time — open it to see the candles it owed an
                    answer to.
                  </p>
                )}
                {conn.tone === "new" && b.status !== "PAUSED" && (
                  <p className="fx-hint" style={{ marginTop: 10 }}>
                    <b>Not connected yet.</b> This bot has never answered. Assign it to a trade and
                    point it at that trade&rsquo;s pull and decision URLs.
                  </p>
                )}

                <div className="fx-bl3">
                  {botTrades.length === 0 ? (
                    <span className="fx-tr2 none2">No trades assigned</span>
                  ) : (
                    botTrades.map((t) => (
                      <span className="fx-tr2" key={t.id}>
                        <i />
                        {(t.pair_name || `Pair #${t.pair}`).toUpperCase()} · {t.timeframe}
                      </span>
                    ))
                  )}
                </div>

                <div className="fx-bacts">
                  <button
                    type="button"
                    className={`fx-mini ${running ? "" : "go"}`}
                    disabled={busyId === b.id}
                    onClick={() => toggleRun(b)}
                  >
                    {busyId === b.id ? "…" : running ? "Pause" : "Resume"}
                  </button>
                  <Link className="fx-mini" href={`/dashboard/bots/${b.id}`}>
                    Open
                  </Link>
                  <Link className="fx-mini" href={`/dashboard/bots/${b.id}/settings`}>
                    Settings
                  </Link>
                  <button
                    type="button"
                    className="fx-mini dgr"
                    disabled={busyId === b.id}
                    onClick={() => setConfirmDelete(b)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </section>

        <Dialog
          open={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          tone="amber"
          labelledBy="del-bot-title"
          icon={<TrashIcon />}
          title={<span id="del-bot-title">Remove {confirmDelete?.name}?</span>}
          subtitle="This one cannot be undone"
          footer={
            <>
              <button className="fx-cta ghost2" type="button" onClick={() => setConfirmDelete(null)}>
                Keep the bot
              </button>
              <button
                className="fx-cta dgr2"
                type="button"
                disabled={busyId === confirmDelete?.id}
                onClick={doDelete}
              >
                Remove bot
              </button>
            </>
          }
        >
          <p className="fx-dwarn">
            The bot and its prompt are deleted. Any trade this bot decides for is left without a
            decider and pauses — its stops stay in place — until you assign another bot or CandleAI.
          </p>
        </Dialog>
      </DashboardShell>
    </>
  );
};

export default BotsPage;
