import { createAsyncThunk } from "@reduxjs/toolkit";
import { axiosApi } from "../lib/axiosApi";
import { AxiosError, AxiosInstance } from "axios";
import {
  setCourseTasks,
  setLeaderboard,
  setRewardTask,
  setStats,
  setStreak,
  setTask,
} from "../redux/slices/taskSlice";
import { error, success } from "../components/alert/Toast";
import type { TaskProp } from "../types/task";

const getErrorMessage = (err: any): string => {
  const e = err as AxiosError;
  const data = e.response?.data as any;
  if (!data) return e.message ?? e.toString();
  if (typeof data === "string") return data;
  if (data.message) return data.message;
  if (typeof data === "object") {
    const firstValue = Object.values(data)[0];
    if (Array.isArray(firstValue) && firstValue.length > 0)
      return String(firstValue[0]);
    if (typeof firstValue === "string") return firstValue;
  }
  return e.message ?? e.toString();
};

const getTasks = createAsyncThunk(
  "/tasks",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/all/");

      // When there are no tasks the API replies with `{ message: "..." }`
      // instead of a list. That's a normal empty state, not an error — set an
      // empty list and let the page render its own "nothing to do" message,
      // rather than popping a toast on every visit.
      if (data?.message != null) {
        thunkApi.dispatch(setTask([]));
        return [];
      }

      thunkApi.dispatch(setTask(Array.isArray(data) ? data : []));
      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

/* Course tasks are NOT in /task/all/ — each enrolled course has its own
   list at /task/course/{id}/. The course ids come from /tutor/courses/ (the
   same list the Academy page shows as "your courses"). A course the student
   isn't fully enrolled in answers 403 and a missing one 400 — those are
   skipped quietly rather than failing the whole list. */
const getCourseTasks = createAsyncThunk(
  "/tasks/course",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/tutor/courses/");
      const courses: any[] = Array.isArray(data?.data?.results)
        ? data.data.results
        : [];

      const perCourse = await Promise.all(
        courses
          .filter((c) => c?.id != null)
          .map(async (c): Promise<TaskProp[]> => {
            try {
              const { data: list } = await api.get(`/task/course/${c.id}/`);
              // `{ status: "success", message: "No task available for now." }`
              // is the empty state, same quirk as /task/all/.
              if (!Array.isArray(list)) return [];
              return list.map((t: TaskProp) => ({
                ...t,
                category: t.category ?? "course",
                course: t.course ?? c.id,
                course_title: t.course_title ?? c.title,
              }));
            } catch {
              return [];
            }
          }),
      );

      const all = perCourse.flat();
      thunkApi.dispatch(setCourseTasks(all));
      return all;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const getReward = createAsyncThunk(
  "/tasks/reward",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/reward/");

      // Same empty-state shape as /task/all/ — a `{ message: "..." }` object
      // instead of a list. Always sync the store either way, or a stale
      // `completed` list (e.g. after the last reward is claimed) never clears.
      if (data?.message != null) {
        thunkApi.dispatch(setRewardTask([]));
        return [];
      }

      thunkApi.dispatch(setRewardTask(Array.isArray(data) ? data : []));

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const verifyReward = createAsyncThunk(
  "/verify/reward",
  async (
    payload: { api: AxiosInstance; data: { task_id?: number; link?: string } },
    thunkApi,
  ) => {
    try {
      const { data } = await payload.api.post("/task/reward/", {
        task_id: payload.data.task_id,
        verification_link: payload.data.link,
      });

      if (data.status !== "success") {
        error(data.message);
      }

      return data;
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
      return thunkApi.rejectWithValue(errMsg);
    }
  },
);

const claimReward = createAsyncThunk(
  "/claim/reward",
  async (payload: { api: AxiosInstance; id: string }, thunkApi) => {
    try {
      // GET still works, but backend now prefers POST for claims.
      const { data } = await payload.api.post(
        `/task/reward/claim/${payload.id}/`,
      );

      if (data.status === "error") {
        error(data.message);
        return;
      }
      thunkApi.dispatch(getTasks(payload.api));
      thunkApi.dispatch(getCourseTasks(payload.api));
      thunkApi.dispatch(getReward(payload.api));
      thunkApi.dispatch(getTaskStats(payload.api));
      thunkApi.dispatch(getTaskStreak(payload.api));
      thunkApi.dispatch(getLeaderboard(payload.api));
      success(data.message ?? "Reward has been claimed.");

      return data;
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      error(errMsg);
      return thunkApi.rejectWithValue(errMsg);
    }
  },
);

const getTaskStats = createAsyncThunk(
  "/tasks/stats",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/stats/");

      if (data.length > 0) {
        thunkApi.dispatch(setStats(data[0]));
      }

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const getTaskStreak = createAsyncThunk(
  "/tasks/streak",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/streak/");

      thunkApi.dispatch(setStreak(data));

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const getLeaderboard = createAsyncThunk(
  "/tasks/leaderboard",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const { data } = await api.get("/task/leaderboard/");

      thunkApi.dispatch(setLeaderboard(data));

      return data;
    } catch (err: any) {
      return thunkApi.rejectWithValue(getErrorMessage(err));
    }
  },
);

const taskService = {
  getTasks,
  getCourseTasks,
  getReward,
  getTaskStats,
  getTaskStreak,
  verifyReward,
  claimReward,
  getLeaderboard,
};

export default taskService;
