import Head from "next/head";
import { maskString } from "ui";
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
import { error } from "../../../../components/alert/Toast";
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
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fetchedRef = useRef(false);
  const botFetchedRef = useRef<number | null>(null);

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
                <b>Not responding.</b> {bot.consecutive_fail_count} failed calls in a row — no
                orders are being placed for any trade this bot decides. Fix the webhook from{" "}
                <Link href={`/dashboard/bots/${bot.id}/settings`} style={{ color: "var(--fx-teal2)" }}>
                  settings
                </Link>
                , then resume.
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
                <b className="mut2">—</b>
                <i>needs a health endpoint</i>
              </div>
            </div>
            <p className="fx-hint" style={{ marginTop: "10px" }}>
              <span className="fx-preview">
                <i>◔</i> Health &amp; P&amp;L land when the backend exposes them
              </span>
              . What we <b>can</b> tell you right now: this bot has failed{" "}
              <b>{bot.consecutive_fail_count}</b> call{bot.consecutive_fail_count === 1 ? "" : "s"} in a
              row, and auto-pauses after <b>{bot.auto_pause_after_n_fails || "—"}</b>.
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
                      <span>Days answering every candle</span>
                      <b className="mut3">—</b>
                      <i>needs decision history</i>
                    </div>
                    <div className="fx-stk2">
                      <span>Suggestions applied</span>
                      <b className="mut3">—</b>
                      <i>needs a bot-review endpoint</i>
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
                {/* connection — design only. The design's uptime bars encode
                    30 days of real daily reply history we don't have, so no
                    bars are drawn rather than faking a pattern. */}
                <div className="fx-sh">
                  <h2>Connection</h2>
                  <span className="fx-preview">
                    <i>◔</i> Needs a health endpoint
                  </span>
                </div>
                <div className="fx-health">
                  <div className="fx-hz">
                    <span>Last signal</span>
                    <b className="mut2">—</b>
                  </div>
                  <div className="fx-hz">
                    <span>Reply time</span>
                    <b className="mut2">—</b>
                  </div>
                  <div className="fx-hz">
                    <span>Failed · 7d</span>
                    <b className="mut2">—</b>
                  </div>
                  <div className="fx-hz">
                    <span>Uptime · 30d</span>
                    <b className="mut2">—</b>
                  </div>
                </div>
                <p className="fx-hint" style={{ marginTop: "14px" }}>
                  Daily reply history needs a health endpoint 
                  {/* (BACKEND_API_REQUESTS.md §1.6). What we{" "}
                  <b>can</b> tell you right now: this bot has failed{" "}
                  <b>{bot.consecutive_fail_count}</b> call{bot.consecutive_fail_count === 1 ? "" : "s"} in
                  a row. */}
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
                      <code>{bot.dev_key ? maskString(bot.dev_key) : "•••••••••••••••• — shown only on create / regenerate"}</code>
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
                    Regenerating the key is a settings action —{" "}
                    <Link href={`/dashboard/bots/${bot.id}/settings`} style={{ color: "var(--fx-teal2)" }}>
                      open settings
                    </Link>
                    .
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
                {/* recent decisions — design only. Matches the same
                    `.fx-spine`/`.fx-ev` timeline already used for this exact
                    gap on the Overview page's "Recent activity", instead of
                    the plain table this page had before. */}
                <div className="fx-sh">
                  <h2>Recent decisions</h2>
                  <span className="fx-preview">
                    <i>◔</i> Feed arrives with a decisions endpoint
                  </span>
                </div>
                <div className="fx-spine">
                  {[0, 1, 2].map((i) => (
                    <div className="fx-ev" key={i}>
                      <span className="t2">—</span>
                      <b>Bot decisions show here</b>
                      <p>
                        Every call Candleweb sends this bot, the reply it gave and what the order did
                        — once the decisions endpoint exists this fills in on its own.
                      </p>
                    </div>
                  ))}
                </div>

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
