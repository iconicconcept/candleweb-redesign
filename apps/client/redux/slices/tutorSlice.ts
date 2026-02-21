import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Tutor, FAQ } from "../../types/tutor";
import tutorService from "../../services/tutorService";

interface TutorState {
  tutors: Tutor[];
  faqs: FAQ[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TutorState = {
  tutors: [],
  faqs: [],
  isLoading: false,
  error: null,
};

const tutorSlice = createSlice({
  name: "tutors",
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setTutors: (state, action: PayloadAction<Tutor[]>) => {
      state.tutors = action.payload;
      state.isLoading = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(tutorService.getTutors.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(tutorService.getTutors.fulfilled, (state, action) => {
        state.tutors = action.payload;
        state.isLoading = false;
      })
      .addCase(tutorService.getTutors.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch tutors";
      })
      .addCase(tutorService.getFaqs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(tutorService.getFaqs.fulfilled, (state, action) => {
        state.faqs = action.payload;
        state.isLoading = false;
      })
      .addCase(tutorService.getFaqs.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || "Failed to fetch FAQs";
      });
  },
});

export const { setLoading, setTutors, setError } = tutorSlice.actions;
export default tutorSlice.reducer;
