import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import { Chat, ChatMessage, AgentChatState } from "../../types/agent";

const initialState: AgentChatState = {
  chats: [],
  currentChat: null,
  messages: [],
  isLoading: false,
  error: null,
  isChatOpen: false,
};

export const agentSlice = createSlice({
  name: "agent",
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
      state.messages = action.payload?.chat_conversation || [];
    },
    addMessage: (state, action: PayloadAction<ChatMessage>) => {
      state.messages = [...state.messages, action.payload];
    },
    setMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
    },
    setIsLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    toggleChatOpen: (state) => {
      state.isChatOpen = !state.isChatOpen;
    },
    setChatOpen: (state, action: PayloadAction<boolean>) => {
      state.isChatOpen = action.payload;
    },
    createNewChat: (state) => {
      state.currentChat = null;
      state.messages = [];
      state.error = null;
    },
  },
});

export const {
  setChats,
  setCurrentChat,
  addMessage,
  setMessages,
  setIsLoading,
  setError,
  toggleChatOpen,
  setChatOpen,
  createNewChat,
} = agentSlice.actions;

export default agentSlice.reducer;
