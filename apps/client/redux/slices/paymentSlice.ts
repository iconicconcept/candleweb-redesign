import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import paymentService from "../../services/paymentService";
import tutorService from "../../services/tutorService";

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
        
        // Extract course ID from the response (data.enrollment.course.id or data.course_id)
        const data = action.payload?.data;
        const courseId = data?.enrollment?.course?.id || data?.enrollment?.course_id || data?.course_id || action.payload?.course_id;
        
        if (courseId && !state.purchasedCourseIds.includes(courseId)) {
          state.purchasedCourseIds.push(courseId);
        }
      })
      .addCase(paymentService.verifyPayment.rejected, (state, action) => {
        state.isVerifying = false;
        state.lastPaymentStatus = "failed";
        state.error = action.payload as string;
      })
      // Get Student Enrollments (from student/check endpoint)
      .addCase(tutorService.checkStudentProfile.fulfilled, (state, action) => {
        const data = action.payload?.data;
        if (data && data.enrolled_courses && Array.isArray(data.enrolled_courses)) {
          state.purchasedCourseIds = data.enrolled_courses.map((c: any) => c.id || c.course_id || c);
        } else if (data && data.enrollments && Array.isArray(data.enrollments)) {
          state.purchasedCourseIds = data.enrollments.map((e: any) => e.course?.id || e.course_id || e);
        }
      });
  },
});

export const { resetPaymentStatus, setPurchasedCourses } = paymentSlice.actions;
export default paymentSlice.reducer;
