import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import paymentService from "../../services/paymentService";

interface PaymentState {
  isInitiating: boolean;
  isVerifying: boolean;
  purchasedCourseIds: number[];
  lastPaymentStatus: "idle" | "success" | "failed";
  error: string | null;
  paymentData: any | null;
}

const initialState: PaymentState = {
  isInitiating: false,
  isVerifying: false,
  purchasedCourseIds: [],
  lastPaymentStatus: "idle",
  error: null,
  paymentData: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    resetPaymentStatus: (state) => {
      state.lastPaymentStatus = "idle";
      state.error = null;
    },
    setPurchasedCourses: (state, action: PayloadAction<number[]>) => {
        state.purchasedCourseIds = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Initiate Payment
      .addCase(paymentService.initiatePayment.pending, (state) => {
        state.isInitiating = true;
        state.error = null;
      })
      .addCase(paymentService.initiatePayment.fulfilled, (state, action) => {
        state.isInitiating = false;
        state.paymentData = action.payload;
      })
      .addCase(paymentService.initiatePayment.rejected, (state, action) => {
        state.isInitiating = false;
        state.lastPaymentStatus = "failed";
        state.error = action.payload as string;
      })
      // Verify Payment
      .addCase(paymentService.verifyPayment.pending, (state) => {
        state.isVerifying = true;
        state.error = null;
      })
      .addCase(paymentService.verifyPayment.fulfilled, (state, action) => {
        state.isVerifying = false;
        state.lastPaymentStatus = "success";
        // Assuming the verification response contains the course_id or we have it from before
        const courseId = action.payload?.course_id || action.payload?.data?.course_id;
        if (courseId && !state.purchasedCourseIds.includes(courseId)) {
          state.purchasedCourseIds.push(courseId);
        }
      })
      .addCase(paymentService.verifyPayment.rejected, (state, action) => {
        state.isVerifying = false;
        state.lastPaymentStatus = "failed";
        state.error = action.payload as string;
      });
  },
});

export const { resetPaymentStatus, setPurchasedCourses } = paymentSlice.actions;
export default paymentSlice.reducer;
