import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import authService from "../../services/authService";

// Interface representing the state structure of the Auth slice
interface AuthState {
  isLoading: boolean; // A flag to indicate if authentication-related actions are in progress
  isSuccessfulLogin: boolean;
}

// Initial state for the Auth slice
const initialState: AuthState = {
  isLoading: false, // Initially, there are no loading actions, so isLoading is set to false
  isSuccessfulLogin: false,
};

// Create the Auth slice using createSlice from Redux Toolkit
export const authSlice = createSlice({
  name: "auth", // Name of the slice, used as the prefix for action types
  initialState, // Initial state for the slice
  reducers: {
    setIsSuccessful: (state, action: PayloadAction<boolean>) => {
      state.isSuccessfulLogin = action.payload;
    },
  },
  extraReducers(builder) {
    // Extra reducers are defined here, responding to actions dispatched by authService
    builder
      .addCase(authService.registerUser.pending, (state, action) => {
        // Reducer executed when the "authService.registerUser.pending" action is dispatched
        // It sets isLoading to true to indicate a registration request is in progress
        state.isLoading = true;
      })
      .addCase(authService.registerUser.rejected, (state, action) => {
        // Reducer executed when the "authService.registerUser.rejected" action is dispatched
        // It sets isLoading to false to indicate the registration request failed
        state.isLoading = false;
      })
      .addCase(authService.registerUser.fulfilled, (state, action) => {
        // Reducer executed when the "authService.registerUser.fulfilled" action is dispatched
        // It sets isLoading to false to indicate the registration request was successful
        state.isLoading = false;
      })
      .addCase(authService.loginUser.pending, (state, action) => {
        // Reducer executed when the "authService.loginUser.pending" action is dispatched
        // It sets isLoading to true to indicate a login request is in progress
        state.isLoading = true;
      })
      .addCase(authService.loginUser.rejected, (state, action) => {
        // Reducer executed when the "authService.loginUser.rejected" action is dispatched
        // It sets isLoading to false to indicate the login request failed
        state.isLoading = false;
      })
      .addCase(authService.loginUser.fulfilled, (state, action) => {
        // Reducer executed when the "authService.loginUser.fulfilled" action is dispatched
        // It sets isLoading to false to indicate the login request was successful
        state.isLoading = false;
      });
  },
});

// Export actions from the Auth slice
export const { setIsSuccessful } = authSlice.actions;

// Export the reducer function for the Auth slice to use in the Redux store
export default authSlice.reducer;
