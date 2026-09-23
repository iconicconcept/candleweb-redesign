import Head from "next/head";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import tradingV2Service from "../../services/tradingV2Service";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import Dialog from "../../components/dashboard/focus/Dialog";
import { TrashIcon } from "../../components/dashboard/focus/icons";
import { BotV2 } from "../../types/tradingV2";
import { STATUS_META, platformLabel } from "../../lib/botV2Labels";

const BotsPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { bots, botsLoading, botsLoaded, trades } = useSelector(
    (state: RootState) => state.tradingV2,
  );

  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<BotV2 | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(tradingV2Service.listBots(axiosToken));
    dispatch(tradingV2Service.listTrades(axiosToken));
  }, [axiosToken, dispatch]);

  // The design's chips under each bot show the real pair/timeframe of every
  // trade currently pointed at it — not the bot's own config (decision style,
  // on-no-reply), which was shown here before real trade data was wired up.
  const tradesForBot = (botId: number) => trades.filter((t) => t.bot === botId);

  const runningCount = bots.filter((b) => b.status === "ACTIVE").length;
  // "Fleet health" from the design wants a 7-day trend, streaks and a
  // "reviews waiting" milestone panel — none of that exists yet (needs bot
  // decision history + a review endpoint, see BACKEND_API_REQUESTS.md §1.5/
  // §1.7). What IS real right now: each bot's current status, so the meter
  // below reflects "healthy right now", not a fabricated 7-day history.
  const healthyCount = bots.filter((b) => !(STATUS_META[b.status] ?? STATUS_META.PAUSED).dead).length;
  const failingCount = bots.length - healthyCount;

  const toggleRun = async (b: BotV2) => {
    setBusyId(b.id);
    try {
      if (b.status === "ACTIVE") {
        await dispatch(tradingV2Service.pauseBot({ api: axiosToken, id: b.id }));
      } else {
        await dispatch(tradingV2Service.resumeBot({ api: axiosToken, id: b.id }));
      }
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

        {/* ---- fleet status — real data only, see comment above ---- */}
        {bots.length > 0 && (
          <section className="fx-mom rv d2" style={{ marginTop: "clamp(26px,3.4vw,38px)", paddingTop: 24 }}>
            <div className="fx-sh">
              <h2>
                Your bots at a glance{" "}
                <span className="sub2">
                  {bots.length} connected · {runningCount} running
                </span>
              </h2>
            </div>
            <div className="fx-momgrid">
              <div>
                <div className="fx-meter">
                  <div className="fx-mh">
                    <b>Fleet health — right now</b>
                    <span>
                      {healthyCount} of {bots.length} healthy
                    </span>
                  </div>
                  <div className="fx-seg">
                    {bots.map((b) => (
                      <i key={b.id} className={(STATUS_META[b.status] ?? STATUS_META.PAUSED).dead ? "" : "f"} />
                    ))}
                  </div>
                  <p className="fx-mnote">
                    {failingCount > 0
                      ? `${failingCount} bot${failingCount === 1 ? "" : "s"} not responding right now — see below.`
                      : "Every connected bot is answering its calls."}{" "}
                    <span className="fx-preview" style={{ marginLeft: 6 }}>
                      <i>◔</i> 7-day trend needs decision history
                    </span>
                  </p>
                </div>
                <div className="fx-streaks2">
                  <div className="fx-stk2">
                    <span>Days with no failures</span>
                    <b className="mut">—</b>
                    <div className="fx-preview" style={{ marginTop: 8 }}>
                      <i>◔</i> needs bot decision history
                    </div>
                  </div>
                  <div className="fx-stk2">
                    <span>Reviews waiting</span>
                    <b className="mut">—</b>
                    <div className="fx-preview" style={{ marginTop: 8 }}>
                      <i>◔</i> needs a bot-review endpoint
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="fx-unlock">
                  <h4>Next milestone</h4>
                  <p className="us">Two bots with real trade history unlocks strategy comparison.</p>
                  <div className="fx-ul">
                    <i>1</i>
                    <div>
                      <b>Two bots with closed-trade history</b>
                      {/* a <div>, not `.fx-ul span` — that selector would
                          override `.fx-preview`'s pill styling */}
                      <div className="fx-preview" style={{ marginTop: 4 }}>
                        <i>◔</i> needs BACKEND_API_REQUESTS.md §1.5 (bot decision history)
                      </div>
                    </div>
                  </div>
                  <div className="fx-ul">
                    <i>2</i>
                    <div>
                      <b>Strategy comparison</b>
                      <span>Put two prompts side by side on the same pair</span>
                    </div>
                  </div>
                  <p className="fx-tip2">
                    <b style={{ color: "var(--fx-t2)" }}>Worth knowing.</b> Recommendations ready and a review
                    verdict per bot (§1.7) need the same decision history — until then this stays a locked
                    preview instead of a guess at whether any bot actually qualifies.
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
                {bots.length} connected · {runningCount} running
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
            return (
              <div key={b.id} className={`fx-bcard ${meta.dead ? "dead" : ""} ${b.status === "PAUSED" ? "off5" : ""}`}>
                <div className="fx-bl1">
                  <Link className="nm4" href={`/dashboard/bots/${b.id}`}>
                    {b.name}
                  </Link>
                  <span className={`fx-st4 ${meta.cls}`}>{meta.label}</span>
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
                  <div className="fx-bm">
                    <span>Fails in a row</span>
                    <b className={b.consecutive_fail_count > 0 ? "dn5" : ""}>
                      {b.consecutive_fail_count}
                    </b>
                  </div>
                  <div className="fx-bm">
                    <span>Auto-pause at</span>
                    <b>{b.auto_pause_after_n_fails || "—"}</b>
                  </div>
                  <div className="fx-bm">
                    <span>P&amp;L · 30d</span>
                    <b className="mut">—</b>
                    {/* a <div>, not a second `.fx-bm span` — that selector
                        would force its own uppercase/mono styling onto this
                        note regardless of the `.fx-preview` class */}
                    <div className="fx-preview" style={{ marginTop: 4 }}>
                      needs a per-bot performance endpoint
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
                    <b>Not responding.</b> {b.consecutive_fail_count} failed{" "}
                    call{b.consecutive_fail_count === 1 ? "" : "s"} in a row — no orders are being
                    placed. Check the webhook is reachable, then resume it.
                  </p>
                )}

                <div className="fx-bl3">
                  {(() => {
                    const botTrades = tradesForBot(b.id);
                    return botTrades.length === 0 ? (
                      <span className="fx-tr2 none2">No trades assigned</span>
                    ) : (
                      botTrades.map((t) => (
                        <span className="fx-tr2" key={t.id}>
                          <i />
                          {(t.pair_name || `Pair #${t.pair}`).toUpperCase()} · {t.timeframe}
                        </span>
                      ))
                    );
                  })()}
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
