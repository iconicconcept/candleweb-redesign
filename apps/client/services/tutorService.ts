import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosInstance } from "axios";
import { Tutor, FAQ, StudentProfile } from "../types/tutor";
import axios from "axios";
import { axiosApi } from "../lib/axiosApi";

const getTutors = createAsyncThunk("tutors/getTutors", async (_, thunkApi) => {
  try {
    const response = await axiosApi.get(`/tutor/lecturers/featured/`);
    console.log("Tutors API Response:", response.data); 

    // Handle various response structures
    let tutorsData = response.data;

    // Check if it's wrapped in a standard successful API response format
    if (tutorsData && typeof tutorsData === 'object' && !Array.isArray(tutorsData)) {
        if (tutorsData.data && Array.isArray(tutorsData.data)) {
             tutorsData = tutorsData.data;
        } else if (tutorsData.data && typeof tutorsData.data === 'object' && tutorsData.data.results && Array.isArray(tutorsData.data.results)) {
             tutorsData = tutorsData.data.results;
        } else if (tutorsData.results && Array.isArray(tutorsData.results)) {
             tutorsData = tutorsData.results;
        }
    }
    
    if (!Array.isArray(tutorsData)) {
        console.error("Unexpected tutors response structure:", tutorsData);
        return [];
    }

    return tutorsData as Tutor[];
  } catch (error: any) {
    return thunkApi.rejectWithValue(error.response?.data?.message || "Failed to fetch tutors");
  }
});

const getFaqs = createAsyncThunk("tutors/getFaqs", async (category: string | undefined, thunkApi) => {
  try {
    const url = `/tutor/faqs/${category ? `?category=${category}` : ''}`;
    const response = await axiosApi.get(url);
    console.log("FAQs API Response:", response.data);

    let faqsData = response.data;

    // Handle various response structures similar to getTutors
    if (faqsData && typeof faqsData === 'object' && !Array.isArray(faqsData)) {
        if (faqsData.data && Array.isArray(faqsData.data)) {
             faqsData = faqsData.data;
        } else if (faqsData.results && Array.isArray(faqsData.results)) {
             faqsData = faqsData.results;
        } else if (faqsData.data && typeof faqsData.data === 'object' && faqsData.data.results && Array.isArray(faqsData.data.results)) {
            faqsData = faqsData.data.results;
       }
    }

    if (!Array.isArray(faqsData)) {
        console.error("Unexpected FAQs response structure:", faqsData);
        return [];
    }

    return faqsData as FAQ[];
  } catch (error: any) {
    return thunkApi.rejectWithValue(error.response?.data?.message || "Failed to fetch FAQs");
  }
});

const checkStudentProfile = createAsyncThunk(
  "tutors/checkStudentProfile",
  async (api: AxiosInstance, thunkApi) => {
    try {
      const response = await api.get(`/tutor/student/check/`);
      return response.data;
    } catch (error: any) {
      return thunkApi.rejectWithValue(
        error.response?.data?.message || "Failed to check student profile"
      );
    }
  }
);


const tutorService = {
  getTutors,
  getFaqs,
  checkStudentProfile,
};

export default tutorService;
