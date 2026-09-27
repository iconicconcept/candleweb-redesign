import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  EntitlementsV2,
  InvoiceV2,
  PaymentMethodV2,
  PlanV2,
  ReviewBalanceV2,
  SubscriptionV2,
  UsageV2,
} from "../../types/subscriptionV2";

interface SubscriptionV2State {
  plans: PlanV2[];
  plansLoaded: boolean;
  /** null when the user has never been on a plan */
  subscription: SubscriptionV2 | null;
  entitlements: EntitlementsV2 | null;
  meLoaded: boolean;
  usage: UsageV2 | null;
  reviews: ReviewBalanceV2 | null;
  invoices: InvoiceV2[];
  paymentMethods: PaymentMethodV2[];
}

const initialState: SubscriptionV2State = {
  plans: [],
  plansLoaded: false,
  subscription: null,
  entitlements: null,
  meLoaded: false,
  usage: null,
  reviews: null,
  invoices: [],
  paymentMethods: [],
};

export const subscriptionV2Slice = createSlice({
  name: "subscriptionV2",
  initialState,
  reducers: {
    setPlansV2: (state, action: PayloadAction<PlanV2[]>) => {
      state.plans = action.payload;
      state.plansLoaded = true;
    },
    setMeV2: (
      state,
      action: PayloadAction<{ subscription: SubscriptionV2 | null; entitlements: EntitlementsV2 | null }>,
    ) => {
      state.subscription = action.payload.subscription;
      state.entitlements = action.payload.entitlements;
      state.meLoaded = true;
    },
    setUsageV2: (state, action: PayloadAction<UsageV2 | null>) => {
      state.usage = action.payload;
    },
    setReviewsV2: (state, action: PayloadAction<ReviewBalanceV2 | null>) => {
      state.reviews = action.payload;
    },
    setInvoicesV2: (state, action: PayloadAction<InvoiceV2[]>) => {
      state.invoices = action.payload;
    },
    setPaymentMethodsV2: (state, action: PayloadAction<PaymentMethodV2[]>) => {
      state.paymentMethods = action.payload;
    },
    /* on sign-out: everything but the public plan list is per-user */
    resetSubscriptionV2: (state) => ({ ...initialState, plans: state.plans, plansLoaded: state.plansLoaded }),
  },
});

export const {
  setPlansV2,
  setMeV2,
  setUsageV2,
  setReviewsV2,
  setInvoicesV2,
  setPaymentMethodsV2,
  resetSubscriptionV2,
} = subscriptionV2Slice.actions;

export default subscriptionV2Slice.reducer;
