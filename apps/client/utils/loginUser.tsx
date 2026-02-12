import { NextRouter } from "next/router";
import { error } from "../components/alert/Toast";
import { axiosApi } from "../lib/axiosApi";
import React from "react";
import { AxiosError } from "axios";
import { RegisterProps } from "../pages/auth/register";

interface LoginDetails {
  wallet: string;
  signerPassword: string;
  setIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  onSuccess: (data: any, type: "success" | "error") => void
}

export const loginUser = async ({ wallet, signerPassword, setIsLoading, onSuccess }: LoginDetails) => {
  setIsLoading && setIsLoading(true);
  try {
    // Make a POST request to the server for user login
    const { data } = await axiosApi.post("/user/login/", {
      wallet_address: wallet,
      password: signerPassword
    }, { withCredentials: true });
    if (data.status === "success") {

      const { data: userData } = await axiosApi.get("/user/profile/", {
        headers: {
          Authorization: `Bearer ${data.access_token}`
        },
        withCredentials: true
      })

      onSuccess({
        ...userData,
        access_token: data.access_token
      }, "success");

    }
  } catch (err: any) {
    // If there was an error during the login process, it will be caught here
    const e = err as AxiosError;
    const message =
      (e.response &&
        e.response.data &&
        (e.response?.data as any).message) ||
      e.message ||
      e.toString();
    error(message, "login");
  }
  finally {
    setIsLoading && setIsLoading(false);
  }
}