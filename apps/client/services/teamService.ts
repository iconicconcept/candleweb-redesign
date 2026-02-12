import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import { setTeam } from "../redux/slices/teamSlice";
import { AxiosError } from "axios";

const getTeams = createAsyncThunk("/teams", async (_, thunkApi) => {
  try {
    const { data } = await axiosApi.get("/team");

    thunkApi.dispatch(setTeam(data));

    return data;
  } catch (err: any) {
    const e = err as AxiosError;
    return thunkApi.rejectWithValue((e.response?.data as any).message);
  }
});

const teamService = {
  getTeams,
};

export default teamService;
