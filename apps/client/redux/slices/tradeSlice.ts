// Import necessary modules and types
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  TradeOrder,
  TradePortfolioPairList,
  TradeProp,
  TradedYears,
  UserTradePortfolio,
  YearlyProfitAnalysisProp,
} from "../../types/trade";
import tradeService from "../../services/tradeService";

// Define the structure of the trade state
interface TradeState {
  activeTrade: TradeProp[];
  tradeOrders: TradeOrder[];
  chartActiveTrade: TradeProp[];
  chartTradeOrders: TradeOrder[];
  activeTradeLoading?: boolean;
  isLoading: boolean;
  tradePortfolio: UserTradePortfolio;
  tradePortfolioLoading: boolean;
  tradePairList: TradePortfolioPairList;
  tradeYears: TradedYears;
  yearAnalysis: YearlyProfitAnalysisProp[];
  selectedTradeYear: string;
  selectedTradePair: string;
  totalTradeAmount: number;
  totalTradeProfit: number;
}

// Define initial state for the trade slice
const initialState: TradeState = {
  activeTrade: [],
  chartActiveTrade: [],
  chartTradeOrders: [],
  activeTradeLoading: false,
  isLoading: false,
  tradeOrders: [],
  tradePortfolio: {},
  tradePortfolioLoading: false,
  tradePairList: {},
  tradeYears: {},
  yearAnalysis: [],
  selectedTradeYear: "",
  selectedTradePair: "",
  totalTradeAmount: 0,
  totalTradeProfit: 0,
};

// Create the trade slice using createSlice function
const tradeSlice = createSlice({
  name: "trade",
  initialState,
  reducers: {
    // Reducer to set the active trades and corresponding trade orders
    setActiveTrade: (state, action: PayloadAction<TradeProp[]>) => {
      state.tradeOrders = [];

      if (action.payload.length > 0) {
        state.activeTrade = action.payload;
        var allOrders: TradeOrder[] = [];
        for (var i = 0; i < action.payload.length; i++) {
          if (
            action.payload[i].trade_order &&
            action.payload[i].trade_order?.length! > 0
          ) {
            const tradeO = action.payload[i].trade_order!;
            let newTrade: TradeOrder[] = [];
            for (var j = 0; j < tradeO.length; j++) {
              tradeO[j].misc = action.payload[i].id;
              newTrade.push(tradeO[j]);
            }

            allOrders = [...state.tradeOrders, ...newTrade];
          }
        }

        state.tradeOrders = allOrders;
      }
    },
    setChartActiveTrade: (state, action: PayloadAction<TradeProp[]>) => {
      state.chartTradeOrders = [];

      if (action.payload.length > 0) {
        state.chartActiveTrade = action.payload;
        var allOrders: TradeOrder[] = [];
        for (var i = 0; i < action.payload.length; i++) {
          if (
            action.payload[i].trade_order &&
            action.payload[i].trade_order?.length! > 0
          ) {
            const tradeO = action.payload[i].trade_order!;
            let newTrade: TradeOrder[] = [];
            for (var j = 0; j < tradeO.length; j++) {
              tradeO[j].misc = action.payload[i].id;
              newTrade.push(tradeO[j]);
            }

            allOrders = [...state.chartTradeOrders, ...newTrade];
          }
        }

        state.chartTradeOrders = allOrders;
      }
    },
    // Reducer to set the user's trade portfolio
    setPortfolioTrade: (state, action: PayloadAction<UserTradePortfolio>) => {
      state.tradePortfolio = action.payload ?? {
        total_profit_margin: 0,
        total_loss_margin: 0,
        total_trades: 0,
        total_orders: 0,
      };
    },
    // Reducer to set the trade pair list
    setPairList: (state, action: PayloadAction<TradePortfolioPairList>) => {
      state.tradePairList = action.payload;
      state.selectedTradePair = action.payload.invested_pairs
        ? action.payload.invested_pairs![0].toString()
        : "";
    },
    // Reducer to set the traded years
    setYearList: (state, action: PayloadAction<TradedYears>) => {
      state.tradeYears = action.payload;
      state.selectedTradeYear = action.payload.trades_years
        ? action.payload.trades_years![0].toString()
        : "";
    },
    // Reducer to set the yearly profit analysis
    setYearAnalysis: (
      state,
      action: PayloadAction<YearlyProfitAnalysisProp[]>
    ) => {
      state.yearAnalysis = action.payload;
    },
    setTotalTradeAmount: (state, action: PayloadAction<number>) => {
      state.totalTradeAmount = action.payload;
    },
    setTotalTradeProfit: (state, action: PayloadAction<number>) => {
      state.totalTradeProfit = action.payload;
    },
  },
  extraReducers(builder) {
    // Common function to handle pending and fulfilled cases
    const handlePending = (state: TradeState) => {
      state.isLoading = true; // Set isLoading to true to indicate that an asynchronous action is in progress
    };

    // Common function to handle the rejected case
    const handleRejected = (state: TradeState) => {
      state.isLoading = false; // Set isLoading to false to indicate that the asynchronous action failed, rejected, or was successful
    };

    // Add extra reducers to handle different asynchronous actions using the tradeService
    builder
      .addCase(tradeService.getActiveTrade.rejected, (state, action) => {
        state.activeTradeLoading = false;
      })
      .addCase(tradeService.getActiveTrade.fulfilled, (state, action) => {
        state.activeTradeLoading = false;
      })
      .addCase(tradeService.getActiveTrade.pending, (state, action) => {
        state.activeTradeLoading = true;
      })
      .addCase(tradeService.getTradePairList.rejected, handleRejected)
      .addCase(tradeService.getTradePairList.fulfilled, handleRejected)
      .addCase(tradeService.getTradePairList.pending, handlePending)
      .addCase(tradeService.getTradePortfolio.rejected, (state, action) => {
        state.tradePortfolioLoading = false;
      })
      .addCase(tradeService.getTradePortfolio.fulfilled, (state, action) => {
        state.tradePortfolioLoading = false;
      })
      .addCase(tradeService.getTradePortfolio.pending, (state, action) => {
        state.tradePortfolioLoading = true;
      })
      .addCase(tradeService.createTrade.fulfilled, handleRejected)
      .addCase(tradeService.createTrade.rejected, handleRejected)
      .addCase(tradeService.createTrade.pending, handlePending)
      .addCase(tradeService.getYearlProfitAnalysis.fulfilled, handleRejected)
      .addCase(tradeService.getYearlProfitAnalysis.rejected, handleRejected)
      .addCase(tradeService.getYearlProfitAnalysis.pending, handlePending)
      .addCase(tradeService.getTotalTradeAmount.fulfilled, handleRejected)
      .addCase(tradeService.getTotalTradeAmount.rejected, handleRejected)
      .addCase(tradeService.getTotalTradeAmount.pending, handlePending)
      .addCase(tradeService.getTotalTradeProfit.fulfilled, handleRejected)
      .addCase(tradeService.getTotalTradeProfit.rejected, handleRejected)
      .addCase(tradeService.getTotalTradeProfit.pending, handlePending);
  },
});

// Export individual action creators and the reducer
export const {
  setActiveTrade,
  setChartActiveTrade,
  setPairList,
  setPortfolioTrade,
  setYearAnalysis,
  setYearList,
  setTotalTradeAmount,
  setTotalTradeProfit,
} = tradeSlice.actions;
export default tradeSlice.reducer;
