import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import { AxiosError, AxiosInstance } from "axios";
import {
  setLeaderboard,
  setRewardTask,
  setStats,
  setStreak,
  setTask,
} from "../redux/slices/taskSlice";
import { error, success } from "../components/alert/Toast";

const getErrorMessage = (err: any): string => {
  const e = err as AxiosError;
  const data = e.response?.data as any;
  if (!data) return e.message ?? e.toString();
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0)
      return String(firstValue[0]);
    if (typeof firstValue === "string") return firstValue;
  }
  return e.message ?? e.toString();
};

const getTasks = createAsyncThunk(
  "/tasks",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/all/");

      if (data?.message != null) {
        error(data.message);
        return;
      }

      thunkApi.dispatch(setTask(data ?? []));
      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const getReward = createAsyncThunk(
  "/tasks/reward",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/reward/");

      if (data.length > 0) {
        thunkApi.dispatch(setRewardTask(data));
      }

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const verifyReward = createAsyncThunk(
  "/verify/reward",
  async (
    payload: { api: AxiosInstance; data: { task_id?: number; link?: string } },
    thunkApi,
  ) => {
    try {
      const { data } = await payload.api.post("/task/reward/", {
        task_id: payload.data.task_id,
        verification_link: payload.data.link,
      });

      if (data.status !== "success") {
        error(data.message);
      }

      return data;
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
      return thunkApi.rejectWithValue(errMsg);
    }
  },
);

const claimReward = createAsyncThunk(
  "/claim/reward",
  async (payload: { api: AxiosInstance; id: string }, thunkApi) => {
    try {
      const { data } = await payload.api.get(
        `/task/reward/claim/${payload.id}/`,
      );

      if (data.status === "error") {
        error(data.message);
        return;
      }
      thunkApi.dispatch(getTasks(payload.api));
      thunkApi.dispatch(getReward(payload.api));
      thunkApi.dispatch(getTaskStats(payload.api));
      thunkApi.dispatch(getTaskStreak(payload.api));
      thunkApi.dispatch(getLeaderboard(payload.api));
      success(data.message ?? "Reward has been claimed.");

      return data;
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
      return thunkApi.rejectWithValue(errMsg);
    }
  },
);

const getTaskStats = createAsyncThunk(
  "/tasks/stats",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/stats/");

      if (data.length > 0) {
        thunkApi.dispatch(setStats(data[0]));
      }

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const getTaskStreak = createAsyncThunk(
  "/tasks/streak",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/streak/");

      thunkApi.dispatch(setStreak(data));

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const getLeaderboard = createAsyncThunk(
  "/tasks/leaderboard",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/leaderboard/");

      thunkApi.dispatch(setLeaderboard(data));

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const taskService = {
  getTasks,
  getReward,
  getTaskStats,
  getTaskStreak,
  verifyReward,
  claimReward,
  getLeaderboard,
};

export default taskService;
