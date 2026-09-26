import { createAsyncThunk } from "@reduxjs/toolkit";
import { Course } from "../types/course";
import axios, { AxiosInstance } from "axios";
import { axiosApi } from "../lib/axiosApi";

// Async thunk to fetch courses
const getCourses = createAsyncThunk("courses/get", async (_, thunkApi) => {
  try {
    const response = await axiosApi.get("/tutor/courses/featured/");
    console.log("Courses API Response:", response.data);

    let coursesData = response.data;

    // Handle various response structures
    if (
      coursesData &&
      typeof coursesData === "object" &&
      !Array.isArray(coursesData)
    ) {
      if (coursesData.data && Array.isArray(coursesData.data)) {
        coursesData = coursesData.data;
      } else if (
        coursesData.data &&
        typeof coursesData.data === "object" &&
        coursesData.data.results &&
        Array.isArray(coursesData.data.results)
      ) {
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
        certification:
          apiCourse.difficulty_level === "advanced"
            ? "Expert Certified"
            : "Certified",
        price: price,
        passiveRevenue: `$${passiveRev}/month`,

        // Store original fields if needed
        ...apiCourse,
      };
    });

    return mappedCourses;
  } catch (err: any) {
    console.error("Error fetching courses:", err);
    return thunkApi.rejectWithValue(
      err.response?.data?.message || "Failed to fetch courses",
    );
  }
});

// Fetch single course by ID
const getCourseById = async (id: string | number) => {
  try {
    const response = await axiosApi.get(`/tutor/courses/${id}/`);
    const responseData = response.data;

    if (responseData?.status === "error") {
      throw new Error(
        responseData.message ||
          responseData.error ||
          response.statusText ||
          "Failed to load course details",
      );
    }

    if (responseData && responseData.data) {
      return responseData.data;
    }

    if (responseData && typeof responseData === "object") {
      return responseData;
    }

    throw new Error("Invalid course detail response");
  } catch (err: any) {
    const message =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.response?.statusText ||
      err?.message ||
      "Failed to load course details";
    throw new Error(message);
  }
};

const apiMessage = (err: any, fallback: string) =>
  err?.response?.data?.message || err?.message || fallback;

/* Records attendance and returns the link to open. The class link must come
   from THIS response, not from the schedule list — skipping this call means
   attendance is never recorded and the class doesn't count toward the
   streak. Open from 15 min before start until the class ends; calling twice
   is harmless. 403 not enrolled, 400 too early / finished, 404 no class. */
const checkInToClass = async (
  api: AxiosInstance,
  scheduleId: string | number,
): Promise<string> => {
  try {
    const { data } = await api.post(`/tutor/schedules/${scheduleId}/check-in/`);
    if (data?.status === "error") throw new Error(data.message);
    const link = data?.data?.class_link;
    if (!link) throw new Error("No class link available yet");
    return link;
  } catch (err: any) {
    throw new Error(apiMessage(err, "Couldn't check you in to this class"));
  }
};

export type CourseAiUnits = {
  course: number;
  course_title: string;
  earned_units: string;
  tasks_completed: number;
};

/* AI units earned from this course's tasks — claimed rewards only.
   403 not enrolled, 404 no such course. */
const getCourseAiUnits = async (
  api: AxiosInstance,
  courseId: string | number,
): Promise<CourseAiUnits> => {
  try {
    const { data } = await api.get(`/tutor/courses/${courseId}/ai-units/`);
    if (data?.status === "error" || !data?.data) throw new Error(data?.message);
    return data.data;
  } catch (err: any) {
    throw new Error(apiMessage(err, "Couldn't load credits for this course"));
  }
};

const courseService = {
  getCourses,
  getCourseById,
  checkInToClass,
  getCourseAiUnits,
};

export default courseService;
