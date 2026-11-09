import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../redux/store";
import tradingV2Service, { toId } from "../../../services/tradingV2Service";
import subscriptionV2Service from "../../../services/subscriptionV2Service";
import userService from "../../../services/userService";
import exchangeServices from "../../../services/exchangeService";
import currencyService from "../../../services/currencyService";
import useAxiosAuth from "../../../lib/hooks/useAxiosAuth";
import { isAuthorizationHeaderSet } from "../../../utils/check_auth";
import { error } from "../../../components/alert/Toast";
import DashboardShell from "../../../components/dashboard/focus/DashboardShell";
import TopBar from "../../../components/dashboard/focus/TopBar";
import Dialog from "../../../components/dashboard/focus/Dialog";
import IndicatorDrawer from "../../../components/dashboard/focus/IndicatorDrawer";
import {
  DEFAULT_INDICATORS,
  dedupeIndicators,
  defaultIndicators,
  indicatorChips,
  indicatorLabel,
  unknownIndicatorNames,
} from "../../../lib/tradingV2Indicators";
import useIndicatorCatalogue from "../../../lib/hooks/useIndicatorCatalogue";
import {
  DEFAULT_MIN_CONFIDENCE,
  confidenceError,
  tradeTitle,
} from "../../../lib/tradingV2Trades";
import { metricNum, metricRead } from "../../../lib/tradingV2Metrics";
import { platformLabel } from "../../../lib/botV2Labels";
import { writeClipboard } from "../../../lib/hooks/useClipboard";
import useBook from "../../../lib/hooks/useBook";
import {
  BotV2,
  PortfolioMetricsV2,
  TradeV2,
  TradeV2DeciderType,
  TradeV2Payload,
  TradeV2Timeframe,
} from "../../../types/tradingV2";
import { BalanceProp } from "../../../types/user";
import { ExchangeProp, ExchangeRecord } from "../../../types/exchange";

/* ------------------------------------------------------------------ *
 * New trade / edit trade — one short step at a time.
 *
 * Users found the single long form too long, so the setup is now six steps
 * (market · money & limits · who decides · how positions close · what the
 * bot sees · review), with a sticky "This trade" panel that is also the
 * navigation. Built to the "Candleweb New Trade" design; its styles are in
 * styles/trade-setup.css under `nt-` names.
 *
 * Everything reads and writes the real API:
 *   - pairs            GET  /currency/retrieve/all/
 *   - exchange accounts GET /exchange/record/
 *   - bots, trades     GET  /trading_v2/bots/, /trading_v2/trades/?book=
 *   - indicators       GET  /trading_v2/indicators/ (public, cached per tab)
 *   - plan             GET  /subscription_v2/me/ — CandleAI and the demo
 *                      balance depend on it
 *   - balance          GET  /trading_v2/metrics/?book= (account_equity), with
 *                      /trade/portfolio/balance/ as the fallback
 *   - save             POST /trading_v2/trades/ · PATCH /trading_v2/trades/{id}/
 *                      then /start/ or /pause/ to land in the state the user
 *                      asked for (a trade is ACTIVE from the moment it is
 *                      created, so "Save as paused" pauses it straight away).
 *
 * `/dashboard/trades/new?id=<id>` stays the edit screen: it opens on Review
 * with every step filled in.
 * ------------------------------------------------------------------ */

/** "BTCUSDT" quoted in "USDT" → "BTC/USDT". Left as is if it doesn't split. */
const pairLabel = (pair: string, quote?: string) =>
  quote && pair.endsWith(quote) && pair.length > quote.length
    ? `${pair.slice(0, -quote.length)}/${quote}`
    : pair;

/**
 * The market a demo trade runs against when no exchange account is chosen.
 * A demo trade created with `exchange_account: null` comes back
 * `exchange_name: "KuCoin"` — the backend picks the venue.
 */
const DEMO_VENUE = "KuCoin";

/* `1d` is deliberately absent: the model accepts it but the candle feed does
   not serve it yet (see DASHBOARD_ENDPOINTS.md). */
const TIMEFRAMES: TradeV2Timeframe[] = ["1m", "5m", "15m", "1h", "4h"];
const TF_CALLS: Record<string, number> = { "1m": 1440, "5m": 288, "15m": 96, "1h": 24, "4h": 6, "1d": 1 };
const TF_MS: Record<string, number> = {
  "1m": 6e4,
  "5m": 3e5,
  "15m": 9e5,
  "1h": 36e5,
  "4h": 144e5,
  "1d": 864e5,
};
const TF_WORD: Record<string, string> = {
  "1m": "one-minute",
  "5m": "five-minute",
  "15m": "fifteen-minute",
  "1h": "one-hour",
  "4h": "four-hour",
  "1d": "one-day",
};
const TF_WAIT: Record<string, string> = {
  "1m": "5 minutes",
  "5m": "25 minutes",
  "15m": "75 minutes",
  "1h": "5 hours",
  "4h": "20 hours",
  "1d": "5 days",
};

const PRESETS: Record<string, { label: string; risk: number; size: number }> = {
  cautious: { label: "Cautious", risk: 1, size: 25 },
  balanced: { label: "Balanced", risk: 2, size: 50 },
  aggressive: { label: "Aggressive", risk: 5, size: 100 },
};
const PRESET_KEYS = ["cautious", "balanced", "aggressive", "custom"];

/* What each plan lets an account do, for the "Preview as" control. The
   account's OWN plan is always read from its entitlements instead; this table
   only describes the plans being previewed. */
const PLANS: Record<string, { label: string; demo: boolean; live: boolean; ai: boolean }> = {
  none: { label: "No plan", demo: false, live: false, ai: false },
  paper: { label: "Paper", demo: true, live: false, ai: false },
  builder: { label: "Builder", demo: true, live: true, ai: true },
  desk: { label: "Desk", demo: true, live: true, ai: true },
};
type PlanKey = keyof typeof PLANS;
const SIZES = [10, 25, 50, 75, 100];
const HISTORY_OPTIONS = [10, 20, 50, 100];
const RISK_MIN = 0.1;
const RISK_MAX = 25;

const STEPS = [
  "What to trade",
  "Money & limits",
  "Who decides",
  "How positions close",
  "What your bot sees",
  "Review & start",
];
const LAST = STEPS.length - 1;
const EXITS = 3;
const DATA = 4;

/* Which step owns each field the API can refuse, so a 400 lands the user on
   the step with the input it is about. Anything unlisted shows on Review. */
const FIELD_STEP: Record<string, number> = {
  exchange_account: 0,
  pair: 0,
  timeframe: 0,
  allocated_amount: 1,
  risk_pct: 1,
  max_size_pct: 1,
  reinvest_profits: 1,
  decider_type: 2,
  bot: 2,
  min_confidence: 2,
  agent_exits: EXITS,
  trailing_stop: EXITS,
  indicators: DATA,
  candle_history_len: DATA,
  name: LAST,
};

const CHECK = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20 6.5 9.2 17.3 4 12.1" />
  </svg>
);
const WARN = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 9v4.5" />
    <path d="M12 17.2h.01" />
    <path d="M10.3 4 2.5 17.9A2 2 0 0 0 4.2 21h15.6a2 2 0 0 0 1.7-3.1L13.7 4a2 2 0 0 0-3.4 0z" />
  </svg>
);

const usd = (n: number) =>
  "$" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n: number) => (Math.round(n * 10) / 10).toString() + "%";
const low = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
const pad = (n: number) => String(n).padStart(2, "0");

type IndSource = "starter" | "bot" | "nobotset" | "custom" | "saved";

type FormState = {
  name: string;
  /** A string: required, and must be able to be empty while typing. */
  min_confidence: string;
  /** 0 = none picked. Optional on demo (KuCoin prices), required on live. */
  exchange_account: number;
  pair: number;
  timeframe: TradeV2Timeframe;
  allocated_amount: string;
  reinvest_profits: boolean;
  risk_pct: number;
  max_size_pct: number;
  decider_type: TradeV2DeciderType;
  bot: number | null;
  agent_exits: boolean;
  trailing_stop: boolean;
  indicators: string[];
  candle_history_len: number;
};

const DEFAULTS: FormState = {
  name: "",
  min_confidence: String(DEFAULT_MIN_CONFIDENCE),
  exchange_account: 0,
  pair: 0,
  timeframe: "1m",
  allocated_amount: "",
  reinvest_profits: false,
  risk_pct: 2,
  max_size_pct: 50,
  decider_type: "OWN_BOT",
  bot: null,
  agent_exits: false,
  trailing_stop: true,
  indicators: DEFAULT_INDICATORS,
  candle_history_len: 20,
};

const matchPreset = (risk: number, size: number) =>
  Object.keys(PRESETS).find((k) => PRESETS[k].risk === risk && PRESETS[k].size === size) || "custom";

/** A stored trade, as the form holds it. */
const formFrom = (t: TradeV2): FormState => ({
  name: t.name ?? "",
  min_confidence: t.min_confidence == null ? DEFAULTS.min_confidence : String(t.min_confidence),
  exchange_account: toId(t.exchange_account) ?? 0,
  pair: toId(t.pair) ?? 0,
  timeframe: t.timeframe,
  allocated_amount: parseFloat(t.allocated_amount) ? String(parseFloat(t.allocated_amount)) : "",
  reinvest_profits: !!t.reinvest_profits,
  risk_pct: Math.round((parseFloat(t.risk_pct) || 2) * 10) / 10,
  max_size_pct: t.max_size_pct || 50,
  decider_type: t.decider_type,
  bot: toId(t.bot),
  agent_exits: !!t.agent_exits,
  trailing_stop: t.trailing_stop !== false,
  indicators: dedupeIndicators(indicatorChips(t.indicators)),
  candle_history_len: t.candle_history_len || 20,
});

type Blocker = { t: string; s?: number; focus?: string };
type Done = { kind: "started" | "paused"; trade: TradeV2 };

const NewTradePage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { trades, bots } = useSelector((state: RootState) => state.tradingV2);
  const { balance } = useSelector((state: RootState) => state.user);
  const { exchanges, exchangeRecord } = useSelector((state: RootState) => state.exchange);
  const { currency } = useSelector((state: RootState) => state.currency);
  const { entitlements, meLoaded } = useSelector((state: RootState) => state.subscriptionV2);

  const editId = typeof router.query.id === "string" ? parseInt(router.query.id, 10) : null;
  const editing = editId != null && !Number.isNaN(editId);

  const [form, setForm] = useState<FormState>(DEFAULTS);
  const [step, setStep] = useState(0);
  const [seen, setSeen] = useState(0);
  const [enter, setEnter] = useState(false);
  const [exOpen, setExOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [preset, setPreset] = useState("balanced");
  const [indSource, setIndSource] = useState<IndSource>("starter");
  const [copiedFrom, setCopiedFrom] = useState<TradeV2 | null>(null);
  const [drawer, setDrawer] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [done, setDone] = useState<Done | null>(null);
  const [busy, setBusy] = useState<null | "save" | "start">(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [existing, setExisting] = useState<TradeV2 | null>(null);
  const [metrics, setMetrics] = useState<PortfolioMetricsV2 | null>(null);
  const [keyShown, setKeyShown] = useState(false);
  const [copied, setCopied] = useState("");
  const [count, setCount] = useState({ left: "--:--", at: "" });

  const loadedRef = useRef<number | null>(null);
  const fetchedRef = useRef(false);
  const indicatorsTouched = useRef(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusTitle = useRef(false);

  const catalogue = useIndicatorCatalogue();

  /* The book this trade is created in is the Settings switch, not a choice
     made here. An existing trade keeps the mode it was created with. */
  const book = useBook();

  /* "Preview as": shows this form the way another plan or account mode
     would see it. `null` follows the real account. While anything differs
     from the real account, saving and starting are off — the server always
     uses the real plan and the real Settings switch. */
  const [pvPlan, setPvPlan] = useState<PlanKey | null>(null);
  const [pvMode, setPvMode] = useState<"demo" | "live" | null>(null);
  const [pvOpen, setPvOpen] = useState(false);
  const pvRef = useRef<HTMLDivElement>(null);
  const realPlan: PlanKey | null = entitlements
    ? entitlements.has_active_plan === false
      ? "none"
      : ((Object.keys(PLANS).find((k) => k === String(entitlements.plan_code || "").toLowerCase()) as PlanKey) ??
        null)
    : null;
  const effPlan = pvPlan ?? realPlan;
  const modeFixed = editing && !!existing?.mode;
  const effMode: "demo" | "live" = modeFixed
    ? String(existing?.mode).toUpperCase() === "LIVE"
      ? "live"
      : "demo"
    : pvMode ?? book;
  const isLive = effMode === "live";
  const previewing = (pvPlan != null && pvPlan !== realPlan) || (!modeFixed && pvMode != null && pvMode !== book);

  /* ---------------- loading ---------------- */

  useEffect(() => {
    if (currency.length < 1) dispatch(currencyService.getCurrency());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken) || fetchedRef.current) return;
    fetchedRef.current = true;
    dispatch(tradingV2Service.listBots(axiosToken));
    dispatch(tradingV2Service.listTrades({ api: axiosToken, book }));
    if (!balance || balance.length === 0) dispatch(userService.getBalance(axiosToken));
    dispatch(exchangeServices.getExchangeRecords(axiosToken));
    if (exchanges.length < 1) dispatch(exchangeServices.getExchanges());
    if (!meLoaded) dispatch(subscriptionV2Service.getMe(axiosToken));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [axiosToken, dispatch]);

  /* The book's account equity is the balance figure; the portfolio balance
     is only the fallback while the backend cannot measure it. */
  useEffect(() => {
    if (!isAuthorizationHeaderSet(axiosToken)) return;
    let live = true;
    tradingV2Service
      .getPortfolioMetrics(axiosToken, { book: isLive ? "live" : "demo" })
      .then((m) => live && setMetrics(m))
      .catch(() => live && setMetrics(null));
    return () => {
      live = false;
    };
  }, [axiosToken, isLive]);

  const pairOptions = useMemo(
    () =>
      currency.flatMap((c) =>
        (c.currency_pair ?? [])
          .filter((p) => p.id != null && p.pair)
          .map((p) => ({ id: p.id as number, name: pairLabel(p.pair as string, c.ticker) })),
      ),
    [currency],
  );

  /* New trade: the first supported pair once the list loads. */
  useEffect(() => {
    if (editing || form.pair || !pairOptions.length) return;
    setForm((f) => ({ ...f, pair: pairOptions[0].id }));
  }, [editing, form.pair, pairOptions]);

  /* Edit: fill every step from the stored trade and open on Review. */
  useEffect(() => {
    if (!editing || editId == null || loadedRef.current === editId) return;
    const apply = (t: TradeV2) => {
      loadedRef.current = editId;
      setExisting(t);
      const f = formFrom(t);
      setForm(f);
      setPreset(matchPreset(f.risk_pct, f.max_size_pct));
      setIndSource("saved");
      setStep(LAST);
      setSeen(LAST);
    };
    const fromStore = trades.find((t) => t.id === editId);
    if (fromStore) apply(fromStore);
    else if (isAuthorizationHeaderSet(axiosToken)) {
      dispatch(tradingV2Service.getTrade({ api: axiosToken, id: editId })).then((res: any) => {
        if (res?.payload?.id) apply(res.payload as TradeV2);
      });
    }
  }, [editing, editId, trades, axiosToken, dispatch]);

  /* A new trade's starter indicators, minus any the catalogue no longer has. */
  useEffect(() => {
    if (editing || indicatorsTouched.current || catalogue.index.size === 0) return;
    const pruned = defaultIndicators(catalogue.index);
    setForm((f) =>
      f.indicators.length === pruned.length && f.indicators.every((n, i) => n === pruned[i])
        ? f
        : { ...f, indicators: pruned },
    );
  }, [catalogue.index, editing]);

  /* ---------------- exchange accounts ---------------- */

  const accountOptions = useMemo(
    () =>
      exchangeRecord
        .filter((r: ExchangeRecord) => r.id != null)
        .map((r: ExchangeRecord) => {
          const ex = exchanges.find((x: ExchangeProp) => String(x.id) === String(r.supported_exchange_id));
          const name = ex?.name ?? (r.supported_exchange_id ? String(r.supported_exchange_id) : "Exchange");
          const active = r.is_active !== false;
          return { id: r.id as number, name, label: active ? name : `${name} (inactive)`, active };
        }),
    [exchangeRecord, exchanges],
  );
  /* An inactive record has no working keys, so a live trade on one would
     place no orders. The one kept is the account an edited trade already uses. */
  const selectableAccounts = useMemo(
    () => accountOptions.filter((a) => a.active || a.id === form.exchange_account),
    [accountOptions, form.exchange_account],
  );

  /* New LIVE trade: the first active account, once they load. Never on demo —
     a demo trade needs no keys. */
  useEffect(() => {
    if (editing || !isLive || form.exchange_account) return;
    const first = accountOptions.find((a) => a.active);
    if (first) setForm((f) => ({ ...f, exchange_account: first.id }));
  }, [editing, isLive, form.exchange_account, accountOptions]);

  /* Switching the Settings switch while this page is open starts the
     exchange choice again — a demo default never carries into a live trade. */
  const lastMode = useRef(effMode);
  useEffect(() => {
    if (editing || lastMode.current === effMode) return;
    lastMode.current = effMode;
    setExOpen(false);
    setForm((f) => ({ ...f, exchange_account: 0 }));
  }, [effMode, editing]);

  /* The preview panel closes on a click outside it, and on Escape. */
  useEffect(() => {
    if (!pvOpen) return;
    const onDown = (e: MouseEvent) => {
      if (pvRef.current && !pvRef.current.contains(e.target as Node)) setPvOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPvOpen(false);
        pvRef.current?.querySelector<HTMLElement>(".nt-pvsum")?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [pvOpen]);

  const exchName = (): string | null => {
    if (!form.exchange_account) return isLive ? null : DEMO_VENUE;
    return (
      accountOptions.find((a) => a.id === form.exchange_account)?.name ||
      (existing && toId(existing.exchange_account) === form.exchange_account ? existing.exchange_name || null : null) ||
      `account #${form.exchange_account}`
    );
  };

  /* ---------------- derived ---------------- */

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (fieldErrors[k as string]) setFieldErrors((e) => ({ ...e, [k as string]: "" }));
  };

  const pairName =
    pairOptions.find((p) => p.id === form.pair)?.name || existing?.pair_name || (form.pair ? `Pair #${form.pair}` : "—");

  const alloc = (() => {
    const v = parseFloat(String(form.allocated_amount).replace(/,/g, ""));
    return Number.isFinite(v) && v > 0 ? v : 0;
  })();

  const aiDecides = form.decider_type === "CANDLEAI";
  /* Locked only when the plan says so. Before it loads, the server is the
     judge — refusing CandleAI on a guess would block a paying user. */
  const aiLocked =
    pvPlan != null ? !PLANS[pvPlan].ai : !!entitlements && entitlements.candleai_included === false;
  const planName = pvPlan != null ? PLANS[pvPlan].label : entitlements?.plan_name || "current";
  const noPlan =
    !isLive &&
    (pvPlan != null ? !PLANS[pvPlan].demo : !!entitlements && entitlements.has_active_plan === false);

  const bot: BotV2 | undefined = form.bot != null ? bots.find((b) => b.id === form.bot) : undefined;
  const botName = bot?.name || (existing && toId(existing.bot) === form.bot ? existing.bot_name : null) || null;
  const who = aiDecides ? "CandleAI" : "your bot";

  /* A bot's most recent other trade — what "last used on" names and where
     its indicators are filled from. */
  const lastTradeOf = useCallback(
    (botId: number): TradeV2 | null =>
      trades
        .filter((t) => toId(t.bot) === botId && t.id !== existing?.id)
        .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))[0] ?? null,
    [trades, existing],
  );
  const botLast = bot ? lastTradeOf(bot.id) : null;

  /* Balance: what the book holds, less what this book's other trades claim. */
  const totalBalance = useMemo(
    () =>
      (balance || [])
        .filter((b: BalanceProp) => b.name?.toLowerCase() !== "cde")
        .reduce((s: number, b: BalanceProp) => s + (Number(b.balance) || 0), 0),
    [balance],
  );
  const balanceKnown = !!balance && balance.length > 0;
  const equityRead = metricRead(metrics, "account_equity", metricNum(metrics?.account_equity));
  const equity = equityRead.available ? equityRead.value : null;

  const bal = useMemo((): {
    label: string;
    total: number | null;
    other: number;
    reason?: string;
    plans?: boolean;
    needAccount?: boolean;
  } => {
    const other = trades.reduce(
      (s, t) => (existing && t.id === existing.id ? s : s + (parseFloat(t.allocated_amount) || 0)),
      0,
    );
    if (!isLive) {
      if (noPlan)
        return {
          label: "Demo balance",
          total: null,
          other,
          reason: "Your demo account opens with 10,000 USDT when you subscribe to a plan. Paper is free.",
          plans: true,
        };
      const total = equity ?? (balanceKnown ? totalBalance : null);
      return {
        label: "Demo balance",
        total,
        other,
        reason: total == null ? equityRead.reason || "Your demo balance couldn't be read yet." : undefined,
      };
    }
    const name = exchName();
    if (!form.exchange_account)
      return {
        label: "Exchange balance",
        total: null,
        other,
        reason: "Choose the exchange account in step 1 to see what is free on it.",
        needAccount: true,
      };
    const entry = (balance || []).find(
      (b: BalanceProp) => name && b.name?.toLowerCase() === name.toLowerCase(),
    );
    const total = entry ? Number(entry.balance) || 0 : equity ?? (balanceKnown ? totalBalance : null);
    return {
      label: `Your ${name} balance`,
      total,
      other,
      reason: total == null ? equityRead.reason || "This account's balance couldn't be read yet." : undefined,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLive, noPlan, equity, balanceKnown, totalBalance, trades, existing, form.exchange_account, balance, accountOptions]);

  const free = bal.total == null ? null : Math.max(0, bal.total - bal.other);
  const over = free != null && alloc > free + 1e-9;

  const confErr = confidenceError(form.min_confidence);
  const confOk = !confErr;
  const confN = parseInt(form.min_confidence, 10);

  const nameDup = useMemo(() => {
    const n = form.name.trim().toLowerCase();
    if (!n) return null;
    const hit = trades.find(
      (t) => t.id !== existing?.id && (t.name || "").trim().toLowerCase() === n,
    );
    return hit ? (hit.name || "").trim() : null;
  }, [form.name, trades, existing]);
  const autoName = `${pairName.replace("/", "")} · ${form.timeframe}`;
  const displayName = form.name.trim() || autoName;

  const staleIndicators = useMemo(
    () => unknownIndicatorNames(form.indicators, catalogue.index),
    [form.indicators, catalogue.index],
  );
  const mtfOff = useMemo(
    () =>
      form.timeframe !== "1m"
        ? form.indicators.filter((n) => catalogue.index.get(n)?.category === "multi_timeframe")
        : [],
    [form.timeframe, form.indicators, catalogue.index],
  );
  const indName = (n: string) => indicatorLabel(catalogue.index, n);

  /** What the API would refuse — blocks Save as well as Start. */
  const createErrors = useMemo((): Blocker[] => {
    const e: Blocker[] = [];
    if (!form.pair) e.push({ t: "Pick a pair to trade", s: 0 });
    if (isLive && !form.exchange_account) e.push({ t: "Choose the exchange account its real orders go to", s: 0 });
    if (aiDecides && aiLocked) e.push({ t: "CandleAI needs the Builder or Desk plan", s: 2 });
    if (!confOk) e.push({ t: "Set a confidence bar from 0 to 99", s: 2 });
    if (!aiDecides && staleIndicators.length)
      e.push({ t: `Remove ${staleIndicators.join(", ")}: no longer available`, s: DATA });
    if (nameDup) e.push({ t: "Pick a name you haven’t used yet", focus: "nt-name" });
    return e;
  }, [form.pair, form.exchange_account, isLive, aiDecides, aiLocked, confOk, staleIndicators, nameDup]);

  /** What a trade needs before it can run. */
  const startBlockers = useMemo((): Blocker[] => {
    const b: Blocker[] = [];
    if (noPlan) b.push({ t: "Choose a plan to open your demo balance. Paper is free.", s: 1 });
    else if (!alloc) b.push({ t: "Allocate an amount", s: 1 });
    else if (over && free != null) b.push({ t: `Lower the amount to ${usd(free)} or less`, s: 1 });
    if (!aiDecides && !form.bot) b.push({ t: "Pick a bot", s: 2 });
    return b;
  }, [noPlan, alloc, over, free, aiDecides, form.bot]);

  const status = (i: number): "done" | "todo" | "auto" | "ready" => {
    if (i === 0) return (isLive && !form.exchange_account) || !form.pair ? "todo" : "done";
    if (i === 1) return startBlockers.some((x) => x.s === 1) ? "todo" : "done";
    if (i === 2) return (!aiDecides && !form.bot) || (aiDecides && aiLocked) || !confOk ? "todo" : "done";
    if (i === EXITS) return "done";
    if (i === DATA) return aiDecides ? "auto" : staleIndicators.length ? "todo" : "done";
    return createErrors.length || startBlockers.length ? "todo" : "ready";
  };

  const railText = (i: number): { v: string; s: string } => {
    switch (i) {
      case 0:
        return {
          v: `${pairName} · ${form.timeframe}`,
          s: isLive
            ? form.exchange_account
              ? `${exchName()} · real orders`
              : "no exchange account yet"
            : `${exchName()} prices · paper fills`,
        };
      case 1:
        return {
          v: noPlan
            ? "No demo balance yet"
            : over
              ? "More than you have free"
              : alloc
                ? `${usd(alloc)} allocated`
                : "No allocation yet",
          s: `loses ≤${fmtPct(form.risk_pct)} · uses ≤${form.max_size_pct}%${form.reinvest_profits ? " · reinvests" : ""}`,
        };
      case 2: {
        const c = confOk ? `acts above ${confN}` : "confidence bar not set";
        if (aiDecides)
          return aiLocked
            ? { v: "CandleAI needs Builder or Desk", s: "or let your own bot decide" }
            : { v: "CandleAI", s: c };
        return {
          v: botName || "No decider yet",
          s: form.bot
            ? `${bot ? `via ${platformLabel(bot.platform)} · ` : ""}${c}${bot?.status === "PAUSED" ? " · paused" : ""}`
            : "pick one of your bots",
        };
      }
      case EXITS:
        return {
          v: form.agent_exits ? (aiDecides ? "CandleAI can close" : "Bot can close") : "Let winners run",
          s: form.trailing_stop ? "trailing stop on" : "fixed stop",
        };
      case DATA:
        if (aiDecides) return { v: "Handled by CandleAI", s: "it reads its own data" };
        return {
          v: `${form.indicators.length} indicator${form.indicators.length === 1 ? "" : "s"}`,
          s: `${form.candle_history_len} candles of history · ${
            indSource === "bot" && botLast
              ? `from ${tradeTitle(botLast)}`
              : indSource === "custom"
                ? "your picks"
                : indSource === "saved"
                  ? "as saved"
                  : "starter set"
          }`,
        };
      default: {
        const n = createErrors.length + startBlockers.length;
        return n
          ? { v: `${n} thing${n === 1 ? "" : "s"} left`, s: "see Review" }
          : { v: "Ready to start", s: isLive ? "real money" : "paper money" };
      }
    }
  };

  const ready = [0, 1, 2, 3, 4].filter((i) => status(i) !== "todo").length;
  const firstTodo = [0, 1, 2, 3, 4].find((i) => status(i) === "todo");
  const allBlockers = createErrors.concat(startBlockers);

  /* ---------------- navigation ---------------- */

  const go = (i: number) => {
    setStep(i);
    setSeen((s) => Math.max(s, i));
    setDrawer(false);
    setEnter(true);
    focusTitle.current = true;
  };
  const nextStep = () => (step === EXITS && aiDecides ? LAST : Math.min(LAST, step + 1));
  const prevStep = () => (step === LAST && aiDecides ? EXITS : Math.max(0, step - 1));

  useEffect(() => {
    if (!focusTitle.current) return;
    focusTitle.current = false;
    titleRef.current?.focus({ preventScroll: true });
    const reduce =
      typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  }, [step]);

  const focusField = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.focus();
  };

  /* ---------------- actions on the form ---------------- */

  const setIndicators = (next: string[]) => {
    indicatorsTouched.current = true;
    setIndSource("custom");
    set("indicators", next);
  };

  const pickBot = (id: number) => {
    if (form.bot === id) return;
    const last = lastTradeOf(id);
    if (last) {
      indicatorsTouched.current = true;
      setForm((f) => ({
        ...f,
        bot: id,
        indicators: dedupeIndicators(indicatorChips(last.indicators)),
        candle_history_len: last.candle_history_len || f.candle_history_len,
      }));
      setIndSource("bot");
    } else {
      setForm((f) => ({ ...f, bot: id }));
      if (indSource !== "custom") setIndSource("nobotset");
    }
    setFieldErrors((e) => ({ ...e, bot: "" }));
  };

  const restoreBotSet = () => {
    if (!botLast) return;
    indicatorsTouched.current = true;
    setForm((f) => ({
      ...f,
      indicators: dedupeIndicators(indicatorChips(botLast.indicators)),
      candle_history_len: botLast.candle_history_len || f.candle_history_len,
    }));
    setIndSource("bot");
  };

  const choosePreset = (k: string) => {
    setPreset(k);
    const p = PRESETS[k];
    if (p) setForm((f) => ({ ...f, risk_pct: p.risk, max_size_pct: p.size }));
    else setAdjustOpen(true);
  };

  const fillPct = (p: number) => {
    if (free == null) return;
    set("allocated_amount", (Math.floor(((free * p) / 100) * 100) / 100).toFixed(2));
  };

  const confStep = (d: number) => {
    const n = confOk ? Math.max(0, Math.min(99, confN + d)) : DEFAULT_MIN_CONFIDENCE;
    set("min_confidence", String(n));
  };

  /* The user's most recent trade in this book — "Copy" fills every step from
     it and opens on Review. */
  const copySource = useMemo(
    () =>
      editing
        ? null
        : trades
            .slice()
            .sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")))[0] ?? null,
    [trades, editing],
  );

  const startBlank = () => {
    if (!copiedFrom) return;
    setCopiedFrom(null);
    indicatorsTouched.current = false;
    setForm({
      ...DEFAULTS,
      pair: pairOptions[0]?.id ?? 0,
      indicators: catalogue.index.size ? defaultIndicators(catalogue.index) : DEFAULT_INDICATORS,
    });
    setPreset("balanced");
    setIndSource("starter");
    setExOpen(false);
    setFieldErrors({});
  };

  const copyTrade = (src: TradeV2) => {
    const f = formFrom(src);
    const acct = toId(src.exchange_account);
    const usable = acct != null && accountOptions.some((a) => a.id === acct && a.active);
    indicatorsTouched.current = true;
    setForm({
      ...f,
      name: `${tradeTitle(src)} (copy)`.slice(0, 100),
      exchange_account: isLive
        ? usable
          ? (acct as number)
          : accountOptions.find((a) => a.active)?.id ?? 0
        : usable
          ? (acct as number)
          : 0,
    });
    setPreset(matchPreset(f.risk_pct, f.max_size_pct));
    setIndSource(f.decider_type === "OWN_BOT" && f.bot ? "bot" : "custom");
    setCopiedFrom(src);
    setFieldErrors({});
    setSeen(LAST);
    go(LAST);
  };

  /* ---------------- saving ---------------- */

  const buildPayload = (): TradeV2Payload => ({
    /* Sent even when empty: clearing the name on an edit has to reach the
       server, or `display_name` keeps the old one. */
    name: form.name.trim(),
    min_confidence: Number(form.min_confidence),
    /* `0` is "none picked" — on demo that means KuCoin prices, no keys. */
    exchange_account: form.exchange_account || null,
    pair: form.pair,
    timeframe: form.timeframe,
    allocated_amount: alloc.toFixed(2),
    /* Only the user's own bot is sent indicators; a CandleAI trade saves an
       empty list rather than whatever the picker last held. */
    indicators: aiDecides ? [] : dedupeIndicators(form.indicators),
    candle_history_len: form.candle_history_len,
    decider_type: form.decider_type,
    bot: aiDecides ? null : form.bot,
    risk_pct: form.risk_pct.toFixed(1),
    max_size_pct: form.max_size_pct,
    trailing_stop: form.trailing_stop,
    agent_exits: form.agent_exits,
    reinvest_profits: form.reinvest_profits,
  });

  const persist = async (): Promise<TradeV2 | null> => {
    setFieldErrors({});
    const data = buildPayload();
    const res: any =
      editing && existing
        ? await dispatch(tradingV2Service.updateTrade({ api: axiosToken, id: existing.id, data }))
        : await dispatch(tradingV2Service.createTrade({ api: axiosToken, data }));
    if (res?.payload?.id) return res.payload as TradeV2;
    const fields: Record<string, string> = res?.payload?.fields ?? {};
    setFieldErrors(fields);
    /* Take the user to the step with the refused input on it. */
    const steps = Object.keys(fields)
      .map((k) => FIELD_STEP[k])
      .filter((s) => s != null);
    if (steps.length) go(Math.min(...steps));
    return null;
  };

  /* Once a trade exists, this page is its edit screen: a second save must
     PATCH it, not POST another. */
  const adopt = (t: TradeV2) => {
    loadedRef.current = t.id;
    setExisting(t);
    setCopiedFrom(null);
    if (!editing) {
      router.replace({ pathname: router.pathname, query: { id: String(t.id) } }, undefined, {
        shallow: true,
      });
    }
  };

  const onSavePaused = async () => {
    if (createErrors.length || busy) return;
    setBusy("save");
    try {
      let saved = await persist();
      if (!saved) return;
      if (saved.status === "ACTIVE") {
        const paused: any = await dispatch(tradingV2Service.pauseTrade({ api: axiosToken, id: saved.id }));
        if (paused?.payload?.id) saved = paused.payload as TradeV2;
      }
      adopt(saved);
      setDone({ kind: "paused", trade: saved });
    } finally {
      setBusy(null);
    }
  };

  /* Edit only: save without changing whether the trade is running. */
  const onSaveChanges = async () => {
    if (createErrors.length || busy) return;
    setBusy("save");
    try {
      const saved = await persist();
      if (saved) router.push(`/dashboard/trades/${saved.id}`);
    } finally {
      setBusy(null);
    }
  };

  const doStart = async () => {
    setConfirm(false);
    setBusy("start");
    try {
      let saved = await persist();
      if (!saved) return;
      if (saved.status !== "ACTIVE") {
        const started: any = await dispatch(tradingV2Service.startTrade({ api: axiosToken, id: saved.id }));
        if (!started?.payload?.id) {
          adopt(saved);
          return;
        }
        saved = started.payload as TradeV2;
      }
      adopt(saved);
      setDone({ kind: "started", trade: saved });
    } finally {
      setBusy(null);
    }
  };

  const onStart = () => {
    if (previewing) return;
    if (createErrors.length || startBlockers.length || busy) {
      if (allBlockers.length) error(`Before starting: ${allBlockers.map((b) => low(b.t)).join(", ")}.`);
      return;
    }
    if (isLive) setConfirm(true);
    else doStart();
  };

  const resetAll = () => {
    setDone(null);
    loadedRef.current = null;
    indicatorsTouched.current = false;
    setExisting(null);
    setCopiedFrom(null);
    setForm({
      ...DEFAULTS,
      pair: pairOptions[0]?.id ?? 0,
      indicators: catalogue.index.size ? defaultIndicators(catalogue.index) : DEFAULT_INDICATORS,
    });
    setPreset("balanced");
    setIndSource("starter");
    setExOpen(false);
    setAdjustOpen(false);
    setFieldErrors({});
    setKeyShown(false);
    setSeen(0);
    router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
    go(0);
  };

  /* ---------------- the "running" dialog ---------------- */

  const doneTrade = done?.trade ?? null;
  const doneBotId = doneTrade ? toId(doneTrade.bot) : null;
  const doneBot = doneBotId != null ? bots.find((b) => b.id === doneBotId) : undefined;

  /* The bot's `dev_key` is on every bot response, but a cached list row can
     predate it — fetch the bot when the key is missing. */
  const keyFetchedRef = useRef<number | null>(null);
  useEffect(() => {
    if (doneBotId == null || !isAuthorizationHeaderSet(axiosToken)) return;
    if (doneBot?.dev_key || keyFetchedRef.current === doneBotId) return;
    keyFetchedRef.current = doneBotId;
    dispatch(tradingV2Service.getBot({ api: axiosToken, id: doneBotId }));
  }, [doneBotId, doneBot, axiosToken, dispatch]);

  useEffect(() => {
    if (done?.kind !== "started") return;
    const tf = done.trade.timeframe;
    const tick = () => {
      const ms = TF_MS[tf] || 6e4;
      const now = Date.now();
      const next = Math.ceil((now + 1) / ms) * ms;
      const s = Math.max(0, Math.round((next - now) / 1000));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      setCount({
        left: (h ? h + ":" + pad(m) : pad(m)) + ":" + pad(s % 60),
        at: new Date(next).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [done]);

  /* Focus the dialog's main action when one opens. */
  useEffect(() => {
    if (!done && !confirm) return;
    const t = setTimeout(() => {
      const el = document.querySelector<HTMLElement>(".fx-dlg [data-autofocus]");
      el?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [done, confirm]);

  const copyValue = async (field: string, value?: string | null) => {
    if (!value) return;
    if (await writeClipboard(value)) {
      setCopied(field);
      setTimeout(() => setCopied((f) => (f === field ? "" : f)), 1600);
    } else {
      error("Couldn't copy — select it by hand");
    }
  };

  /* Closing the dialog leaves the user on this trade's edit screen, on Review. */
  const closeDone = () => {
    setDone(null);
    go(LAST);
  };

  /* ---------------- views ---------------- */

  const fieldMsg = (...keys: string[]) => {
    const msgs = keys.map((k) => fieldErrors[k]).filter(Boolean);
    return msgs.length ? <p className="nt-hint badt">{msgs.join(" ")}</p> : null;
  };

  const head = (i: number, title: string, lede?: React.ReactNode) => {
    const st = status(i);
    return (
      <>
        <div className="nt-fh">
          <span className="nt-fn">0{i + 1}</span>
          <h2 id="nt-step-title" tabIndex={-1} ref={titleRef}>
            {title}
          </h2>
          {(st === "done" || st === "ready") && (
            <span className="nt-tick2" aria-label="Done">
              &#10003;
            </span>
          )}
        </div>
        {lede && <p className="nt-fsub">{lede}</p>}
      </>
    );
  };

  const vMarket = () => {
    const name = exchName();
    let ex: React.ReactNode;
    if (isLive) {
      ex = (
        <div>
          <label className="nt-fl" htmlFor="nt-exch">
            Exchange account
          </label>
          <div className={`nt-inp${form.exchange_account ? "" : " warn"}`}>
            <select
              id="nt-exch"
              value={form.exchange_account}
              aria-invalid={form.exchange_account ? undefined : true}
              aria-describedby="nt-exch-help"
              onChange={(e) => set("exchange_account", parseInt(e.target.value, 10))}
            >
              <option value={0} disabled>
                {selectableAccounts.length ? "Choose an account" : "No active exchange connected"}
              </option>
              {selectableAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
              {existing?.exchange_account != null &&
                !selectableAccounts.some((a) => a.id === toId(existing.exchange_account)) && (
                  <option value={toId(existing.exchange_account) ?? 0}>
                    {existing.exchange_name || `Account #${existing.exchange_account}`}
                  </option>
                )}
            </select>
          </div>
          {form.exchange_account ? (
            <p className="nt-hint" id="nt-exch-help">
              Real orders are placed here. <Link className="nt-a" href="/dashboard/exchanges/new">Add an account</Link>
            </p>
          ) : (
            <p className="nt-warn2" id="nt-exch-help">
              <em>&#9679;</em>
              <span>
                {accountOptions.length && !selectableAccounts.length
                  ? "None of your exchange accounts are active, so none can place a live order. "
                  : "A live trade needs an exchange account: choose the one its real orders go to. "}
                <Link className="nt-a" href="/dashboard/exchanges">
                  {accountOptions.length ? "Check your exchanges" : "Add an account"}
                </Link>
              </span>
            </p>
          )}
          {fieldMsg("exchange_account")}
        </div>
      );
    } else if (!exOpen) {
      ex = (
        <div>
          <span className="nt-fl">Prices from</span>
          <div className="nt-static">
            <span>
              <b>{name}</b> · {form.exchange_account ? "your account" : "no account needed"}
            </span>
            <button
              type="button"
              className="nt-mini"
              onClick={() => {
                setExOpen(true);
                setTimeout(() => focusField("nt-exch"), 0);
              }}
            >
              Change
            </button>
          </div>
          <p className="nt-hint">A demo trade needs no exchange account or keys.</p>
          {fieldMsg("exchange_account")}
        </div>
      );
    } else {
      ex = (
        <div>
          <label className="nt-fl" htmlFor="nt-exch">
            Exchange account <em>optional on demo</em>
          </label>
          <div className="nt-inp">
            <select
              id="nt-exch"
              value={form.exchange_account}
              onChange={(e) => set("exchange_account", parseInt(e.target.value, 10))}
            >
              <option value={0}>None · {DEMO_VENUE} prices, no keys</option>
              {selectableAccounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </div>
          <p className="nt-hint">A demo trade needs no exchange account or keys.</p>
          {fieldMsg("exchange_account")}
        </div>
      );
    }

    return (
      <>
        {head(0, "What to trade", "Candleweb watches this market and sends every closed candle to whoever decides.")}
        <div className="nt-stack">
          {!editing && (
            <div>
              <span className="nt-fl" id="nt-l-start">
                Start from
              </span>
              <div className="nt-picks" role="group" aria-labelledby="nt-l-start">
                <button
                  type="button"
                  className={`nt-pk${copiedFrom ? "" : " on7"}`}
                  aria-pressed={!copiedFrom}
                  onClick={startBlank}
                >
                  New setup
                </button>
                {copySource && (
                  <button
                    type="button"
                    className={`nt-pk${copiedFrom ? " on7" : ""}`}
                    aria-pressed={!!copiedFrom}
                    onClick={() => copyTrade(copySource)}
                  >
                    Copy &ldquo;{tradeTitle(copySource)}&rdquo;
                  </button>
                )}
              </div>
              <p className="nt-hint">
                {copySource
                  ? "Copying one of your trades fills every step and takes you straight to review."
                  : "Once you have a trade, you can copy it here: every step filled, straight to review."}
              </p>
            </div>
          )}
          <div>
            <span className="nt-fl">Environment</span>
            <div className="nt-env one">
              <div className={`nt-eb sel3${isLive ? " live8" : ""}`}>
                <b>{isLive ? "Live" : "Demo"}</b>
                <span>{isLive ? "Real orders, real money" : "Paper money, live prices"}</span>
              </div>
            </div>
            <p className="nt-envnote">
              {isLive ? (
                <>
                  <em>Real orders.</em> Candleweb places them on the exchange account you choose below,
                  inside the limits you set, and the trade stays Live.
                </>
              ) : (
                <>
                  Runs on your paper account: demo funds, real market prices, no real money. It stays Demo.
                </>
              )}{" "}
              {editing ? (
                "A trade’s Demo or Live mode is fixed when it is created."
              ) : (
                <>
                  New trades follow the Demo/Live switch in{" "}
                  <Link className="nt-a" href="/dashboard/settings">
                    Settings
                  </Link>
                  .
                </>
              )}
            </p>
          </div>
          <div className="nt-fr two2">
            <div>
              <label className="nt-fl" htmlFor="nt-pair">
                Pair
              </label>
              <div className="nt-inp">
                <select id="nt-pair" value={form.pair} onChange={(e) => set("pair", parseInt(e.target.value, 10))}>
                  {!form.pair && (
                    <option value={0} disabled>
                      {pairOptions.length ? "Pick a pair" : "Loading pairs…"}
                    </option>
                  )}
                  {pairOptions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                  {existing && !pairOptions.some((p) => p.id === toId(existing.pair)) && (
                    <option value={toId(existing.pair) ?? 0}>{existing.pair_name || `Pair #${existing.pair}`}</option>
                  )}
                </select>
              </div>
              {fieldMsg("pair")}
            </div>
            {ex}
          </div>
          <div>
            <span className="nt-fl" id="nt-l-tf">
              Timeframe
            </span>
            <div className="nt-picks" role="group" aria-labelledby="nt-l-tf">
              {TIMEFRAMES.concat(
                TIMEFRAMES.includes(form.timeframe) ? [] : [form.timeframe],
              ).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`nt-pk${form.timeframe === k ? " on7" : ""}`}
                  aria-pressed={form.timeframe === k}
                  onClick={() => set("timeframe", k)}
                >
                  {k}
                </button>
              ))}
            </div>
            <p className="nt-hint">
              The decider is called once per closed candle:{" "}
              <b>about {(TF_CALLS[form.timeframe] || 0).toLocaleString("en-US")} calls a day</b>. A limit entry it
              names waits up to 5 candles ({TF_WAIT[form.timeframe]}) for its price, then it&rsquo;s cancelled.
            </p>
            {fieldMsg("timeframe")}
          </div>
        </div>
      </>
    );
  };

  const vMoney = () => {
    const mine = free != null ? Math.min(alloc, free) : 0;
    const tot = bal.total || 1;
    const stillFree = free != null ? Math.max(0, free - alloc) : 0;
    const balCard =
      bal.total == null ? (
        <div className="nt-bal cold">
          <div className="nt-balh">
            <b>{bal.label}</b>
            <span className="nt-live stale">
              <i />
              <span>{bal.plans ? "No plan yet" : bal.needAccount ? "No account yet" : "Not available yet"}</span>
            </span>
          </div>
          <div className="nt-balgrid">
            <div className="nt-bg1">
              <span>Total</span>
              <b title={bal.reason}>—</b>
            </div>
            <div className="nt-bg1">
              <span>Other trades</span>
              <b>{bal.other ? usd(bal.other) : "—"}</b>
            </div>
            <div className="nt-bg1">
              <span>Free to allocate</span>
              <b>—</b>
            </div>
          </div>
          <p className="nt-warn2">
            <em>&#9679;</em>
            <span>
              {bal.reason}{" "}
              {bal.plans ? (
                <Link className="nt-a" href="/dashboard/subscription">
                  See plans
                </Link>
              ) : bal.needAccount ? (
                <button type="button" className="nt-a" onClick={() => go(0)}>
                  Choose the account
                </button>
              ) : null}
            </span>
          </p>
        </div>
      ) : (
        <div className="nt-bal">
          <div className="nt-balh">
            <b>{bal.label}</b>
            <span className={`nt-live${isLive ? "" : " sim"}`}>
              <i />
              <span>{isLive ? "Live balance" : "Paper account"}</span>
            </span>
          </div>
          <div className="nt-balgrid">
            <div className="nt-bg1">
              <span>Total</span>
              <b>{usd(bal.total)}</b>
            </div>
            <div className="nt-bg1">
              <span>{isLive ? "Other live trades" : "Other demo trades"}</span>
              <b>{usd(bal.other)}</b>
            </div>
            <div className="nt-bg1">
              <span>Still free</span>
              <b className={over ? "over4" : "free4"}>{usd(stillFree)}</b>
            </div>
          </div>
          <div
            className="nt-balbar"
            role="img"
            aria-label={`Other trades ${usd(bal.other)}, this trade ${usd(alloc)}, still free ${usd(stillFree)}`}
          >
            <i className="o5" style={{ width: `${Math.min(100, (bal.other / tot) * 100)}%` }} />
            <i
              className={over ? "x5" : "t5"}
              style={{ width: `${Math.min(100, ((over ? free ?? 0 : mine) / tot) * 100)}%` }}
            />
          </div>
          <div className="nt-ballab">
            <span>
              <i className="k4" />
              Other trades
            </span>
            <span>
              <i className="k5" />
              This trade · <b>{usd(alloc)}</b>
            </span>
            <span>
              <i className="k6" />
              Free
            </span>
          </div>
        </div>
      );

    const noFree = free == null;
    const amtMsg =
      free == null
        ? isLive
          ? form.exchange_account
            ? "In USDT. Candleweb checks it against the account when the trade is saved."
            : "Choose the exchange account first to see what is free."
          : noPlan
            ? "Your demo balance opens when you choose a plan."
            : "In USDT. You can raise or lower it later without stopping the trade."
        : over
          ? `That is more than the ${usd(free)} you have free. Lower it, or free up money from another trade.`
          : "In USDT, from your free balance. You can raise or lower it later without stopping the trade.";

    return (
      <>
        {head(
          1,
          "Money and limits",
          `Capital set aside for this trade, and the limits Candleweb enforces on it whatever ${who} asks for.`,
        )}
        <div className="nt-stack">
          {balCard}
          <div>
            <label className="nt-fl" htmlFor="nt-amt">
              Amount allocated <em>USDT</em>
            </label>
            <div className="nt-amt">
              <div className={`nt-inp nt-amtw${over ? " bad" : ""}`}>
                <span className="cur4" aria-hidden="true">
                  $
                </span>
                <input
                  id="nt-amt"
                  type="text"
                  inputMode="decimal"
                  autoComplete="off"
                  placeholder="0.00"
                  value={form.allocated_amount}
                  aria-invalid={over}
                  aria-describedby="nt-amt-msg"
                  onChange={(e) => set("allocated_amount", e.target.value.replace(/[^\d.,]/g, ""))}
                />
              </div>
              <div className="qs">
                {[25, 50, 75].map((p) => (
                  <button key={p} type="button" className="nt-mini" disabled={noFree} onClick={() => fillPct(p)}>
                    {p}%
                  </button>
                ))}
                <button type="button" className="nt-mini" disabled={noFree} onClick={() => fillPct(100)}>
                  Max
                </button>
              </div>
            </div>
            <p className={`nt-hint${over ? " badt" : ""}`} id="nt-amt-msg" aria-live="polite">
              {amtMsg}
            </p>
            {fieldMsg("allocated_amount")}
          </div>
          <div className="nt-sw boxed">
            <div className="tx">
              <b id="nt-l-reinvest">Reinvest profits</b>
              <span>Grow this trade&rsquo;s size with its own profits. Off: it trades at most its allocation.</span>
            </div>
            <button
              type="button"
              role="switch"
              className={`nt-tg${form.reinvest_profits ? "" : " off4"}`}
              aria-checked={form.reinvest_profits}
              aria-labelledby="nt-l-reinvest"
              onClick={() => set("reinvest_profits", !form.reinvest_profits)}
            />
          </div>
          {fieldMsg("reinvest_profits")}
          <div>
            <span className="nt-fl" id="nt-l-preset">
              Limits
            </span>
            <p className="nt-hint" style={{ margin: "0 0 12px" }}>
              Shares of this trade&rsquo;s capital, not your whole balance.
            </p>
            <div className="nt-env four" role="group" aria-labelledby="nt-l-preset">
              {PRESET_KEYS.map((k) => {
                const p = PRESETS[k];
                const on = preset === k;
                return (
                  <button
                    key={k}
                    type="button"
                    className={`nt-eb${on ? " sel3" : ""}`}
                    aria-pressed={on}
                    onClick={() => choosePreset(k)}
                  >
                    <b>{p ? p.label : "Custom"}</b>
                    <span>{p ? `${p.risk}% loss · ${p.size}% size` : "Set each one"}</span>
                  </button>
                );
              })}
            </div>
            <div className="nt-sldout" style={{ marginTop: 12 }}>
              {alloc ? (
                <>
                  Each position uses at most <b>{usd((alloc * form.max_size_pct) / 100)}</b> ({form.max_size_pct}%). If
                  its stop is hit, it loses at most about <b>{usd((alloc * form.risk_pct) / 100)}</b> (
                  {fmtPct(form.risk_pct)}), fees included.
                </>
              ) : (
                <>
                  Each position uses at most <b>{form.max_size_pct}%</b> of the trade&rsquo;s capital, and loses at most{" "}
                  <b>{fmtPct(form.risk_pct)}</b> if its stop is hit, fees included.
                </>
              )}
              {form.reinvest_profits ? " Both grow as the trade reinvests its profits." : ""}
            </div>
            <button
              type="button"
              className="nt-disc"
              aria-expanded={adjustOpen}
              aria-controls="nt-adjust"
              style={{ marginTop: 6 }}
              onClick={() => setAdjustOpen((v) => !v)}
            >
              <span className="chev" aria-hidden="true" />
              Adjust each limit
            </button>
            <div className="nt-adjust" id="nt-adjust" hidden={!adjustOpen}>
              <div className="nt-fr two2">
                <div>
                  <label className="nt-fl" htmlFor="nt-risk">
                    Lose at most this much if a stop is hit
                  </label>
                  <div className="nt-sld">
                    <div className="nt-sldtop">
                      <span className={`nt-sldval${form.risk_pct > 5 ? " hot4" : ""}`}>
                        {form.risk_pct.toFixed(1)}%<em>of the trade&rsquo;s capital</em>
                      </span>
                      <span className="nt-sldcash">{alloc ? `≈ ${usd((alloc * form.risk_pct) / 100)}` : ""}</span>
                    </div>
                    <input
                      id="nt-risk"
                      type="range"
                      min={RISK_MIN}
                      max={RISK_MAX}
                      step={0.1}
                      value={form.risk_pct}
                      aria-describedby="nt-risk-hint"
                      style={
                        {
                          ["--p" as any]: `${((form.risk_pct - RISK_MIN) / (RISK_MAX - RISK_MIN)) * 100}%`,
                        } as React.CSSProperties
                      }
                      onChange={(e) => {
                        const r = Math.round(parseFloat(e.target.value) * 10) / 10;
                        set("risk_pct", r);
                        setPreset(matchPreset(r, form.max_size_pct));
                      }}
                    />
                    <div className="nt-sldscale" aria-hidden="true">
                      <span>0.1%</span>
                      <span>5%</span>
                      <span>10%</span>
                      <span>15%</span>
                      <span>20%</span>
                      <span>25%</span>
                    </div>
                  </div>
                  <p className="nt-hint" id="nt-risk-hint">
                    Of this trade&rsquo;s capital, fees included.
                  </p>
                  {fieldMsg("risk_pct")}
                </div>
                <div>
                  <label className="nt-fl" htmlFor="nt-size">
                    Use at most this much per position
                  </label>
                  <div className="nt-inp">
                    <select
                      id="nt-size"
                      value={form.max_size_pct}
                      onChange={(e) => {
                        const s = parseInt(e.target.value, 10);
                        set("max_size_pct", s);
                        setPreset(matchPreset(form.risk_pct, s));
                      }}
                    >
                      {SIZES.concat(SIZES.includes(form.max_size_pct) ? [] : [form.max_size_pct])
                        .sort((a, b) => a - b)
                        .map((s) => (
                          <option key={s} value={s}>
                            {s}% of the trade&rsquo;s capital
                          </option>
                        ))}
                    </select>
                  </div>
                  <p className="nt-hint">A hard ceiling on any one position.</p>
                  <div className="nt-sldout" style={{ marginTop: 12 }}>
                    {alloc ? (
                      <>
                        A full-size position comes to <b>{usd((alloc * form.max_size_pct) / 100)}</b>.
                      </>
                    ) : (
                      "Set an amount and this shows what a full-size position comes to."
                    )}
                  </div>
                  {fieldMsg("max_size_pct")}
                </div>
              </div>
              <p className="nt-hint" style={{ margin: 0 }}>
                You don&rsquo;t set the stop. Candleweb places it from the market, a multiple of the recent price range
                on {form.timeframe} candles and never closer than 0.75%, then sizes each position so a stopped-out loss
                fits your limit. On smaller trades, the size limit usually decides.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  };

  const vDecider = () => {
    let body: React.ReactNode = null;
    if (!aiDecides) {
      body = (
        <div>
          <span className="nt-fl" id="nt-l-bot">
            Bot
          </span>
          {bots.length ? (
            <ul className="nt-bots" aria-labelledby="nt-l-bot">
              {bots.map((x) => {
                const last = lastTradeOf(x.id);
                const sel = form.bot === x.id;
                return (
                  <li key={x.id}>
                    <button
                      type="button"
                      className={`nt-bot${sel ? " sel" : ""}`}
                      aria-pressed={sel}
                      onClick={() => pickBot(x.id)}
                    >
                      <span className="bn">
                        <b>{x.name}</b>
                        <small>via {platformLabel(x.platform)}</small>
                      </span>
                      <span className="br">
                        {x.status === "PAUSED" && <span className="nt-dchip">Paused</span>}
                        {x.status === "FAILING" && <span className="nt-dchip hot9">Failing</span>}
                        <small>{last ? `last used on ${tradeTitle(last)}` : "no trades yet"}</small>
                      </span>
                      <span className="nt-ck" aria-hidden="true">
                        &#10003;
                      </span>
                    </button>
                  </li>
                );
              })}
              {form.bot != null && !bots.some((b) => b.id === form.bot) && (
                <li>
                  <button type="button" className="nt-bot sel" aria-pressed="true">
                    <span className="bn">
                      <b>{botName || `Bot #${form.bot}`}</b>
                      <small>assigned to this trade</small>
                    </span>
                    <span className="br" />
                    <span className="nt-ck" aria-hidden="true">
                      &#10003;
                    </span>
                  </button>
                </li>
              )}
            </ul>
          ) : (
            <p className="nt-warn2" style={{ marginTop: 0 }}>
              <em>&#9679;</em>
              <span>No bots connected yet. Connect one, or let CandleAI decide.</span>
            </p>
          )}
          {bot?.status === "PAUSED" && (
            <p className="nt-warn2">
              <em>&#9679;</em>
              <span>
                <b>{bot.name}</b> is paused. The trade can start, but Candleweb refuses the bot&rsquo;s key until you
                resume it from My bots.
              </span>
            </p>
          )}
          <Link className="nt-disc" href="/dashboard/bots/new" style={{ marginTop: 6 }}>
            + Connect a new bot
          </Link>
          {fieldMsg("bot")}
        </div>
      );
    } else if (aiLocked) {
      body = (
        <div className="nt-aibox">
          <b>CandleAI is part of Builder and Desk</b>
          <p>
            Your {planName} plan can&rsquo;t create a CandleAI trade. Upgrade to use it, or let your own bot decide.
          </p>
          <div className="acts">
            <Link className="nt-mini" href="/dashboard/subscription">
              See plans
            </Link>
            <button
              type="button"
              className="nt-mini go"
              onClick={() => {
                set("decider_type", "OWN_BOT");
                setTimeout(() => focusField("nt-dc-own"), 0);
              }}
            >
              Use my own bot
            </button>
          </div>
        </div>
      );
    } else {
      body = (
        <div className="nt-sldout">
          CandleAI decides once per market, so every CandleAI trade on{" "}
          <b>
            {pairName} · {form.timeframe}
          </b>{" "}
          acts on the same decision. This trade&rsquo;s money, limits, confidence bar and exits are its own.
        </div>
      );
    }

    return (
      <>
        {head(2, "Who decides", "Either your own bot, or ours. Everything after the decision works the same way.")}
        <div className="nt-stack">
          <div className="nt-reach2" role="group" aria-label="Who decides">
            <button
              type="button"
              id="nt-dc-own"
              className={`nt-rc2${!aiDecides ? " sel" : ""}`}
              aria-pressed={!aiDecides}
              onClick={() => set("decider_type", "OWN_BOT")}
            >
              <span className="nt-ck" aria-hidden="true">
                &#10003;
              </span>
              <span className="kinds">
                <span className="kind4">Your bot</span>
              </span>
              <b>Own bot</b>
              <span className="d">
                Candleweb sends the candle to your endpoint and waits for a decision. Built in n8n, Make, Zapier or
                your own code.
              </span>
              <em>Pull · you host it</em>
            </button>
            <button
              type="button"
              className={`nt-rc2${aiDecides ? " sel" : ""}`}
              aria-pressed={aiDecides}
              onClick={() => set("decider_type", "CANDLEAI")}
            >
              <span className="nt-ck" aria-hidden="true">
                &#10003;
              </span>
              <span className="kinds">
                <span className="kind4">Built in</span>
                {aiLocked && <span className="kind4 lock">Builder · Desk</span>}
              </span>
              <b>CandleAI</b>
              <span className="d">
                Our agent decides for you. No endpoint, no hosting. You still control the money, limits and exits.
              </span>
              <em>{aiLocked ? "Builder and Desk plans" : "Included · no setup"}</em>
            </button>
          </div>
          {fieldMsg("decider_type")}
          {body}
          <div>
            <label className="nt-fl" htmlFor="nt-conf">
              Act on decisions above this confidence
            </label>
            <div className="nt-num">
              <button type="button" className="nt-mini" aria-label="Lower by one" onClick={() => confStep(-1)}>
                −
              </button>
              <div className={`nt-inp${confOk ? "" : " bad"}`}>
                <input
                  id="nt-conf"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={2}
                  required
                  value={form.min_confidence}
                  aria-invalid={!confOk}
                  aria-describedby="nt-conf-help nt-conf-msg"
                  onChange={(e) => set("min_confidence", e.target.value.replace(/\D/g, "").slice(0, 2))}
                />
              </div>
              <button type="button" className="nt-mini" aria-label="Raise by one" onClick={() => confStep(1)}>
                +
              </button>
            </div>
            <p className="nt-hint" id="nt-conf-help">
              {aiDecides ? "CandleAI sends" : "Your bot sends"} a confidence from 0 to 100 with each decision. Candleweb
              only trades on decisions above this number.
            </p>
            <p className={`nt-hint${confOk ? "" : " warnt"}`} id="nt-conf-msg" aria-live="polite">
              {confOk
                ? `At ${confN}, a ${confN} is held and a ${confN + 1} can trade. It applies to a BUY opening a position` +
                  (form.agent_exits
                    ? " and to a SELL closing one, so a high bar can also keep a position open."
                    : `, and to a SELL closing one if you let ${who} close positions in the next step.`)
                : `Required. How confident ${who} must be before a decision is acted on: a whole number from 0 to 99.`}
            </p>
            {fieldMsg("min_confidence")}
          </div>
        </div>
      </>
    );
  };

  const vExits = () => {
    const barN = confOk ? confN : DEFAULT_MIN_CONFIDENCE;
    return (
      <>
        {head(EXITS, "How positions close", "Every position gets a stop the moment it opens. Choose what else may close it.")}
        <div className="nt-stack">
          <div className="nt-reach2" role="group" aria-label="How positions close">
            <button
              type="button"
              className={`nt-rc2${form.agent_exits ? "" : " sel"}`}
              aria-pressed={!form.agent_exits}
              onClick={() => set("agent_exits", false)}
            >
              <span className="nt-ck" aria-hidden="true">
                &#10003;
              </span>
              <span className="kinds">
                <span className="kind4">Stop only</span>
              </span>
              <b>Let winners run</b>
              <span className="d">
                Only the stop or trailing stop closes a position. A SELL from {who} is recorded, not acted on.
              </span>
              <em>Default</em>
            </button>
            <button
              type="button"
              className={`nt-rc2${form.agent_exits ? " sel" : ""}`}
              aria-pressed={form.agent_exits}
              onClick={() => set("agent_exits", true)}
            >
              <span className="nt-ck" aria-hidden="true">
                &#10003;
              </span>
              <span className="kinds">
                <span className="kind4">{aiDecides ? "CandleAI exits" : "Bot exits"}</span>
              </span>
              <b>{aiDecides ? "CandleAI" : "My bot"} can close</b>
              <span className="d">
                A SELL above {barN} confidence closes the position at the market. The stop protects it until then.
              </span>
              <em>Closes at market</em>
            </button>
          </div>
          {fieldMsg("agent_exits")}
          <div className="nt-sw boxed">
            <div className="tx">
              <b id="nt-l-trail">Trailing stop</b>
              <span>
                {form.trailing_stop
                  ? `Follows price in your favour and never moves back. It moves as each ${form.timeframe} candle closes, and to breakeven once the position is up by as much as it risks.`
                  : "Off: the stop stays where Candleweb placed it."}
              </span>
            </div>
            <button
              type="button"
              role="switch"
              className={`nt-tg${form.trailing_stop ? "" : " off4"}`}
              aria-checked={form.trailing_stop}
              aria-labelledby="nt-l-trail"
              onClick={() => set("trailing_stop", !form.trailing_stop)}
            />
          </div>
          {fieldMsg("trailing_stop")}
          {!form.agent_exits && !form.trailing_stop && (
            <div className="nt-aibox">
              <b>Nothing will take profit</b>
              <p>
                With no trailing stop and no SELL exits, a winning position only closes if price falls all the way back
                to its first stop.
              </p>
            </div>
          )}
          {form.agent_exits && !aiDecides && (
            <p className="nt-hint" style={{ margin: 0 }}>
              Your bot&rsquo;s SELLs still need to clear the confidence bar from step 3. HOLD keeps the position open.
            </p>
          )}
        </div>
      </>
    );
  };

  const vData = () => {
    if (aiDecides) {
      return (
        <>
          {head(DATA, "What your bot sees")}
          <div className="nt-sldout">
            CandleAI reads the market with its own indicators and history, so there is nothing to set here.
          </div>
        </>
      );
    }
    let src: React.ReactNode;
    if (indSource === "bot" && botLast && bot)
      src = (
        <>
          Filled from <b>{tradeTitle(botLast)}</b>, the last trade that used <b>{bot.name}</b>. Change them only if its
          prompt reads something else.
        </>
      );
    else if (indSource === "nobotset" && bot)
      src = (
        <>
          <b>{bot.name}</b> has no trades yet, so these are starter picks. Keep the ones its prompt reads.
        </>
      );
    else if (indSource === "saved") src = "The indicators this trade already sends.";
    else if (indSource === "custom")
      src = (
        <>
          Your own picks.
          {botLast && (
            <>
              {" "}
              <button type="button" className="nt-a" onClick={restoreBotSet}>
                Use the set from {tradeTitle(botLast)}
              </button>
            </>
          )}
        </>
      );
    else src = "A starter set. Pick a bot in step 3 and the indicators from its last trade fill this in.";

    return (
      <>
        {head(
          DATA,
          "What your bot sees",
          "Candleweb computes these and sends them alongside the raw candles. Pick what your strategy actually reads; anything else is noise in the payload.",
        )}
        <div className="nt-stack">
          <p className="nt-src">
            <i />
            <span>{src}</span>
          </p>
          <div>
            <span className="nt-fl">
              Indicators <em>· {form.indicators.length} selected</em>
            </span>
            {form.indicators.length ? (
              <div className="nt-picks">
                {form.indicators.map((n) => {
                  const gone = staleIndicators.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      className={`nt-pk on7 rm${mtfOff.includes(n) ? " hot" : ""}${gone ? " gone" : ""}`}
                      aria-label={`Remove ${indName(n)}`}
                      onClick={() => setIndicators(form.indicators.filter((x) => x !== n))}
                    >
                      {gone ? n : indName(n)}
                      <span aria-hidden="true">&times;</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="nt-warn2" style={{ marginTop: 0 }}>
                <em>&#9679;</em>
                <span>No indicators yet. Your bot would only get raw candles.</span>
              </p>
            )}
            <div style={{ marginTop: 12 }}>
              <button type="button" className="nt-mini" id="nt-open-drawer" onClick={() => setDrawer(true)}>
                Edit indicators
              </button>
            </div>
            {staleIndicators.length > 0 && (
              <p className="nt-warn2 bad5">
                <em>&#9679;</em>
                <span>
                  {staleIndicators.join(", ")} {staleIndicators.length === 1 ? "is" : "are"} no longer available. Remove{" "}
                  {staleIndicators.length === 1 ? "it" : "them"} before saving.
                </span>
              </p>
            )}
            {mtfOff.length > 0 && (
              <p className="nt-warn2">
                <em>&#9679;</em>
                <span>
                  Multi-timeframe readings are meant for 1m trades only. Remove {mtfOff.map(indName).join(", ")}, or set
                  the timeframe to 1m.
                </span>
              </p>
            )}
            {form.indicators.length > 8 && (
              <p className="nt-warn2">
                <em>&#9679;</em>
                <span>
                  Three to eight is plenty for most bots. More values make each call longer without making the decision
                  better.
                </span>
              </p>
            )}
            <p className="nt-hint">
              Windows count this trade&rsquo;s own candles: RSI (14) on {form.timeframe} covers 14{" "}
              {TF_WORD[form.timeframe]} candles.
            </p>
            {fieldMsg("indicators")}
          </div>
          <div className="nt-fr two2">
            <div>
              <label className="nt-fl" htmlFor="nt-hist">
                Candle history sent
              </label>
              <div className="nt-inp">
                <select
                  id="nt-hist"
                  value={form.candle_history_len}
                  onChange={(e) => set("candle_history_len", parseInt(e.target.value, 10))}
                >
                  {HISTORY_OPTIONS.concat(
                    HISTORY_OPTIONS.includes(form.candle_history_len) ? [] : [form.candle_history_len],
                  )
                    .sort((a, b) => a - b)
                    .map((n) => (
                      <option key={n} value={n}>
                        {n} candles
                      </option>
                    ))}
                </select>
              </div>
              <p className="nt-hint">
                How much context arrives with each call. More history means a bigger payload, not a better decision.
              </p>
              {fieldMsg("candle_history_len")}
            </div>
          </div>
        </div>
      </>
    );
  };

  const blockItem = (x: Blocker, i: number) => (
    <li key={i}>
      <button
        type="button"
        className="nt-a"
        onClick={() => (x.focus ? focusField(x.focus) : go(x.s ?? 0))}
      >
        {x.t}
      </button>
    </li>
  );

  /* Server refusals on fields that have no input of their own here. */
  const looseErrors = Object.entries(fieldErrors).filter(([k, v]) => v && FIELD_STEP[k] == null);

  const vReview = () => {
    const indList = form.indicators.length ? form.indicators.map(indName).join(", ") : "no indicators";
    const items: { s: number; h: React.ReactNode }[] = [
      {
        s: 1,
        h: (
          <>
            {alloc ? (
              <>
                Set aside <b>{usd(alloc)}</b> of your {isLive ? "live" : "demo"} balance for this trade.{" "}
              </>
            ) : (
              "Set aside an amount you haven’t chosen yet. "
            )}
            {form.reinvest_profits
              ? "It grows with its own profits; losses shrink it either way."
              : "It never trades more than that."}
          </>
        ),
      },
      {
        s: 0,
        h: (
          <>
            Watch <b>{pairName}</b> at {exchName() || "an exchange you haven’t chosen"}&rsquo;s prices and close a{" "}
            <b>{form.timeframe}</b> candle about {(TF_CALLS[form.timeframe] || 0).toLocaleString("en-US")} times a day.
          </>
        ),
      },
      aiDecides
        ? {
            s: 2,
            h: (
              <>
                Take <b>CandleAI</b>&rsquo;s decision for {pairName} · {form.timeframe}. It decides once per market for
                every CandleAI trade on it.
              </>
            ),
          }
        : {
            s: DATA,
            h: (
              <>
                Send each closed candle to <b>{botName || "your bot (not picked yet)"}</b> with {indList} and the last{" "}
                {form.candle_history_len} candles.
              </>
            ),
          },
      {
        s: 2,
        h: confOk ? (
          <>
            Act only on decisions above <b>{confN}</b> confidence: BUYs to open
            {form.agent_exits ? " and SELLs to close" : ""}. Positions are spot and long only.
          </>
        ) : (
          "Act only on decisions above a confidence bar you haven’t set yet."
        ),
      },
      {
        s: 1,
        h: alloc ? (
          <>
            Use up to <b>{usd((alloc * form.max_size_pct) / 100)}</b> ({form.max_size_pct}%) per position, with a stop
            Candleweb places from the market, so a stopped-out position loses at most about{" "}
            <b>{usd((alloc * form.risk_pct) / 100)}</b> ({fmtPct(form.risk_pct)}), fees included.
          </>
        ) : (
          `Use up to ${form.max_size_pct}% of the capital per position, losing at most ${fmtPct(form.risk_pct)} if a stop is hit.`
        ),
      },
      {
        s: EXITS,
        h: (
          <>
            {form.agent_exits
              ? `Close a position when ${who} sends a confident SELL, at the market. Until then, the stop protects it.`
              : `Close positions only by their stop${form.trailing_stop ? " or trailing stop, letting winners run." : "."} A SELL from ${who} is recorded, not acted on.`}
            {form.trailing_stop
              ? " The stop trails price and moves to breakeven once a position is up by as much as it risks."
              : ""}
          </>
        ),
      },
      {
        s: 0,
        h: isLive ? (
          <>
            Place <b>real orders</b> on {form.exchange_account ? exchName() : "the exchange account you choose"}.
          </>
        ) : (
          <>
            Fill every order <b>on paper</b> at the live price. Nothing reaches an exchange.
          </>
        ),
      },
    ];

    return (
      <>
        {head(LAST, "Review and start", "This is exactly what Candleweb will do on your behalf, in the order it happens.")}
        <div className="nt-stack">
          {copiedFrom && (
            <div className="nt-sldout ok">
              Copied from <b>{tradeTitle(copiedFrom)}</b>. Check each line, then start.
            </div>
          )}
          <div className="nt-rv2">
            <div className="rh2">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <b>Before you start it</b>
            </div>
            <ol className="nt-plan">
              {items.map((it, i) => (
                <li key={i}>
                  <span>{it.h}</span>
                  <button
                    type="button"
                    className="nt-edit"
                    aria-label={`Edit: ${STEPS[it.s]}`}
                    onClick={() => go(it.s)}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="nt-rvblock">
            {createErrors.length > 0 && (
              <div className="nt-aibox">
                <b>Before you can save</b>
                <ul>{createErrors.map(blockItem)}</ul>
              </div>
            )}
            {startBlockers.length > 0 && (
              <div className="nt-aibox">
                <b>Before you can start</b>
                <ul>{startBlockers.map(blockItem)}</ul>
              </div>
            )}
            {looseErrors.length > 0 && (
              <div className="nt-aibox">
                <b>The server refused this setup</b>
                <ul>
                  {looseErrors.map(([k, v]) => (
                    <li key={k}>
                      {k.replace(/_/g, " ")}: {v}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="nt-fr two2">
            <div>
              <label className="nt-fl" htmlFor="nt-name">
                Trade name <em>optional</em>
              </label>
              <div className={`nt-inp${nameDup || fieldErrors.name ? " bad" : ""}`}>
                <input
                  id="nt-name"
                  type="text"
                  autoComplete="off"
                  maxLength={100}
                  placeholder={autoName}
                  value={form.name}
                  aria-invalid={!!nameDup}
                  aria-describedby="nt-name-msg"
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <p className={`nt-hint${nameDup ? " badt" : ""}`} id="nt-name-msg" aria-live="polite">
                {nameDup ? (
                  <>You already have a trade called &ldquo;{nameDup}&rdquo;. Pick another name.</>
                ) : (
                  <>
                    How it appears in your lists. Leave it blank and it&rsquo;s listed as <code>{autoName}</code>.
                    {form.name.length > 80 ? ` ${form.name.length} of 100 characters.` : ""}
                  </>
                )}
              </p>
              {fieldMsg("name")}
            </div>
          </div>
        </div>
      </>
    );
  };

  const vActions = () => {
    if (step === LAST) {
      const canSave = !createErrors.length && !busy && !previewing;
      const canStart = canSave && !startBlockers.length;
      const running = editing && existing?.status === "ACTIVE";
      let note: React.ReactNode = null;
      if (previewing)
        note = (
          <>
            <b>Previewing as {effPlan ? PLANS[effPlan].label : "another plan"} · {isLive ? "Live" : "Demo"}.</b>{" "}
            Saving uses your real plan and Settings switch, so it&rsquo;s off while you preview.{" "}
            <button type="button" className="nt-a" onClick={resetPreview}>
              Back to my account
            </button>
          </>
        );
      else if (createErrors.length)
        note = (
          <>
            <b>Before you can save:</b> {createErrors.map((x) => low(x.t)).join(", ")}.
          </>
        );
      else if (startBlockers.length && !running)
        note = (
          <>
            <b>Before you can start:</b> {startBlockers.map((x) => low(x.t).replace(/\.$/, "")).join(", ")}.{" "}
            {editing ? "Saving works now: the setup is kept, nothing runs." : "Saving as paused works now: the setup is kept, nothing runs."}
          </>
        );
      else if (running) note = "This trade is running. Saving applies the changes from its next candle.";

      return (
        <>
          <div className="nt-actions">
            {running ? (
              <button type="button" className="nt-cta main2" disabled={!canSave} onClick={onSaveChanges}>
                {busy === "save" ? "Saving…" : "Save changes"}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="nt-cta ghost2"
                  disabled={!canSave}
                  onClick={editing ? onSaveChanges : onSavePaused}
                >
                  {busy === "save" ? "Saving…" : editing ? "Save changes" : "Save as paused"}
                </button>
                <button
                  type="button"
                  className={`nt-cta ${isLive ? "live6" : "main2"}`}
                  disabled={!canStart}
                  onClick={onStart}
                >
                  {busy === "start"
                    ? "Starting…"
                    : editing
                      ? isLive
                        ? "Save and start live"
                        : "Save and start"
                      : isLive
                        ? "Start live trading"
                        : "Start trading"}
                </button>
              </>
            )}
          </div>
          {note && <p className="nt-note3">{note}</p>}
        </>
      );
    }
    const toReview = nextStep() === LAST;
    return (
      <div className="nt-actions">
        {step > 0 && (
          <button type="button" className="nt-cta ghost2 back" onClick={() => go(prevStep())}>
            Back
          </button>
        )}
        <button type="button" className="nt-cta main2" onClick={() => go(nextStep())}>
          {toReview ? "Review" : "Continue"}
        </button>
      </div>
    );
  };

  const views = [vMarket, vMoney, vDecider, vExits, vData, vReview];

  /* ---------------- dialogs ---------------- */

  const epRow = (method: "GET" | "POST" | "", title: string, sub: string, value: string, id: string, secret?: boolean) => (
    <div className="nt-ep2">
      <div className="eh2">
        {method && <span className={`nt-mv ${method === "GET" ? "g4" : "p4"}`}>{method}</span>}
        <b>{title}</b>
        <small>{sub}</small>
      </div>
      <div className="eb2">
        <code>{secret && !keyShown ? (value.length > 11 ? `${value.slice(0, 11)}${"•".repeat(14)}` : value) : value}</code>
        {secret && (
          <button type="button" className="nt-mini" aria-pressed={keyShown} onClick={() => setKeyShown((v) => !v)}>
            {keyShown ? "Hide" : "Show"}
          </button>
        )}
        <button type="button" className="nt-mini" onClick={() => copyValue(id, value)}>
          {copied === id ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );

  const doneDialog = () => {
    if (!done || !doneTrade) return null;
    const started = done.kind === "started";
    const t = doneTrade;
    const tLive = t.mode ? String(t.mode).toUpperCase() === "LIVE" : isLive;
    const nm = tradeTitle(t);
    const ai = t.decider_type === "CANDLEAI";
    const bName = doneBot?.name || t.bot_name || null;
    const whoGets = ai ? "CandleAI decides on it" : bName ? `${bName} gets it` : "your bot gets it";
    const amount = parseFloat(t.allocated_amount) || 0;
    const hasLinks = !!(t.candles_url || t.decision_url);
    return (
      <Dialog
        open
        onClose={closeDone}
        labelledBy="nt-dn-title"
        icon={CHECK}
        title={started ? "Your trade is running" : `${nm} is saved`}
        subtitle={
          started
            ? `${nm} · ${tLive ? `real orders on ${t.exchange_name || exchName() || "your exchange"}` : "paper fills, live prices"}`
            : "Paused · nothing runs until you start it from My trades"
        }
        footer={
          <>
            <button type="button" className="fx-cta ghost2" onClick={resetAll}>
              Set up another
            </button>
            <Link className="fx-cta main2" href={`/dashboard/trades/${t.id}`} data-autofocus>
              Open trade
            </Link>
          </>
        }
      >
        <div className="nt-root">
          {started && (
            <div className="nt-count">
              <span>First decision in</span>
              <b>{count.left}</b>
              <p>
                At {count.at}, when the current {t.timeframe} candle closes, {whoGets}.
              </p>
            </div>
          )}
          {!ai && hasLinks && (
            <>
              <h3 className="nt-h3">Connect {bName || "your bot"}</h3>
              <p className="nt-hint" style={{ margin: "0 0 12px" }}>
                Paste these into its {doneBot ? platformLabel(doneBot.platform) : ""} workflow. The two links belong to
                this trade; the key belongs to the bot.
              </p>
              {t.candles_url &&
                epRow("GET", "Pull candles", "Returns the candles and the indicators you picked.", t.candles_url, "pull")}
              {t.decision_url &&
                epRow("POST", "Send decisions", "Your bot posts BUY, SELL or HOLD here.", t.decision_url, "dec")}
              {doneBot?.dev_key ? (
                epRow("", "Developer key", "Anyone holding it can post decisions as this bot.", doneBot.dev_key, "key", true)
              ) : (
                <div className="nt-ep2">
                  <div className="eh2">
                    <b>Developer key</b>
                    <small>Anyone holding it can post decisions as this bot.</small>
                  </div>
                  <div className="eb2">
                    <code>— loading the bot&rsquo;s key —</code>
                  </div>
                </div>
              )}
              <p className="nt-epnote">
                <b>Note.</b> Send the key on both calls in the <code>X-Candleweb-Key</code> header. Each answer needs a{" "}
                <code>decision</code> (BUY, SELL or HOLD), a <code>confidence</code> from 0 to 100 and a{" "}
                <code>risk</code> (LOW, MEDIUM or HIGH). When there&rsquo;s nothing to do, send HOLD: silence counts as
                a missed candle.
              </p>
              {doneBot?.status === "PAUSED" && (
                <p className="nt-warn2">
                  <em>&#9679;</em>
                  <span>
                    <b>{doneBot.name}</b> is paused, so Candleweb refuses its key. Resume it from My bots before it can
                    decide.
                  </span>
                </p>
              )}
              <details className="nt-more">
                <summary>Field names in each candle</summary>
                <p>Your bot&rsquo;s prompt can refer to the indicators by these names.</p>
                <div className="nt-codebox">
                  {indicatorChips(t.indicators).join(", ") || "Raw candles only"}
                </div>
              </details>
            </>
          )}
          {!ai && !hasLinks && (
            <p className="nt-dwarn">
              No bot is assigned yet. Its links and key appear on the trade&rsquo;s page once you assign one.
            </p>
          )}
          <div className="nt-dchips">
            <span className={`nt-dchip ${tLive ? "hot9" : "hi9"}`}>{tLive ? "Live" : "Demo"}</span>
            <span className="nt-dchip">
              {t.pair_name || pairName} · {t.timeframe}
            </span>
            <span className="nt-dchip">{ai ? "CandleAI" : bName || "No bot yet"}</span>
            <span className="nt-dchip">{t.agent_exits ? "Bot can close" : "Let winners run"}</span>
            {amount > 0 && <span className="nt-dchip">{usd(amount)}</span>}
            {(t.reinvest_profits ?? form.reinvest_profits) && (
              <span className="nt-dchip hi9">Reinvests profits</span>
            )}
          </div>
        </div>
      </Dialog>
    );
  };

  const confirmDialog = () => (
    <Dialog
      open={confirm}
      onClose={() => setConfirm(false)}
      tone="amber"
      labelledBy="nt-cf-title"
      icon={WARN}
      title="Start live trading?"
      subtitle={`Real orders on ${exchName() || "your exchange"} · ${pairName} · ${form.timeframe}`}
      footer={
        <>
          <button type="button" className="fx-cta ghost2" data-autofocus onClick={() => setConfirm(false)}>
            Not yet
          </button>
          <button type="button" className="fx-cta live6" disabled={!!busy} onClick={doStart}>
            Start live trading
          </button>
        </>
      }
    >
      <div className="nt-root">
        <div className="nt-dfacts">
          <div className="nt-dfact">
            <span>Allocated</span>
            <b>{usd(alloc)}</b>
          </div>
          <div className="nt-dfact">
            <span>Per position</span>
            <b>up to {usd((alloc * form.max_size_pct) / 100)}</b>
          </div>
          <div className="nt-dfact">
            <span>Loss if stopped</span>
            <b>≈ {usd((alloc * form.risk_pct) / 100)}</b>
          </div>
          <div className="nt-dfact">
            <span>Exits</span>
            <b>{form.agent_exits ? "Bot can close" : "Stop only"}</b>
          </div>
        </div>
        <p className="nt-dwarn">
          Candleweb can&rsquo;t undo a filled order. You can pause the trade whenever you like: pausing stops new
          decisions, it doesn&rsquo;t close a position that is already open.
        </p>
      </div>
    </Dialog>
  );

  /* ---------------- page ---------------- */

  const pageTitle = editing ? "Edit trade" : "New trade";

  function resetPreview() {
    setPvPlan(null);
    setPvMode(null);
  }

  const choosePvPlan = (k: PlanKey) => {
    setPvPlan(k);
    /* A plan without live trading keeps the Settings switch on Demo. */
    if (!PLANS[k].live && !modeFixed) setPvMode("demo");
  };

  const pvLiveAllowed = effPlan ? PLANS[effPlan].live : true;
  const pvSummary = `${effPlan ? PLANS[effPlan].label : planName === "current" ? "—" : planName} · ${
    isLive ? "Live" : "Demo"
  }`;

  const previewControl = (
    <div className="nt-root nt-pvwrap" ref={pvRef}>
      <div className="nt-pv">
        <button
          type="button"
          className={`nt-pvsum${previewing ? " on" : ""}`}
          aria-expanded={pvOpen}
          aria-controls="nt-pv-panel"
          aria-label={`Preview as ${pvSummary}`}
          title={`Preview as ${pvSummary}`}
          onClick={() => setPvOpen((v) => !v)}
        >
          <span className="nt-pvk">Preview as</span>
          <span>{pvSummary}</span>
        </button>
        {pvOpen && (
          <div className="nt-pvpanel" id="nt-pv-panel">
            <p className="nt-pvh">Plan</p>
            <div className="nt-env four tight" role="group" aria-label="Plan">
              {(Object.keys(PLANS) as PlanKey[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`nt-eb${effPlan === k ? " sel3" : ""}`}
                  aria-pressed={effPlan === k}
                  onClick={() => choosePvPlan(k)}
                >
                  <b>{PLANS[k].label}</b>
                </button>
              ))}
            </div>
            <p className="nt-pvh">Account mode</p>
            <div className="nt-env tight" role="group" aria-label="Account mode">
              <button
                type="button"
                className={`nt-eb${isLive ? "" : " sel3"}`}
                aria-pressed={!isLive}
                disabled={modeFixed}
                onClick={() => setPvMode("demo")}
              >
                <b>Demo</b>
              </button>
              <button
                type="button"
                className={`nt-eb${isLive ? " sel3 live8" : ""}`}
                aria-pressed={isLive}
                disabled={modeFixed || !pvLiveAllowed}
                onClick={() => setPvMode("live")}
              >
                <b>Live</b>
              </button>
            </div>
            {modeFixed ? (
              <p className="nt-hint" style={{ margin: 0 }}>
                This trade&rsquo;s Demo or Live mode was fixed when it was created.
              </p>
            ) : (
              !pvLiveAllowed && (
                <p className="nt-hint" style={{ margin: 0 }}>
                  Live trading is part of Builder and Desk, so the Settings switch stays on Demo.
                </p>
              )
            )}
            <p className="nt-fine">
              {previewing
                ? "Previewing only. Saving and starting use your real plan and Settings switch, so they're off until you go back."
                : "This is your account. Pick another plan or mode to see how this form changes for it."}
            </p>
            {previewing && (
              <button type="button" className="nt-mini go" onClick={resetPreview}>
                Back to my account
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>{`${pageTitle} | Candleweb`}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <DashboardShell active="trades">
        <TopBar
          crumb={
            <>
              <Link href="/dashboard/trades">&#8249; My trades</Link> &nbsp;/&nbsp; {pageTitle}
            </>
          }
          title={pageTitle}
          actions={previewControl}
          titleExtra={<span className={`fx-run2 ${isLive ? "live7" : "demo7"}`}>{isLive ? "Live" : "Demo"}</span>}
          subtitle="Set the market, the money, who decides and how positions close. Nothing reaches the exchange until you start it."
        />

        <div className="nt-root">
          <div className="nt-formwrap">
            <div>
              <div className="nt-prog">
                <div className="nt-ph">
                  <b>{editing ? "Editing this trade" : "Setting up this trade"}</b>
                  <span>{ready} of 5 ready</span>
                </div>
                <div className="nt-psteps" role="group" aria-label="Steps">
                  {STEPS.map((n, i) => {
                    const st = status(i);
                    const cls =
                      i === step && !done
                        ? "cur3"
                        : st === "done" || st === "auto" || st === "ready"
                          ? "done3"
                          : i < seen || step === LAST
                            ? "todo3"
                            : "";
                    return (
                      <button
                        key={n}
                        type="button"
                        className="nt-pstep"
                        aria-label={`Step ${i + 1}: ${n}`}
                        aria-current={i === step ? "step" : undefined}
                        onClick={() => go(i)}
                      >
                        <i className={cls} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <form onSubmit={(e) => e.preventDefault()}>
                <section
                  key={step}
                  className={`nt-fsec${enter ? " enter" : ""}`}
                  aria-labelledby="nt-step-title"
                >
                  {views[step]()}
                </section>
                {vActions()}
              </form>
            </div>

            <aside className="nt-side2" aria-label="This trade">
              <div className="nt-meter">
                <div className="nt-mh">
                  <b>Ready to start</b>
                  <span>{ready} of 5</span>
                </div>
                <div className="nt-seg">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <i key={i} className={status(i) !== "todo" ? "f" : i === firstTodo ? "nx" : ""} />
                  ))}
                </div>
                <p className="nt-mnote">
                  {allBlockers.length
                    ? `Next: ${low(allBlockers[0].t).replace(/\.$/, "")}.`
                    : "Everything is set. Read the review, then start."}
                </p>
              </div>
              <div className="nt-unlock">
                <h4>This trade</h4>
                <p className="us">What Candleweb will do once you start it. Select a row to change it.</p>
                <ol className="nt-rail2">
                  {STEPS.map((name, i) => {
                    const st = status(i);
                    const t = railText(i);
                    const cur = !done && step === i;
                    const cls = st === "done" || st === "ready" ? " got3" : st === "todo" ? " warn3" : " auto3";
                    return (
                      <li key={name}>
                        <button
                          type="button"
                          className={`nt-ul${cls}${cur ? " cur" : ""}`}
                          aria-current={cur ? "step" : undefined}
                          onClick={() => go(i)}
                        >
                          <i aria-hidden="true">{st === "done" || st === "ready" ? "✓" : i + 1}</i>
                          <span>
                            <em>{name}</em>
                            <b>{t.v}</b>
                            <small>{t.s}</small>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ol>
                <p className="nt-tip2">You can edit the trade after it is created. Its Demo or Live mode is fixed.</p>
              </div>
            </aside>
          </div>
        </div>

        <IndicatorDrawer
          open={drawer}
          onClose={() => {
            setDrawer(false);
            setTimeout(() => focusField("nt-open-drawer"), 0);
          }}
          selected={form.indicators}
          onChange={setIndicators}
          catalogue={catalogue}
          pairName={pairName}
        />
        {confirmDialog()}
        {doneDialog()}
      </DashboardShell>
    </>
  );
};

export default NewTradePage;
