import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { BalanceProp, User } from "../../types/user";
import userService from "../../services/userService";
import { convertObjectToArray } from "../../utils/trade-utils";

// Interface representing the state structure of the User slice
interface UserState {
  user: User; // Data representing the user's profile
  balance: BalanceProp[]; // User's balance as a string (could be a number, but maintained as a string for precision)
  token: string; // user access token
  isLoading?: boolean; // A flag to indicate if user-related actions are in progress
  totalUsers: number;
}

// Initial state for the User slice
const initialState: UserState = {
  user: {}, // Initially, there is no user data, so an empty object is used
  balance: [], // Initial balance is set to ""
  token: "", // Initial token is set to ""
  isLoading: false, // Initially, there are no loading actions, so isLoading is set to false
  totalUsers: 0,
};

// Create the User slice using createSlice from Redux Toolkit
export const userSlice = createSlice({
  name: "user", // Name of the slice, used as the prefix for action types
  initialState, // Initial state for the slice
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      // Reducer to update the user data when the "setUser" action is dispatched
      state.user = action.payload;
    },
    setBalance: (state, action) => {
      // Reducer to update the user's balance when the "setBalance" action is dispatched
      state.balance = action.payload;
    },
    setTotalUsers: (state, action: PayloadAction<number>) => {
      state.totalUsers = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(userService.getTotalUsers.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(userService.getTotalUsers.rejected, (state, action) => {
        state.isLoading = false;
      })
      .addCase(userService.getTotalUsers.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(userService.updateUserDemo.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(userService.updateUserDemo.rejected, (state, action) => {
        state.isLoading = false;
      })
      .addCase(userService.updateUserDemo.fulfilled, (state, action) => {
        state.isLoading = false;
      });
  },
});

// Export actions from the User slice
export const { setUser, setBalance, setTotalUsers } = userSlice.actions;

// Export the reducer function for the User slice to use in the Redux store
export default userSlice.reducer;
