import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import { setCurrency } from "../redux/slices/currencySlice";

const getCurrency = createAsyncThunk("/currency/retrieve/all/", async (_, thunkApi) => {
  try {
    const { data } = await axiosApi.get("/currency/retrieve/all/");

    thunkApi.dispatch(setCurrency(data));

    return data;
  } catch (err: any) {
    return thunkApi.rejectWithValue(err.response.message);
  }
});

const currencyService = {
  getCurrency,
};

export default currencyService;
