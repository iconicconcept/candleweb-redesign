import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { NotificationProp } from "../../types/notification";

interface NotificationState {
  notification: NotificationProp;
  isLoading: boolean;
}

const initialState: NotificationState = {
  notification: {},
  isLoading: false,
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotification: (state, action: PayloadAction<NotificationProp>) => {
      state.notification = action.payload;
    },
  },
  extraReducers(builder) {},
});

export const { setNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
