/**
 * This module defines a collection of async thunk functions that interact with
 * the backend API for managing user referrals. It uses Redux Toolkit's createAsyncThunk
 * to handle asynchronous actions and API requests.
 */

import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError, AxiosInstance } from "axios";
import {
  setSubscribedReferral,
  setUnsubscribedReferral,
  setUserRecord,
} from "../redux/slices/referralSlice";
import { success } from "../components/alert/Toast";
import userService from "./userService";

/**
 * Async thunk to fetch the user's referral record from the API.
 *
 * @param {AxiosInstance} api - The Axios instance for making API requests.
 * @param {Object} thunkApi - The Redux Toolkit's `thunkApi` object.
 * @returns {Promise} A Promise that resolves to the fetched referral record data.
 */
const getUserReferral = createAsyncThunk(
  "/referral/user/referral/record/",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/referral/user/referral/record/");

      // Dispatching the fetched data to update the user's referral record in the Redux store
      thunkApi.dispatch(setUserRecord(data));

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const getUnsubscribedReferral = createAsyncThunk(
  "/referral/user/referral/unsubscribed/",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/referral/user/referral/unsubscribed/");

      thunkApi.dispatch(setUnsubscribedReferral(data));
      return data.results;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

const getSubscribedReferral = createAsyncThunk(
  "/referral/user/referral/subscribed/",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/referral/user/referral/subscribed/");

      thunkApi.dispatch(setSubscribedReferral(data));

      return data.results;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

/**
 * Async thunk to claim a reward associated with a referral.
 *
 * @param {Object} payload - The payload containing API instance and referral data.
 * @param {AxiosInstance} payload.api - The Axios instance for making API requests.
 * @param {Object} payload.data - The referral data to claim the reward.
 * @param {string} payload.data.referred - The user being referred.
 * @param {string} payload.data.hash - The transaction hash for claiming the reward.
 * @param {Object} thunkApi - The Redux Toolkit's `thunkApi` object.
 * @returns {Promise} A Promise that resolves when the reward is successfully claimed.
 */
const claimReward = createAsyncThunk(
  "/referral/user/referral/",
  async (
    payload: {
      api: AxiosInstance;
      data: {
        referred: string;
        hash: string;
      };
    },
    thunkApi
  ) => {
    try {
      const { data } = await payload.api.put(
        `/referral/user/referral/${payload.data.referred}/claim/`,
        {
          transaction_hash: payload.data.hash,
        }
      );

      // After claiming the reward, fetch the updated subscribed referral data and show success message
      thunkApi.dispatch(getSubscribedReferral(payload.api));
      thunkApi.dispatch(userService.getBalance(payload.api));
      success(data.message);

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      return thunkApi.rejectWithValue((e.response?.data as any).message);
    }
  }
);

// Define a collection of referral service async thunks
const referralService = {
  getUserReferral,
  getUnsubscribedReferral,
  getSubscribedReferral,
  claimReward,
};

export default referralService;
