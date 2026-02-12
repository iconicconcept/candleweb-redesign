import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import {
  setCurrentPlan,
  setPaymentId,
  setSubscription,
  setSubscriptionHistory,
} from "../redux/slices/subscriptionSlice";
import { AxiosError, AxiosInstance } from "axios";
import { error, success } from "../components/alert/Toast";
import { AccountSubscription } from "../types/subscription";
import notificationService from "./notificationService";

const getSubscriptionList = createAsyncThunk(
  "/subscription/retrieve/all/",
  async (_, thunkApi) => {
    try {
      const { data } = await axiosApi.get("/subscription/retrieve/all/");

      thunkApi.dispatch(setSubscription(data));

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const getPaymentId = createAsyncThunk(
  "/subscription/payment/methods/all/",
  async (_, thunkApi) => {
    try {
      const { data } = await axiosApi.get("/subscription/payment/methods/all/");

      thunkApi.dispatch(setPaymentId(data));

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const getSubscriptionById = createAsyncThunk(
  "/subscription/retrieve/",
  async (id: string | number, thunkApi) => {
    try {
      const { data } = await axiosApi.get(`/subscription/retrieve/${id}`);

      thunkApi.dispatch(setSubscription(data));

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const getSubscriptionHistoryList = createAsyncThunk(
  "/subscription/user/history/",
  async (axiosToken: AxiosInstance, thunkApi) => {
    try {
      const { data } = await axiosToken.get("/subscription/user/history/");

      thunkApi.dispatch(setSubscriptionHistory(data));

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const cancelSubscription = createAsyncThunk(
  "/subscription/cancel/",
  async (payload: { api: AxiosInstance; id: string | number }, thunkApi) => {
    try {
      const { data } = await payload.api.get(
        `/subscription/cancel/${payload.id}`
      );

      success(data.message);
      thunkApi.dispatch(getSubscriptionHistoryList(payload.api));
      thunkApi.dispatch(setCurrentPlan({}));
      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      error((e.response?.data as any).message);
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const createSubscription = createAsyncThunk(
  "/subscription/user/",
  async (
    payload: {
      api: AxiosInstance;
      data: {
        subscription_id: number;
        transaction_hash: string;
        expiry_date: string;
        payment_id: number;
        tokens: number;
      };
      onSuccess: (data: AccountSubscription[]) => void;
    },
    thunkApi
  ) => {
    try {
      const { data } = await payload.api.post(
        `/subscription/user/`,
        payload.data
      );

      if (data.status === "success") {
        thunkApi.dispatch(getSubscriptionHistoryList(payload.api));
        thunkApi.dispatch(
          notificationService.getNotifications({ api: payload.api })
        );
        success(data.message);
        if (
          data.account_subscription !== null &&
          Object.keys(data.account_subscription).length !== 0
        ) {
          // console.log({ data });
          payload.onSuccess(data.account_subscription);
        }
      }
      return data;
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
      return thunkApi.rejectWithValue(message);
    }
  }
);

const subscriptionService = {
  getSubscriptionList,
  getSubscriptionHistoryList,
  cancelSubscription,
  getSubscriptionById,
  createSubscription,
  getPaymentId,
};

export default subscriptionService;
