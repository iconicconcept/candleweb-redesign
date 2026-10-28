import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError, AxiosInstance } from "axios";
import { error, success } from "../components/alert/Toast";
import {
  setTradesV2,
  upsertTradeV2,
  removeTradeV2,
  setBotsV2,
  upsertBotV2,
  removeBotV2,
  patchBotV2,
} from "../redux/slices/tradingV2Slice";
import {
  BookV2Param,
  BotMetricsV2,
  BotMetricsV2Query,
  BotReviewReadinessV2,
  HistoryV2,
  HistoryV2Query,
  TradeV2,
  TradeV2Payload,
  BotV2,
  BotV2Payload,
  BotV2TestResult,
  TradingLimitsV2,
  BotDecisionV2Detail,
  BotDecisionsV2Page,
  BotDecisionsV2Query,
  TradingStatusV2,
  PositionV2,
  PositionsV2Page,
  PositionsV2Query,
  BotHealthV2,
  FleetHealthV2,
  PortfolioMetricsV2,
  PortfolioMetricsV2Query,
  TradeMetricsV2,
  TradeMetricsV2Query,
} from "../types/tradingV2";
import { unwrapV2, unwrapPageV2, unwrapDataV2 } from "../lib/tradingV2Shape";
import { revalidate } from "../redux/slices/revalidateSlice";

const BASE = "/trading_v2/trades/";

/* Every error from /api/trading_v2/ carries `status` and `message`, whatever
   went wrong — bad payload, bad filter, not found, not logged in, rate
   limited. `message` is written for the user (including on 403 and 409), so
   it is always what we show. There is no `detail` key any more, and nothing
   here reads one. A 500 may not be JSON at all, hence the fallbacks. */
const getErrorMessage = (err: any): string => {
  const e = err as AxiosError;
  const data = e.response?.data as any;
  if (!data) return e.message ?? e.toString();
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0) return String(firstValue[0]);
    if (typeof firstValue === "string") return firstValue;
  }
  return e.message ?? e.toString();
};

/* On a form 400 the field's own errors sit next to `status` and `message`,
   keyed by field name, each a list of strings — so an error can be put under
   its input instead of only in a toast. `status` and `message` are skipped
   when looping; a problem that isn't about one field has no field key at all
   and stays in `message`. */
export const getFieldErrors = (err: any): Record<string, string> => {
  const data = (err as AxiosError)?.response?.data as any;
  if (!data || typeof data !== "object" || Array.isArray(data)) return {};
  const out: Record<string, string> = {};
  Object.entries(data).forEach(([key, value]) => {
    if (key === "status" || key === "message") return;
    if (Array.isArray(value) && value.length > 0) out[key] = String(value[0]);
    else if (typeof value === "string") out[key] = value;
  });
  return out;
};

/**
 * GET /trading_v2/trades/ — list my trades, for ONE book.
 *
 * Book-scoped as of the v2 update: a Live dashboard no longer lists demo
 * trades, nor folds their allocation into its Capital Allocated. Callers pass
 * `{ api, book }`; the bare-instance form is still accepted so a call site
 * that genuinely wants the server's own switch does not have to invent one.
 */
const listTrades = createAsyncThunk(
  "tradingV2/list",
  async (payload: AxiosInstance | { api: AxiosInstance; book?: BookV2Param }, thunkApi) => {
    const api = "api" in payload ? payload.api : payload;
    const book = "api" in payload ? payload.book : undefined;
    try {
      const { data } = await api.get<TradeV2[]>(BASE, { params: book ? { book } : {} });
      const trades = Array.isArray(data) ? data : [];
      thunkApi.dispatch(setTradesV2(trades));
      return trades;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

/** GET /trading_v2/trades/{id}/ */
const getTrade = createAsyncThunk(
  "tradingV2/get",
  async (payload: { api: AxiosInstance; id: number }, thunkApi) => {
    try {
      const { data } = await payload.api.get<TradeV2>(`${BASE}${payload.id}/`);
      thunkApi.dispatch(upsertTradeV2(data));
      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

/* The API rejects `bot`, `pair` and `exchange_account` sent as objects
   ("pk" error) — they must be bare ids. A trade read back from the API can
   carry them nested, so normalise every write here, not at each call site. */
export const toId = (v: unknown): number | null => {
  if (v == null) return null;
  if (typeof v === "object") {
    const id = (v as { id?: unknown }).id;
    return id == null ? null : Number(id);
  }
  return Number(v);
};

const withIds = (data: TradeV2Payload): TradeV2Payload => {
  const out = { ...data };
  if ("bot" in out) out.bot = toId(out.bot);
  if ("pair" in out) out.pair = toId(out.pair) ?? undefined;
  if ("exchange_account" in out) out.exchange_account = toId(out.exchange_account) ?? undefined;
  return out;
};

/**
 * What a refused trade save rejects with.
 *
 * `message` is the sentence for the toast, as before. `fields` is the same
 * 400 broken out per input, so the form can put `indicators` under the
 * indicator picker rather than leaving the user to match a toast to a
 * control. Only the two trade writes carry it; nothing reads the rejected
 * payload of the others.
 */
export type TradeV2Rejection = { message: string; fields: Record<string, string> };

/** POST /trading_v2/trades/ — create (status=PAUSED) */
const createTrade = createAsyncThunk(
  "tradingV2/create",
  async (
    payload: { api: AxiosInstance; data: TradeV2Payload; onSuccess?: (trade: TradeV2) => void },
    thunkApi,
  ) => {
    try {
      const { data } = await payload.api.post<TradeV2>(BASE, withIds(payload.data));
      thunkApi.dispatch(upsertTradeV2(data));
      /* Everything that reads the trades list or the status chips, wherever
         it is mounted. Doing this in the thunk rather than at each call site
         is what keeps a page from having to know which other pages exist. */
      thunkApi.dispatch(revalidate(["trades", "status"]));
      success("Trade saved.");
      payload.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue({ message, fields: getFieldErrors(err) });
    }
  },
);

/** PATCH /trading_v2/trades/{id}/ — partial update */
const updateTrade = createAsyncThunk(
  "tradingV2/update",
  async (
    payload: {
      api: AxiosInstance;
      id: number;
      data: TradeV2Payload;
      onSuccess?: (trade: TradeV2) => void;
    },
    thunkApi,
  ) => {
    try {
      const { data } = await payload.api.patch<TradeV2>(`${BASE}${payload.id}/`, withIds(payload.data));
      thunkApi.dispatch(upsertTradeV2(data));
      thunkApi.dispatch(revalidate(["trades", "status"]));
      success("Trade updated.");
      payload.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue({ message, fields: getFieldErrors(err) });
    }
  },
);

/** DELETE /trading_v2/trades/{id}/ */
const deleteTrade = createAsyncThunk(
  "tradingV2/delete",
  async (payload: { api: AxiosInstance; id: number; onSuccess?: () => void }, thunkApi) => {
    try {
      await payload.api.delete(`${BASE}${payload.id}/`);
      thunkApi.dispatch(removeTradeV2(payload.id));
      thunkApi.dispatch(revalidate(["trades", "status"]));
      success("Trade deleted.");
      payload.onSuccess?.();
      return payload.id;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/** POST /trading_v2/trades/{id}/start/ */
const startTrade = createAsyncThunk(
  "tradingV2/start",
  async (payload: { api: AxiosInstance; id: number; onSuccess?: (t: TradeV2) => void }, thunkApi) => {
    try {
      const { data } = await payload.api.post<TradeV2>(`${BASE}${payload.id}/start/`);
      thunkApi.dispatch(upsertTradeV2(data));
      thunkApi.dispatch(revalidate(["trades", "status"]));
      success("Trade started.");
      payload.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/** POST /trading_v2/trades/{id}/pause/ */
const pauseTrade = createAsyncThunk(
  "tradingV2/pause",
  async (payload: { api: AxiosInstance; id: number; onSuccess?: (t: TradeV2) => void }, thunkApi) => {
    try {
      const { data } = await payload.api.post<TradeV2>(`${BASE}${payload.id}/pause/`);
      thunkApi.dispatch(upsertTradeV2(data));
      thunkApi.dispatch(revalidate(["trades", "status"]));
      success("Trade paused.");
      payload.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/* ================= Bots (v2) ================= */

const BOTS = "/trading_v2/bots/";

/** GET /trading_v2/bots/ */
const listBots = createAsyncThunk(
  "tradingV2/bots/list",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get<BotV2[]>(BOTS);
      const bots = Array.isArray(data) ? data : [];
      thunkApi.dispatch(setBotsV2(bots));
      return bots;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

/** GET /trading_v2/bots/{id}/ */
const getBot = createAsyncThunk(
  "tradingV2/bots/get",
  async (payload: { api: AxiosInstance; id: number }, thunkApi) => {
    try {
      const { data } = await payload.api.get<BotV2>(`${BOTS}${payload.id}/`);
      thunkApi.dispatch(upsertBotV2(data));
      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

/** POST /trading_v2/bots/ — dev_key is returned once, in full */
const createBot = createAsyncThunk(
  "tradingV2/bots/create",
  async (
    payload: { api: AxiosInstance; data: BotV2Payload; onSuccess?: (bot: BotV2) => void },
    thunkApi,
  ) => {
    try {
      const { data } = await payload.api.post<BotV2>(BOTS, payload.data);
      thunkApi.dispatch(upsertBotV2(data));
      success("Bot added.");
      payload.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/** PATCH /trading_v2/bots/{id}/ */
const updateBot = createAsyncThunk(
  "tradingV2/bots/update",
  async (
    payload: {
      api: AxiosInstance;
      id: number;
      data: BotV2Payload;
      onSuccess?: (bot: BotV2) => void;
    },
    thunkApi,
  ) => {
    try {
      const { data } = await payload.api.patch<BotV2>(`${BOTS}${payload.id}/`, payload.data);
      thunkApi.dispatch(upsertBotV2(data));
      /* ONLY the prompt, the model and the decision style restart a bot's
         review-readiness count. Renaming it, or editing its note, webhook,
         timeout or alerts, does not — so those must not trigger a re-read
         that would make the meter look as though it had moved. */
      if (
        "prompt" in payload.data ||
        "model_name" in payload.data ||
        "decision_style" in payload.data
      ) {
        thunkApi.dispatch(revalidate(["reviewReadiness"]));
      }
      success("Bot updated.");
      payload.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/** DELETE /trading_v2/bots/{id}/ */
const deleteBot = createAsyncThunk(
  "tradingV2/bots/delete",
  async (payload: { api: AxiosInstance; id: number; onSuccess?: () => void }, thunkApi) => {
    try {
      await payload.api.delete(`${BOTS}${payload.id}/`);
      thunkApi.dispatch(removeBotV2(payload.id));
      success("Bot removed.");
      payload.onSuccess?.();
      return payload.id;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/** POST /trading_v2/bots/{id}/pause/ */
const pauseBot = createAsyncThunk(
  "tradingV2/bots/pause",
  async (payload: { api: AxiosInstance; id: number }, thunkApi) => {
    try {
      const { data } = await payload.api.post<BotV2>(`${BOTS}${payload.id}/pause/`);
      thunkApi.dispatch(upsertBotV2(data));
      thunkApi.dispatch(revalidate(["botHealth", "status"]));
      success("Bot paused.");
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/** POST /trading_v2/bots/{id}/resume/ — also resets the failure count */
const resumeBot = createAsyncThunk(
  "tradingV2/bots/resume",
  async (payload: { api: AxiosInstance; id: number }, thunkApi) => {
    try {
      const { data } = await payload.api.post<BotV2>(`${BOTS}${payload.id}/resume/`);
      thunkApi.dispatch(upsertBotV2(data));
      thunkApi.dispatch(revalidate(["botHealth", "status"]));
      success("Bot resumed.");
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/** POST /trading_v2/bots/{id}/regenerate-key/ — old key stops working immediately */
const regenerateBotKey = createAsyncThunk(
  "tradingV2/bots/regenerateKey",
  async (
    payload: { api: AxiosInstance; id: number; onSuccess?: (devKey: string) => void },
    thunkApi,
  ) => {
    try {
      const { data } = await payload.api.post<{ status: string; dev_key: string }>(
        `${BOTS}${payload.id}/regenerate-key/`,
      );
      if (data?.dev_key) {
        thunkApi.dispatch(patchBotV2({ id: payload.id, changes: { dev_key: data.dev_key } }));
        payload.onSuccess?.(data.dev_key);
        success("New developer key issued.");
      }
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  },
);

/** POST /trading_v2/bots/test-connection/ — never throws on a connection failure */
const testBotConnection = createAsyncThunk(
  "tradingV2/bots/testConnection",
  async (payload: { api: AxiosInstance; webhook_url: string }, thunkApi) => {
    try {
      const { data } = await payload.api.post<BotV2TestResult>(
        `${BOTS}test-connection/`,
        { webhook_url: payload.webhook_url },
      );
      return data as BotV2TestResult;
    } catch (err: any) {
      // The endpoint shouldn't raise on a bad webhook, but a real network / auth
      // error can still land here — surface it as a displayable failed result.
      return {
        ok: false,
        error: getErrorMessage(err),
      } as BotV2TestResult;
    }
  },
);

/** GET /trading_v2/limits/ — running bots / exchanges against the plan, so the
    UI can disable an action before the backend refuses it. Resolves to null on
    failure (the backend still enforces the limit with a readable 403). */
const getLimits = async (api: AxiosInstance): Promise<TradingLimitsV2 | null> => {
  try {
    const { data } = await api.get("/trading_v2/limits/");
    const body = unwrapV2<any>(data);
    return body?.agents ? (body as TradingLimitsV2) : null;
  } catch {
    return null;
  }
};

/* ================= Bot decisions & health (v2) =================

   All four are read-only, and all four are plain async functions rather than
   thunks: the same endpoint is read with different filters on several screens
   at once (the whole timeline, one bot's last ten, one trade's), so a single
   shared array in the store would have them overwriting each other. Each
   caller keeps its own page. Same pattern as getLimits above.

   Errors are thrown with the backend's own `message` so the caller can show
   it; a 404 is always "Not found." and also covers a record that exists but
   belongs to someone else, deliberately, so ids cannot be probed. */

/** GET /trading_v2/decisions/ — newest first, across all of the user's bots.
    `count` is the total, for paging; `results` is this page. */
const listDecisions = async (
  api: AxiosInstance,
  query: BotDecisionsV2Query = {},
): Promise<BotDecisionsV2Page> => {
  // An `undefined` filter must not be sent: `?bot=undefined` is a 400
  // ("bot: Must be an id."), which usually just means the filter state had
  // not been set yet.
  const params: Record<string, string | number> = {};
  if (query.book) params.book = query.book;
  if (query.bot != null) params.bot = query.bot;
  if (query.trade != null) params.trade = query.trade;
  if (query.decision) params.decision = query.decision;
  if (query.risk) params.risk = query.risk;
  if (query.limit != null) params.limit = query.limit;
  if (query.offset != null) params.offset = query.offset;
  try {
    const { data } = await api.get("/trading_v2/decisions/", { params });
    return unwrapPageV2<BotDecisionsV2Page["results"][number]>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/** GET /trading_v2/decisions/{id}/ — the row plus `market_data_ids`. Bare. */
const getDecision = async (
  api: AxiosInstance,
  id: number,
): Promise<BotDecisionV2Detail> => {
  try {
    const { data } = await api.get(`/trading_v2/decisions/${id}/`);
    return unwrapV2<BotDecisionV2Detail>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/** GET /trading_v2/bots/{id}/health/ — one bot's reliability record. */
const getBotHealth = async (api: AxiosInstance, id: number): Promise<BotHealthV2> => {
  try {
    const { data } = await api.get(`${BOTS}${id}/health/`);
    return unwrapV2<BotHealthV2>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/** GET /trading_v2/bots/health/ — the fleet at a glance. A user with no bots
    gets zeroes and an empty `bots` array, not an error. */
const getFleetHealth = async (api: AxiosInstance): Promise<FleetHealthV2> => {
  try {
    const { data } = await api.get(`${BOTS}health/`);
    return unwrapV2<FleetHealthV2>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/* ================= Metrics (v2) =================
   Money, derived from recorded fills only. Both of these are plain async
   functions rather than thunks, like the health pair above: a page reads them
   into local state next to figures it already has, and nothing else in the
   app needs them in the store.

   `window_days` is always sent explicitly even though the server defaults to
   30 — the labels on screen say "· 30d", and a changed server default would
   silently make them lie. A filter with no value is never sent at all, the
   same rule as the decisions list.
   ================================================================ */

/** GET /trading_v2/metrics/ — portfolio PnL, risk and win rate.
 *
 *  `account_equity`, `change_today` and `max_drawdown` come back null today,
 *  each with its reason in `unavailable`; read them through `metricRead` in
 *  `lib/tradingV2Metrics.ts` so the reason is shown rather than a zero. */
const getPortfolioMetrics = async (
  api: AxiosInstance,
  query: PortfolioMetricsV2Query = {},
): Promise<PortfolioMetricsV2> => {
  const params: Record<string, string | number> = {};
  if (query.book) params.book = query.book;
  if (query.venue) params.venue = query.venue;
  if (query.window_days != null) params.window_days = query.window_days;
  try {
    const { data } = await api.get("/trading_v2/metrics/", { params });
    return unwrapV2<PortfolioMetricsV2>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/** GET /trading_v2/positions/ — positions with their orders and fills.
 *
 *  `?status=open` is the open-positions card; no filter is every position,
 *  open and closed, for "All positions". One book per call — the caller's
 *  current one unless `book` names another, and the response says which.
 *
 *  Never sum `at_risk` across these without checking each row's
 *  `unavailable`: a position with no stop reports null, not zero. */
const listPositions = async (
  api: AxiosInstance,
  query: PositionsV2Query = {},
): Promise<PositionsV2Page> => {
  const params: Record<string, string | number> = {};
  if (query.book) params.book = query.book;
  if (query.status) params.status = query.status;
  if (query.trade != null) params.trade = query.trade;
  if (query.venue) params.venue = query.venue;
  if (query.limit != null) params.limit = query.limit;
  if (query.offset != null) params.offset = query.offset;
  try {
    const { data } = await api.get("/trading_v2/positions/", { params });
    const page = unwrapPageV2<PositionV2>(data);
    return {
      book: data?.book ?? null,
      as_of: data?.as_of ?? null,
      count: page.count,
      results: page.results,
    };
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/** GET /trading_v2/positions/{id}/ — one position, inside `data`. */
const getPosition = async (api: AxiosInstance, id: number): Promise<PositionV2> => {
  try {
    const { data } = await api.get(`/trading_v2/positions/${id}/`);
    return unwrapDataV2<PositionV2>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/** GET /trading_v2/status/ — the hero's three chips.
 *
 *  No parameters. `overall` is "down" when a stop could be missed or nothing
 *  can reach KuCoin, "degraded" when something else is wrong, else "ok".
 *  The exchange check is one read-only call to KuCoin cached for a minute, so
 *  a revoked key surfaces here within a minute. */
const getStatus = async (api: AxiosInstance): Promise<TradingStatusV2> => {
  try {
    const { data } = await api.get("/trading_v2/status/");
    return unwrapV2<TradingStatusV2>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/** GET /trading_v2/trades/{id}/metrics/ — PnL and risk for one trade.
 *
 *  Counts only the positions THIS TRADE opened. The old venue+symbol matching
 *  is gone, and with it the rule that these could never be compared between
 *  trades. What it does not count is `unattributed_positions` — positions on
 *  the same market that no trade opened at all.
 *
 *  No `book`: a trade's mode is fixed when it is created, so this always
 *  answers for the trade's own. */
const getTradeMetrics = async (
  api: AxiosInstance,
  id: number,
  query: TradeMetricsV2Query = {},
): Promise<TradeMetricsV2> => {
  const params: Record<string, string | number> = {};
  if (query.window_days != null) params.window_days = query.window_days;
  try {
    const { data } = await api.get(`${BASE}${id}/metrics/`, { params });
    return unwrapV2<TradeMetricsV2>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/**
 * GET /trading_v2/bots/{id}/metrics/ — one bot's money, in one book.
 *
 * Counts the positions this bot's DECISIONS opened, not every position on the
 * trades that point at it, so the figures survive a trade's bot being
 * swapped. It replaces assembling a bot's PnL in the browser out of per-trade
 * metrics, which double-counted any pair two trades shared and could not
 * average a winner against a loser at all.
 */
const getBotMetrics = async (
  api: AxiosInstance,
  id: number,
  query: BotMetricsV2Query = {},
): Promise<BotMetricsV2> => {
  const params: Record<string, string | number> = {};
  if (query.book) params.book = query.book;
  if (query.window_days != null) params.window_days = query.window_days;
  try {
    const { data } = await api.get(`${BOTS}${id}/metrics/`, { params });
    return unwrapV2<BotMetricsV2>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/**
 * GET /trading_v2/bots/{id}/review-readiness/ — can this bot be reviewed yet.
 *
 * The bar is **20 closed trades on the current prompt**, both books counted —
 * not 20 decisions, which is a different and much easier thing to reach. Only
 * a change to the prompt, model or decision style restarts the count, which
 * is what `prompt_changed_at` marks; `updated_at` moves on any edit at all
 * and must not be used for it.
 */
const getBotReviewReadiness = async (
  api: AxiosInstance,
  id: number,
): Promise<BotReviewReadinessV2> => {
  try {
    const { data } = await api.get(`${BOTS}${id}/review-readiness/`);
    return unwrapV2<BotReviewReadinessV2>(data);
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/* ================= History (v2) ================= */

const HISTORY = "/trading_v2/history/";

/** Query parameters, built once so the list and the CSV export cannot drift
 *  apart about what they are showing. An absent filter is never sent: the
 *  server rejects `?bot=undefined`, and an unset filter usually just means
 *  the page has not finished mounting. */
const historyParams = (query: HistoryV2Query): Record<string, string | number> => {
  const params: Record<string, string | number> = {};
  if (query.book) params.book = query.book;
  /* `from`/`to` override `days`, so sending both invites a disagreement
     between the rows and the heading above them. */
  if (query.from || query.to) {
    if (query.from) params.from = query.from;
    if (query.to) params.to = query.to;
  } else if (query.days != null) {
    params.days = query.days;
  }
  if (query.tz) params.tz = query.tz;
  if (query.bot != null) params.bot = query.bot;
  if (query.trade != null) params.trade = query.trade;
  if (query.pair) params.pair = query.pair;
  if (query.exit) params.exit = query.exit;
  if (query.limit != null) params.limit = query.limit;
  if (query.offset != null) params.offset = query.offset;
  return params;
};

/**
 * GET /trading_v2/history/ — closed positions, with the summary, the per-bot
 * strip and the day groups the page shows.
 *
 * `summary`, `by_bot` and `days` cover everything the filters match, NOT just
 * the rows in `results` — so none of them may be recomputed from the page on
 * screen. A plan that caps the window answers with 30 days and
 * `record_limited: true` rather than an error.
 */
const getHistory = async (api: AxiosInstance, query: HistoryV2Query = {}): Promise<HistoryV2> => {
  try {
    const { data } = await api.get(HISTORY, { params: historyParams(query) });
    const body = unwrapV2<any>(data);
    const page = unwrapPageV2<HistoryV2["results"][number]>(body);
    return {
      ...(body as HistoryV2),
      summary: body?.summary ?? {},
      by_bot: Array.isArray(body?.by_bot) ? body.by_bot : [],
      days: Array.isArray(body?.days) ? body.days : [],
      count: page.count,
      results: page.results,
    };
  } catch (err: any) {
    throw new Error(getErrorMessage(err));
  }
};

/**
 * GET /trading_v2/history/export/ — the same rows as CSV, no paging.
 *
 * **Desk plan only**: anything else is a 403 carrying the upgrade sentence,
 * which is thrown here so the caller can show it. Fetched with the auth
 * header and handed back as a blob, since the browser cannot be sent to a
 * protected URL directly.
 */
const exportHistory = async (
  api: AxiosInstance,
  query: HistoryV2Query = {},
): Promise<{ blob: Blob; filename: string }> => {
  try {
    const res = await api.get(`${HISTORY}export/`, {
      params: historyParams({ ...query, limit: undefined, offset: undefined }),
      responseType: "blob",
    });
    /* The server names the file after the day it was taken; falling back to
       today keeps a download from landing as "download". */
    const disposition = String(res.headers?.["content-disposition"] ?? "");
    const match = disposition.match(/filename="?([^"]+)"?/i);
    return {
      blob: res.data as Blob,
      filename: match?.[1] || `candleweb-history-${new Date().toISOString().slice(0, 10)}.csv`,
    };
  } catch (err: any) {
    /* A blob response type makes an error body a Blob too, so the usual
       reader finds no `message` on it and would report the raw Axios text
       instead of the plan sentence the user needs. */
    const body = (err as AxiosError)?.response?.data as any;
    if (body instanceof Blob) {
      try {
        const parsed = JSON.parse(await body.text());
        throw new Error(parsed?.message || "Couldn't export your history.");
      } catch (parseErr: any) {
        if (parseErr?.message) throw parseErr;
      }
    }
    throw new Error(getErrorMessage(err));
  }
};

const tradingV2Service = {
  listTrades,
  getTrade,
  createTrade,
  updateTrade,
  deleteTrade,
  startTrade,
  pauseTrade,
  listBots,
  getBot,
  createBot,
  updateBot,
  deleteBot,
  pauseBot,
  resumeBot,
  regenerateBotKey,
  testBotConnection,
  getLimits,
  listDecisions,
  getDecision,
  getBotHealth,
  getFleetHealth,
  getBotMetrics,
  getBotReviewReadiness,
  getHistory,
  exportHistory,
  getPortfolioMetrics,
  getTradeMetrics,
  getStatus,
  listPositions,
  getPosition,
};

export default tradingV2Service;
