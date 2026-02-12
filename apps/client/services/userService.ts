// Import necessary modules and types
import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosError, AxiosInstance } from "axios"; // Import AxiosError and AxiosInstance types
import { setBalance, setTotalUsers, setUser } from "../redux/slices/userSlice"; // Import relevant action creators from the userSlice
import { axiosApi } from "../lib/axiosApi";

// Create an async thunk to fetch user profile
const getUser = createAsyncThunk(
  "/user/profile/", // Action type prefix
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/user/profile/"); // Fetch user profile data using the provided Axios instance
      thunkApi.dispatch(setUser(data)); // Dispatch the setUser action creator from userSlice

      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to fetch user balance
const getBalance = createAsyncThunk(
  "/trade/portfolio/balance/", // Action type prefix
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/trade/portfolio/balance/"); // Fetch user balance data using the provided Axios instance
      thunkApi.dispatch(setBalance(data)); // Dispatch the setBalance action creator from userSlice
      // console.log({ data });
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to fetch user balance
const getTotalUsers = createAsyncThunk(
  "/user/total", // Action type prefix
  async (_, thunkApi) => {
    try {
      const { data } = await axiosApi.get("/user/total"); // Fetch user balance data using the provided Axios instance
      thunkApi.dispatch(setTotalUsers(data.total_users ?? 0)); // Dispatch the setBalance action creator from userSlice

      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if fetching fails
    }
  }
);

// Create an async thunk to delete a user
const deleteUser = createAsyncThunk(
  "/user/delete", // Action type prefix
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.delete("/user/delete"); // create a delete request to the server to delete user
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if deleting fails
    }
  }
);

const updateUserDemo = createAsyncThunk(
  "/user/demo", // Action type prefix
  async (
    payload: {
      api: AxiosInstance;
      is_live?: boolean;
    },
    thunkApi
  ) => {
    try {
      const { data } = await payload.api.put("/user/profile/", {
        is_live_mode: payload.is_live,
      }); // create a delete request to the server to delete user
      thunkApi.dispatch(getUser(payload.api)); // Dispatch the setUser action creator from userSlice
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if deleting fails
    }
  }
);

const updateWalletAddress = createAsyncThunk(
  "/user/update-wallet-address", // Action type prefix
  async (
    payload: {
      api: AxiosInstance;
      wallet_address?: string;
      password?: string;
    },
    thunkApi
  ) => {
    try {
      const { data } = await payload.api.put("/user/update-wallet-password/", {
        wallet_address: payload.wallet_address,
        password: payload.password,
      }); // create a delete request to the server to delete user
      thunkApi.dispatch(getUser(payload.api)); // Dispatch the setUser action creator from userSlice
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if deleting fails
    }
  }
);

//TODO: Create an async thunk to delete a user
const editUserEmail = createAsyncThunk(
  "/user/delete", // Action type prefix
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.delete("/user/delete"); // create a delete request to the server to delete user
      return data; // Return the fetched data
    } catch (err: any) {
      const e = err as AxiosError; // Cast the error to AxiosError
      return thunkApi.rejectWithValue((e.response?.data as any).message); // Reject with error message if deleting fails
    }
  }
);

// Create a userService object with the async thunks
const userService = {
  getUser, // Expose the getUser async thunk
  getBalance, // Expose the getBalance async thunk
  deleteUser, //Expose the deleteUser async thunk
  getTotalUsers,
  updateUserDemo,
  updateWalletAddress,
};

export default userService; // Export the userService object
