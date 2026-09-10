"use client";

import React from "react";
import { X, Bot, Sparkles } from "lucide-react";
import { ChatContainer } from "@/components/chat/chat-container";
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
    <aside className="fixed inset-y-0 right-0 z-[1300] flex w-full max-w-md flex-col border-l border-slate-800 bg-slate_obsidian-900/98 shadow-2xl backdrop-blur-2xl sm:w-[440px]">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4 bg-slate_obsidian-card">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="h-4 w-4 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              SeismoAgent-TW AI Copilot
            </h3>
            <p className="text-[10px] text-slate-400">
              Streaming RAG with Ground Truth Citation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={clearMessages}
            className="rounded px-2 py-1 text-[10px] text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2 text-center text-[11px] text-rose-300 font-medium">
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
        <div className="p-3 border-t border-slate-800 bg-slate-900/40">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Sparkles className="h-3 w-3 text-cyan-400" />
            <span>Recommended Seismological Inquiries</span>
          </div>
          <div className="flex flex-col space-y-1.5">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate_obsidian-card px-2.5 py-1.5 text-left text-[11px] text-slate-300 hover:border-cyan-500/50 hover:bg-slate-800/80 transition"
              >
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
