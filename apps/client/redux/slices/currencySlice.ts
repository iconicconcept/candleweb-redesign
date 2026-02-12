import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Currency } from "../../types/currency";

interface CurrencyState {
  currency: Currency[];
  isLoading: boolean;
}

const initialState: CurrencyState = {
  currency: [],
  isLoading: false,
};

export const currencySlice = createSlice({
  name: "currency",
  initialState,
  reducers: {
    setCurrency: (state, action: PayloadAction<Currency[]>) => {
      state.currency = action.payload;
    },
  },
  extraReducers(builder) {},
});

export const { setCurrency } = currencySlice.actions;
export default currencySlice.reducer;
