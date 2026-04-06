import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosInstance } from "axios";
import axios from "axios";
import { error } from "../components/alert/Toast";
import { ChatResponse, StudentContext } from "../types/agent";
import { axiosApi } from "../lib/axiosApi";

// Agent API base URL (separate from main backend)
const AGENT_API_BASE = "http://65.21.47.124:8002";
// const AGENT_API_BASE = "http://production-agent-url:8002";

// App key for agent API
const APP_KEY = "cw_live_9f3aK8xP2mQ7vL4rT1zY6bN0dH5sW8eC";

/**
 * Send a message to the tutor agent
 */
const sendTutorMessage = createAsyncThunk(
  "agent/sendTutorMessage",
  async (
    payload: {
      api: AxiosInstance;
      userId: string;
      query: string;
      studentContext?: StudentContext;
      accessToken: string;
    },
    thunkApi,
  ) => {
    try {
      const agentAxios = axios.create({
        baseURL: AGENT_API_BASE,
        headers: {
          "Content-Type": "application/json",
          "X-App-Key": APP_KEY,
          Authorization: `Bearer ${payload.accessToken}`,
        },
      });

      const response = await agentAxios.post<ChatResponse>(
        "/chat/agent/tutor/",
        {
          user_id: payload.userId,
          query: payload.query,
          student_context: payload.studentContext || {},
        },
      );

      return response.data.response;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Failed to get response from agent";
      error(errorMessage);
      return thunkApi.rejectWithValue(errorMessage);
    }
  },
);

/**
 * Fetch all chats for the current user
 */
const fetchChats = createAsyncThunk(
  "agent/fetchChats",
  async (payload: { api: AxiosInstance }, thunkApi) => {
    try {
      const response = await payload.api.get(`/chats/`);

      const chatsData = response.data?.data || response.data || [];
      return Array.isArray(chatsData) ? chatsData : [];
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to fetch chats";
      console.error("Fetch chats error:", errorMessage);
      return thunkApi.rejectWithValue(errorMessage);
    }
  },
);

/**
 * Send feedback on a conversation
 */
const sendConversationFeedback = createAsyncThunk(
  "agent/sendFeedback",
  async (
    payload: {
      api: AxiosInstance;
      conversationId: number;
      feedbackType: "positive" | "negative";
    },
    thunkApi,
  ) => {
    try {
      const response = await payload.api.put(
        `/conversation/${payload.conversationId}/feedback/`,
        {
          feedback_type: payload.feedbackType,
        },
      );

      return response.data;
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to send feedback";
      error(errorMessage);
      return thunkApi.rejectWithValue(errorMessage);
    }
  },
);

const agentService = {
  sendTutorMessage,
  fetchChats,
  sendConversationFeedback,
};

export default agentService;
