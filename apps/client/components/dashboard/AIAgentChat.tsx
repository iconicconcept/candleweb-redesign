import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import {
  addMessage,
  setChatOpen,
  createNewChat,
  setIsLoading,
  setError,
  setAgentType,
} from "../../redux/slices/agentSlice";
import agentService from "../../services/agentService";
import useAxiosAuth from "../../lib/hooks/useAxiosAuth";
import useUserStore from "../../lib/hooks/useUserStore";
import { ChatMessage } from "../../types/agent";
import { IoClose, IoPaperPlane } from "react-icons/io5";
import { MdSmartToy } from "react-icons/md";
import { BsThreeDots } from "react-icons/bs";

interface AIAgentChatProps {
  studentContext?: Record<string, any>;
}

export default function AIAgentChat({ studentContext: additionalStudentContext }: AIAgentChatProps = {}) {
  const dispatch = useDispatch<AppDispatch>();
  const axiosToken = useAxiosAuth();
  const { user } = useUserStore();

  const { isChatOpen, isLoading, messages, error, agentType } = useSelector(
    (state: RootState) => state.agent,
  );
  
  const { tasks, stats } = useSelector((state: RootState) => state.task);

  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isSending = useRef(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isChatOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputValue.trim() || isLoading || isSending.current) return;

    const userMessage = inputValue.trim();
    setInputValue("");
    isSending.current = true;

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

    // Construct robust context
    const aiUnits = stats?.earned_units ?? 0;
    const AI_UNIT_VALUE_NGN = 64.1;
    const studentContext = {
      task_info: {
        count: tasks?.length || 0,
      },
      earnings_info: { revenue: aiUnits * AI_UNIT_VALUE_NGN, ai_units: aiUnits },
      ...(additionalStudentContext || {}),
    };

    try {
      const response = await dispatch(
        agentService.sendMessage({
          api: axiosToken,
          userId: user?.username || "user",
          query: userMessage,
          agentType: agentType,
          studentContext,
          accessToken: user?.access_token || "",
        }),
      ).unwrap();

      let responseText = "";
      if (response && typeof response === "string") {
        responseText = response;
      } else if (response && typeof response === "object" && (response as any).response) {
        responseText = (response as any).response;
      }

      if (responseText) {
        const agentMsg: ChatMessage = {
          id: Date.now() + 1,
          chat_id: 0,
          user_query: "", // empty user query block
          response: responseText,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        dispatch(addMessage(agentMsg));
      } else {
        console.error("Unknown response structure:", response);
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      // Ensure the error gets saved to state to render inline red-text
      dispatch(setError(err || "Failed to get response. Please try again."));
    } finally {
      dispatch(setIsLoading(false));
      isSending.current = false;
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAgentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(setAgentType(e.target.value as "tutor" | "customer-care"));
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toUpperCase();
  };

  return (
    <>
      {!isChatOpen && (
        <button
          onClick={() => dispatch(setChatOpen(true))}
          className="fixed bottom-6 right-6 z-40 p-[14px] rounded-2xl bg-primary hover:bg-primary/90 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-xl transition-all duration-300 group inline-flex border border-white/10"
          title="Open AI Tutor"
        >
          <MdSmartToy size={32} className="text-[#0d1017]" />
        </button>
      )}

      {isChatOpen && (
        <div className="fixed z-50 bg-[#121212] border border-white/5 shadow-2xl flex flex-col overflow-hidden animate-fade-in 
            bottom-6 right-6 w-[420px] h-[650px] max-h-[90vh] rounded-[20px] inset-auto
            tb:bottom-0 tb:right-0 tb:left-0 tb:top-0 tb:w-full tb:h-full tb:max-h-none tb:rounded-none tb:inset-0">
          
          {/* Header */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/5 bg-[#121212]">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/20 flex-shrink-0">
                <MdSmartToy className="text-primary" size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-white">
                  Al Co-pilot
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <p className="text-[9px] text-primary tracking-widest uppercase font-bold">
                    SYSTEMS ONLINE
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
               <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                 <BsThreeDots size={18} className="text-white/70" />
               </button>
               <button
                 onClick={() => dispatch(setChatOpen(false))}
                 className="p-2 hover:bg-white/5 rounded-lg transition-colors"
               >
                 <IoClose size={20} className="text-white" />
               </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-black/10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-4">
                <p className="text-xs text-txtGray/70">
                  You requested system communications.
                </p>
              </div>
            ) : (
              messages.map((msg: ChatMessage) => (
                <div key={msg.id} className="space-y-4">
                  {/* User Message */}
                  {msg.user_query && msg.user_query.trim() !== "" && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1.5 mr-1">
                        <span className="text-[10px] text-txtGray font-medium">{formatTime(msg.created_at)}</span>
                        <span className="text-[10px] text-[#ffb86c] font-black uppercase tracking-wider">YOU</span>
                      </div>
                      <div className="max-w-[85%] bg-[#1c140d] border border-[#ffb86c]/20 text-white/90 px-4 py-3.5 rounded-2xl rounded-tr-sm text-[13px] break-words leading-relaxed shadow-sm">
                        {msg.user_query}
                      </div>
                    </div>
                  )}

                  {/* Agent Response */}
                  {msg.response && msg.response.trim() !== "" && (
                    <div className="flex flex-col items-start">
                      <div className="flex items-center gap-2 mb-1.5 ml-1">
                        <span className="text-[10px] text-primary font-black uppercase tracking-wider">CO-PILOT</span>
                        <span className="text-[10px] text-txtGray font-medium">{formatTime(msg.updated_at)}</span>
                      </div>
                      <div className="max-w-[85%] bg-[#1a1a1a] border border-white/5 text-white/90 px-4 py-3.5 rounded-2xl rounded-tl-sm text-[13px] break-words leading-relaxed shadow-sm">
                        {msg.response}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}

            {isLoading && (
              <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1.5 ml-1">
                    <span className="text-[10px] text-primary font-black uppercase tracking-wider">CO-PILOT</span>
                  </div>
                  <div className="bg-[#1a1a1a] text-txtGray/70 text-[13px] px-5 py-3 rounded-2xl rounded-tl-sm border border-white/5 shadow-sm font-medium">
                    Loading response...
                  </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center mt-4">
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 font-medium px-4 py-2.5 rounded-xl text-xs w-full text-center">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Form & Input Area */}
          <div className="bg-[#0b0c0f] p-5 pb-4 flex flex-col gap-3 z-10 border-t border-white/5 relative">
            
            {/* Dropdown for Agent */}
            <div className="px-1 flex items-center justify-start">
              <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-white/5">
                 <MdSmartToy size={14} className="text-primary" />
                 <select 
                    value={agentType}
                    onChange={handleAgentChange}
                    className="bg-transparent text-[11px] text-white/80 font-bold outline-none cursor-pointer tracking-wide appearance-none pr-3"
                 >
                   <option value="tutor" className="bg-card p-1">Tutor</option>
                   <option value="customer-care" className="bg-card p-109">Customer care</option>
                 </select>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="relative mt-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask anything about your portfolio..."
                disabled={isLoading}
                className="w-full bg-[#1e1e1e] border border-white/5 focus:border-primary/30 rounded-full pl-5 pr-[52px] py-3.5 text-[13px] text-white placeholder-txtGray/60 focus:outline-none transition-colors disabled:opacity-50 shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="absolute right-2 top-2 bottom-2 aspect-square rounded-full bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-[0_0_15px_rgba(39,236,176,0.3)] hover:shadow-[0_0_20px_rgba(39,236,176,0.5)]"
                title="Send message"
              >
                <IoPaperPlane size={16} className="text-[#0d1017] ml-0.5" />
              </button>
            </form>
            
            <p className="text-[9px] text-txtGray/40 text-center uppercase tracking-widest mt-1.5 font-bold">
              Candle AI Agents v1
            </p>
          </div>
        </div>
      )}

      {/* Overlay for mobile ONLY (optional, to dim background) */}
      {isChatOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 pointer-events-auto sm:bg-transparent"
          onClick={() => dispatch(setChatOpen(false))}
        />
      )}
    </>
  );
}
