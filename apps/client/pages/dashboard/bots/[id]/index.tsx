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
import { BotHealthV2 } from "../../../../types/tradingV2";

/* The rich per-bot view. Live: the bot's own config, the trades that point
   at it, its reliability record (`GET /bots/<id>/health/`) and the decisions
   it has made (`GET /decisions/?bot=`). Still DESIGN ONLY behind a
   `.fx-preview` ribbon: P&L and open-position state, which have no endpoint
   (DASHBOARD_ENDPOINTS.md §1.4 / §1.21).

   The health block's one rule: a field named in `health.unavailable` has no
   measurement yet and renders as "Not measured yet" — never as 0, and never
   as a green 100%. A bot nobody has called has not proved anything. */

const BotDetailPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots, trades } = useSelector((state: RootState) => state.tradingV2);

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
      dispatch(tradingV2Service.listTrades(axiosToken));
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
  }, [axiosToken, dispatch, valid, id, bot, loadHealth]);

  const linkedTrades = useMemo(
    () => trades.filter((t) => t.bot === id),
    [trades, id],
  );

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
  const bars = dailyReplyBars(health?.daily_replies);
  const busiestDay = bars.reduce((m, b) => Math.max(m, b.decisions), 0);

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
              {linkedTrades.length} trade{linkedTrades.length === 1 ? "" : "s"} use it · updated{" "}
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
                any of these yet (needs per-trade P&L §1.4 + bot health §1.6),
                so each shows an honest "—" with what it's waiting on instead
                of the design's illustrative numbers. */}
            <div className="fx-vitals rv d1">
              <div className="fx-v">
                <span>Net · 30d</span>
                <b className="mut2">—</b>
                <i>needs a P&amp;L endpoint</i>
              </div>
              <div className="fx-v">
                <span>Win rate</span>
                <b className="mut2">—</b>
                <i>needs a P&amp;L endpoint</i>
              </div>
              <div className="fx-v">
                <span>Avg win / loss</span>
                <b className="mut2">—</b>
                <i>needs a P&amp;L endpoint</i>
              </div>
              <div className="fx-v">
                <span>Open now</span>
                <b className="mut2">—</b>
                <i>needs open-position data</i>
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
              <span className="fx-preview">
                <i>◔</i> P&amp;L and open positions land when the backend exposes them
              </span>
              . What we <b>can</b> tell you: this bot has answered{" "}
              <b>{health ? health.decisions_total.toLocaleString() : "—"}</b> time
              {health?.decisions_total === 1 ? "" : "s"} in total,{" "}
              <b>{health ? health.decisions_7d.toLocaleString() : "—"}</b> of them this week, and it
              auto-pauses after <b>{bot.auto_pause_after_n_fails || "—"}</b> failures.
            </p>

            {/* review readiness — the design's trade-count meter, streaks and
                milestone checklist all need bot decision history (§1.5) that
                doesn't exist yet. Only "Prompt stored" is real today. */}
            <section
              className="fx-mom rv d2"
              style={{ marginTop: "clamp(26px,3.2vw,36px)", paddingTop: 24 }}
            >
              <div className="fx-sh">
                <h2>
                  Review readiness <span className="sub2">on the current prompt</span>
                </h2>
                <span className="fx-preview">
                  <i>◔</i> Needs bot decision history
                </span>
              </div>
              <div className="fx-momgrid">
                <div>
                  <div className="fx-meter">
                    <div className="fx-mh">
                      <b>Trades since the prompt last changed</b>
                      <span>—</span>
                    </div>
                    <div className="fx-seg">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <i key={i} />
                      ))}
                    </div>
                    <p className="fx-mnote">
                      Needs bot decision history to count trades against the current prompt — once it
                      exists, review can compare this prompt against its results (see
                      BACKEND_API_REQUESTS.md §1.5).
                    </p>
                  </div>
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
                      <span className="why3">
                        {health == null
                          ? "reading…"
                          : streak.value == null
                            ? unavailableReason(health.unavailable, "days_without_failure") ??
                              "Nothing in the last 30 days to measure."
                            : health.last_failure_at
                              ? `Last miss ${whenLabel(health.last_failure_at)}.`
                              : "No missed candles on record."}
                      </span>
                    </div>
                    <div className="fx-stk2">
                      <span>Suggestions applied</span>
                      <b className="mut3">—</b>
                      <span className="why3">needs a bot-review endpoint</span>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="fx-unlock">
                    <h4>This bot&rsquo;s milestones</h4>
                    <p className="us">Each one opens something real.</p>
                    <div className={`fx-ul ${bot.prompt ? "got3" : ""}`}>
                      <i>{bot.prompt ? "✓" : "1"}</i>
                      <div>
                        <b>Prompt stored</b>
                        <span>{bot.prompt ? "Review can read it" : "Add one from settings"}</span>
                      </div>
                    </div>
                    <div className="fx-ul">
                      <i>2</i>
                      <div>
                        <b>First trade closed</b>
                        <span>Needs bot decision history</span>
                      </div>
                    </div>
                    <div className="fx-ul">
                      <i>3</i>
                      <div>
                        <b>100 trades</b>
                        <span>Needs bot decision history</span>
                      </div>
                    </div>
                    <div className="fx-ul">
                      <i>4</i>
                      <div>
                        <b>30 clean days</b>
                        <span>Needs bot decision history</span>
                      </div>
                    </div>
                    <div className="fx-ul">
                      <i>5</i>
                      <div>
                        <b>Shareable record</b>
                        <span>At 250 closed trades — needs bot decision history</span>
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
                      <span>{bars[0].date}</span>
                      <span>
                        {busiestDay > 0 ? `busiest day ${busiestDay}` : "no replies in 30 days"}
                      </span>
                      <span>{bars[bars.length - 1].date}</span>
                    </div>
                  </>
                )}

                <p className="fx-hint" style={{ marginTop: "14px" }}>
                  One answer is owed per candle shown — not per request, and a candle still
                  inside the timeout is pending, not failed. <b>Silence counts as a failure; a hold
                  does not.</b>
                  {health?.reply_timeout_seconds != null && (
                    <>
                      {" "}
                      Timeout in use: <b>{health.reply_timeout_seconds}s</b>
                      {timeoutDiffers(health, bot.reply_timeout_s) && (
                        <>
                          {" "}
                          — not the <b>{bot.reply_timeout_s}s</b> you set, because the timeout is
                          clamped to between 5 seconds and 6 hours
                        </>
                      )}
                      .
                    </>
                  )}
                  {health?.first_seen && <> First seen {whenLabel(health.first_seen)}.</>}
                  {pausesCaveat(health?.unavailable) && (
                    <>
                      {" "}
                      <span title={pausesCaveat(health?.unavailable)} style={{ cursor: "help" }}>
                        Time spent paused before this release still counts against uptime (?)
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
                  <h2>Decisions</h2>
                  <span className="fx-src">what this bot answered</span>
                </div>
                <DecisionsFeed
                  api={axiosToken}
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
