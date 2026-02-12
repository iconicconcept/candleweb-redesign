import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import {
  setExchangeList,
  setExchangeRecord,
} from "../redux/slices/exchangeSlice";
import { AxiosError, AxiosInstance } from "axios";
import { ExchangeData } from "../components/dashboard/modal/AddExchange";
import { success } from "../components/alert/Toast";
import userService from "./userService";

const getExchanges = createAsyncThunk(
  "/exchange/list/",
  async (_, thunkApi) => {
    try {
      const { data } = await axiosApi.get("/exchange/list/");

      thunkApi.dispatch(setExchangeList(data));

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const getExchangeRecords = createAsyncThunk(
  "/exchange/record/",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/exchange/record/");

      thunkApi.dispatch(setExchangeRecord(data));

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const addExchange = createAsyncThunk(
  "/exchange/record/",
  async (
    payload: {
      axiosToken: AxiosInstance;
      data: ExchangeData;
    },
    thunkApi
  ) => {
    try {
      const { data } = await payload.axiosToken.post(
        "/exchange/record/",
        payload.data
      );

      thunkApi.dispatch(userService.getBalance(payload.axiosToken));
      success(data.message);

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const deleteExchange = createAsyncThunk(
  "/exchange/record/delete",
  async (
    payload: {
      api: AxiosInstance;
      id: number | string;
    },
    thunkApi
  ) => {
    try {
      const { data } = await payload.api.delete(
        `/exchange/record/${payload.id}`
      );

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const exchangeServices = {
  getExchanges,
  addExchange,
  getExchangeRecords,
  deleteExchange,
};

export default exchangeServices;
