import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../redux/store";
import tradingV2Service from "../../../../services/tradingV2Service";
import useAxiosAuth from "../../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../../utils/check_auth";
import DashboardShell from "../../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../../components/dashboard/focus/TopBar";
import {
  STATUS_META,
  platformLabel,
  decisionStyleLabel,
  onNoReplyLabel,
} from "../../../../lib/botV2Labels";

/* The rich per-bot view. Header + config are live (Bots v2 fields + the
   trades that reference this bot). Health, reply-time, decisions and P&L
   are DESIGN ONLY behind a `.fx-preview` ribbon — no endpoints exist for
   them yet (tracked in DASHBOARD_ENDPOINTS.md §10). Wire each block when
   the backend exposes it; the markup is already in place. */

const BotDetailPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots, trades } = useSelector((state: RootState) => state.tradingV2);

  const id = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const valid = id != null && !Number.isNaN(id);
  const bot = useMemo(() => bots.find((b) => b.id === id) || null, [bots, id]);

  const [busy, setBusy] = useState(false);
  const fetchedRef = useRef(false);
  const botFetchedRef = useRef<number | null>(null);

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
  }, [axiosToken, dispatch, valid, id, bot]);

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
    } finally {
      setBusy(false);
    }
  };

  const meta = bot ? STATUS_META[bot.status] ?? STATUS_META.PAUSED : null;

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
          subtitle={
            bot?.note ? bot.note : "How this bot connects, what it has decided, and how it's doing."
          }
        />

        {!bot && (
          <p className="fx-hint" style={{ padding: "24px 4px" }}>
            {valid ? "Loading this bot…" : "Bot not found."}
          </p>
        )}

        {bot && meta && (
          <>
            {/* header */}
            <div className="fx-bh">
              <span className="fx-bavatar">{bot.name.slice(0, 2).toUpperCase()}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="fx-bl1" style={{ marginBottom: "6px" }}>
                  <span className={`fx-st4 ${meta.cls}`}>{meta.label}</span>
                  <span className="fx-src">
                    {platformLabel(bot.platform)} · {bot.reach_mode === "PULL" ? "pull" : "push"}
                  </span>
                </div>
                <p className="fx-hint" style={{ margin: 0 }}>
                  Added {new Date(bot.created_at).toLocaleDateString()} · updated{" "}
                  {new Date(bot.updated_at).toLocaleDateString()} ·{" "}
                  {linkedTrades.length} trade{linkedTrades.length === 1 ? "" : "s"} use it
                </p>
              </div>
              <div className="fx-bacts" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className={`fx-mini ${bot.status === "ACTIVE" ? "" : "go"}`}
                  disabled={busy}
                  onClick={toggleRun}
                >
                  {busy ? "…" : bot.status === "ACTIVE" ? "Pause" : "Resume"}
                </button>
                <Link className="fx-mini" href={`/dashboard/bots/${bot.id}/settings`}>
                  Settings
                </Link>
                <Link className="fx-mini" href={`/dashboard/bots/${bot.id}/review`}>
                  Review
                </Link>
              </div>
            </div>

            {meta.dead && (
              <p className="fx-failmsg">
                <b>Not responding.</b> {bot.consecutive_fail_count} failed calls in a row — no
                orders are being placed for any trade this bot decides. Fix the webhook from{" "}
                <Link href={`/dashboard/bots/${bot.id}/settings`} style={{ color: "var(--fx-teal2)" }}>
                  settings
                </Link>
                , then resume.
              </p>
            )}

            {/* health — design only */}
            <section
              className="fx-mom rv d1"
              style={{ marginTop: "clamp(20px,2.6vw,30px)", paddingTop: "22px" }}
            >
              <div className="fx-sh">
                <h2>
                  How this bot is doing <span className="sub2">preview</span>
                </h2>
                <span className="fx-preview">
                  <i>◔</i> Health &amp; P&amp;L land when the backend exposes them
                </span>
              </div>
              <div className="fx-cap2" style={{ marginTop: 0 }}>
                <div className="fx-cp">
                  <span>Uptime · 30d</span>
                  <b className="mut2">—</b>
                  <i>needs a health endpoint</i>
                </div>
                <div className="fx-cp">
                  <span>Median reply time</span>
                  <b className="mut2">—</b>
                  <i>not available yet</i>
                </div>
                <div className="fx-cp">
                  <span>Decisions · 30d</span>
                  <b className="mut2">—</b>
                  <i>needs a decisions endpoint</i>
                </div>
                <div className="fx-cp">
                  <span>Net on its trades · 30d</span>
                  <b className="mut2">—</b>
                  <i>needs a P&amp;L endpoint</i>
                </div>
              </div>
              <p className="fx-hint" style={{ marginTop: "14px" }}>
                What we <b>can</b> tell you right now: this bot has failed{" "}
                <b>{bot.consecutive_fail_count}</b> call
                {bot.consecutive_fail_count === 1 ? "" : "s"} in a row, and auto-pauses after{" "}
                <b>{bot.auto_pause_after_n_fails || "—"}</b>.
              </p>
            </section>

            {/* recent decisions — design only */}
            <section className="fx-sec rv d2">
              <div className="fx-sh">
                <h2>Recent decisions</h2>
                <span className="fx-preview">
                  <i>◔</i> Feed arrives with a decisions endpoint
                </span>
              </div>
              <div className="fx-dec">
                <div className="fx-drow head">
                  <span>When</span>
                  <span>Pair</span>
                  <span>Call</span>
                  <span>Size</span>
                  <span>Outcome</span>
                </div>
                {[0, 1, 2].map((i) => (
                  <div className="fx-drow" key={i}>
                    <span className="mut">—</span>
                    <span className="mut">—</span>
                    <span className="mut">—</span>
                    <span className="mut">—</span>
                    <span className="mut">—</span>
                  </div>
                ))}
              </div>
              <p className="fx-hint" style={{ marginTop: "10px" }}>
                Every call Candleweb sends this bot, the reply it gave, and what the order did —
                once the endpoint exists this table fills in automatically.
              </p>
            </section>

            {/* config — live */}
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

              {bot.reach_mode === "PUSH" && (
                <div style={{ marginTop: "16px" }}>
                  <span className="fx-fl">Webhook</span>
                  <div className="fx-key">
                    <code>{bot.webhook_url || "— not set —"}</code>
                  </div>
                </div>
              )}

              <div style={{ marginTop: "16px" }}>
                <span className="fx-fl">Developer key</span>
                <div className="fx-key">
                  <code>{bot.dev_key || "•••••••••••••••• — shown only on create / regenerate"}</code>
                </div>
              </div>
            </section>

            {/* prompt — live, read-only */}
            <section className="fx-sec rv d3">
              <div className="fx-rv2">
                <div className="rh2">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3v2M12 19v2M3 12h2M19 12h2" />
                    <circle cx="12" cy="12" r="4" />
                  </svg>
                  <b>The prompt this bot is reviewed against</b>
                </div>
                {bot.prompt ? (
                  <pre className="fx-pre" style={{ marginTop: "10px" }}>
                    {bot.prompt}
                  </pre>
                ) : (
                  <p>
                    No prompt stored. Bots without a prompt can be monitored, but review can&rsquo;t
                    tell you <em>why</em> a decision was made — add one from settings.
                  </p>
                )}
              </div>
            </section>

            {/* trades using this bot — live */}
            <section className="fx-sec rv d3">
              <div className="fx-sh">
                <h2>
                  Trades using this bot{" "}
                  <span className="sub2">{linkedTrades.length}</span>
                </h2>
                <Link className="fx-link" href="/dashboard/trades">
                  All trades →
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
                          t.status === "RUNNING" ? "live4" : t.status === "ERROR" ? "fail4" : "pause4"
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
            </section>
          </>
        )}
      </DashboardShell>
    </>
  );
};

export default BotDetailPage;
