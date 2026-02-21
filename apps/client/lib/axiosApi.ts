import axios from "axios";

// export const uri = "https://api.candleweb.io/api/";
export const uri = "https://sandboxapi.candleweb.io/api/";

export const axiosApi = axios.create({
  baseURL: uri,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const fetcher = async (url: string) => {
  const response = await axios.get(url);
  return response.data;
};
