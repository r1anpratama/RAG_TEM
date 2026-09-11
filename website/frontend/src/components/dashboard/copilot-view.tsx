"use client";

import React, { useState } from "react";
import { Bot, Sparkles, Send, Trash2, Paperclip, ShieldCheck, FileText } from "lucide-react";
import { ChatContainer } from "@/components/chat/chat-container";
import { useRagStream } from "@/hooks/use-rag-stream";

export const CopilotView: React.FC = () => {
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useRagStream();

  const [inputVal, setInputVal] = useState<string>("");

  const samplePrompts = [
    "What is the collapse risk of NCU Science Building 4?",
    "Why does Shuanglienpo rupture trigger the Hukou fault?",
    "What automated SCADA cutoffs activated in Track A?",
    "Compare the 72.4 cm/s PGV with Lin & Lee (2008) GMPE.",
    "Explain the TEM PSHA 2025 multi-fault cascading table 2.",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isStreaming) return;
    sendMessage(inputVal);
    setInputVal("");
  };

  return (
    <div className="flex flex-col h-[760px] w-full rounded-2xl border border-slate-800 bg-slate_obsidian-card overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-6 bg-slate_obsidian-card">
        <div className="flex items-center space-x-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <span>SeismoAgent-TW Geotechnical Copilot</span>
              <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-[10px] font-mono text-cyan-400 border border-cyan-500/30 font-semibold">
                TEM PSHA 2025 Grounded
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Streaming RAG with verifiable physical citations &amp; zero hallucination enforcement
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={clearMessages}
            className="flex items-center space-x-1 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* Global Error Notice */}
      {error && (
        <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2 text-center text-xs text-rose-300 font-medium">
          {error}
        </div>
      )}

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto p-4">
        <ChatContainer
          messages={messages}
          onSelectPrompt={(p) => sendMessage(p)}
        />
      </div>

      {/* Suggested Prompt Chips */}
      {messages.length === 0 && (
        <div className="px-6 py-3 border-t border-slate-800/80 bg-slate-900/40">
          <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Recommended Seismological Inquiries</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {samplePrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => sendMessage(prompt)}
                className="rounded-lg border border-slate-800 bg-slate_obsidian-card px-3 py-1.5 text-left text-xs text-slate-300 hover:border-cyan-500/40 hover:bg-slate-800 hover:text-white transition"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Message Input Box */}
      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-4 bg-slate_obsidian-card">
        <div className="flex items-center space-x-3 rounded-xl border border-slate-800 bg-slate-900/90 px-4 py-2 focus-within:border-cyan-500/50 transition">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Ask anything about Taiwan active faults, TEM PSHA 2025, or NCU triage..."
            className="flex-1 bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
            disabled={isStreaming}
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isStreaming}
            className="flex items-center space-x-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-40 px-3 py-1.5 text-xs font-bold text-slate-950 transition"
          >
            <span>Send</span>
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};
