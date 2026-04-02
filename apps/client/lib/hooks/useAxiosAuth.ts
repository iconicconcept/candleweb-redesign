"use client";

import { useEffect } from "react";
import { useRefreshToken } from "./useRefreshToken";
import axios from "axios";
import useUserStore from "./useUserStore";
import { uri } from "../axiosApi";

const useAxiosAuth = () => {
  const { user } = useUserStore((state) => state);
  const refreshToken = useRefreshToken();

  // Create a new instance every render (original behavior — keeps token fresh)
  const axiosApi = axios.create({
    baseURL: uri,
    headers: {
      Authorization: `Bearer ${user.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    withCredentials: true,
  });

  useEffect(() => {
    if (!user.access_token) return;

    const requestInterceptor = axiosApi.interceptors.request.use(
      (config) => {
        config.headers["Authorization"] = `Bearer ${user.access_token}`;
        config.withCredentials = true;
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseInterceptor = axiosApi.interceptors.response.use(
      (response) => response,
      async (err) => {
        const prevRequest = err.config;

        if (
          (err.response?.status === 401 || err.response?.status === 403) &&
          !prevRequest._retry
        ) {
          prevRequest._retry = true;
          const newToken = await refreshToken();

          if (newToken?.access_token) {
            prevRequest.headers["Authorization"] = `Bearer ${newToken.access_token}`;
            axiosApi.defaults.headers.common.Authorization = `Bearer ${newToken.access_token}`;
            return axiosApi(prevRequest);
          }
        }

        return Promise.reject(err);
      }
    );

    return () => {
      axiosApi.interceptors.request.eject(requestInterceptor);
      axiosApi.interceptors.response.eject(responseInterceptor);
    };
  }, [user]);

  return axiosApi;
};

export default useAxiosAuth;