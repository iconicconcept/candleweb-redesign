import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { dollarFormat } from "ui";
import { AppDispatch, RootState } from "../../../redux/store";
import tradingV2Service from "../../../services/tradingV2Service";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import { error } from "../../../components/alert/Toast";
import DashboardShell from "../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../components/dashboard/focus/TopBar";
import {
  TradeV2,
  TradeV2Direction,
  TradeV2DeciderType,
  TradeV2Payload,
  TradeV2Timeframe,
} from "../../../types/tradingV2";

/* ------------------------------------------------------------------ *
 * Reference lists — no backend endpoint exists for pairs / exchange
 * accounts / bots yet. These placeholders keep the form usable; swap
 * each for a fetch once /api/trading_v2/{pairs,bots}/ + an accounts
 * endpoint land. Tracked in DASHBOARD_ENDPOINTS.md.
 * ------------------------------------------------------------------ */
const PLACEHOLDER_ACCOUNTS = [
  { id: 1, name: "KuCoin · main" },
  { id: 2, name: "Binance · main" },
  { id: 3, name: "Bybit" },
  { id: 4, name: "BitMart" },
];
const PLACEHOLDER_PAIRS = [
  { id: 1, name: "BTC/USDT" },
  { id: 2, name: "ETH/USDT" },
  { id: 3, name: "SOL/USDT" },
  { id: 4, name: "AVAX/USDT" },
  { id: 5, name: "LINK/USDT" },
];
/* Bots are real — /api/trading_v2/bots/. This fallback only shows if the
   list hasn't loaded yet or the account has none. */
const FALLBACK_BOTS: { id: number; name: string }[] = [];

const TIMEFRAMES: { v: TradeV2Timeframe; calls: number }[] = [
  { v: "1m", calls: 1440 },
  { v: "5m", calls: 288 },
  { v: "15m", calls: 96 },
  { v: "1h", calls: 24 },
  { v: "4h", calls: 6 },
  { v: "1d", calls: 1 },
];

/* Front-end's assumed indicator set — confirm the canonical keys with the
   backend (docs example: rsi, macd, macd_signal, sma_50). */
const INDICATORS: { key: string; label: string }[] = [
  { key: "rsi", label: "RSI" },
  { key: "macd", label: "MACD" },
  { key: "macd_signal", label: "MACD signal" },
  { key: "sma_20", label: "SMA 20" },
  { key: "sma_50", label: "SMA 50" },
  { key: "sma_200", label: "SMA 200" },
  { key: "ema_50", label: "EMA 50" },
  { key: "ema_200", label: "EMA 200" },
  { key: "atr", label: "ATR" },
  { key: "bb_upper", label: "Bollinger upper" },
  { key: "bb_lower", label: "Bollinger lower" },
  { key: "stoch", label: "Stochastic" },
  { key: "volume", label: "Volume" },
];

const HISTORY_OPTIONS = [20, 30, 50, 100];
const RISK_STEPS = [0.5, 10];
const API_ROOT = "https://api.candleweb.io/api/trading_v2";

const DIRECTION_LABELS: Record<TradeV2Direction, string> = {
  BOTH: "long & short",
  LONG: "long only",
  SHORT: "short only",
};

type FormState = {
  exchange_account: number;
  pair: number;
  timeframe: TradeV2Timeframe;
  allocated_amount: string;
  indicators: string[];
  candle_history_len: number;
  decider_type: TradeV2DeciderType;
  bot: number | null;
  risk_pct: number;
  max_size_pct: number;
  direction: TradeV2Direction;
  trailing_stop: boolean;
};

const DEFAULTS: FormState = {
  exchange_account: PLACEHOLDER_ACCOUNTS[0].id,
  pair: PLACEHOLDER_PAIRS[0].id,
  timeframe: "15m",
  allocated_amount: "",
  indicators: ["rsi", "macd", "macd_signal", "sma_50"],
  candle_history_len: 20,
  decider_type: "OWN_BOT",
  bot: null,
  risk_pct: 2,
  max_size_pct: 50,
  direction: "BOTH",
  trailing_stop: true,
};

const NewTradePage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { trades, bots } = useSelector((state: RootState) => state.tradingV2);
  const botOptions = bots.length ? bots : FALLBACK_BOTS;

  const editId = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const editing = editId != null && !Number.isNaN(editId);

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [busy, setBusy] = useState<null | "save" | "start">(null);
  const [existing, setExisting] = useState<TradeV2 | null>(null);
  const loadedRef = useRef<number | null>(null);
  const botsFetchedRef = useRef(false);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || botsFetchedRef.current) return;
    botsFetchedRef.current = true;
    dispatch(tradingV2Service.listBots(axiosToken));
  }, [axiosToken, dispatch]);

  // hydrate for edit
  useEffect(() => {
    if (!editing || loadedRef.current === editId) return;
    const fromStore = trades.find((t) => t.id === editId);
    const apply = (t: TradeV2) => {
      loadedRef.current = editId;
      setExisting(t);
      setForm({
        exchange_account: t.exchange_account,
        pair: t.pair,
        timeframe: t.timeframe,
        allocated_amount: String(parseFloat(t.allocated_amount) || ""),
        indicators: (t.indicators || "")
          .split(/[,\s]+/)
          .map((s) => s.trim())
          .filter(Boolean),
        candle_history_len: t.candle_history_len,
        decider_type: t.decider_type,
        bot: t.bot,
        risk_pct: parseFloat(t.risk_pct) || 2,
        max_size_pct: t.max_size_pct,
        direction: t.direction,
        trailing_stop: t.trailing_stop,
      });
    };
    if (fromStore) apply(fromStore);
    else if (isAuthorizationHeaderSet(axiosToken)) {
      dispatch(tradingV2Service.getTrade({ api: axiosToken, id: editId })).then((res: any) => {
        if (res?.payload?.id) apply(res.payload as TradeV2);
      });
    }
  }, [editing, editId, trades, axiosToken, dispatch]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const toggleIndicator = (key: string) =>
    setForm((f) => ({
      ...f,
      indicators: f.indicators.includes(key)
        ? f.indicators.filter((i) => i !== key)
        : [...f.indicators, key],
    }));

  const alloc = parseFloat(form.allocated_amount) || 0;
  const riskCash = alloc * (form.risk_pct / 100);
  const ceilingCash = alloc * (form.max_size_pct / 100);

  const pairName =
    PLACEHOLDER_PAIRS.find((p) => p.id === form.pair)?.name ||
    existing?.pair_name ||
    `Pair #${form.pair}`;

  const missing = useMemo(() => {
    const m: string[] = [];
    if (!(alloc > 0)) m.push("allocate an amount");
    if (form.indicators.length === 0) m.push("send at least one indicator");
    if (form.decider_type === "OWN_BOT" && !form.bot) m.push("pick a bot");
    return m;
  }, [alloc, form.indicators.length, form.decider_type, form.bot]);

  const sectionsDone = [
    !!form.exchange_account && !!form.pair,
    alloc > 0,
    form.indicators.length > 0,
    form.decider_type === "CANDLE_AI" || !!form.bot,
    true,
  ];
  const doneCount = sectionsDone.filter(Boolean).length;

  const buildPayload = (): TradeV2Payload => ({
    exchange_account: form.exchange_account,
    pair: form.pair,
    timeframe: form.timeframe,
    allocated_amount: alloc.toFixed(2),
    indicators: form.indicators,
    candle_history_len: form.candle_history_len,
    decider_type: form.decider_type,
    bot: form.decider_type === "OWN_BOT" ? form.bot : null,
    risk_pct: form.risk_pct.toFixed(1),
    max_size_pct: form.max_size_pct,
    direction: form.direction,
    trailing_stop: form.trailing_stop,
  });

  const persist = async (): Promise<TradeV2 | null> => {
    const payload = buildPayload();
    if (editing && existing) {
      const res: any = await dispatch(
        tradingV2Service.updateTrade({ api: axiosToken, id: existing.id, data: payload }),
      );
      return res?.payload?.id ? (res.payload as TradeV2) : null;
    }
    const res: any = await dispatch(tradingV2Service.createTrade({ api: axiosToken, data: payload }));
    return res?.payload?.id ? (res.payload as TradeV2) : null;
  };

  const onSave = async () => {
    setBusy("save");
    try {
      const saved = await persist();
      if (saved) router.push("/dashboard/trades");
    } finally {
      setBusy(null);
    }
  };

  const onStart = async () => {
    if (missing.length) {
      error(`Before starting: ${missing.join(", ")}.`);
      return;
    }
    setBusy("start");
    try {
      const saved = await persist();
      if (saved) {
        await dispatch(tradingV2Service.startTrade({ api: axiosToken, id: saved.id }));
        router.push("/dashboard/trades");
      }
    } finally {
      setBusy(null);
    }
  };

  const tf = TIMEFRAMES.find((t) => t.v === form.timeframe)!;
  const tradeIdForUrl = existing ? String(existing.id) : "{trade_id}";

  return (
    <>
      <Head>
        <title>{editing ? "Edit trade" : "New trade"} | Candleweb</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="trades">
        <TopBar
          crumb={
            <>
              <a href="/dashboard/trades">‹ My trades</a> / {editing ? "Edit trade" : "New trade"}
            </>
          }
          title={editing ? "Edit trade" : "New trade"}
          subtitle="Define the setup, then choose who decides. Nothing reaches the exchange until you start it."
        />

        <div className="fx-formwrap">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="fx-prog">
              <div className="fx-ph">
                <b>{editing ? "Editing this trade" : "Setting up this trade"}</b>
                <span>{doneCount} of 5 ready</span>
              </div>
              <div className="fx-psteps">
                {sectionsDone.map((ok, i) => (
                  <i key={i} className={ok ? "done3" : i === sectionsDone.indexOf(false) ? "cur3" : ""} />
                ))}
              </div>
            </div>

            {/* 01 — market */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">01</span>
                <h3>What to trade</h3>
              </div>
              <p className="fx-fsub">
                Candleweb watches this market and sends every closed candle to whoever decides.
              </p>

              <div className="fx-fr two2">
                <div>
                  <label className="fx-fl" htmlFor="ex">
                    Exchange account
                  </label>
                  <div className="fx-inp">
                    <select
                      id="ex"
                      value={form.exchange_account}
                      onChange={(e) => set("exchange_account", parseInt(e.target.value, 10))}
                    >
                      {PLACEHOLDER_ACCOUNTS.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                      {existing &&
                        !PLACEHOLDER_ACCOUNTS.some((a) => a.id === existing.exchange_account) && (
                          <option value={existing.exchange_account}>
                            {existing.exchange_name || `Account #${existing.exchange_account}`}
                          </option>
                        )}
                    </select>
                  </div>
                  <p className="fx-hint">
                    Placeholder list — real accounts load once the backend exposes them.
                  </p>
                </div>
                <div>
                  <label className="fx-fl" htmlFor="pr">
                    Pair
                  </label>
                  <div className="fx-inp">
                    <select
                      id="pr"
                      value={form.pair}
                      onChange={(e) => set("pair", parseInt(e.target.value, 10))}
                    >
                      {PLACEHOLDER_PAIRS.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                      {existing && !PLACEHOLDER_PAIRS.some((p) => p.id === existing.pair) && (
                        <option value={existing.pair}>
                          {existing.pair_name || `Pair #${existing.pair}`}
                        </option>
                      )}
                    </select>
                  </div>
                  <p className="fx-hint">Placeholder list — pending a pairs endpoint.</p>
                </div>
              </div>

              <div className="fx-fr" style={{ marginTop: "14px" }}>
                <div>
                  <span className="fx-fl">Timeframe</span>
                  <div className="fx-picks">
                    {TIMEFRAMES.map((t) => (
                      <button
                        key={t.v}
                        type="button"
                        className={`fx-pk ${form.timeframe === t.v ? "on7" : ""}`}
                        onClick={() => set("timeframe", t.v)}
                      >
                        {t.v}
                      </button>
                    ))}
                  </div>
                  <p className="fx-hint">
                    Your bot is called once per closed candle — about{" "}
                    {tf.calls.toLocaleString("en-US")} calls a day.
                  </p>
                </div>
              </div>
            </section>

            {/* 02 — allocation */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">02</span>
                <h3>How much to trade with</h3>
              </div>
              <p className="fx-fsub">
                Capital set aside for this trade. Candleweb never commits more than this to it,
                whatever your bot asks for.
              </p>

              <div className="fx-fr two2">
                <div>
                  <label className="fx-fl" htmlFor="alloc">
                    Amount allocated <em>USDT</em>
                  </label>
                  <div className="fx-amt">
                    <div className="fx-inp fx-amtw">
                      <span className="cur4">$</span>
                      <input
                        id="alloc"
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={form.allocated_amount}
                        onChange={(e) =>
                          set("allocated_amount", e.target.value.replace(/[^0-9.]/g, ""))
                        }
                      />
                    </div>
                  </div>
                  <p className="fx-hint">
                    You can raise or lower it later without stopping the trade.
                  </p>
                </div>
                <div>
                  <label className="fx-fl" htmlFor="hist">
                    Candle history sent
                  </label>
                  <div className="fx-inp">
                    <select
                      id="hist"
                      value={form.candle_history_len}
                      onChange={(e) => set("candle_history_len", parseInt(e.target.value, 10))}
                    >
                      {HISTORY_OPTIONS.map((n) => (
                        <option key={n} value={n}>
                          {n} candles
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="fx-hint">
                    How much context arrives with each call. More history means a bigger payload,
                    not a better decision.
                  </p>
                </div>
              </div>

              <div className="fx-flat2" style={{ marginTop: "16px" }}>
                <span className="fx-preview">
                  <i>◔</i> Balance panel — pending an endpoint
                </span>
                <b style={{ marginLeft: "auto" }}>Free to allocate: —</b>
              </div>
            </section>

            {/* 03 — indicators */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">03</span>
                <h3>What your bot sees</h3>
              </div>
              <p className="fx-fsub">
                Candleweb computes these and sends them alongside the raw candles. Pick what your
                strategy actually reads.
              </p>

              <div className="fx-picks">
                {INDICATORS.map((ind) => (
                  <button
                    key={ind.key}
                    type="button"
                    className={`fx-pk ${form.indicators.includes(ind.key) ? "on7" : ""}`}
                    onClick={() => toggleIndicator(ind.key)}
                  >
                    {ind.label}
                  </button>
                ))}
              </div>
              <p className="fx-hint">
                Sent as <code>{form.indicators.join(", ") || "none"}</code>. Confirm the canonical
                keys with the backend.
              </p>

              {form.decider_type === "OWN_BOT" && (
                <div className="fx-epbox">
                  <div className="fx-ep2">
                    <div className="eh2">
                      <span className="fx-mv g4">GET</span>
                      <b>Fetch market data</b>
                      <small>
                        Paste into an n8n HTTP Request node, a Make module, or your own code. Returns
                        the candles and the indicators selected above — the URL stays valid across
                        edits.
                      </small>
                    </div>
                    <div className="eb2">
                      <code>{`${API_ROOT}/trades/${tradeIdForUrl}/candles/`}</code>
                    </div>
                  </div>
                  <div className="fx-ep2">
                    <div className="eh2">
                      <span className="fx-mv p4">POST</span>
                      <b>Send your decision back</b>
                      <small>
                        Your bot posts buy, sell or hold here. Candleweb sizes the order against your
                        limits and places it.
                      </small>
                    </div>
                    <div className="eb2">
                      <code>{`${API_ROOT}/trades/${tradeIdForUrl}/decision/`}</code>
                    </div>
                  </div>
                  <p className="fx-epnote">
                    <b>Note.</b> Authenticate with the bot&rsquo;s developer key in the{" "}
                    <code>X-Candleweb-Key</code> header. Both URLs are secret.
                    {!existing && " The real trade id fills in once you save."}
                  </p>
                </div>
              )}
            </section>

            {/* 04 — decider */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">04</span>
                <h3>Who decides</h3>
              </div>
              <p className="fx-fsub">Either your own bot, or ours.</p>

              <div className="fx-reach2">
                <button
                  type="button"
                  className={`fx-rc2 ${form.decider_type === "OWN_BOT" ? "sel" : ""}`}
                  onClick={() => set("decider_type", "OWN_BOT")}
                >
                  <span className="ck">✓</span>
                  <span className="kind4">Your bot</span>
                  <b>Own bot</b>
                  <span>
                    Candleweb sends the candle to your endpoint and waits for a decision.
                  </span>
                  <em>Assign one below</em>
                </button>
                <button
                  type="button"
                  className={`fx-rc2 ${form.decider_type === "CANDLE_AI" ? "sel" : ""}`}
                  onClick={() => set("decider_type", "CANDLE_AI")}
                >
                  <span className="ck">✓</span>
                  <span className="kind4">Built in</span>
                  <b>CandleAI</b>
                  <span>Our agent decides for you — no endpoint, no hosting.</span>
                  <em>Included</em>
                </button>
              </div>

              {form.decider_type === "OWN_BOT" && (
                <div className="fx-fr" style={{ marginTop: "16px" }}>
                  <div>
                    <label className="fx-fl" htmlFor="bot">
                      Bot
                    </label>
                    <div className="fx-inp">
                      <select
                        id="bot"
                        value={form.bot ?? ""}
                        onChange={(e) =>
                          set("bot", e.target.value ? parseInt(e.target.value, 10) : null)
                        }
                      >
                        <option value="">Select a bot…</option>
                        {botOptions.map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                        {existing?.bot &&
                          !botOptions.some((b) => b.id === existing.bot) && (
                            <option value={existing.bot}>
                              {existing.bot_name || `Bot #${existing.bot}`}
                            </option>
                          )}
                      </select>
                    </div>
                    <p className="fx-hint">
                      {bots.length === 0 ? (
                        <>
                          No bots connected yet.{" "}
                          <a href="/dashboard/bots/new">Add one</a> — a trade can&rsquo;t start
                          without a bot assigned, or switch to CandleAI above.
                        </>
                      ) : (
                        "A trade can’t start without a bot assigned. Manage bots from My bots."
                      )}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* 05 — limits */}
            <section className="fx-fsec">
              <div className="fx-fh">
                <span className="fx-fn">05</span>
                <h3>Your limits</h3>
              </div>
              <p className="fx-fsub">
                Every percentage is measured against this trade&rsquo;s{" "}
                <b>{alloc > 0 ? dollarFormat(alloc) : "allocation"}</b>, not your whole balance.
                Candleweb enforces them whatever the bot asks for.
              </p>

              <div className="fx-fr two2">
                <div>
                  <span className="fx-fl">Risk per trade</span>
                  <div className="fx-sld">
                    <div className="fx-sldtop">
                      <span className={`fx-sldval ${form.risk_pct > 5 ? "hot4" : ""}`}>
                        {form.risk_pct.toFixed(1)}%<em>of this allocation</em>
                      </span>
                      <span className="fx-sldcash">
                        ≈ {alloc > 0 ? dollarFormat(riskCash) : "—"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={RISK_STEPS[0]}
                      max={RISK_STEPS[1]}
                      step={0.5}
                      value={form.risk_pct}
                      style={
                        {
                          ["--p" as any]: `${((form.risk_pct - 0.5) / 9.5) * 100}%`,
                        } as React.CSSProperties
                      }
                      onChange={(e) => set("risk_pct", parseFloat(e.target.value))}
                    />
                    <div className="fx-sldscale">
                      <span>0.5%</span>
                      <span>2.5%</span>
                      <span>5%</span>
                      <span>7.5%</span>
                      <span>10%</span>
                    </div>
                  </div>
                  <p className="fx-hint">The most a single losing trade can cost you.</p>
                </div>
                <div>
                  <label className="fx-fl" htmlFor="sz">
                    Max size per trade
                  </label>
                  <div className="fx-inp">
                    <select
                      id="sz"
                      value={form.max_size_pct}
                      onChange={(e) => set("max_size_pct", parseInt(e.target.value, 10))}
                    >
                      {[25, 50, 75, 100].map((n) => (
                        <option key={n} value={n}>
                          {n}% of allocation
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="fx-sldout">
                    {alloc > 0 ? (
                      <>
                        A hard ceiling of <b>{dollarFormat(ceilingCash)}</b> on any one order. A bot
                        that asks for more is refused, and the refusal is logged.
                      </>
                    ) : (
                      "Set an allocation and we'll show what the ceiling works out to."
                    )}
                  </div>
                </div>
              </div>

              <div className="fx-fr two2" style={{ marginTop: "16px" }}>
                <div>
                  <label className="fx-fl" htmlFor="dir">
                    Direction allowed
                  </label>
                  <div className="fx-inp">
                    <select
                      id="dir"
                      value={form.direction}
                      onChange={(e) => set("direction", e.target.value as TradeV2Direction)}
                    >
                      <option value="BOTH">Long &amp; short</option>
                      <option value="LONG">Long only</option>
                      <option value="SHORT">Short only</option>
                    </select>
                  </div>
                  <p className="fx-hint">
                    Decisions outside this are refused and logged, not silently dropped.
                  </p>
                </div>
                <div>
                  <span className="fx-fl">Stop behaviour</span>
                  <div className="fx-sw">
                    <div className="tx">
                      <b>Trailing stop</b>
                      <span>
                        Follows price in your favour and never moves back. Off keeps the stop where
                        it was set.
                      </span>
                    </div>
                    <button
                      type="button"
                      className={`fx-tg ${form.trailing_stop ? "" : "off4"}`}
                      aria-pressed={form.trailing_stop}
                      aria-label="Trailing stop"
                      onClick={() => set("trailing_stop", !form.trailing_stop)}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="fx-fsec">
              <div className="fx-actions">
                <button
                  className="fx-cta ghost2"
                  type="button"
                  disabled={busy !== null}
                  onClick={onSave}
                >
                  {busy === "save" ? "Saving…" : editing ? "Save changes" : "Save as paused"}
                </button>
                <button
                  className="fx-cta main2"
                  type="button"
                  disabled={busy !== null || missing.length > 0}
                  onClick={onStart}
                >
                  {busy === "start" ? "Starting…" : "Start trading"}
                </button>
              </div>
              <p className="fx-note3">
                {missing.length > 0 ? (
                  <>
                    <b>Before you can start:</b> {missing.join(", ")}. Saving as paused works now —
                    the setup is kept, nothing runs.
                  </>
                ) : (
                  "Starting runs the same logic against live candles. Pause it any time from the trade list."
                )}
              </p>
            </section>
          </form>

          <aside className="fx-side2">
            <div className="fx-meter">
              <div className="fx-mh">
                <b>Setup strength</b>
                <span>{doneCount} of 5</span>
              </div>
              <div className="fx-seg">
                {sectionsDone.map((ok, i) => (
                  <i key={i} className={ok ? "f" : i === sectionsDone.indexOf(false) ? "nx" : ""} />
                ))}
              </div>
              <p className="fx-mnote">
                Five things decide whether this trade behaves: the market, the money, the data, the
                decider and the limits. Work down the page.
              </p>
            </div>

            <div className="fx-unlock" style={{ marginTop: "24px" }}>
              <h4>This trade at a glance</h4>
              <p className="us">What Candleweb will do once you start it.</p>
              <div className="fx-ul got3">
                <i>✓</i>
                <div>
                  <b>{pairName} · {form.timeframe}</b>
                  <span>on {PLACEHOLDER_ACCOUNTS.find((a) => a.id === form.exchange_account)?.name || `account #${form.exchange_account}`}</span>
                </div>
              </div>
              <div className={`fx-ul ${alloc > 0 ? "got3" : ""}`}>
                <i>{alloc > 0 ? "✓" : "2"}</i>
                <div>
                  <b>{alloc > 0 ? dollarFormat(alloc) : "No allocation yet"}</b>
                  <span>
                    risk {form.risk_pct.toFixed(1)}% · max order {form.max_size_pct}%
                  </span>
                </div>
              </div>
              <div className={`fx-ul ${form.indicators.length ? "got3" : ""}`}>
                <i>{form.indicators.length ? "✓" : "3"}</i>
                <div>
                  <b>{form.indicators.length} indicator{form.indicators.length === 1 ? "" : "s"}</b>
                  <span>{form.candle_history_len} candles of history</span>
                </div>
              </div>
              <div
                className={`fx-ul ${form.decider_type === "CANDLE_AI" || form.bot ? "got3" : ""}`}
              >
                <i>{form.decider_type === "CANDLE_AI" || form.bot ? "✓" : "4"}</i>
                <div>
                  <b>
                    {form.decider_type === "CANDLE_AI"
                      ? "CandleAI decides"
                      : form.bot
                        ? `${botOptions.find((b) => b.id === form.bot)?.name || existing?.bot_name || `Bot #${form.bot}`} decides`
                        : "No decider yet"}
                  </b>
                  <span>{DIRECTION_LABELS[form.direction]}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </DashboardShell>
    </>
  );
};

export default NewTradePage;
