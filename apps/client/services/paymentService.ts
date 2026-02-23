import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";

interface InitiatePaymentPayload {
  course_id: number;
  email: string;
  first_name: string;
  last_name: string;
  pricing_tier_id?: number;
}

const initiatePayment = createAsyncThunk(
  "payment/initiate",
  async (payload: InitiatePaymentPayload, thunkApi) => {
    try {
      const response = await axiosApi.post("/tutor/payments/initiate/", payload);
      return response.data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(err.response?.data?.message || "Failed to initiate payment");
    }
  }
);

const verifyPayment = createAsyncThunk(
  "payment/verify",
  async (reference: string, thunkApi) => {
    try {
      const response = await axiosApi.get(`/tutor/payments/verify/?reference=${reference}`);
      return response.data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(err.response?.data?.message || "Failed to verify payment");
    }
  }
);

const paymentService = {
  initiatePayment,
  verifyPayment,
};

export default paymentService;
