export interface ChatMessage {
  id: number;
  chat_id: number;
  feedback_id?: number;
  user_query: string;
  response: string;
  duration?: string;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: number;
  title: string;
  account_id: string;
  agent: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  chat_conversation: ChatMessage[];
}

export interface ChatResponse {
  response: string;
}

export interface StudentContext {
  task_info?: any;
  class_details?: any;
  course_details?: any;
  earnings_info?: any;
}

export interface AgentChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  isChatOpen: boolean;
  agentType: "tutor" | "customer-care";
}
