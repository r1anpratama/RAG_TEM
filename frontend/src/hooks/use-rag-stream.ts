"use client";

import { useState, useRef, useCallback } from "react";
import { ChatMessage, SourceCitation, StreamEventData } from "@/types/chat";
import { API_BASE_URL } from "@/lib/api";
import { chatInputSchema } from "@/lib/validators";

export interface UseRagStreamReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (query: string, topK?: number) => Promise<void>;
  stopStreaming: () => void;
  clearMessages: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export function useRagStream(initialMessages: ChatMessage[] = []): UseRagStreamReturn {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const clearMessages = useCallback(() => {
    stopStreaming();
    setMessages([]);
    setError(null);
  }, [stopStreaming]);

  const sendMessage = useCallback(
    async (queryText: string, topK: number = 4) => {
      setError(null);

      // 1. Client-side Zod validation
      const validation = chatInputSchema.safeParse({
        query: queryText,
        top_k: topK,
        stream: true,
      });

      if (!validation.success) {
        const firstError = validation.error.errors[0]?.message || "Invalid input";
        setError(firstError);
        return;
      }

      const userMsgId = `user-${Date.now()}`;
      const assistantMsgId = `asst-${Date.now()}`;

      const userMessage: ChatMessage = {
        id: userMsgId,
        role: "user",
        content: queryText.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      const initialAssistantMessage: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isStreaming: true,
        citations: [],
      };

      // Append user prompt and placeholder for assistant
      setMessages((prev) => [...prev, userMessage, initialAssistantMessage]);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const response = await fetch(`${API_BASE_URL}/api/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
          },
          body: JSON.stringify({
            query: queryText.trim(),
            stream: true,
            top_k: topK,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error("Rate limit reached. Please wait a moment before asking again.");
          }
          let detail = `Server error (${response.status})`;
          try {
            const errJson = await response.json();
            if (errJson.detail) detail = errJson.detail;
          } catch {
            // fallback
          }
          throw new Error(detail);
        }

        if (!response.body) {
          throw new Error("Readable stream not supported by the browser.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let accumulatedContent = "";
        let collectedCitations: SourceCitation[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last incomplete slice in the buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;

            const jsonStr = trimmed.replace(/^data:\s*/, "");
            if (!jsonStr) continue;

            try {
              const event: StreamEventData = JSON.parse(jsonStr);

              if (event.event === "token" && event.token) {
                accumulatedContent += event.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: accumulatedContent }
                      : m
                  )
                );
              } else if (event.event === "citation" && event.citations) {
                collectedCitations = event.citations;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, citations: collectedCitations }
                      : m
                  )
                );
              } else if (event.event === "error" && event.error) {
                throw new Error(event.error);
              } else if (event.event === "done") {
                // Stream finalized cleanly
              }
            } catch (err) {
              // Ignore partial JSON parse errors if chunk is truncated
            }
          }
        }

        // Finalize assistant message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, isStreaming: false, citations: collectedCitations }
              : m
          )
        );
      } catch (err: any) {
        if (err.name === "AbortError") {
          // User canceled request intentionally
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, isStreaming: false, content: m.content + " _[Generation paused]_" }
                : m
            )
          );
        } else {
          const errorMsg = err.message || "Failed to communicate with RAG backend.";
          setError(errorMsg);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    isStreaming: false,
                    content:
                      m.content.length > 0
                        ? m.content + `\n\n> ⚠️ **Error:** ${errorMsg}`
                        : `⚠️ **Error:** ${errorMsg}`,
                  }
                : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
    setMessages,
  };
}
