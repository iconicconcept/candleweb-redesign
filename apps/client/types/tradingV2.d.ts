/**
 * Trades (v2) — `/api/trading_v2/`.
 * A trade ties a pair / timeframe / allocation together with who decides
 * (your own bot, or CandleAI) and the risk limits Candleweb enforces.
 */

/**
 * Which book a call answers for, as the QUERY takes it (lower case).
 * Responses name the same thing upper case, in their own `book` field.
 *
 * Every list and every figure answers for exactly one book. Nothing mixes
 * them: a Live dashboard must not list demo trades, and must not add their
 * allocation into its capital either.
 */
export type BookV2Param = "demo" | "live";

export type TradeV2Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
export type TradeV2DeciderType = "OWN_BOT" | "CANDLE_AI";
export type TradeV2Direction = "BOTH" | "LONG" | "SHORT";
export type TradeV2Status = "RUNNING" | "PAUSED" | "ERROR";

/** A trade configuration as returned by the API. */
export interface TradeV2 {
  id: number;
  /** What the user calls this trade ("ETH momentum"). Optional, max 100. */
  name?: string;
  /** `name`, or "ETHUSDT · 15m" when `name` is blank. Read-only, and the one
   *  to put on screen — never `name`, which is empty on most trades. */
  display_name?: string;
  /**
   * How confident a decision must be before it is acted on: a decision trades
   * only when its `confidence` is ABOVE this. At 60, a 60 is held and a 61 can
   * trade. Applies to a BUY opening a position and a SELL closing one.
   * Required on create; existing trades were given 50.
   */
  min_confidence?: number;
  /**
   * Null on a DEMO trade, which needs no exchange: paper orders never reach
   * one. A live trade always has one, and it cannot be removed by an edit.
   */
  exchange_account: number | null;
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

  /* --- this trade's own record, in its own book --- */

  /** Closed positions this trade opened, all time. */
  closed_trades?: number | null;
  /** Of those, how many made / lost money after fees. */
  wins?: number | null;
  losses?: number | null;
  /** Percent, e.g. 11.11. Null until something has closed — a dash, not 0%. */
  win_rate?: number | null;

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
  /** Optional, max 100. Blank is fine — `display_name` falls back to the pair. */
  name?: string;
  /** REQUIRED on create: a whole number from 0 to 99. A partial PATCH that
   *  leaves it out keeps the trade's current value. */
  min_confidence?: number;
  /** Optional for a DEMO trade (send nothing or null). A live trade without
   *  one is a 400. */
  exchange_account?: number | null;
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
  /**
   * True when this is worth saying but is not a fault — a bot holding a
   * position its own decision opened, or no exchange on a demo-only account.
   * `overall` only turns `degraded` for the non-informational ones, so an
   * informational issue is styled neutral and never as a warning.
   */
  informational?: boolean;
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
    /**
     * Whether anything on this account actually needs an exchange: true when
     * the switch is on Live, a live trade is active, or a live position is
     * open. On a demo-only account it is false, and a missing exchange is
     * then informational rather than a red "not connected".
     */
    required?: boolean;
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
    running?: number;
    not_responding?: number;
    not_responding_ids?: number[];
    /**
     * Bots holding a position their own decision opened. A bot here is quiet
     * with something still running, which is NOT the same as one that has
     * gone silent with nothing to show for it — nothing is waiting on it, the
     * stop or trail manages the exit. Neutral, never amber.
     */
    with_open_positions?: number;
    with_open_positions_ids?: number[];
    silent_with_open_positions_ids?: number[];
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

/** GET /decisions/ — filters. All optional. Book-scoped. */
export interface BotDecisionsV2Query {
  book?: BookV2Param;
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
  max_drawdown_pct: MetricsV2Number;
  at_risk_now: MetricsV2Number;
  /** Open positions with no stop armed. The caveat that makes `at_risk_now`
   *  honest; `0` here is good news and worth stating. */
  unprotected_positions: number | null;
  unavailable?: MetricsV2Unavailable;

  /* --- PnL, risk and win rate --- */

  /** Which book this answers for. */
  book?: "DEMO" | "LIVE" | null;
  /** The realised window actually applied, if the response echoes it. */
  window_days?: number | null;
  /** The venue filter actually applied, if the response echoes it. */
  venue?: string | null;

  realised_pnl?: MetricsV2Number;
  realised_return_pct?: MetricsV2Number;
  unrealised_pnl?: MetricsV2Number;
  open_pnl?: MetricsV2Number;
  change_today_pct?: MetricsV2Number;
  win_rate?: MetricsV2Number;
  wins?: number | null;
  losses?: number | null;

  at_risk_pct?: MetricsV2Number;
  closed_positions?: number | null;
  closed_trades?: number | null;
  open_positions?: number | null;
  max_drawdown_usdt?: MetricsV2Number;
  max_drawdown_peak_at?: string | null;
  max_drawdown_trough_at?: string | null;
  max_drawdown_recovered_at?: string | null;
  equity_baseline_at?: string | null;
  equity_curve?: { t: string; equity: number | string }[];
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
  window_days?: number | null;
  book?: "DEMO" | "LIVE" | null;

  realised_pnl?: MetricsV2Number;
  realised_return_pct?: MetricsV2Number;
  unrealised_pnl?: MetricsV2Number;
  open_pnl?: MetricsV2Number;
  win_rate?: MetricsV2Number;
  wins?: number | null;
  losses?: number | null;
  /** Closed positions this trade opened. Same number as `closed_positions`,
   *  which it replaces. */
  closed_trades?: number | null;
  closed_positions?: number | null;
  open_positions?: number | null;
  at_risk_now?: MetricsV2Number;
  unprotected_positions?: number | null;
  /**
   * Positions on this trade's market that NO trade opened.
   *
   * It replaces `legacy_positions_matched`, and with it the whole venue+symbol
   * matching caveat: a trade's figures now count only the positions it opened
   * itself, so two trades on one pair no longer report the same money and the
   * figures can be read as this trade's own. These positions are in none of
   * them — only the account-wide `metrics/` still counts them.
   */
  unattributed_positions?: number | null;
  unavailable?: MetricsV2Unavailable;
}

/* ------------------------------------------------------------------ *
 * Bot metrics — `GET /api/trading_v2/bots/<id>/metrics/`
 *
 * Counts the positions THIS BOT'S DECISIONS opened — not every position on
 * the trades that point at it — so the figures stay right even when a trade's
 * bot is swapped. It is also why nothing here is assembled in the browser any
 * more: summing per-trade metrics double-counted positions and could not
 * average a winner against a loser at all.
 * ------------------------------------------------------------------ */

/** The bot's whole record in this book, ignoring `window_days`. */
export interface BotMetricsV2AllTime {
  closed_trades?: number | null;
  wins?: number | null;
  losses?: number | null;
  win_rate?: MetricsV2Number;
  avg_win?: MetricsV2Number;
  avg_loss?: MetricsV2Number;
  realised_pnl?: MetricsV2Number;
}

export interface BotMetricsV2 {
  bot_id?: number;
  book?: "DEMO" | "LIVE" | null;
  window_days?: number | null;

  realised_pnl?: MetricsV2Number;
  /** Of the capital the closed positions actually used. */
  realised_return_pct?: MetricsV2Number;
  win_rate?: MetricsV2Number;
  closed_trades?: number | null;
  wins?: number | null;
  losses?: number | null;
  /** Money, after fees. Null when the bot has none of that kind yet. */
  avg_win?: MetricsV2Number;
  avg_loss?: MetricsV2Number;
  open_positions?: number | null;
  /** `0` here is the "all have a stop armed" caption, and is good news. */
  unprotected_positions?: number | null;
  /** Trades pointing at this bot, in this book. */
  trades_using?: number | null;
  /** The markets it has closed positions on — "across N pairs". */
  pairs?: string[] | null;
  all_time?: BotMetricsV2AllTime;
  unavailable?: MetricsV2Unavailable;
}

/** GET /bots/<id>/metrics/ — filters. Both default to the switch / 30. */
export interface BotMetricsV2Query {
  book?: "demo" | "live";
  window_days?: number;
}

/* ------------------------------------------------------------------ *
 * Review readiness — `GET /api/trading_v2/bots/<id>/review-readiness/`
 *
 * The rule is the plan's: **20 CLOSED TRADES on the current prompt**, both
 * books counted. Not 20 decisions — the meter used to count those, which is a
 * different and much easier bar.
 *
 * Only a change to the bot's prompt, model or decision style restarts the
 * count. Renaming it, or editing its note, webhook, timeout or alerts, does
 * not — which is why `prompt_changed_at` exists and `updated_at` must not be
 * used for this.
 * ------------------------------------------------------------------ */

export type BotReviewBlockerCode =
  | "NO_PROMPT"
  | "TOO_FEW_CLOSED_TRADES"
  | "NO_REVIEWS_LEFT"
  | string;

export interface BotReviewBlockerV2 {
  code?: BotReviewBlockerCode;
  message?: string;
}

export interface BotReviewReadinessV2 {
  prompt_stored?: boolean;
  /** When the count started. Also on the bot itself. */
  prompt_changed_at?: string | null;
  closed_trades_needed?: number | null;
  closed_trades_on_prompt?: number | null;
  closed_trades_by_book?: Partial<Record<"DEMO" | "LIVE", number>> | null;
  closed_trades_remaining?: number | null;
  wins?: number | null;
  losses?: number | null;
  win_rate?: MetricsV2Number;
  /** Context beside the bar, never the bar itself. */
  decisions_on_prompt?: number | null;
  decisions_on_prompt_by_kind?: Partial<Record<BotDecisionV2Action, number>> | null;
  decisions_total?: number | null;
  reviews_available?: number | null;
  /** Has what a review needs: a stored prompt and enough closed trades. */
  eligible?: boolean;
  /** `eligible` AND a review left to spend. */
  ready?: boolean;
  /** Everything missing, in order. Show each `message`. */
  blockers?: BotReviewBlockerV2[];
}

/** GET /metrics/ — filters. All optional; `window_days` defaults to 30. */
export interface PortfolioMetricsV2Query {
  /** Which book to answer for. Omitted, the server uses the Settings switch.
   *  Anything other than "demo" / "live" is a 400. */
  book?: BookV2Param;
  /** Limit to one venue. */
  venue?: string;
  /** Realised window. Default 30 server-side; sent explicitly so the figure
   *  and the "· 30d" label on screen cannot drift apart. */
  window_days?: number;
}

/** GET /trades/<id>/metrics/ — filters.
 *
 *  No `book`: a trade's mode is fixed when it is created, so this always
 *  answers for the trade's OWN book. */
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
  /** The stop that fires first: tightest armed stop or trail. Null only when
   *  there is no stop at all. */
  stop_price?: number | null;
  /** `TRAIL`, `STOP_LOSS` or `BACKSTOP`. */
  stop_kind?: "TRAIL" | "STOP_LOSS" | "BACKSTOP" | string | null;
  distance_to_stop?: number | null;
  distance_to_stop_pct?: number | null;
  /**
   * Where price sits on the stop track, 0 at the stop and 1 at the safe end,
   * clamped. The design's marker position, already computed — never re-derive
   * it.
   *
   * **Null now means there is no stop AT ALL**, and `stop_price` is null too.
   * It used to go null whenever a trail climbed above the entry, which made
   * the card shout "NO STOP" over a position that was being protected.
   */
  stop_gauge?: number | null;
  /** What the track spans, so the marker can be read correctly:
   *  - `ENTRY` — the usual: stop (0) → entry (1).
   *  - `TRAIL_DISTANCE` — stop at or above entry: 0 at the stop, 1 a full
   *    trail distance above it (price at its high).
   *  - `LOCKED_IN` — stop above entry with no trail distance known. */
  stop_gauge_basis?: "ENTRY" | "TRAIL_DISTANCE" | "LOCKED_IN" | null;
  /** The stop is at or above the entry: if it fires, the position closes at
   *  or above what it cost. Worth saying — it is good news. */
  stop_locked_in?: boolean | null;
  /** What this loses if the stop fills at the backstop. `0` when the stop is
   *  in profit — a real figure. Null (with a reason) when there is no stop at
   *  all, which must never be shown as $0 at risk. */
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

/* ------------------------------------------------------------------ *
 * History — `GET /api/trading_v2/history/` and `/history/export/`
 *
 * Closed positions, with the summary, the per-bot strip and the day groups
 * the page shows. Three things to read correctly:
 *
 *  - **`summary`, `by_bot` and `days` cover EVERYTHING the filters match**,
 *    not just the page in `results`. Recomputing them from the rows on screen
 *    would quietly report "last 25 closes" under a 30-day heading.
 *  - **A row whose sale was never recorded** has `exit_reason: "UNKNOWN"`,
 *    null results and `unavailable.realised_pnl`. It is counted in
 *    `summary.positions_missing_fills` and in NO total. Show a dash.
 *  - **The plan caps the window.** Paper (and no plan) keeps 30 days: asking
 *    for more returns 30 with `record_limited: true` rather than an error.
 * ------------------------------------------------------------------ */

export type HistoryV2ExitReason =
  | "TRAILING_STOP"
  | "STOP_HIT"
  | "BOT_CLOSED"
  | "TAKE_PROFIT"
  | "SYSTEM_CLOSED"
  | "MANUAL"
  | "UNKNOWN";

/** GET /history/ — every parameter optional. */
export interface HistoryV2Query {
  book?: BookV2Param;
  /** A number of days, or "all". Default 30. Overridden by `from`/`to`. */
  days?: number | "all";
  /** `YYYY-MM-DD`, inclusive, read in `tz`. */
  from?: string;
  to?: string;
  /** IANA zone. Always send the browser's — the day a trade closed on
   *  depends on it, and so do the day groups. */
  tz?: string;
  /** A bot id, `"candleai"`, or `"none"` for positions no bot opened. */
  bot?: number | "candleai" | "none";
  trade?: number;
  /** `ETHUSDT` or `ETH/USDT`. */
  pair?: string;
  exit?: HistoryV2ExitReason;
  /** `limit` max 100, default 25. */
  limit?: number;
  offset?: number;
}

/** Over everything the filters match — never just the page. */
export interface HistoryV2Summary {
  closed_trades?: number | null;
  win_rate?: MetricsV2Number;
  wins?: number | null;
  losses?: number | null;
  /** Each position's own return, averaged. */
  avg_win_pct?: MetricsV2Number;
  avg_loss_pct?: MetricsV2Number;
  avg_win?: MetricsV2Number;
  avg_loss?: MetricsV2Number;
  net_return_pct?: MetricsV2Number;
  realised_pnl?: MetricsV2Number;
  /** Null when nothing closed in the window. */
  best_day?: { date?: string | null; net_pnl?: MetricsV2Number } | null;
  /** Rows whose sale was never recorded. In no total. */
  positions_missing_fills?: number | null;
}

/** One bot in the strip. `key` is what to pass back as `bot=`. */
export interface HistoryV2BotRow {
  key?: string;
  name?: string;
  closed_trades?: number | null;
  win_rate?: MetricsV2Number;
  net_return_pct?: MetricsV2Number;
  realised_pnl?: MetricsV2Number;
}

export interface HistoryV2FilterOption {
  key?: string | number;
  name?: string;
}

/** A whole day's figures — not just the rows on this page. */
export interface HistoryV2Day {
  date?: string;
  closed?: number | null;
  net_pnl?: MetricsV2Number;
}

export interface HistoryV2Row {
  position_id?: number;
  /** Already in `tz`. `date` is its day, for grouping. */
  closed_at?: string | null;
  date?: string | null;
  pair?: string | null;
  /** Always BUY — spot is long-only, so no SELL badge can appear. */
  side?: string | null;
  bot?: { id?: number | null; name?: string } | null;
  /** Used when `bot` is null: "CandleAI", "Not from a trade", "No bot recorded". */
  decider?: { key?: string; name?: string } | null;
  trade?: { id?: number | null; name?: string } | null;
  entry_price?: MetricsV2Number;
  exit_price?: MetricsV2Number;
  held_seconds?: number | null;
  exit_reason?: HistoryV2ExitReason | string | null;
  exit_reason_label?: string | null;
  /** After fees. Null with `unavailable.realised_pnl` when the sale was
   *  never recorded — a dash, and in no total. */
  return_pct?: MetricsV2Number;
  realised_pnl?: MetricsV2Number;
  unavailable?: MetricsV2Unavailable;
}

export interface HistoryV2 {
  book?: "DEMO" | "LIVE" | null;
  tz?: string | null;
  /** True when the plan shortened the window that was asked for. */
  record_limited?: boolean;
  /** Days the plan keeps. Null = unlimited. */
  record_days?: number | null;
  summary: HistoryV2Summary;
  by_bot: HistoryV2BotRow[];
  days: HistoryV2Day[];
  filters?: {
    bots?: HistoryV2FilterOption[];
    trades?: HistoryV2FilterOption[];
    pairs?: HistoryV2FilterOption[];
    exit_reasons?: HistoryV2FilterOption[];
  } | null;
  /** The TOTAL matching rows, for paging — not this page's length. */
  count: number;
  offset?: number;
  results: HistoryV2Row[];
  /** Carries `earlier_history` when the plan capped the window. */
  unavailable?: MetricsV2Unavailable;
}
