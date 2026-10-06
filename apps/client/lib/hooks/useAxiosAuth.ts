"use client";

import { useEffect, useRef } from "react";
import { useRefreshToken } from "./useRefreshToken";
import axios, { AxiosInstance } from "axios";
import useUserStore from "./useUserStore";
import { uri, isExpiredToken } from "../axiosApi";

/**
 * The authenticated axios instance used by the dashboard.
 *
 * This used to call `axios.create()` on every render while attaching the
 * interceptors inside a `useEffect` keyed on `user`. The effect only ran on the
 * renders where `user` changed, so every instance handed out after that had no
 * interceptors at all — which is why an expired access token was never
 * refreshed: the 401 simply fell through. The instance is kept across renders
 * so the interceptors stay attached to the object callers actually use.
 *
 * It is rebuilt when — and only when — the access token changes, because the
 * instance's identity is what the dashboard's fetch effects are keyed on:
 * nearly every page does
 *
 *     useEffect(() => {
 *       if (!isAuthorizationHeaderSet(axiosToken)) return;
 *       ...fetch...
 *     }, [axiosToken, dispatch]);
 *
 * The persisted user store is not readable on the first client render — it
 * rehydrates from localStorage a render later, which is what `useHydration`
 * exists to wait for — so on a full page load that guard is false the first
 * time round. With a permanently stable instance both deps were constant, the
 * effect never ran again once the token arrived, and the page sat on its
 * loading state forever. Soft navigation hid it: by then the store had
 * rehydrated, so the guard passed on the first try. Changing identity with the
 * token makes the effects re-run exactly when there is finally a token to
 * fetch with. The interceptor effect below is keyed on the same instance, so a
 * replacement is always fully wired before anyone uses it.
 */
const useAxiosAuth = () => {
  const { user } = useUserStore((state) => state);
  const refreshToken = useRefreshToken();

  /* The hook returns a new closure each render; the interceptor is attached
     once, so it reads the current one through a ref. */
  const refreshRef = useRef(refreshToken);
  refreshRef.current = refreshToken;

  const token = user?.access_token;
  const instanceRef = useRef<AxiosInstance>();
  const tokenRef = useRef<string | undefined>();
  if (!instanceRef.current || tokenRef.current !== token) {
    tokenRef.current = token;
    instanceRef.current = axios.create({
      baseURL: uri,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      withCredentials: true,
    });
  }
  const axiosApi = instanceRef.current;

  /* Callers read `defaults.headers.Authorization` (see utils/check_auth) and
     key effects off it, so it has to track the live token. */
  axiosApi.defaults.headers["Authorization"] = `Bearer ${token}`;

  useEffect(() => {
    const requestInterceptor = axiosApi.interceptors.request.use(
      (config) => {
        /* Read at send time rather than from a closure, so a request already in
           flight when the token rotates still goes out with the current one. */
        const token = useUserStore.getState().user?.access_token;
        if (token) config.headers["Authorization"] = `Bearer ${token}`;
        config.withCredentials = true;
        return config;
      },
      (error) => Promise.reject(error),
    );

    const responseInterceptor = axiosApi.interceptors.response.use(
      (response) => response,
      async (err) => {
        const prevRequest = err.config;
        /* Not 401 only: this API answers 403 for an expired access token as
           well as for ordinary permission denials, so the body is what tells
           them apart — see `isExpiredToken`. Treating every 403 as an expiry
           is what once logged people out mid-session over a plan limit. */
        if (isExpiredToken(err) && prevRequest && !prevRequest._retry) {
          prevRequest._retry = true;
          const newToken = await refreshRef.current();

          if (newToken?.access_token) {
            prevRequest.headers["Authorization"] = `Bearer ${newToken.access_token}`;
            axiosApi.defaults.headers["Authorization"] = `Bearer ${newToken.access_token}`;
            return axiosApi(prevRequest);
          }
        }

        return Promise.reject(err);
      },
    );

    return () => {
      axiosApi.interceptors.request.eject(requestInterceptor);
      axiosApi.interceptors.response.eject(responseInterceptor);
    };
  }, [axiosApi]);

  return axiosApi;
};

export default useAxiosAuth;
