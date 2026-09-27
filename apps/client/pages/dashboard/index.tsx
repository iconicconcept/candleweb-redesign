import Head from "next/head";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dollarFormat } from "ui";
import { AppDispatch, RootState } from "../../redux/store";
import tradingV2Service from "../../services/tradingV2Service";
import userService from "../../services/userService";
import exchangeServices from "../../services/exchangeService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { isAuthorizationHeaderSet } from "../../utils/check_auth";
import DashboardShell from "../../components/dashboard/focus/DashboardShell";
import TopBar from "../../components/dashboard/focus/TopBar";
import HeroChart from "../../components/dashboard/focus/HeroChart";
import { STATUS_META } from "../../lib/botV2Labels";
import { BalanceProp } from "../../types/user";

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

  const { bots, botsLoaded, trades, tradesLoaded } = useSelector(
    (state: RootState) => state.tradingV2,
  );
  const { balance } = useSelector((state: RootState) => state.user);
  const { exchangeRecord } = useSelector((state: RootState) => state.exchange);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(tradingV2Service.listBots(axiosToken));
    dispatch(tradingV2Service.listTrades(axiosToken));
    if (!balance || balance.length === 0) dispatch(userService.getBalance(axiosToken));
    if (exchangeRecord.length === 0) dispatch(exchangeServices.getExchangeRecords(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

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
    return [...bots].sort(
      (a, b) =>
        (statusRank[a.status] ?? 3) - (statusRank[b.status] ?? 3) ||
        (running.get(b.id) || 0) - (running.get(a.id) || 0) ||
        (a.consecutive_fail_count || 0) - (b.consecutive_fail_count || 0),
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

        {!loaded && (
          <p className="fx-hint" style={{ padding: "28px 4px" }}>
            Loading your dashboard…
          </p>
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
                  Candleweb can&rsquo;t see anything until you connect an exchange. The setup
                  steps cost nothing and move no money — the last one is the only one that does.
                </p>
              </div>
            </section>

            <section className="fx-sec rv">
              <div className="fx-sh">
                <h2>Get to your first trade</h2>
              </div>
              <div className="fx-start">
                <div className="fx-stepline">
                  <span className="sn9">1</span>
                  <div className="sb9">
                    <b>Connect an exchange</b>
                    <span>
                      A trade-only API key — read and spot trade, no withdrawal. Candleweb checks
                      it when you paste it.
                    </span>
                  </div>
                  <Link className="fx-mini go" href="/dashboard/settings">
                    Connect
                  </Link>
                </div>
                <div className="fx-stepline">
                  <span className="sn9">2</span>
                  <div className="sb9">
                    <b>Add a bot</b>
                    <span>The thing that decides. Point Candleweb at your workflow, or use CandleAI.</span>
                  </div>
                  <Link className="fx-mini" href="/dashboard/bots/new">
                    Add a bot
                  </Link>
                </div>
                <div className="fx-stepline">
                  <span className="sn9">3</span>
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
              <div className="fx-chips">
                <span className={`fx-chip ${exchangeRecord.length ? "ok4" : ""}`}>
                  <i />
                  {exchangeRecord.length
                    ? `${exchangeRecord.length} exchange${exchangeRecord.length === 1 ? "" : "s"}`
                    : "No exchange"}
                </span>
                <span className={`fx-chip ${activeBots ? "ok4" : ""}`}>
                  <i />
                  {activeBots} bot{activeBots === 1 ? "" : "s"} live
                </span>
                {failingBots.length > 0 && (
                  <span className="fx-chip warn4">
                    <i />
                    {failingBots.length} not responding
                  </span>
                )}
              </div>

              <div className="fx-hero-chart">
                <HeroChart path={HERO_PATH} />
              </div>

              <div className="fx-hero-in">
                <p className="fx-eqlab">
                  Account balance
                  {exchangeRecord[0]?.supported_exchange_id
                    ? ` · ${exchangeRecord[0].supported_exchange_id}`
                    : ""}
                </p>
                <p className="fx-eq">
                  {balance && balance.length ? dollarFormat(totalBalance) : "—"}
                </p>
                <div style={{ marginTop: "15px" }}>
                  <span className="fx-preview">
                    <i>◔</i> Daily P&amp;L arrives with a positions endpoint
                  </span>
                </div>

                <div className="fx-substat">
                  <div className="fx-ss">
                    <span>Open P&amp;L</span>
                    <b className="mut2">—</b>
                    <i>needs a positions endpoint</i>
                  </div>
                  <div className="fx-ss">
                    <span>Realised · 30d</span>
                    <b className="mut2">—</b>
                    <i>needs a P&amp;L endpoint</i>
                  </div>
                  <div className="fx-ss">
                    <span>Trades set up</span>
                    <b>{trades.length}</b>
                    <i>{runningTrades} running</i>
                  </div>
                  <div className="fx-ss">
                    <span>Bots connected</span>
                    <b>{bots.length}</b>
                    <i>{activeBots} live</i>
                  </div>
                </div>
              </div>
            </section>

            {/* ---- trades as positions ---- */}
            <section className="fx-sec rv">
              <div className="fx-sh">
                <h2>
                  Your trades <span className="sub2">stops enforced by Candleweb</span>
                </h2>
                <Link className="fx-link" href="/dashboard/trades">
                  All trades →
                </Link>
              </div>
              <span className="fx-preview">
                <i>◔</i> Live P&amp;L and stop distance arrive when the backend exposes them
              </span>

              {trades.length === 0 ? (
                <div className="fx-flat2" style={{ marginTop: "14px" }}>
                  <b>No trades yet.</b>{" "}
                  <Link href="/dashboard/trades/new" style={{ color: "var(--fx-teal2)" }}>
                    Set one up
                  </Link>{" "}
                  — nothing reaches the exchange until you start it.
                </div>
              ) : (
                <div className="fx-pos" style={{ marginTop: "14px" }}>
                  {trades.slice(0, 6).map((t) => {
                    const side = DIRECTION_SIDE[t.direction] ?? DIRECTION_SIDE.BOTH;
                    const isAi = t.decider_type === "CANDLE_AI";
                    return (
                      <Link
                        key={t.id}
                        className="fx-row"
                        href={`/dashboard/trades/new?id=${t.id}`}
                      >
                        <div className="fx-pair">
                          <b>{t.pair_name || `Pair #${t.pair}`}</b>
                          <span className={`fx-side ${side.cls}`}>{side.label}</span>
                        </div>
                        <div className="fx-meta2">
                          {isAi ? "CandleAI" : t.bot_name || "Own bot"} · {t.timeframe}
                          <br />
                          {t.status === "RUNNING"
                            ? "running"
                            : t.status === "ERROR"
                              ? "not responding"
                              : "paused"}
                          {" · "}
                          {dollarFormat(parseFloat(t.allocated_amount) || 0)} allocated
                        </div>
                        <div className="fx-plr">
                          <span className="mut2">—</span>
                          <small>P&amp;L pending</small>
                        </div>
                      </Link>
                    );
                  })}
                </div>
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
                            {b.consecutive_fail_count > 0 ? `${b.consecutive_fail_count} fails` : "ok"}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ---- activity + needs you ---- */}
            <div className="fx-cols fx-sec rv">
              <section>
                <div className="fx-sh">
                  <h2>Recent activity</h2>
                  <span className="fx-preview">
                    <i>◔</i> Decision feed pending
                  </span>
                </div>
                <div className="fx-spine">
                  {[0, 1, 2].map((i) => (
                    <div className="fx-ev" key={i}>
                      <span className="t2">—</span>
                      <b>Bot decisions show here</b>
                      <p>
                        Every call Candleweb sends a bot, the reply it gave and what the order did
                        — once the decisions endpoint exists this fills in on its own.
                      </p>
                    </div>
                  ))}
                </div>
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
                        {b.consecutive_fail_count} failed call
                        {b.consecutive_fail_count === 1 ? "" : "s"} in a row — no orders are being
                        placed for trades it decides.{" "}
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
                      When a bot goes quiet or a trade errors it shows up here. Risk figures land
                      when the positions endpoint does.
                    </p>
                  </div>
                )}

                <div className="fx-soft" style={{ marginTop: "14px" }}>
                  <h3 style={{ marginBottom: "12px" }}>Risk right now</h3>
                  <span className="fx-preview" style={{ marginBottom: "10px", display: "inline-block" }}>
                    <i>◔</i> Full risk figures need a positions endpoint
                  </span>
                  <div className="fx-riskline">
                    <span>If every stop hit at once</span>
                    <b className="mut2">—</b>
                  </div>
                  <div className="fx-riskline">
                    <span>Max size per trade</span>
                    <b>{maxSizePct != null ? `${maxSizePct}%` : "—"}</b>
                  </div>
                  <div className="fx-riskline">
                    <span>Closest stop</span>
                    <b className="mut2">—</b>
                  </div>
                </div>
              </section>
            </div>

            {/* ---- momentum (design only) ---- */}
            <section className="fx-mom rv">
              <div className="fx-sh">
                <h2>
                  {featuredBot ? `Your ${featuredBot.name}` : "Your momentum"} <span className="sub2">progress toward a system you can trust</span>
                </h2>
                <span className="fx-preview">
                  <i>◔</i> Needs the decisions + review endpoints
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
                      <span>Days with no bot failures</span>
                      <b className="mut3">—</b>
                      <i>needs the decisions endpoint</i>
                    </div>
                    <div className="fx-stk2">
                      <span>Review suggestions applied</span>
                      <b className="mut3">—</b>
                      <i>needs the review endpoint</i>
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
          </>
        )}
      </DashboardShell>
    </>
  );
};

export default DashboardPage;
