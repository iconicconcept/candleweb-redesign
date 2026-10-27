import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import tradingV2Service from "../../services/tradingV2Service";
import { BookV2Param, TradeV2, BotV2 } from "../../types/tradingV2";

interface TradingV2State {
  /**
   * Which book the cached rows below belong to.
   *
   * `trades` is book-scoped — a Live dashboard must not list demo trades, nor
   * add their allocation into its capital — but this slice outlives the page
   * that filled it, so without this the rows from one book stay on screen
   * after the Settings switch flips, and keep being summed. `setBookV2`
   * clears them the moment the book changes; see `useBookSync`.
   *
   * Bots are not themselves book-scoped, but every figure attached to one is,
   * so they are cleared alongside rather than left wearing the other book's
   * numbers.
   */
  book: BookV2Param | null;
  trades: TradeV2[];
  tradesLoaded: boolean;
  tradesLoading: boolean;
  /* Why a separate flag and not `loaded` on failure: a failed list is not an
     empty one. Pages key their "nothing here yet, let's set you up" state off
     `loaded && length === 0`, so marking a rejected fetch as loaded would greet
     someone with bots and trades as a new user. Leaving both false was the
     other half of the problem — the page then showed its loading line forever.
     The error is its own state. */
  tradesError: string | null;
  bots: BotV2[];
  botsLoaded: boolean;
  botsLoading: boolean;
  botsError: string | null;
}

const initialState: TradingV2State = {
  book: null,
  trades: [],
  tradesLoaded: false,
  tradesLoading: false,
  tradesError: null,
  bots: [],
  botsLoaded: false,
  botsLoading: false,
  botsError: null,
};

export const tradingV2Slice = createSlice({
  name: "tradingV2",
  initialState,
  reducers: {
    /**
     * Name the book these rows belong to, clearing them if it changed.
     *
     * Idempotent on purpose: it is dispatched from every dashboard page on
     * every render of the shell, so the common case has to be a no-op. Only a
     * genuine change throws anything away — and when it does it resets the
     * `loaded` flags too, so a page shows its loading state rather than the
     * other book's rows while the refetch is in the air. Clearing the rows
     * but keeping `loaded` would read as "you have no trades", which is the
     * one wrong answer here.
     */
    setBookV2: (state, action: PayloadAction<BookV2Param>) => {
      if (state.book === action.payload) return;
      const first = state.book === null;
      state.book = action.payload;
      /* First sighting is not a change: the slice starts with no book, and
         wiping here would discard a fetch that a page had already started. */
      if (first) return;
      state.trades = [];
      state.tradesLoaded = false;
      state.tradesError = null;
      state.bots = [];
      state.botsLoaded = false;
      state.botsError = null;
    },
    setTradesV2: (state, action: PayloadAction<TradeV2[]>) => {
      state.trades = action.payload;
      state.tradesLoaded = true;
      state.tradesError = null;
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
      state.botsError = null;
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
        state.tradesError = null;
      })
      .addCase(tradingV2Service.listTrades.fulfilled, (state) => {
        state.tradesLoading = false;
      })
      .addCase(tradingV2Service.listTrades.rejected, (state, action) => {
        state.tradesLoading = false;
        state.tradesError = (action.payload as string) || "Could not load your trades.";
      })
      .addCase(tradingV2Service.listBots.pending, (state) => {
        state.botsLoading = true;
        state.botsError = null;
      })
      .addCase(tradingV2Service.listBots.fulfilled, (state) => {
        state.botsLoading = false;
      })
      .addCase(tradingV2Service.listBots.rejected, (state, action) => {
        state.botsLoading = false;
        state.botsError = (action.payload as string) || "Could not load your bots.";
      });
  },
});

export const {
  setBookV2,
  setTradesV2,
  upsertTradeV2,
  removeTradeV2,
  setBotsV2,
  upsertBotV2,
  patchBotV2,
  removeBotV2,
} = tradingV2Slice.actions;
export default tradingV2Slice.reducer;
