import { createAsyncThunk } from "@reduxjs/toolkit";
import { AxiosInstance } from "axios";
import axios from "axios";
import { error } from "../components/alert/Toast";
import { ChatResponse, StudentContext } from "../types/agent";
import { axiosApi } from "../lib/axiosApi";

// The Agent API is now called directly as the backend has been configured to accept CORS.

/**
 * Send a message to the tutor agent
 */
const sendMessage = createAsyncThunk(
  "agent/sendMessage",
  async (
    payload: {
      api: AxiosInstance;
      userId: string;
      query: string;
      agentType: "tutor" | "customer-care";
      studentContext?: StudentContext;
      accessToken: string;
    },
    thunkApi,
  ) => {
    try {
      const AGENT_APP_KEY = "cw_live_9f3aK8xP2mQ7vL4rT1zY6bN0dH5sW8eC";
      const response = await axios.post<ChatResponse>(
        `http://65.21.47.124:8002/chat/agent/${payload.agentType}/`,
        {
          user_id: payload.userId,
          query: payload.query,
          ...(payload.agentType === "tutor" ? { student_context: payload.studentContext || {} } : {}),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${payload.accessToken}`,
            "X-App-Key": AGENT_APP_KEY,
          },
        },
      );

      return response.data.response || response.data;
    } catch (err: any) {
      let errorMessage = "Failed to get response from agent";
      
      // Specifically handle rate limiting 429
      if (err.response?.status === 429 && err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else {
        errorMessage = err.response?.data?.message || err.message || errorMessage;
        // Don't toast 429, we handle it inline. Do toast other errors.
        error(errorMessage);
      }
      
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
  sendMessage,
  fetchChats,
  sendConversationFeedback,
};

export default agentService;
