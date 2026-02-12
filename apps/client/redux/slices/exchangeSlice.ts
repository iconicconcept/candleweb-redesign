import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { ExchangeProp, ExchangeRecord } from "../../types/exchange";
import exchangeServices from "../../services/exchangeService";

interface ExchangeState {
  exchanges: ExchangeProp[];
  exchangeRecord: ExchangeRecord[];
  isLoading: boolean;
}

const initialState: ExchangeState = {
  exchanges: [],
  exchangeRecord: [],
  isLoading: false,
};

export const exchangeSlice = createSlice({
  name: "exchange",
  initialState,
  reducers: {
    setExchangeList: (state, action: PayloadAction<ExchangeProp[]>) => {
      state.exchanges = action.payload;
    },
    setExchangeRecord: (state, action: PayloadAction<ExchangeRecord[]>) => {
      state.exchangeRecord = action.payload;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(exchangeServices.addExchange.rejected, (state, action) => {
        state.isLoading = false;
      })
      .addCase(exchangeServices.addExchange.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(exchangeServices.addExchange.pending, (state, action) => {
        state.isLoading = true;
      })
      .addCase(exchangeServices.deleteExchange.rejected, (state, action) => {
        state.isLoading = false;
      })
      .addCase(exchangeServices.deleteExchange.fulfilled, (state, action) => {
        state.isLoading = false;
      })
      .addCase(exchangeServices.deleteExchange.pending, (state, action) => {
        state.isLoading = true;
      });
  },
});

export const { setExchangeList, setExchangeRecord } = exchangeSlice.actions;
export default exchangeSlice.reducer;
