// Import necessary modules and types
import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Testimonial } from "../../types/testimonial"; // Import the Testimonial type from the relevant path

// Define the structure of the testimonial state
interface TestimonialState {
  testimonials: Testimonial; // A single Testimonial object
}

// Define initial state for the testimonial slice
const initialState: TestimonialState = {
  testimonials: {}, // Start with an empty object for testimonials
};

// Create the testimonial slice using createSlice function
export const testimonialSlice = createSlice({
  name: "testimonial", // Name of the slice
  initialState, // Initial state defined above
  reducers: {
    // Reducer to set the testimonials
    setTestimonials: (state, action: PayloadAction<Testimonial>) => {
      state.testimonials = action.payload; // Set the testimonials using the payload data
    },
  },
  extraReducers(builder) {},
});

// Export the action creator and the reducer
export const { setTestimonials } = testimonialSlice.actions; // Export the action creator for setting testimonials
export default testimonialSlice.reducer; // Export the reducer function
