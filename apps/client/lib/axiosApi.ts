import axios from "axios";
import useUserStore from "../lib/hooks/useUserStore";

export const uri = "https://api.candleweb.io/api/";
// export const uri = "https://sandboxapi.candleweb.io/api/";

export const axiosApi = axios.create({
  baseURL: uri,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// Attach token automatically
axiosApi.interceptors.request.use((config) => {
  const token = useUserStore.getState().user?.access_token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};
