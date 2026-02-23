import { combineReducers, configureStore, Store } from "@reduxjs/toolkit";
import thunk from "redux-thunk";
import { createWrapper, HYDRATE } from "next-redux-wrapper";

import authReducer from "./slices/authSlice";
import teamReducer from "./slices/teamSlice";
import testimonialReducer from "./slices/testimonialSlice";
import currencyReducer from "./slices/currencySlice";
import subscriptionReducer from "./slices/subscriptionSlice";
import exchangeReducer from "./slices/exchangeSlice";
import referralReducer from "./slices/referralSlice";
import notificationReducer from "./slices/notificationSlice";
import tradeReducer from "./slices/tradeSlice";
import userReducer from "./slices/userSlice";
import taskReducer from "./slices/taskSlice";
import courseReducer from "./slices/courseSlice";
import tutorReducer from "./slices/tutorSlice";
import paymentReducer from "./slices/paymentSlice";

const combineReducer = combineReducers({
  auth: authReducer,
  team: teamReducer,
  testimonial: testimonialReducer,
  currency: currencyReducer,
  subscription: subscriptionReducer,
  exchange: exchangeReducer,
  user: userReducer,
  referral: referralReducer,
  notification: notificationReducer,
  trade: tradeReducer,
  task: taskReducer,
  courses: courseReducer,
  tutors: tutorReducer,
  payment: paymentReducer,
});

const makeStore = () =>
  configureStore({
    reducer: combineReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [HYDRATE],
        },
      }).concat(thunk),
  });

const store = makeStore();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const wrapper = createWrapper<Store>(makeStore, { debug: true });
