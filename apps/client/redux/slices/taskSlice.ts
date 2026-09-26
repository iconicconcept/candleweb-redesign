import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import {
  LeaderboardProp,
  RewardTaskProp,
  TaskProp,
  TaskStatsProp,
  TaskStreakProp,
} from "../../types/task";

interface TaskState {
  tasks: TaskProp[];
  /** Open tasks from every enrolled course, flattened. */
  courseTasks: TaskProp[];
  stats: TaskStatsProp;
  streak: TaskStreakProp;
  isLoading: boolean;
  completed: RewardTaskProp[];
  leaderboards: LeaderboardProp[];
}

const initialState: TaskState = {
  tasks: [],
  courseTasks: [],
  stats: {},
  streak: {},
  isLoading: false,
  completed: [],
  leaderboards: [],
};

export const taskSlice = createSlice({
  name: "task",
  initialState,
  reducers: {
    setTask: (state, action: PayloadAction<TaskProp[]>) => {
      state.tasks = action.payload;
    },
    setCourseTasks: (state, action: PayloadAction<TaskProp[]>) => {
      state.courseTasks = action.payload;
    },
    setStats: (state, action: PayloadAction<TaskStatsProp>) => {
      state.stats = action.payload;
    },
    setStreak: (state, action: PayloadAction<TaskStreakProp>) => {
      state.streak = action.payload;
    },
    setRewardTask: (state, action: PayloadAction<RewardTaskProp[]>) => {
      state.completed = action.payload;
    },
    setLeaderboard: (state, action: PayloadAction<LeaderboardProp[]>) => {
      state.leaderboards = action.payload;
    },
  },
  extraReducers(builder) {},
});

export const {
  setTask,
  setCourseTasks,
  setStats,
  setStreak,
  setRewardTask,
  setLeaderboard,
} = taskSlice.actions;
export default taskSlice.reducer;
