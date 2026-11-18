import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { NotificationProp } from "../../types/notification";

interface NotificationState {
  notification: NotificationProp;
  isLoading: boolean;
  /**
   * Ids this session has successfully marked read.
   *
   * The bell's unread badge is counted from `notification.results`, and a
   * fetch of `/notification/unread/` that was already in the air when the
   * user hit "Mark all read" (the 15s bell poll, a page's own refetch) used
   * to land afterwards and put the old unread rows straight back — so the
   * badge stayed up until a full reload. Every incoming list is passed
   * through this set, so a notification marked read here stays read on
   * screen whatever order the replies arrive in.
   */
  readIds: number[];
}

const initialState: NotificationState = {
  notification: {},
  isLoading: false,
  readIds: [],
};

/* Same list, with anything marked read this session flagged as read. Rows
   are kept, not dropped: the Notifications page lists read ones too. */
const applyRead = (list: NotificationProp, readIds: number[]): NotificationProp => {
  if (!readIds.length || !Array.isArray(list?.results)) return list;
  const read = new Set(readIds);
  return {
    ...list,
    results: list.results.map((r) =>
      r?.id != null && read.has(Number(r.id)) && !r.is_read ? { ...r, is_read: true } : r,
    ),
  };
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotification: (state, action: PayloadAction<NotificationProp>) => {
      state.notification = applyRead(action.payload, state.readIds);
    },
    /** Mark ids read locally, at once — the badge drops without waiting for
        a refetch. Called after the server has confirmed each one. */
    markNotificationsRead: (state, action: PayloadAction<number[]>) => {
      const ids = action.payload.map(Number).filter((n) => Number.isFinite(n));
      if (!ids.length) return;
      const merged = new Set([...state.readIds, ...ids]);
      /* Bounded — a long session should not grow this forever. Oldest go first. */
      state.readIds = Array.from(merged).slice(-500);
      state.notification = applyRead(state.notification, state.readIds);
    },
  },
  extraReducers(builder) {},
});

export const { setNotification, markNotificationsRead } = notificationSlice.actions;
export default notificationSlice.reducer;
