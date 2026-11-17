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

// Create an async thunk for creating a user with email + password
const createUserWithEmail = createAsyncThunk(
  "/user/create-with-email/", // The name of the action (used as the prefix for action types)
  async (
    payload: {
      data: { username: string; email: string; password: string };
      onSucess?: (value: any) => void;
    },
    thunkApi
  ) => {
    try {
      // Create the account. The backend emails a 10-minute verification
      // code; callers send the user to /verify-email to enter it, and the
      // API signs them in once it matches.
      const { data } = await axiosApi.post(
        "/user/create-with-email/",
        payload.data
      );
      success(data?.message || "Account created. Check your email for a code.");
      payload.onSucess?.(data);
      return data;
    } catch (err: any) {
      const e = err as AxiosError;
      let errorMessage = "";

      if (e.response?.data) {
        const resData = e.response.data as any;
        if (resData.username && resData.username[0]) {
          errorMessage = resData.username[0];
        } else if (resData.email && resData.email[0]) {
          errorMessage = resData.email[0];
        } else if (resData.password && resData.password[0]) {
          errorMessage = resData.password[0];
        } else if (resData.message) {
          errorMessage = resData.message;
        } else if (resData.detail) {
          errorMessage = resData.detail;
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
  createUserWithEmail,
  loginUser,
  googleLoginUser,
};

export default authService;

{/* 
Note: only work on what you are prompted to work on, don't touch other things already working fine.
1. We are changing our logo across our web-app overall, from the favicon, header, footer, landing/public pages, dashboard header. dashboard sidebar, and every single places we have candlwebs's logo and icon, we will changes them to the new logo and icon.
The logo and icon will be provided in the public folder, and also added here for checking, put the right logo and icon at the right places, on the background that fit. Confirm the current ones, also get this done perfectly!

2. The is a UI change, on trade details page, the is scrollable/overflow horizontally, correct that! The page screenshot is added here for checking. 

3. A UI changes in positioning also on dashboard/overview page, i circled it in the screenshot attached.

4. Logic correction, currently what we implemented is that when a user is signing up with Google, they have to check the terms before it works,.. please don't make it that way, most people wouldn't know. So, instead, if someone is signing up with Google, let them know they're agreeing to Candleweb's terms of service by signing up, then check the terms automatically for them.

5. This is on dashboard/overview page, When the screen is idle for a while, it just switches to start showing the user their live account balance even though they're on demo, and it doesn't show the page details and start showing null/not provided/unrealized, shows that error "can't load your positions" as well. But once the user refreshes the page everything goes back to normal. Sceeenshot attached!

6. This is on academy/tutor dashboard page, the continue learning should turn to "download certificate" when the course/class is completed, and work well like the card we have on that same page for downloading certificates.

Work on them one after the other and let me know when they are all done, and how i can confirm them all.
*/}

