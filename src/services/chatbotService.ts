/**
 * AI Chatbot Service — Answer questions about uploaded documents
 *
 * Uses the document text (from OCR or file content) to provide
 * context-aware answers. Falls back to keyword-based matching
 * when no AI backend is configured.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  fileId?: string;
  confidence?: number;
}

export interface ChatSession {
  id: string;
  title: string;
  fileId?: string;
  filename?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatContext {
  fileId: string;
  filename: string;
  text: string;
  ocrText?: string;
  tags: string[];
  category: string;
}

// In-memory session store (persisted to localStorage)
const SESSION_KEY = "novaa_chat_sessions";

function getSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessions.slice(0, 50)));
  } catch {}
}

/** Generate a simple response based on document context */
function generateResponse(
  question: string,
  context: ChatContext
): { answer: string; confidence: number } {
  const q = question.toLowerCase();
  const text = (context.text + " " + (context.ocrText || "")).toLowerCase();

  // Extract sentences from the document
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];

  // Keyword-based matching
  const keywords = q
    .replace(/[?:;.,]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  let bestMatch = "";
  let bestScore = 0;

  for (const sentence of sentences) {
    let score = 0;
    for (const kw of keywords) {
      if (sentence.includes(kw)) score += 1;
    }
    const density = score / Math.max(keywords.length, 1);
    if (density > bestScore) {
      bestScore = density;
      bestMatch = sentence.trim();
    }
  }

  // If we found a good match, use it
  if (bestScore > 0.3 && bestMatch) {
    return {
      answer: bestMatch.charAt(0).toUpperCase() + bestMatch.slice(1),
      confidence: Math.round(bestScore * 100),
    };
  }

  // Fallback responses based on question type
  if (q.includes("what") && q.includes("file")) {
    return {
      answer: `This is a ${context.category} file named "${context.filename}".`,
      confidence: 80,
    };
  }

  if (q.includes("how many") || q.includes("count")) {
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    return {
      answer: `The document contains approximately ${wordCount} words.`,
      confidence: 75,
    };
  }

  if (q.includes("summary") || q.includes("summarize") || q.includes("what is this about")) {
    const summary = sentences.slice(0, 3).join(" ").trim();
    return {
      answer: summary || "I couldn't extract a summary from this document.",
      confidence: 60,
    };
  }

  if (q.includes("tag") || q.includes("label")) {
    return {
      answer: `This file is tagged with: ${context.tags.join(", ") || "no tags"}.`,
      confidence: 85,
    };
  }

  // Generic response
  return {
    answer:
      "I can help you find information in your documents. Try asking about the content, key points, or specific details in this file.",
    confidence: 30,
  };
}

export const chatbotService = {
  /** Create a new chat session for a file */
  createSession(fileId: string, filename: string): ChatSession {
    const session: ChatSession = {
      id: "chat_" + Math.random().toString(36).substring(2, 15),
      title: `Chat about ${filename}`,
      fileId,
      filename,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: "msg_" + Math.random().toString(36).substring(2, 15),
          role: "system",
          content: `I'm your AI assistant for "${filename}". Ask me anything about this document!`,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    const sessions = getSessions();
    sessions.unshift(session);
    saveSessions(sessions);
    return session;
  },

  /** Get all chat sessions */
  getSessions(): ChatSession[] {
    return getSessions();
  },

  /** Get a specific session */
  getSession(sessionId: string): ChatSession | null {
    return getSessions().find((s) => s.id === sessionId) || null;
  },

  /** Get or create a session for a file */
  getSessionForFile(fileId: string): ChatSession | null {
    return getSessions().find((s) => s.fileId === fileId) || null;
  },

  /** Send a message and get a response */
  async sendMessage(
    sessionId: string,
    message: string,
    context: ChatContext
  ): Promise<ChatMessage> {
    const sessions = getSessions();
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) throw new Error("Session not found");

    // Add user message
    const userMessage: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 15),
      role: "user",
      content: message,
      timestamp: new Date().toISOString(),
      fileId: context.fileId,
    };

    session.messages.push(userMessage);

    // Generate AI response
    const { answer, confidence } = generateResponse(message, context);

    const assistantMessage: ChatMessage = {
      id: "msg_" + Math.random().toString(36).substring(2, 15),
      role: "assistant",
      content: answer,
      timestamp: new Date().toISOString(),
      fileId: context.fileId,
      confidence,
    };

    session.messages.push(assistantMessage);
    session.updatedAt = new Date().toISOString();

    saveSessions(sessions);
    return assistantMessage;
  },

  /** Delete a chat session */
  deleteSession(sessionId: string): void {
    const sessions = getSessions().filter((s) => s.id !== sessionId);
    saveSessions(sessions);
  },

  /** Clear all chat sessions */
  clearAllSessions(): void {
    localStorage.removeItem(SESSION_KEY);
  },
};
