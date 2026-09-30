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
  TradeV2,
  TradeV2Payload,
  BotV2,
  BotV2Payload,
  BotV2TestResult,
  TradingLimitsV2,
} from "../types/tradingV2";

const BASE = "/trading_v2/trades/";

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

/** GET /trading_v2/trades/ — list my trades */
const listTrades = createAsyncThunk(
  "tradingV2/list",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get<TradeV2[]>(BASE);
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
      success("Trade saved.");
      payload.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
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
      success("Trade updated.");
      payload.onSuccess?.(data);
      return data;
    } catch (err: any) {
      const message = getErrorMessage(err);
      error(message);
      return thunkApi.rejectWithValue(message);
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
    const body = data && typeof data === "object" && "data" in data ? (data as any).data : data;
    return body?.agents ? (body as TradingLimitsV2) : null;
  } catch {
    return null;
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
};

export default tradingV2Service;
