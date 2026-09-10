"use client";

import React, { useState } from "react";
import { X, Bot, Sparkles, Send, Square, FileText, ChevronRight } from "lucide-react";
import { ChatContainer } from "@/components/chat/chat-container";
import { ChatInput } from "@/components/chat/chat-input";
import { useRagStream } from "@/hooks/use-rag-stream";

interface CopilotDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload: () => void;
}

export const CopilotDrawer: React.FC<CopilotDrawerProps> = ({
  isOpen,
  onClose,
  onOpenUpload,
}) => {
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useRagStream();

  const samplePrompts = [
    "What is the collapse risk of NCU Science Building 4?",
    "Why does Shuanglienpo rupture trigger the Hukou fault?",
    "What automated SCADA cutoffs activated in Track A?",
    "Compare the 72.4 cm/s PGV with Lin & Lee (2008) GMPE.",
  ];

  if (!isOpen) return null;

  return (
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-zinc-800 bg-zinc-950/95 shadow-2xl backdrop-blur-xl sm:w-[440px]">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-zinc-800 px-4">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
              SeismoAgent-TW AI Copilot
            </h3>
            <p className="text-[10px] text-zinc-400">
              Streaming RAG with Ground Truth Citation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={clearMessages}
            className="rounded px-2 py-1 text-[10px] text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-900 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="bg-red-950/80 border-b border-red-800/80 px-4 py-2 text-center text-[11px] text-red-200">
          {error}
        </div>
      )}

      {/* Conversation Feed */}
      <div className="flex-1 overflow-y-auto">
        <ChatContainer
          messages={messages}
          onSelectPrompt={(p) => sendMessage(p)}
        />
      </div>

      {/* Suggested Chips if no messages */}
      {messages.length === 0 && (
        <div className="p-3 border-t border-zinc-800/80 bg-zinc-900/30">
          <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span>Recommended Seismological Inquiries</span>
          </div>
          <div className="flex flex-col space-y-1.5">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/70 px-2.5 py-1.5 text-left text-[11px] text-zinc-300 hover:border-emerald-500/40 hover:bg-zinc-800 transition"
              >
                <span className="line-clamp-1">{prompt}</span>
                <ChevronRight className="h-3 w-3 text-zinc-500 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-zinc-800 p-3 bg-zinc-950">
        <ChatInput
          onSend={(p) => sendMessage(p)}
          onStop={stopStreaming}
          onOpenUpload={onOpenUpload}
          isStreaming={isStreaming}
        />
      </div>
    </aside>
  );
};
