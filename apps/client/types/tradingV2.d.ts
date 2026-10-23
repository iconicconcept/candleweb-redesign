/**
 * Trades (v2) — `/api/trading_v2/`.
 * A trade ties a pair / timeframe / allocation together with who decides
 * (your own bot, or CandleAI) and the risk limits Candleweb enforces.
 */

export type TradeV2Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
export type TradeV2DeciderType = "OWN_BOT" | "CANDLE_AI";
export type TradeV2Direction = "BOTH" | "LONG" | "SHORT";
export type TradeV2Status = "RUNNING" | "PAUSED" | "ERROR";

/** A trade configuration as returned by the API. */
export interface TradeV2 {
  id: number;
  exchange_account: number;
  exchange_name?: string;
  pair: number;
  pair_name?: string;
  timeframe: TradeV2Timeframe;
  allocated_amount: string;
  /** Documented as a comma/space string on read (sent as string[] on write),
   * but has been observed coming back as string[] on read too — the trades
   * page's `indicatorChips` helper tolerates either shape. */
  indicators: string | string[];
  candle_history_len: number;
  decider_type: TradeV2DeciderType;
  bot: number | null;
  bot_name?: string | null;
  risk_pct: string;
  max_size_pct: number;
  direction: TradeV2Direction;
  trailing_stop: boolean;
  status: TradeV2Status;
  /** The two URLs the user hands to their own bot — GET for candles, POST for
   * decisions. Present on every trade response (list, detail, create, edit)
   * and `null` on a CandleAI trade, where there is no bot to connect.
   * Never assemble these by hand: the host differs between sandbox and
   * production and the API already returns the right one. */
  candles_url: string | null;
  decision_url: string | null;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ *
 * Bots (v2) — `/api/trading_v2/bots/`
 * ------------------------------------------------------------------ */

export type BotV2Platform =
  | "N8N_CLOUD"
  | "N8N_SELF_HOSTED"
  | "MAKE"
  | "ZAPIER"
  | "CUSTOM_CODE"
  | "OTHER";
export type BotV2ReachMode = "PUSH" | "PULL";
export type BotV2OnNoReply = "SKIP" | "HOLD" | "CLOSE";
export type BotV2DecisionStyle = "BUY_SELL_HOLD" | "BUY_HOLD_ONLY" | "SIGNAL_STRENGTH";
export type BotV2Status = "ACTIVE" | "PAUSED" | "FAILING";

export interface BotV2 {
  id: number;
  name: string;
  note: string;
  platform: BotV2Platform;
  reach_mode: BotV2ReachMode;
  /** null for a PULL bot that has no URL */
  webhook_url: string | null;
  /** Returned in full on create / regenerate-key; may be masked on later reads. */
  dev_key: string;
  reply_timeout_s: number;
  on_no_reply: BotV2OnNoReply;
  prompt: string;
  model_name: string;
  decision_style: BotV2DecisionStyle;
  alert_email_on_fail: boolean;
  alert_push_on_fail: boolean;
  auto_pause_after_n_fails: number;
  consecutive_fail_count: number;
  status: BotV2Status;
  created_at: string;
  updated_at: string;
}

/** Body for POST /bots/ and PATCH /bots/{id}/ (partial for PATCH). */
export interface BotV2Payload {
  name?: string;
  note?: string;
  platform?: BotV2Platform;
  reach_mode?: BotV2ReachMode;
  /** optional for PULL — send null, never "" (a blank URL fails validation) */
  webhook_url?: string | null;
  reply_timeout_s?: number;
  on_no_reply?: BotV2OnNoReply;
  prompt?: string;
  model_name?: string;
  decision_style?: BotV2DecisionStyle;
  alert_email_on_fail?: boolean;
  alert_push_on_fail?: boolean;
  auto_pause_after_n_fails?: number;
}

/** POST /bots/test-connection/ result. */
/** GET /trading_v2/limits/ — what the plan lets the user run. `max: null` = unlimited. */
export interface TradingLimitsV2 {
  agents: { running: number; max: number | null; can_start_another: boolean; has_active_plan: boolean };
  exchanges: { in_use: number; max: number | null; can_use_another: boolean };
}

export interface BotV2TestResult {
  ok: boolean;
  status_code?: number;
  body?: unknown;
  error?: string;
}

/** Body for POST /trades/ and PATCH /trades/{id}/ (partial for PATCH). */
export interface TradeV2Payload {
  exchange_account?: number;
  pair?: number;
  timeframe?: TradeV2Timeframe;
  allocated_amount?: string;
  indicators?: string[];
  candle_history_len?: number;
  decider_type?: TradeV2DeciderType;
  bot?: number | null;
  risk_pct?: string;
  max_size_pct?: number;
  direction?: TradeV2Direction;
  trailing_stop?: boolean;
}

/* ------------------------------------------------------------------ *
 * Status (v2) — `GET /api/trading_v2/status/`
 *
 * The hero's three chips: is KuCoin connected, is monitoring active, are the
 * bots answering. The response is documented as "No response body", so every
 * field below is OPTIONAL and read through `lib/tradingV2Status.ts` rather
 * than trusted — a chip that cannot be read says so instead of claiming the
 * reassuring state.
 * ------------------------------------------------------------------ */

export type StatusV2Overall = "ok" | "degraded" | "down";

/** One finding, as a stable code plus a human message. */
export interface StatusV2Issue {
  code?: string;
  message?: string;
}

/** A worker heartbeat. `age_seconds` is how long ago the last one was. */
export interface StatusV2Process {
  alive?: boolean;
  age_seconds?: number | null;
}

export interface TradingStatusV2 {
  overall?: StatusV2Overall;
  issues?: StatusV2Issue[];
  exchange?: {
    connected?: boolean;
    name?: string;
    venue?: string;
    [k: string]: unknown;
  };
  monitoring?: {
    /** True only when the price monitor, the feed and the execution worker
     *  are all beating, firing is not paused, and every market holding a stop
     *  is watched. Anything less is false — it is not a partial score. */
    active?: boolean;
    paused?: boolean;
    processes?: Record<string, StatusV2Process>;
    [k: string]: unknown;
  };
  bots?: {
    answering?: number;
    total?: number;
    not_responding?: number;
    [k: string]: unknown;
  };
  [k: string]: unknown;
}

/* ------------------------------------------------------------------ *
 * Bot decisions (v2) — `/api/trading_v2/decisions/`
 *
 * What a user's own bot answered when Candleweb handed it a candle.
 * Read-only: nothing in the dashboard writes a decision (the bot posts it
 * itself with its `dev_key`), and no order is placed from one.
 * ------------------------------------------------------------------ */

export type BotDecisionV2Action = "BUY" | "SELL" | "HOLD";

/** The bot's OWN rating of a decision, and a `?risk=` filter on the list.
 *  Self-reported: Candleweb does not score this, so it says what the bot
 *  thought, not whether the trade was actually risky. */
export type BotDecisionV2Risk = "LOW" | "MEDIUM" | "HIGH";

export interface BotDecisionV2 {
  id: number;
  trade: number;
  bot: number;
  bot_name: string;
  pair: string;
  timeframe: TradeV2Timeframe;
  decision: BotDecisionV2Action;
  /** 0–100, or null — a bot doesn't have to send one. */
  confidence: number | null;
  /** The bot's own risk rating. Optional — a bot need not send one. */
  risk: BotDecisionV2Risk | null;
  /** Free text written by the user's own bot. Can be empty. */
  rationale: string;
  /** The price the bot quoted when it decided, as a decimal string. This is
   * NOT a fill: an order may never have been placed, and one that was filled
   * at whatever the venue gave. */
  entry_price: string | number | null;
  /**
   * "The gate's verdict, the order it placed, and the position it became."
   *
   * Documented as `additionalProperties` — an OPEN map whose keys are named
   * nowhere in the schema. Nothing may assume a key exists; `outcomeEntries`
   * renders whatever actually arrives, so a shape change cannot put a wrong
   * number on screen. (§3.M13)
   */
  outcome: Record<string, unknown> | null;
  /** Candles at the trade's timeframe — this is the number to show users. */
  candles_seen: number;
  /** Stored rows behind those candles. Larger than `candles_seen` above 1m;
   * looks like a bug to users, so keep it out of the main read. */
  market_data_count: number;
  /** true = the candles were already behind when the bot got them. null when
   * the fetch is unknown. */
  saw_stale_data: boolean | null;
  data_delivered_at: string | null;
  decided_at: string;
  /** Measured by Candleweb, not self-reported. null when the bot posted
   * without fetching through us — render a dash, never 0. */
  think_time_seconds: number | null;
}

/** GET /decisions/<id>/ — the list row plus the rows it looked at. Returned
 * bare, with no wrapper. `market_data_ids` can be SHORTER than
 * `market_data_count`: the count is frozen when the decision is made, and the
 * links go when old market data is cleaned up. That is tidying, not a bot
 * that saw less than it claimed. */
export interface BotDecisionV2Detail extends BotDecisionV2 {
  /** Typed loosely on purpose: the prose calls it a list, oldest first, while
   * the schema renders it as a string. `marketDataIds` accepts either and is
   * the only place that has to care. */
  market_data_ids: number[] | string | null;
}

/** GET /decisions/ — filters. All optional. */
export interface BotDecisionsV2Query {
  bot?: number;
  trade?: number;
  decision?: BotDecisionV2Action;
  risk?: BotDecisionV2Risk;
  /** default 25, max 100 */
  limit?: number;
  offset?: number;
}

/** GET /decisions/ — `count` is the TOTAL, not the page size. Use it for paging. */
export interface BotDecisionsV2Page {
  count: number;
  results: BotDecisionV2[];
}

/* ------------------------------------------------------------------ *
 * Bot health — `/api/trading_v2/bots/<id>/health/` and `/bots/health/`
 *
 * `unavailable` is the contract that matters: a key listed there has no
 * number yet and must render as "Not measured yet" — never as 0, and never
 * as a green 100%. A field that *has* a value is not listed, so there is no
 * permanent "not measured" badge either.
 * ------------------------------------------------------------------ */

export interface BotHealthV2Unavailable {
  [field: string]: string;
}

export interface BotHealthV2DailyReply {
  date: string;
  decisions: number;
}

export interface BotHealthV2 {
  bot_id: number;
  name: string;
  status: BotV2Status;
  reach_mode: BotV2ReachMode;
  /** Answered within the last 6 hours and not paused. A 4h trade decides 4
   * times a day and is perfectly healthy — don't invent a tighter rule. */
  connected: boolean;

  last_signal: string | null;
  seconds_since_last_signal: number | null;
  /** Average over the last 7 days; null when there is nothing to measure. */
  reply_time_seconds: number | null;

  decisions_total: number;
  decisions_7d: number;
  deliveries_total: number;
  first_seen: string | null;

  /** Candles that went unanswered in the last 7 days. Always show it next to
   * `calls_expected_7d` — "3 failed" is alarming and meaningless. */
  failed_7d: number | null;
  uptime_30d: number | null;
  days_without_failure: number | null;
  last_failure_at: string | null;

  calls_expected_7d: number | null;
  calls_expected_30d: number | null;
  /** The timeout actually used — clamped to 5s…6h, so it may differ from what
   * the user typed. Surface it when it does. */
  reply_timeout_seconds: number | null;

  unavailable: BotHealthV2Unavailable;
  /** Always exactly 30 entries, oldest first, zero-filled for quiet days. */
  daily_replies: BotHealthV2DailyReply[];
}

/** One row of the fleet endpoint's `bots` array. */
export interface FleetHealthV2Bot {
  bot_id: number;
  name: string;
  status: BotV2Status;
  connected: boolean;
  last_signal: string | null;
}

/** GET /bots/health/ — the whole fleet at a glance. */
export interface FleetHealthV2 {
  bots_total: number;
  /** Bots actually answering right now. */
  connected: number;
  /** Bots that are not paused. */
  running: number;
  /** "N of M answering" — a *right now* reading, NOT uptime. */
  answering: number;
  answering_of: number;
  decisions_7d: number;
  /** The fleet's WORST bot, not an average: if any bot failed today this is 0. */
  days_without_failure: number | null;
  failed_30d: number | null;
  /** Always null — nothing spends a bot review yet. */
  reviews_waiting: number | null;
  unavailable: BotHealthV2Unavailable;
  bots: FleetHealthV2Bot[];
}

/* ------------------------------------------------------------------ *
 * Metrics — `/api/trading_v2/metrics/` and `/trades/<id>/metrics/`
 *
 * Every figure here is derived from RECORDED FILLS, never from an intention:
 * an allocated amount, a risk percentage or a running trade proves nothing
 * about money. That is why these are separate from `TradeV2`, which is only
 * the setup.
 *
 * Two contracts carry over from bot health and matter just as much:
 *
 *  - `unavailable` is a map of field name → the backend's own reason. A key
 *    listed there has NO number yet and must render as that sentence, never
 *    as 0 and never as a flat dash with no explanation. Today
 *    `account_equity`, `change_today` and `max_drawdown` are always in it:
 *    equity is the sum of the ledger and the agent path does not write
 *    ledger entries yet, and drawdown needs equity sampled over time.
 *  - `at_risk_now` is derived from the stops ACTUALLY ARMED on the venue, so
 *    a position with no stop contributes ZERO to it. On its own it therefore
 *    reads as "barely exposed" for the worst case there is. It must always be
 *    shown next to `unprotected_positions`, which counts exactly those.
 *
 * Money and percentages arrive as decimal strings elsewhere in trading_v2
 * (`allocated_amount`, `risk_pct`), so every numeric field here is typed
 * `string | number | null` and read through `metricNum` in
 * `lib/tradingV2Metrics.ts` rather than used raw.
 * ------------------------------------------------------------------ */

/** Field name → the backend's explanation for why it has no value yet. Same
 *  shape and same rules as `BotHealthV2Unavailable`, so the `isUnavailable` /
 *  `unavailableReason` helpers in `lib/botHealthV2.ts` work on it unchanged. */
export type MetricsV2Unavailable = BotHealthV2Unavailable;

/** A money or percentage figure as trading_v2 sends it. */
export type MetricsV2Number = string | number | null;

/**
 * GET /trading_v2/metrics/ — portfolio PnL, risk and win rate.
 *
 * ⚠ The OpenAPI entry for this endpoint documents **no response body**, so
 * only the fields named in its description are confirmed. Those are declared
 * below. The realised / unrealised / win-rate figures are described in prose
 * ("Portfolio PnL, risk and win rate", "Realised window, default 30") but
 * their exact keys are NOT given, so they are declared optional under their
 * most likely spellings and read through the resolvers in
 * `lib/tradingV2Metrics.ts`. When the backend confirms the real names, that
 * one file is the only place that has to change.
 */
export interface PortfolioMetricsV2 {
  /* --- confirmed by the endpoint description --- */

  /** Sum of the ledger. Always null today — see `unavailable`. */
  account_equity: MetricsV2Number;
  /** Always null today — see `unavailable`. */
  change_today: MetricsV2Number;
  /** Needs equity sampled over time. Always null today — see `unavailable`. */
  max_drawdown: MetricsV2Number;
  /** From stops armed on the venue. A position with no stop adds zero, so
   *  never show this without `unprotected_positions`. */
  at_risk_now: MetricsV2Number;
  /** Open positions with no stop armed. The caveat that makes `at_risk_now`
   *  honest; `0` here is good news and worth stating. */
  unprotected_positions: number | null;
  unavailable?: MetricsV2Unavailable;

  /* --- named in prose, exact keys unconfirmed (see the resolvers) --- */

  /** The realised window actually applied, if the response echoes it. */
  window_days?: number | null;
  /** The venue filter actually applied, if the response echoes it. */
  venue?: string | null;

  realised_pnl?: MetricsV2Number;
  realized_pnl?: MetricsV2Number;
  unrealised_pnl?: MetricsV2Number;
  unrealized_pnl?: MetricsV2Number;
  open_pnl?: MetricsV2Number;
  win_rate?: MetricsV2Number;
  wins?: number | null;
  losses?: number | null;
  trades_closed?: number | null;
}

/**
 * GET /trading_v2/trades/{id}/metrics/ — PnL and risk for one trade.
 *
 * `positions_matched_by` is the field that stops this being read as exact
 * attribution: a `Position` carries no foreign key to a v2 trade, so
 * positions are matched by VENUE AND SYMBOL. Two trades on the same pair and
 * venue therefore report the SAME positions, and the figures must never be
 * summed across trades — the total would double-count. The response states
 * the matching rule precisely so a client cannot mistake it, and the UI
 * repeats it wherever a per-trade figure is shown.
 *
 * ⚠ Same caveat as the portfolio endpoint: OpenAPI documents no response
 * body, so the PnL key names are resolved tolerantly.
 */
export interface TradeMetricsV2 {
  /** How positions were attributed, e.g. "venue+symbol". Surface it. */
  positions_matched_by?: string | null;
  window_days?: number | null;

  realised_pnl?: MetricsV2Number;
  realized_pnl?: MetricsV2Number;
  unrealised_pnl?: MetricsV2Number;
  unrealized_pnl?: MetricsV2Number;
  open_pnl?: MetricsV2Number;
  win_rate?: MetricsV2Number;
  at_risk_now?: MetricsV2Number;
  unprotected_positions?: number | null;
  unavailable?: MetricsV2Unavailable;
}

/** GET /metrics/ — filters. Both optional; `window_days` defaults to 30. */
export interface PortfolioMetricsV2Query {
  /** Limit to one venue. */
  venue?: string;
  /** Realised window. Default 30 server-side; sent explicitly so the figure
   *  and the "· 30d" label on screen cannot drift apart. */
  window_days?: number;
}

/** GET /trades/<id>/metrics/ — filters. */
export interface TradeMetricsV2Query {
  window_days?: number;
}

/* ------------------------------------------------------------------ *
 * Positions (v2) — `/api/trading_v2/positions/`
 *
 * The endpoint the whole dashboard was waiting on (§1.21). Reading rules,
 * each of which is a way to get this wrong:
 *
 *  - **`unavailable` is PER POSITION.** A position with no stop has
 *    `at_risk: null`, NOT zero, with a reason beside it. Summing nulls as
 *    zeroes reports a reassuringly small risk for an unprotected book, which
 *    is the single most dangerous mistake available here.
 *  - **A null WITHOUT a reason does not apply**, rather than being unknown:
 *    `exit_price` on an open position is null because an open position has no
 *    exit, and that is not a gap to apologise for.
 *  - **`stop_price` vs `derived_stop`.** `stop_price` is the stop that fires
 *    first — the tightest armed stop or trail, which an agent may have moved
 *    above the exchange backstop. `derived_stop` is the level the backstop
 *    holds, and `at_risk` is measured against THAT.
 *  - **`side` is always BUY.** Trading is spot and long-only, so no position
 *    opens with a sell; the design's "sell" pill cannot occur.
 *  - **Open figures are before fees**, because the closing fee is not known
 *    until the close happens.
 *  - Money is in the row's own `quote_currency`, not a account-wide currency.
 * ------------------------------------------------------------------ */

export type PositionV2Status = "OPEN" | "CLOSED";
export type PositionV2Book = "DEMO" | "LIVE";
export type PositionV2OrderRole = "ENTRY" | "CLOSE" | "BACKSTOP";

export interface PositionV2Fill {
  venue_trade_id?: string | null;
  qty?: number | null;
  price?: number | null;
  fee?: number | null;
  fee_currency?: string | null;
  ts?: string | null;
}

export interface PositionV2Order {
  client_order_id?: string | null;
  venue_order_id?: string | null;
  /** What the order was for. BACKSTOP is the stop resting on the exchange. */
  role?: PositionV2OrderRole | null;
  type?: string | null;
  side?: string | null;
  status?: string | null;
  requested_qty?: number | null;
  filled_qty?: number | null;
  avg_fill_price?: number | null;
  limit_price?: number | null;
  created_at?: string | null;
  terminal_at?: string | null;
  fills?: PositionV2Fill[] | null;
}

export interface PositionV2 {
  position_id: number;
  status?: PositionV2Status | null;
  book?: PositionV2Book | null;
  venue?: string | null;
  symbol?: string | null;
  base_currency?: string | null;
  quote_currency?: string | null;
  /** Always "BUY" — spot, long-only. */
  side?: string | null;
  qty?: number | null;
  trade_id?: number | null;
  bot_id?: number | null;
  bot_name?: string | null;
  decider_type?: string | null;
  opened_at?: string | null;
  /** null on an open position — does not apply, not unknown. */
  closed_at?: string | null;
  entry_price?: number | null;
  protection_status?: string | null;
  /** The level the exchange backstop holds. `at_risk` is measured to this. */
  derived_stop?: number | null;
  /** The latest stored candle CLOSE, not a live tick. */
  mark_price?: number | null;
  mark_price_as_of?: string | null;
  /** Before fees — the closing fee is unknown until the close. */
  open_pnl?: number | null;
  open_return_pct?: number | null;
  /** The stop that fires first: tightest armed stop or trail. */
  stop_price?: number | null;
  stop_kind?: string | null;
  distance_to_stop?: number | null;
  distance_to_stop_pct?: number | null;
  /** Where price sits between the stop (0) and the entry (1), clamped. This
   *  is the design's marker position, already computed — never re-derive it. */
  stop_gauge?: number | null;
  /** What this loses if the stop fills at the backstop. null (with a reason)
   *  when there is no stop — never zero. */
  at_risk?: number | null;
  exit_price?: number | null;
  realised_pnl?: number | null;
  realised_fees?: number | null;
  realised_return_pct?: number | null;
  fees_other?: Record<string, number> | null;
  orders?: PositionV2Order[] | null;
  /** Field name → the backend's own sentence. Per position. */
  unavailable?: BotHealthV2Unavailable;
}

/** GET /positions/ — `count` is the TOTAL, for paging. */
export interface PositionsV2Page {
  book?: PositionV2Book | null;
  as_of?: string | null;
  count: number;
  results: PositionV2[];
}

/** GET /positions/ — filters. All optional. */
export interface PositionsV2Query {
  book?: "demo" | "live";
  status?: "open" | "closed";
  trade?: number;
  venue?: string;
  /** default 25, max 100 */
  limit?: number;
  offset?: number;
}
