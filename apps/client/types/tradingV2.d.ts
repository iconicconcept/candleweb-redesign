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
 * Bot decisions (v2) — `/api/trading_v2/decisions/`
 *
 * What a user's own bot answered when Candleweb handed it a candle.
 * Read-only: nothing in the dashboard writes a decision (the bot posts it
 * itself with its `dev_key`), and no order is placed from one.
 * ------------------------------------------------------------------ */

export type BotDecisionV2Action = "BUY" | "SELL" | "HOLD";

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
  /** Free text written by the user's own bot. Can be empty. */
  rationale: string;
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
  market_data_ids: number[];
}

/** GET /decisions/ — filters. All optional. */
export interface BotDecisionsV2Query {
  bot?: number;
  trade?: number;
  decision?: BotDecisionV2Action;
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
