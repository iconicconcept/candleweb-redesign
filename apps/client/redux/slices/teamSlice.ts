import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { TeamProp } from "../../types/teams";

interface TeamState {
  teams: TeamProp[];
  isLoading: boolean;
}

const initialState: TeamState = {
  teams: [],
  isLoading: false,
};

export const teamSlice = createSlice({
  name: "team",
  initialState,
  reducers: {
    setTeam: (state, action: PayloadAction<TeamProp[]>) => {
      state.teams = action.payload;
    },
  },
  extraReducers(builder) {},
});

export const { setTeam } = teamSlice.actions;
export default teamSlice.reducer;
