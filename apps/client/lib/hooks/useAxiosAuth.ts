"use client";

import { useEffect } from "react";
import { useRefreshToken } from "./useRefreshToken";
import axios from "axios";
import useUserStore from "./useUserStore";
import { uri } from "../axiosApi";

// Custom hook to handle Axios authentication with tokens
const useAxiosAuth = () => {
  // Use the session data from NextAuth
  const { user, setUser } = useUserStore((state) => state);

  // Initialize refreshToken only if session?.user?.refresh_token is available
  let refreshToken = useRefreshToken();

  // Create an Axios instance with default configuration
  const axiosApi = axios.create({
    baseURL: uri,
    headers: {
      // Set the Authorization header with the access token from the session
      Authorization: `Bearer ${user.access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    // withCredentials: true,
  });

  useEffect(() => {
    // Check if session, access token and refresh token are available
    if (user.access_token) {
      // Create a request interceptor to attach the access token to the request headers
      const requestInterceptor = axiosApi.interceptors.request.use(
        (config) => {
          // Set the Authorization header with the access token from the session
          config.headers["Authorization"] = `Bearer ${user.access_token}`;
          config.withCredentials = true;
          return config;
        },
        (error) => Promise.reject(error)
      );

      // Create a response interceptor to handle 401 Unauthorized and 403 Forbidden errors
      const responseInterceptor = axiosApi.interceptors.response.use(
        (response) => response,
        async (err) => {
          const prevRequest = err.config;

          // If the response status is 401 or 403, attempt to refresh the access token
          if (
            (err.response?.status === 401 || err.response?.status === 403) &&
            !prevRequest.sent
          ) {
            prevRequest.sent = true;
            const newToken = await refreshToken();

            // setUser({
            //   ...user,
            //   access_token: newToken?.access_token,
            // });

            // Set the Authorization header with the new access token
            prevRequest.headers["Authorization"] = `Bearer ${
              newToken!.access_token
            }`;
            return axiosApi(prevRequest);
          }
          // If the response status is not 401 or 403, reject the request with the error
          return Promise.reject(err);
        }
      );

      // Clean up the interceptors when the component unmounts to prevent memory leaks
      return () => {
        axiosApi.interceptors.request.eject(requestInterceptor);
        axiosApi.interceptors.response.eject(responseInterceptor);
      };
    }
  }, [user]); // Depend on "session?.user" and "session" to re-run the effect when they change

  // Return the customized Axios instance with authentication handling
  return axiosApi;
};

export default useAxiosAuth;
