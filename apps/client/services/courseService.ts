import { createAsyncThunk } from "@reduxjs/toolkit";
import { Course } from "../types/course";
import axios from "axios";
import { axiosApi } from "../lib/axiosApi";

// Async thunk to fetch courses
const getCourses = createAsyncThunk(
  "courses/get",
  async (_, thunkApi) => {
    try {
      const response = await axiosApi.get("/tutor/courses/featured/");
      console.log("Courses API Response:", response.data);

      let coursesData = response.data;

      // Handle various response structures
      if (coursesData && typeof coursesData === 'object' && !Array.isArray(coursesData)) {
          if (coursesData.data && Array.isArray(coursesData.data)) {
               coursesData = coursesData.data;
          } else if (coursesData.data && typeof coursesData.data === 'object' && coursesData.data.results && Array.isArray(coursesData.data.results)) {
               coursesData = coursesData.data.results;
          } else if (coursesData.results && Array.isArray(coursesData.results)) {
               coursesData = coursesData.results;
          }
      }
      
      if (!Array.isArray(coursesData)) {
          console.error("Unexpected courses response structure:", coursesData);
          return [];
      }

      // Map API data to UI Course interface
      const mappedCourses: Course[] = coursesData.map((apiCourse: any) => {
        const price = parseFloat(apiCourse.base_price || "0");
        const passiveRev = (price * 1.5).toFixed(2); // Placeholder logic

        return {
          id: apiCourse.id,
          title: apiCourse.title,
          description: apiCourse.description,
          image: apiCourse.thumbnail || apiCourse.logo || null, // Use thumbnail or logo
          features: apiCourse.tags || [],
          duration: `${apiCourse.duration_weeks || 0} Weeks`,
          lessons: apiCourse.total_hours || 0, // Mapping total_hours to lessons/hours
          certification: apiCourse.difficulty_level === 'advanced' ? "Expert Certified" : "Certified",
          price: price,
          passiveRevenue: `$${passiveRev}/month`,
          
          // Store original fields if needed
          ...apiCourse
        };
      });

      return mappedCourses;
    } catch (err: any) {
      console.error("Error fetching courses:", err);
      return thunkApi.rejectWithValue(err.response?.data?.message || "Failed to fetch courses");
    }
  }
);

const courseService = {
  getCourses
};

export default courseService;
