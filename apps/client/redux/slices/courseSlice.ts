import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Course } from "../../types/course";
import courseService from "../../services/courseService";

interface CourseState {
  courses: Course[];
  isLoading: boolean;
  error: string | null;
}

const initialState: CourseState = {
  courses: [], // Start empty, will be populated by service
  isLoading: false,
  error: null
};

const courseSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    setCourses: (state, action: PayloadAction<Course[]>) => {
      state.courses = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(courseService.getCourses.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(courseService.getCourses.fulfilled, (state, action) => {
        state.isLoading = false;
        state.courses = action.payload;
      })
      .addCase(courseService.getCourses.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  }
});

export const { setCourses, setLoading, setError } = courseSlice.actions;
export default courseSlice.reducer;
