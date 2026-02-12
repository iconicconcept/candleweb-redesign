// Import necessary modules and types
import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError, AxiosInstance } from "axios"; // Import AxiosError and AxiosInstance types
import {
  setActiveTrade,
  setChartActiveTrade,
  setPairList,
  setPortfolioTrade,
  setTotalTradeAmount,
  setTotalTradeProfit,
  setYearAnalysis,
  setYearList,
} from "../redux/slices/tradeSlice"; // Import relevant action creators from the tradeSlice
import { AddTradeProp } from "../types/trade"; // Import relevant type
import { error, success } from "../components/alert/Toast"; // Import toast notifications
import notificationService from "./notificationService";
import { axiosApi } from "../lib/axiosApi";

// Create an async thunk to fetch active trades
const getActiveTrade = createAsyncThunk(
  "/trade/active/", // Action type prefix
  async (
    payload: {
      api: AxiosInstance;
      interval: string;
      isChart?: boolean;
    },
    thunkApi
  ) => {
    try {
      const { data } = await payload.api.get(
        "/trade/active/" +
          (payload.interval.length > 0
            ? "?time_interval=" + payload.interval
            : "")
      ); // Fetch active trade data using the provided Axios instance
      if (Array.isArray(data)) {
        if (payload.isChart) {
          thunkApi.dispatch(setChartActiveTrade(data)); // Dispatch the setActiveTrade action creator from tradeSlice
        } else {
          thunkApi.dispatch(setActiveTrade(data)); // Dispatch the setActiveTrade action creator from tradeSlice
        }
      } else {
        if (payload.isChart) {
          thunkApi.dispatch(setChartActiveTrade([]));
        } else {
          thunkApi.dispatch(setActiveTrade([]));
        }
      }

      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to fetch active trades
const getTotalTradeAmount = createAsyncThunk(
  "/trade/total/amount/", // Action type prefix
  async (_, thunkApi) => {
    try {
      const { data } = await axiosApi.get("/trade/total/amount/"); // Fetch active trade data using the provided Axios instance

      thunkApi.dispatch(setTotalTradeAmount(data.total_amount ?? 0)); // Dispatch the setActiveTrade action creator from tradeSlice

      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to fetch active trades
const getTotalTradeProfit = createAsyncThunk(
  "/trade/total/profit/", // Action type prefix
  async (_, thunkApi) => {
    try {
      const { data } = await axiosApi.get("/trade/total/profit/"); // Fetch active trade data using the provided Axios instance

      thunkApi.dispatch(setTotalTradeProfit(data.total_profit ?? 0)); // Dispatch the setActiveTrade action creator from tradeSlice

      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to fetch user's trade portfolio
const getTradePortfolio = createAsyncThunk(
  "/trade/portfolio/", // Action type prefix
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/trade/portfolio/"); // Fetch trade portfolio data using the provided Axios instance
      thunkApi.dispatch(setPortfolioTrade(data[0])); // Dispatch the setPortfolioTrade action creator from tradeSlice

      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to fetch trade pair list for profit analysis
const getTradePairList = createAsyncThunk(
  "/trade/portfolio/profit/pair/list/", // Action type prefix
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/trade/portfolio/profit/pair/list/"); // Fetch trade pair list data using the provided Axios instance

      if (data[0].invested_pairs.length > 0) {
        thunkApi.dispatch(setPairList(data[0])); // Dispatch the setPairList action creator from tradeSlice
        thunkApi.dispatch(
          getTradeYearList({ api, pair: data[0].invested_pairs[0] }) // Fetch trade year list based on the first pair in the list
        );
      }
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to fetch trade year list for profit analysis
const getTradeYearList = createAsyncThunk(
  "/trade/portfolio/profit/year/list/", // Action type prefix
  async (payload: { api: AxiosInstance; pair: string }, thunkApi) => {
    try {
      const { data } = await payload.api.get(
        "/trade/portfolio/profit/year/list/"
      ); // Fetch trade year list data using the provided Axios instance

      if (data.trades_years.length > 0) {
        thunkApi.dispatch(setYearList(data)); // Dispatch the setYearList action creator from tradeSlice
        thunkApi.dispatch(
          getYearlyProfitAnalysis({
            api: payload.api,
            year: data.trades_years[data.trades_years.length - 1],
            pair: payload.pair,
          }) // Fetch yearly profit analysis based on the first year in the list
        );
      }
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to create a new trade
const createTrade = createAsyncThunk(
  "/trade/new/", // Action type prefix
  async (payload: { api: AxiosInstance; data: AddTradeProp }, thunkApi) => {
    try {
      const { data } = await payload.api.post("/trade/new/", payload.data); // Create a new trade using the provided Axios instance
      thunkApi.dispatch(
        getActiveTrade({ api: payload.api, interval: "24hrs" })
      ); // Fetch active trade data after creating the trade
      thunkApi.dispatch(
        notificationService.getNotifications({ api: payload.api })
      ); // Fetch new notifications data after creating the trade
      thunkApi.dispatch(getTradePortfolio(payload.api));
      thunkApi.dispatch(getTradePairList(payload.api));
      success(data.message); // Display success toast notification
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError;
      const message =
        (e.response && e.response.data && (e.response?.data as any).message) ||
        (e.response?.data as any).username[0] ||
        (e.response?.data as any).wallet_address[0] ||
        (e.response?.data as any).email[0] ||
        e.message ||
        e.toString();
      error(message);
      return thunkApi.rejectWithValue(message); // Reject with error message if creation fails
    }
  }
);

// Create an async thunk to cancel a trade
const cancelTrade = createAsyncThunk(
  "/trade/cancel/", // Action type prefix
  async (payload: { api: AxiosInstance; id: number }, thunkApi) => {
    try {
      const { data } = await payload.api.get(`/trade/cancel/${payload.id}/`); // Cancel a trade using the provided Axios instance
      success("Trade has been cancelled."); // Display success toast notification
      thunkApi.dispatch(
        getActiveTrade({ api: payload.api, interval: "6months" })
      ); // Fetch active trade data after cancelling the trade
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError;
      const message =
        (e.response && e.response.data && (e.response?.data as any).message) ||
        (e.response?.data as any).username[0] ||
        (e.response?.data as any).wallet_address[0] ||
        (e.response?.data as any).email[0] ||
        e.message ||
        e.toString();
      error(message);
      return thunkApi.rejectWithValue(message); // Reject with error message if creation fails
    }
  }
);

// Create an async thunk to resume a stopped trade
const resumeTrade = createAsyncThunk(
  "/trade/activate/", // Action type prefix
  async (payload: { api: AxiosInstance; id: number }, thunkApi) => {
    try {
      const { data } = await payload.api.get(`/trade/activate/${payload.id}/`); // Resume a trade using the provided Axios instance
      success("Trade resumed successfully"); // Display success toast notification
      thunkApi.dispatch(
        getActiveTrade({ api: payload.api, interval: "6months" })
      ); // Fetch active trade data after cancelling the trade
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError;
      const message =
        (e.response && e.response.data && (e.response?.data as any).message) ||
        (e.response?.data as any).username[0] ||
        (e.response?.data as any).wallet_address[0] ||
        (e.response?.data as any).email[0] ||
        e.message ||
        e.toString();
      error(message);
      return thunkApi.rejectWithValue(message); // Reject with error message if creation fails
    }
  }
);

// Create an async thunk to fetch yearly profit analysis for a trade pair
const getYearlyProfitAnalysis = createAsyncThunk(
  "/trade/portfolio/profit/analysis/", // Action type prefix
  async (
    payload: { api: AxiosInstance; year: number | string; pair: string },
    thunkApi
  ) => {
    try {
      const { data } = await payload.api.get(
        `/trade/portfolio/profit/analysis/${payload.year}/${payload.pair}`
      ); // Fetch yearly profit analysis data using the provided Axios instance
      thunkApi.dispatch(setYearAnalysis(data)); // Dispatch the setYearAnalysis action creator from tradeSlice
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      error((e.response?.data as any).message); // Display error toast notification
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create a tradeService object with the async thunks
const tradeService = {
  getActiveTrade,
  getTradePortfolio,
  getTradePairList,
  createTrade,
  cancelTrade,
  getYearlProfitAnalysis: getYearlyProfitAnalysis,
  resumeTrade,
  getTotalTradeProfit,
  getTotalTradeAmount,
};

export default tradeService; // Export the tradeService object
