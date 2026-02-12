import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import { error, success } from "../components/alert/Toast";

import { AxiosError, AxiosInstance } from "axios";
import { BlogCategory, BlogProp } from "../types/blog";

// Create an async thunk for registering a user
const getBlogs = createAsyncThunk(
  "/blog/", // The name of the action (used as the prefix for action types)
  async (api: AxiosInstance, thunkApi) => {
    try {
      // Make a POST request to the server to create a new user
      const { data } = await api.get(`/blog/post/list/`);
      if (data.status === "success") {
        // If the registration was successful, show a success toast message
        //   success(data.message);

        // Return the data received from the server, which can be accessed in the "fulfilled" action
        return data.data as BlogProp[];
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

// Create an async thunk for registering a user
const getRecentBlogs = createAsyncThunk(
  "/blog/recent/", // The name of the action (used as the prefix for action types)
  async (api: AxiosInstance, thunkApi) => {
    try {
      // Make a POST request to the server to create a new user
      const { data } = await api.get(`/blog/post/recent/list/`);
      if (data.status === "success") {
        // If the registration was successful, show a success toast message
        //   success(data.message);

        // Return the data received from the server, which can be accessed in the "fulfilled" action
        return data.data as BlogProp[];
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

// Create an async thunk for registering a user
const getCategoryList = createAsyncThunk(
  "/blog/category/", // The name of the action (used as the prefix for action types)
  async (api: AxiosInstance, thunkApi) => {
    try {
      // Make a POST request to the server to create a new user
      const { data } = await api.get(`/blog/post/category/list/`);
      if (data.status === "success") {
        // If the registration was successful, show a success toast message
        //   success(data.message);

        // Return the data received from the server, which can be accessed in the "fulfilled" action
        return data.data as BlogCategory[];
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

// Create an async thunk for registering a user
const getBlog = createAsyncThunk(
  "/blog/id", // The name of the action (used as the prefix for action types)
  async (
    payload: {
      api: AxiosInstance;
      id: any;
    },
    thunkApi
  ) => {
    try {
      // Make a POST request to the server to create a new user
      const { data } = await payload.api.get(`/blog/post/detail/${payload.id}`);
      if (data.status === "success") {
        // If the registration was successful, show a success toast message
        //   success(data.message);

        // Return the data received from the server, which can be accessed in the "fulfilled" action
        return data.data as BlogProp;
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

const blogService = {
  getBlogs,
  getBlog,
  getCategoryList,
  getRecentBlogs,
};

export default blogService;
