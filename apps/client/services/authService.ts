import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import { error, success } from "../components/alert/Toast";
import { RegisterProps } from "../pages/auth/register";
import { AxiosError } from "axios";
import { setIsSuccessful } from "../redux/slices/authSlice";

// Create an async thunk for registering a user
const registerUser = createAsyncThunk(
  "/register/", // The name of the action (used as the prefix for action types)
  async (
    payload: { data: RegisterProps; onSucess: (value: any) => void },
    thunkApi
  ) => {
    try {
      // Make a POST request to the server to create a new user
      const { data } = await axiosApi.post(
        `/user/create/${payload.data.referral ?? ""}`,
        payload.data
      );
      if (data.status === "success") {
        // If the registration was successful, show a success toast message
        success(data.message);
        payload.onSucess(data);

        // Return the data received from the server, which can be accessed in the "fulfilled" action
        return data;
      }
    } catch (err: any) {
      // If there was an error during the registration process, it will be caught here
      const e = err as AxiosError;
      let errorMessage = "";

      if (e.response?.data) {
        if (
          (e.response.data as any).username &&
          (e.response.data as any).username[0]
        ) {
          errorMessage = (e.response.data as any).username[0];
        } else if (
          (e.response.data as any).wallet_address &&
          (e.response.data as any).wallet_address[0]
        ) {
          errorMessage = (e.response.data as any).wallet_address[0];
        } else if (
          (e.response.data as any).email &&
          (e.response.data as any).email[0]
        ) {
          errorMessage = (e.response.data as any).email[0];
        }
      }
      const message = errorMessage || e.message || e.toString();
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

// Create an async thunk for user login
const loginUser = createAsyncThunk(
  "/auth/login/", // The name of the action (used as the prefix for action types)
  async (
    payload: {
      wallet_address: string;
      password: string;
    },
    thunkApi
  ) => {
    try {
      // Make a POST request to the server for user login
      const { data } = await axiosApi.post("/user/login/", payload);
      if (data.status === "success") {
        // If the login was successful, show a success toast message

        thunkApi.dispatch(setIsSuccessful(true));
        // Return the data received from the server, which can be accessed in the "fulfilled" action
        return data;
      }
    } catch (err: any) {
      // If there was an error during the login process, it will be caught here
      const e = err as AxiosError;
      let errorMessage = "";

      if (e.response?.data) {
        if (
          (e.response.data as any).username &&
          (e.response.data as any).username[0]
        ) {
          errorMessage = (e.response.data as any).username[0];
        } else if (
          (e.response.data as any).wallet_address &&
          (e.response.data as any).wallet_address[0]
        ) {
          errorMessage = (e.response.data as any).wallet_address[0];
        } else if (
          (e.response.data as any).email &&
          (e.response.data as any).email[0]
        ) {
          errorMessage = (e.response.data as any).email[0];
        }
      }
      const message = errorMessage || e.message || e.toString();
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

// Create an async thunk for user login
const googleLoginUser = createAsyncThunk(
  "/user/google/login/", // The name of the action (used as the prefix for action types)
  async (
    payload: {
      queries: string;
    },
    thunkApi
  ) => {
    try {
      // Make a POST request to the server for user login
      const { data } = await axiosApi.get(
        `/user/google/callback/?${payload.queries}`
      );
      if (data.status === "success") {
        // If the login was successful, show a success toast message

        thunkApi.dispatch(setIsSuccessful(true));
        // Return the data received from the server, which can be accessed in the "fulfilled" action
        return data;
      }
    } catch (err: any) {
      // If there was an error during the login process, it will be caught here
      const e = err as AxiosError;
      let errorMessage = "";

      if (e.response?.data) {
        if (
          (e.response.data as any).username &&
          (e.response.data as any).username[0]
        ) {
          errorMessage = (e.response.data as any).username[0];
        } else if (
          (e.response.data as any).wallet_address &&
          (e.response.data as any).wallet_address[0]
        ) {
          errorMessage = (e.response.data as any).wallet_address[0];
        } else if (
          (e.response.data as any).email &&
          (e.response.data as any).email[0]
        ) {
          errorMessage = (e.response.data as any).email[0];
        }
      }
      const message = errorMessage || e.message || e.toString();
      error(message);
      return thunkApi.rejectWithValue(message);
    }
  }
);

// Object containing the created async thunks
const authService = {
  registerUser,
  loginUser,
  googleLoginUser,
};

export default authService;
