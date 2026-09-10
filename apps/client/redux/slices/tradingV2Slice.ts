import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import tradingV2Service from "../../services/tradingV2Service";
import { TradeV2, BotV2 } from "../../types/tradingV2";

interface TradingV2State {
  trades: TradeV2[];
  tradesLoaded: boolean;
  tradesLoading: boolean;
  bots: BotV2[];
  botsLoaded: boolean;
  botsLoading: boolean;
}

const initialState: TradingV2State = {
  trades: [],
  tradesLoaded: false,
  tradesLoading: false,
  bots: [],
  botsLoaded: false,
  botsLoading: false,
};

export const tradingV2Slice = createSlice({
  name: "tradingV2",
  initialState,
  reducers: {
    setTradesV2: (state, action: PayloadAction<TradeV2[]>) => {
      state.trades = action.payload;
      state.tradesLoaded = true;
    },
    upsertTradeV2: (state, action: PayloadAction<TradeV2>) => {
      const i = state.trades.findIndex((t) => t.id === action.payload.id);
      if (i > -1) state.trades[i] = action.payload;
      else state.trades.unshift(action.payload);
    },
    removeTradeV2: (state, action: PayloadAction<number>) => {
      state.trades = state.trades.filter((t) => t.id !== action.payload);
    },
    setBotsV2: (state, action: PayloadAction<BotV2[]>) => {
      state.bots = action.payload;
      state.botsLoaded = true;
    },
    upsertBotV2: (state, action: PayloadAction<BotV2>) => {
      const i = state.bots.findIndex((b) => b.id === action.payload.id);
      if (i > -1) state.bots[i] = action.payload;
      else state.bots.unshift(action.payload);
    },
    patchBotV2: (
      state,
      action: PayloadAction<{ id: number; changes: Partial<BotV2> }>,
    ) => {
      const i = state.bots.findIndex((b) => b.id === action.payload.id);
      if (i > -1) state.bots[i] = { ...state.bots[i], ...action.payload.changes };
    },
    removeBotV2: (state, action: PayloadAction<number>) => {
      state.bots = state.bots.filter((b) => b.id !== action.payload);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(tradingV2Service.listTrades.pending, (state) => {
        state.tradesLoading = true;
      })
      .addCase(tradingV2Service.listTrades.fulfilled, (state) => {
        state.tradesLoading = false;
      })
      .addCase(tradingV2Service.listTrades.rejected, (state) => {
        state.tradesLoading = false;
      })
      .addCase(tradingV2Service.listBots.pending, (state) => {
        state.botsLoading = true;
      })
      .addCase(tradingV2Service.listBots.fulfilled, (state) => {
        state.botsLoading = false;
      })
      .addCase(tradingV2Service.listBots.rejected, (state) => {
        state.botsLoading = false;
      });
  },
});

export const {
  setTradesV2,
  upsertTradeV2,
  removeTradeV2,
  setBotsV2,
  upsertBotV2,
  patchBotV2,
  removeBotV2,
} = tradingV2Slice.actions;
export default tradingV2Slice.reducer;
