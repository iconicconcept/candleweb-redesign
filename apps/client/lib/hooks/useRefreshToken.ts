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
import { signInPath } from "../authRedirect";

const BASE_URL = uri;

export const useRefreshToken = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { user, setUser, removeUser } = useUserStore((state) => state);

  const refreshToken = async () => {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}user/refresh/get/token/`, {
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
       is over. A 500 or a gateway error is a server problem, not an expiry.
       This endpoint reads nothing but that cookie, so ANY 4xx from it is a
       rejected cookie — and the answer to a missing or expired one is in fact
       400 {"status":"error","message":"Refresh token not found."}, not 401.
       Matching on 401/403 alone meant a genuinely expired session was read as
       "server problem, leave it alone": the persisted user survived in
       localStorage, so the public header kept showing the account menu and the
       dashboard let the user in to a page whose every request then 401'd. */
    if (!response.ok) {
      if (response.status >= 400 && response.status < 500) {
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

      /* Only move someone whose page has nothing left to show. The dashboard
         is signed-in-only, so it goes to the login page — carrying the page
         they were on, so logging back in returns them to it. The Academy drops
         to its public form (TutorHeader then shows Login/Signup instead of
         keeping the Enroll Now button). Every other public page stays put: the
         header has already swapped back to logged-out, and throwing a reader
         off the homepage over an expired cookie is the worse outcome. It was
         also pushing to /register — the wrong page for someone who plainly has
         an account. */
      const currentPath = router.pathname;
      if (currentPath.startsWith("/dashboard")) {
        router.replace(signInPath(router.asPath));
      } else if (currentPath.startsWith("/tutor")) {
        router.replace("/tutor");
      }
      error("Session expired. Please log in again.", "expired");
  };

  return refreshToken;
};
