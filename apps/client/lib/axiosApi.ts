import axios from "axios";
import useUserStore from "../lib/hooks/useUserStore";

// export const uri = "https://api.candleweb.io/api/";
export const uri = "https://sandboxapi.candleweb.io/api/";

export const axiosApi = axios.create({
  baseURL: uri,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// helper: refresh access_token via refresh cookie and update user store
let isRefreshing = false;
let failedQueue: Array<{resolve: (value?: any) => void; reject: (error: any) => void}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async () => {
  const response = await fetch(`${uri}user/refresh/get/token/`, {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();

  if (!data?.access_token) {
    throw new Error("No access token returned");
  }

  const currentUser = useUserStore.getState().user || {};
  useUserStore.getState().setUser({
    ...currentUser,
    access_token: data.access_token,
  });

  axiosApi.defaults.headers.common.Authorization = `Bearer ${data.access_token}`;

  return data.access_token;
};

// Attach token automatically
axiosApi.interceptors.request.use((config) => {
  const token = useUserStore.getState().user?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Is this failure "your access token is no good", as opposed to "you are signed
 * in but may not do this"?
 *
 * The API answers **403** for an expired or invalid access token — not 401 —
 * and it answers 403 for ordinary permission denials as well. Only the body
 * separates them: an auth failure says "Invalid or expired token provided.",
 * while a permission answer says something else entirely.
 *
 * Matching on 401 alone meant an expired token was never refreshed. The
 * dashboard hid it, because most of what it shows is either already in redux
 * or served by public endpoints; the first call that genuinely needed auth —
 * starting a course payment — was where it surfaced, as "Invalid or expired
 * token provided." on an account whose session was otherwise fine.
 *
 * Deliberately narrow: refreshing on *any* 403 is what previously wiped a
 * session and showed "Session expired" to someone sitting on a working page,
 * because a plan limit or an unenrolled course answers 403 too.
 */
export const isExpiredToken = (error: any) => {
  const status = error?.response?.status;
  if (status === 401) return true;
  if (status !== 403) return false;
  const body = error?.response?.data;
  const message = typeof body === "string" ? body : String(body?.message ?? "");
  /* `/trading_v2/*` loses the auth message on the way out: an expired (or
     missing) token there answers 403 {"status":"error","message":"status:
     error"} instead of "Invalid or expired token provided.". Not matching it
     meant the overview's metrics, status and positions polls never refreshed
     the token after a phone sat idle past its lifetime — they failed on every
     tick ("Couldn't load your positions. status: error", the hero falling
     back to the live exchange balance) until a full reload, whose
     /user/profile/ call did get refreshed. That exact string is the wrapper's
     placeholder, never a real permission message, so it stays narrow.
     "Authorization token required." is the same API with no token at all. */
  return /invalid or expired token|^status: error$|authorization token required/i.test(
    message.trim(),
  );
};

axiosApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (isExpiredToken(error) && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosApi(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();

        processQueue(null, newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosApi(originalRequest);
      } catch (err) {
        processQueue(err, null);
        useUserStore.getState().removeUser();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};
