import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import { setTestimonials } from "../redux/slices/testimonialSlice";
import { AxiosError } from "axios";

const getTestimonial = createAsyncThunk("/teams", async (_, thunkApi) => {
  try {
    const { data, ...other } = await axiosApi.get("/testimonial");

    thunkApi.dispatch(setTestimonials(data));

    return data;
  } catch (err: any) {
    const e = err as AxiosError;
    return thunkApi.rejectWithValue((e.response?.data as any).message);
  }
});

const testimonialService = {
  getTestimonial,
};

export default testimonialService;
