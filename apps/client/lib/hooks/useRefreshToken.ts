"use client";

import { useRouter } from "next/router";
import { error } from "../../components/alert/Toast";
import useUserStore from "./useUserStore";
import { useDispatch } from "react-redux";
import { setIsSuccessful } from "../../redux/slices/authSlice";
import { setExchangeRecord } from "../../redux/slices/exchangeSlice";
import { setNotification } from "../../redux/slices/notificationSlice";
import {
  setUserRecord,
  setUnsubscribedReferral,
  setSubscribedReferral,
} from "../../redux/slices/referralSlice";
import {
  setSubscription,
  setSubscriptionHistory,
  setCurrentPlan,
} from "../../redux/slices/subscriptionSlice";
import {
  setActiveTrade,
  setPortfolioTrade,
  setYearList,
  setYearAnalysis,
} from "../../redux/slices/tradeSlice";
import { setBalance } from "../../redux/slices/userSlice";
import { AppDispatch } from "../../redux/store";
import { uri } from "../axiosApi";

const BASE_URL = uri;

export const useRefreshToken = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, setUser, removeUser } = useUserStore((state) => state);

  const refreshToken = async () => {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/user/refresh/get/token/`, {
        method: "GET",
        credentials: "include", // This is equivalent to withCredentials: true in axios
      });
    } catch {
      /* The network dropped, or the request was blocked. That says nothing
         about whether the session is still good, so leave it alone and let the
         caller fail — tearing the user out of a working page over one failed
         request is the worse outcome. */
      return;
    }

    /* Only the server actually rejecting the refresh cookie means the session
       is over. A 500 or a gateway error is a server problem, not an expiry. */
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        endSession();
      }
      return;
    }

    try {

      const data = await response.json();

      // If the token refresh was successful, update the tokens in the state
      setUser({
        ...user,
        access_token: data.access_token,
      });
      // Return the updated tokens
      return {
        access_token: data.access_token,
      };
    } catch {
      /* Malformed body from an otherwise-OK response. Nothing to act on. */
      return;
    }
  };

  /* Only called when the server has actually rejected the refresh cookie. */
  const endSession = () => {
      // Clear all user state first
      removeUser();
      dispatch(setIsSuccessful(false));
      dispatch(setSubscription([]));
      dispatch(setExchangeRecord([]));
      dispatch(setNotification({}));
      dispatch(setUserRecord({}));
      dispatch(setUnsubscribedReferral({}));
      dispatch(setSubscribedReferral({}));
      dispatch(setSubscriptionHistory([]));
      dispatch(setActiveTrade([]));
      dispatch(setPortfolioTrade({}));
      dispatch(setYearList({}));
      dispatch(setYearAnalysis([]));
      dispatch(setCurrentPlan({}));
      dispatch(setBalance(""));

      // Redirect to the tutor page as a logged-out user so they see Login/Signup
      // instead of just showing a toast while keeping the Enroll Now button visible.
      const currentPath = router.pathname;
      const isTutorPage = currentPath.startsWith("/tutor");
      if (isTutorPage) {
        // Stay on tutor page — TutorHeader will now show Login/Signup buttons
        router.replace("/tutor");
      } else {
        router.push("/register");
      }
      error("Session expired. Please log in again.", "expired");
  };

  return refreshToken;
};
