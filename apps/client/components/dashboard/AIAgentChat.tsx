import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  addMessage,
  setChatOpen,
  createNewChat,
  setIsLoading,
  setError,
} from "../../redux/slices/agentSlice";
import agentService from "../../services/agentService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { ChatMessage } from "../../types/agent";
import { IoClose, IoSend, IoPaperPlane } from "react-icons/io5";
import { MdSmartToy } from "react-icons/md";

interface AIAgentChatProps {
  studentContext?: any;
}

export default function AIAgentChat({ studentContext }: AIAgentChatProps) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore();

  const { isChatOpen, isLoading, messages, error } = useSelector(
    (state: RootState) => state.agent,
  );

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue("");

    // Add user message to chat
    const userMsg: ChatMessage = {
      id: Date.now(),
      chat_id: 0,
      user_query: userMessage,
      response: "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    dispatch(addMessage(userMsg));
    dispatch(setIsLoading(true));
    dispatch(setError(null));

    try {
      // Call tutor agent API
      const response = await dispatch(
        agentService.sendTutorMessage({
          api: axiosToken,
          userId: user?.username || "user",
          query: userMessage,
          studentContext: studentContext || {},
          accessToken: user?.access_token || "",
        }),
      );

      if (response.payload && typeof response.payload === "string") {
        const agentMsg: ChatMessage = {
          id: Date.now() + 1,
          chat_id: 0,
          user_query: userMessage,
          response: response.payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        dispatch(addMessage(agentMsg));
      }
    } catch (err) {
      console.error("Error sending message:", err);
      dispatch(setError("Failed to get response. Please try again."));
    } finally {
      dispatch(setIsLoading(false));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClose = () => {
    dispatch(setChatOpen(false));
  };

  const handleNewChat = () => {
    dispatch(createNewChat());
  };

  return (
    <>
      {/* Chat Toggle Button - Always visible */}
      {!isChatOpen && (
        <button
          onClick={() => dispatch(setChatOpen(true))}
          className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300 group"
          title="Open AI Tutor"
        >
          <MdSmartToy size={24} className="text-white animate-bounce" />
          <div className="hidden group-hover:block absolute bottom-full right-0 mb-3 bg-black/90 text-white text-xs px-3 py-2 rounded whitespace-nowrap">
            AI Learning Assistant
          </div>
        </button>
      )}

      {/* Chat Panel */}
      {isChatOpen && (
        <div className="fixed z-50 bg-card border border-white/10 shadow-2xl flex flex-col overflow-hidden animate-fade-in top-0 left-0 right-0 bottom-0 w-full h-full sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96 sm:h-[600px] sm:max-h-[90vh] sm:rounded-2xl xl:inset-y-0 xl:right-0 xl:bottom-auto xl:left-auto xl:w-1/2 xl:max-w-2xl xl:h-full xl:rounded-none xl:rounded-l-2xl xl:border-l xl:border-b-0 xl:border-r-0 xl:border-t-0">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 to-primary/10 border-b border-primary/20 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/20">
                <MdSmartToy className="text-primary" size={20} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Learning Assistant
                </p>
                <p className="text-xs text-txtGray">
                  {isLoading ? "Thinking..." : "Ready to help"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
              title="Close chat"
            >
              <IoClose size={20} className="text-white" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <div className="p-4 rounded-full bg-primary/10 mb-4">
                  <MdSmartToy size={32} className="text-primary" />
                </div>
                <p className="text-sm text-txtGray mb-2">
                  Welcome to your AI Learning Assistant
                </p>
                <p className="text-xs text-txtGray/70">
                  Ask questions about your courses, concepts, or anything
                  you&apos;d like to understand better
                </p>
              </div>
            ) : (
              messages.map((msg: ChatMessage) => (
                <div key={msg.id} className="space-y-2">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="max-w-xs bg-primary/30 hover:bg-primary/40 text-white px-4 py-2 rounded-2xl rounded-tr-none text-sm break-words transition-colors">
                      {msg.user_query}
                    </div>
                  </div>

                  {/* Agent Response */}
                  {msg.response && (
                    <div className="flex justify-start">
                      <div className="max-w-xs bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-2xl rounded-tl-none text-sm break-words transition-colors border border-white/10">
                        {msg.response}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white/5 text-white px-4 py-3 rounded-2xl rounded-tl-none border border-white/10">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className="w-2 h-2 bg-primary rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="bg-red-500/20 border border-red-500/30 text-red-200 px-4 py-2 rounded-lg text-xs">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-white/10 bg-black/40 p-4 space-y-2">
            {/* New Chat Button */}
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="w-full text-xs text-primary hover:text-primary/80 font-medium py-2 px-3 rounded-lg hover:bg-primary/5 transition-all border border-primary/20"
              >
                + New Conversation
              </button>
            )}

            {/* Input Field */}
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything..."
                disabled={isLoading}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 focus:border-primary/50 rounded-full px-4 py-2 text-sm text-white placeholder-txtGray/50 focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="p-2 rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-primary/30"
                title="Send message"
              >
                <IoPaperPlane size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-40 pointer-events-auto"
          onClick={handleClose}
          style={{ background: "rgba(0,0,0,0.2)" }}
        />
      )}

      <style jsx>{`
        @keyframes slide-in-bottom {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: slide-in-bottom 0.3s ease-out;
        }

        @media (min-width: 768px) {
          .animate-fade-in {
            animation: slide-in-right 0.3s ease-out;
          }
        }
      `}</style>
    </>
  );
}
