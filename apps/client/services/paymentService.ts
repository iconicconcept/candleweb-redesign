import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";

interface InitiatePaymentPayload {
  course_id: number;
  email: string;
  first_name: string;
  last_name: string;
  pricing_tier_id?: number;
  callback_url?: string;
}

const initiatePayment = createAsyncThunk(
  "payment/initiate",
  async (payload: InitiatePaymentPayload, thunkApi) => {
    try {
      const response = await axiosApi.post("/tutor/payments/initiate/", payload);
      return response.data;
    } catch (err: any) {
      const errorData = err.response?.data;
      const errorMessage = 
        errorData?.errors?.non_field_errors?.[0] || 
        errorData?.non_field_errors?.[0] ||
        errorData?.message || 
        "Failed to initiate payment";
      return thunkApi.rejectWithValue(errorMessage);
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
      const errorData = err.response?.data;
      const errorMessage = 
        errorData?.errors?.non_field_errors?.[0] || 
        errorData?.non_field_errors?.[0] ||
        errorData?.message || 
        "Failed to verify payment";
      return thunkApi.rejectWithValue(errorMessage);
    }
  }
);

const paymentService = {
  initiatePayment,
  verifyPayment,
};

export default paymentService;
