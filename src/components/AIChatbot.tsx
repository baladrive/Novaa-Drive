"use client";
import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, X, MessageSquare, Copy, ThumbsUp, ThumbsDown,
  Sparkles, FileText, Loader2,
} from "lucide-react";
import { chatbotService, ChatContext } from "../services/chatbotService";
import { useAuth } from "../context/AuthContext";

interface AIChatbotProps {
  fileId: string;
  filename: string;
  fileText?: string;
  ocrText?: string;
  tags?: string[];
  category?: string;
  onClose?: () => void;
}

export default function AIChatbot({
  fileId,
  filename,
  fileText = "",
  ocrText = "",
  tags = [],
  category = "document",
  onClose,
}: AIChatbotProps) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const context: ChatContext = {
    fileId,
    filename,
    text: fileText,
    ocrText,
    tags,
    category,
  };

  // Initialize or get session
  useEffect(() => {
    let session = chatbotService.getSessionForFile(fileId);
    if (!session) {
      session = chatbotService.createSession(fileId, filename);
    }
    setSessionId(session.id);
    setMessages(session.messages);
  }, [fileId, filename]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || !sessionId || loading) return;

    const message = input.trim();
    setInput("");
    setLoading(true);

    try {
      const assistantMessage = await chatbotService.sendMessage(sessionId, message, context);

      // Update messages
      const session = chatbotService.getSession(sessionId);
      if (session) {
        setMessages([...session.messages]);
      }
    } catch (e) {
      console.error("Failed to send message:", e);
    } finally {
      setLoading(false);
    }
  }, [input, sessionId, loading, context]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleFeedback = (messageId: string, feedback: "positive" | "negative") => {
    // In a real app, this would send feedback to the backend
    console.log(`Feedback for ${messageId}: ${feedback}`);
  };

  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-96 flex-col rounded-2xl border border-white/[0.1] bg-[#0B1020]/95 backdrop-blur-xl shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between rounded-t-2xl border-b border-white/[0.06] bg-white/[0.03] p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500">
            <Bot className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-white">AI Assistant</h3>
            <p className="text-xs text-white/40">Ask about "{filename}"</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-white/40 hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-2">
            <div className="flex gap-3">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-purple-500 to-cyan-500"
                  : "bg-white/[0.1]"
              }`}>
                {msg.role === "assistant" ? (
                  <Bot className="h-3 w-3 text-white" />
                ) : (
                  <User className="h-3 w-3 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className={`rounded-xl px-3 py-2 text-sm ${
                  msg.role === "assistant"
                    ? "bg-white/[0.03] text-white/80"
                    : "bg-gradient-to-r from-purple-500/10 to-cyan-500/10 text-white"
                }`}>
                  {msg.content}
                </div>
                {msg.role === "assistant" && (
                  <div className="mt-1 flex items-center gap-1">
                    <button
                      onClick={() => handleFeedback(msg.id, "positive")}
                      className="rounded p-0.5 text-xs text-white/30 hover:text-white/60"
                    >
                      <ThumbsUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id, "negative")}
                      className="rounded p-0.5 text-xs text-white/30 hover:text-white/60"
                    >
                      <ThumbsDown className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleCopy(msg.content)}
                      className="rounded p-0.5 text-xs text-white/30 hover:text-white/60"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                    {msg.confidence !== undefined && (
                      <span className="text-xs text-white/30">
                        {msg.confidence}% confidence
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-cyan-500">
              <Bot className="h-3 w-3 text-white" />
            </div>
            <div className="rounded-xl bg-white/[0.03] px-3 py-2">
              <Loader2 className="h-4 w-4 animate-spin text-white/40" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/[0.06] p-3">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this document..."
            className="flex-1 resize-none rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
            rows={1}
            maxLength={500}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-cyan-500 text-white shadow-lg shadow-purple-500/20 transition-transform hover:scale-105 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-1 flex flex-wrap gap-1">
          {["What is this about?", "Summarize key points", "How many words?", "What are the tags?"]
            .map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setInput(suggestion)}
                className="rounded-full px-2 py-0.5 text-xs text-white/30 hover:bg-white/[0.06] hover:text-white/60 transition-colors"
              >
                {suggestion}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
