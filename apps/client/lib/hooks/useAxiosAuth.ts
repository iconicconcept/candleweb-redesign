"use client";

import { useEffect, useRef } from "react";
import { useRefreshToken } from "./useRefreshToken";
import axios, { AxiosInstance } from "axios";
import useUserStore from "./useUserStore";
import { uri } from "../axiosApi";

/**
 * The authenticated axios instance used by the dashboard.
 *
 * This used to call `axios.create()` on every render while attaching the
 * interceptors inside a `useEffect` keyed on `user`. The effect only ran on the
 * renders where `user` changed, so every instance handed out after that had no
 * interceptors at all — which is why an expired access token was never
 * refreshed: the 401 simply fell through. The instance is now created once and
 * kept, so the interceptors stay attached to the object callers actually use.
 */
const useAxiosAuth = () => {
  const { user } = useUserStore((state) => state);
  const refreshToken = useRefreshToken();

  /* The hook returns a new closure each render; the interceptor is attached
     once, so it reads the current one through a ref. */
  const refreshRef = useRef(refreshToken);
  refreshRef.current = refreshToken;

  const instanceRef = useRef<AxiosInstance>();
  if (!instanceRef.current) {
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
  axiosApi.defaults.headers["Authorization"] = `Bearer ${user.access_token}`;

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
        /* 401 only — never 403. A 403 is a permission answer ("not enrolled",
           "plan limit", "not public"), not an expired token, and treating it
           as one logged people out mid-session. */
        if (err.response?.status === 401 && prevRequest && !prevRequest._retry) {
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
