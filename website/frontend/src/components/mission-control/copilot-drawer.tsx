"use client";

import React from "react";
import { X, Bot, Sparkles, ChevronRight } from "lucide-react";
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
    <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-stormy_teal-400/30 bg-ink_black-500/95 shadow-2xl backdrop-blur-xl sm:w-[440px]">
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b border-stormy_teal-400/30 px-4 bg-ink_black-500">
        <div className="flex items-center space-x-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-stormy_teal-500/20 border border-stormy_teal-500/40 text-stormy_teal-700">
            <Bot className="h-4 w-4 text-stormy_teal-700" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-papaya_whip-500 uppercase tracking-wider">
              SeismoAgent-TW AI Copilot
            </h3>
            <p className="text-[10px] text-stormy_teal-800">
              Streaming RAG with Ground Truth Citation
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={clearMessages}
            className="rounded px-2 py-1 text-[10px] text-stormy_teal-800 hover:bg-ink_black-400 hover:text-papaya_whip-500 transition"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="rounded p-1.5 text-stormy_teal-800 hover:bg-ink_black-400 hover:text-papaya_whip-500 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="bg-brandy-500/90 border-b border-brandy-600 px-4 py-2 text-center text-[11px] text-papaya_whip-500 font-medium">
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
        <div className="p-3 border-t border-stormy_teal-400/30 bg-ink_black-400/40">
          <div className="text-[10px] font-bold text-stormy_teal-700 uppercase tracking-wider mb-2 flex items-center space-x-1">
            <Sparkles className="h-3 w-3 text-vivid_tangerine-500" />
            <span>Recommended Seismological Inquiries</span>
          </div>
          <div className="flex flex-col space-y-1.5">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="flex items-center justify-between rounded-lg border border-stormy_teal-400/30 bg-ink_black-500/80 px-2.5 py-1.5 text-left text-[11px] text-papaya_whip-600 hover:border-vivid_tangerine-500 hover:bg-ink_black-400 transition"
              >
                <span className="line-clamp-1">{prompt}</span>
                <ChevronRight className="h-3 w-3 text-stormy_teal-700 shrink-0 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-stormy_teal-400/30 p-3 bg-ink_black-500">
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
