// Import necessary modules and types
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  PaymentIDProp,
  SubscriptionHistoryProp,
  SubscriptionProp,
} from "../../types/subscription"; // Import relevant types
import subscriptionService from "../../services/subscriptionService";

// Define the structure of the subscription state
interface SubscriptionState {
  subscriptions: SubscriptionProp[]; // Array of subscription objects
  paymentIds: PaymentIDProp[];
  isLoading: boolean; // Indicates if an asynchronous action is in progress
  currentPlan: SubscriptionHistoryProp; // Current subscription plan
  subscriptionHistory: SubscriptionHistoryProp[]; // Array of subscription history objects
}

// Define initial state for the subscription slice
const initialState: SubscriptionState = {
  subscriptions: [],
  paymentIds: [],
  isLoading: false,
  currentPlan: {},
  subscriptionHistory: [],
};

// Create the subscription slice using createSlice function
export const subscriptionSlice = createSlice({
  name: "subscription", // Name of the slice
  initialState, // Initial state defined above
  reducers: {
    // Reducer to set the subscriptions
    setSubscription: (state, action: PayloadAction<SubscriptionProp[]>) => {
      state.subscriptions = action.payload; // Set subscriptions using the payload data
    },
    setPaymentId: (state, action: PayloadAction<PaymentIDProp[]>) => {
      state.paymentIds = action.payload; // Set subscriptions using the payload data
    },
    // Reducer to set the current subscription plan
    setCurrentPlan: (state, action: PayloadAction<SubscriptionHistoryProp>) => {
      state.currentPlan = action.payload; // Set current subscription plan using the payload data
    },
    // Reducer to set the subscription history
    setSubscriptionHistory: (
      state,
      action: PayloadAction<SubscriptionHistoryProp[]>
    ) => {
      state.subscriptionHistory = action.payload;

      if (action.payload.length > 0) {
        const checkActive = action.payload.filter(
          (sub) => sub.is_active === true
        );

        if (checkActive.length > 0) {
          state.currentPlan = checkActive[0]; // Set the current plan if an active subscription is found
        } else {
          state.currentPlan = {}; // Set the current plan to an empty object if no active subscription is found
        }
      } else {
        state.currentPlan = {}; // Set the current plan to an empty object if there are no subscription history entries
      }
    },
  },
  extraReducers(builder) {
    // Handle asynchronous actions using extraReducers
    builder
      .addCase(
        subscriptionService.getSubscriptionList.pending,
        (state, action) => {
          state.isLoading = true; // Set isLoading to true when fetching subscription list
        }
      )
      .addCase(
        subscriptionService.getSubscriptionList.rejected,
        (state, action) => {
          state.isLoading = false; // Set isLoading to false if fetching subscription list is rejected
        }
      )
      .addCase(
        subscriptionService.getSubscriptionList.fulfilled,
        (state, action) => {
          state.isLoading = false; // Set isLoading to false after successfully fetching subscription list
        }
      )
      .addCase(
        subscriptionService.getSubscriptionHistoryList.pending,
        (state, action) => {
          state.isLoading = true; // Set isLoading to true when fetching subscription history list
        }
      )
      .addCase(
        subscriptionService.getSubscriptionHistoryList.rejected,
        (state, action) => {
          state.isLoading = false; // Set isLoading to false if fetching subscription history list is rejected
        }
      )
      .addCase(
        subscriptionService.getSubscriptionHistoryList.fulfilled,
        (state, action) => {
          state.isLoading = false; // Set isLoading to false after successfully fetching subscription history list
        }
      );
  },
});

// Export the action creators and the reducer
export const {
  setSubscription,
  setSubscriptionHistory,
  setCurrentPlan,
  setPaymentId,
} = subscriptionSlice.actions; // Export the action creators
export default subscriptionSlice.reducer; // Export the reducer function
