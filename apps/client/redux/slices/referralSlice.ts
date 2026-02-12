import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  SubscribedReferral,
  UnsubscribedReferral,
  UserReferralRecord,
} from "../../types/referral";
import referralService from "../../services/referralService";

// Interface representing the state structure of the Referral slice
interface ReferralState {
  userReferralRecord: UserReferralRecord; // Data representing user's referral record
  unsubscribedReferrals: UnsubscribedReferral; // Data representing unsubscribed referrals
  subscribedReferrals: SubscribedReferral; // Data representing subscribed referrals
  isLoading: boolean; // A flag to indicate if referral-related actions are in progress
}

// Initial state for the Referral slice
const initialState: ReferralState = {
  userReferralRecord: {},
  unsubscribedReferrals: {},
  subscribedReferrals: {},
  isLoading: false, // Initially, there are no loading actions, so isLoading is set to false
};

// Create the Referral slice using createSlice from Redux Toolkit
const referralSlice = createSlice({
  name: "referral", // Name of the slice, used as the prefix for action types
  initialState, // Initial state for the slice
  reducers: {
    setUserRecord: (state, action: PayloadAction<UserReferralRecord>) => {
      // Reducer to update the userReferralRecord when the "setUserRecord" action is dispatched
      state.userReferralRecord = action.payload;
    },
    setUnsubscribedReferral: (
      state,
      action: PayloadAction<UnsubscribedReferral>
    ) => {
      // Reducer to update the unsubscribedReferrals when the "setUnsubscribedReferral" action is dispatched
      state.unsubscribedReferrals = action.payload;
    },
    setSubscribedReferral: (
      state,
      action: PayloadAction<SubscribedReferral>
    ) => {
      // Reducer to update the subscribedReferrals when the "setsubscribedReferral" action is dispatched
      state.subscribedReferrals = action.payload;
    },
  },
  extraReducers(builder) {
    // Reducers for handling asynchronous actions dispatched by referralService

    // Common function to handle pending and fulfilled cases
    const handlePendingAndFulfilled = (state: ReferralState) => {
      state.isLoading = true; // Set isLoading to true to indicate that an asynchronous action is in progress
    };

    // Common function to handle the rejected case
    const handleRejected = (state: ReferralState) => {
      state.isLoading = false; // Set isLoading to false to indicate that the asynchronous action failed, rejected or was successful
    };

    builder
      .addCase(
        referralService.getUserReferral.pending,
        handlePendingAndFulfilled
      )
      .addCase(referralService.getUserReferral.fulfilled, handleRejected)
      .addCase(referralService.getUserReferral.rejected, handleRejected)
      .addCase(
        referralService.getUnsubscribedReferral.pending,
        handlePendingAndFulfilled
      )
      .addCase(
        referralService.getUnsubscribedReferral.fulfilled,
        handleRejected
      )
      .addCase(referralService.getUnsubscribedReferral.rejected, handleRejected)
      .addCase(
        referralService.getSubscribedReferral.pending,
        handlePendingAndFulfilled
      )
      .addCase(referralService.getSubscribedReferral.fulfilled, handleRejected)
      .addCase(referralService.getSubscribedReferral.rejected, handleRejected);
  },
});

// Export actions from the Referral slice
export const { setUserRecord, setUnsubscribedReferral, setSubscribedReferral } =
  referralSlice.actions;

// Export the reducer function for the Referral slice to use in the Redux store
export default referralSlice.reducer;
