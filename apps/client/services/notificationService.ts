import { createAsyncThunk } from "@reduxjs/toolkit";
import { markNotificationsRead, setNotification } from "../redux/slices/notificationSlice";
import { AxiosError, AxiosInstance } from "axios";
import { axiosApi } from "../lib/axiosApi";

const getNotifications = createAsyncThunk(
  "/notification/unread/",
  async (
    payload: {
      api: AxiosInstance;
      page?: number;
    },
    thunkApi
  ) => {
    try {
      const { data } = await payload.api.get(
        "/notification/unread/" +
          (payload.page === 1 || !payload.page ? "" : `?page=${payload.page}`)
      );
      thunkApi.dispatch(setNotification(data));

      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      /* `.data.message` was read without a guard, so a network error (no
         `response` at all) threw a TypeError *inside* the catch and the
         thunk rejected with that instead of a message. Harmless when this
         ran once a page; the bell now polls it, so a dropped connection hit
         it every few seconds. */
      return thunkApi.rejectWithValue(
        (e.response?.data as any)?.message ?? e.message ?? "Couldn't load notifications.",
      );
    }
  }
);

const getMarkNotificationRead = createAsyncThunk(
  "/notification/",
  async (payload: { api: AxiosInstance; id: string | number }, thunkApi) => {
    try {
      /* Trailing slash: without it the API answers 301 → `/notification/{id}/`,
         doubling the requests behind every "mark read". */
      const { data } = await payload.api.get(`/notification/${payload.id}/`);
      /* Reflected locally the moment the server confirms it, so the bell's
         badge drops at once and a stale list can't bring it back — see
         `readIds` in notificationSlice. */
      thunkApi.dispatch(markNotificationsRead([Number(payload.id)]));

      return data;
    } catch (err: any) {
      /* `err.response.message` threw a TypeError on a network error (no
         response), which rejected with that instead of a message. */
      return thunkApi.rejectWithValue(
        err?.response?.data?.message ?? err?.message ?? "Couldn't mark that notification read.",
      );
    }
  }
);

const clearAllNotification = createAsyncThunk(
  "/notification/clear/",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get(`/notification/clear/`);

      thunkApi.dispatch(getNotifications({ api }));

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(err.response.message);
    }
  }
);

const notificationService = {
  getNotifications,
  getMarkNotificationRead,
  clearAllNotification,
};

export default notificationService;
