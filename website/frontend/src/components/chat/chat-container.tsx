"use client";

import React, { useRef, useEffect } from "react";
import { Sparkles, Activity, ShieldAlert, Layers } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import { MessageBubble } from "./message-bubble";

interface ChatContainerProps {
  messages: ChatMessage[];
  onSelectPrompt: (prompt: string) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Activity,
    title: "Active Faults in Taiwan",
    desc: "What are the primary active seismogenic faults identified by CGS & TEM?",
    prompt: "What are the primary active seismogenic seismotectonic faults in Taiwan?",
  },
  {
    icon: ShieldAlert,
    title: "Earthquake Emergency Triage",
    desc: "Protocols for immediate hospital and lifeline structural safety.",
    prompt: "What are the standard emergency triage protocols following an Mw 6.5+ earthquake in Taiwan?",
  },
  {
    icon: Layers,
    title: "Taiwan Earthquake Model (TEM)",
    desc: "How does TEM calculate 30-year rupture probabilities?",
    prompt: "Explain how the Taiwan Earthquake Model (TEM) calculates 30-year rupture probabilities.",
  },
  {
    icon: Sparkles,
    title: "Chi-Chi 1999 Chelungpu Rupture",
    desc: "Displacement, depth, and seismic lessons learned.",
    prompt: "Summarize the rupture mechanics and geological features of the 1999 Chi-Chi earthquake on the Chelungpu fault.",
  },
];

export function ChatContainer({ messages, onSelectPrompt }: ChatContainerProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-3xl mx-auto">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30 mb-4 shadow-lg">
          <Sparkles className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">
          Prototype &amp; RAG Knowledge Platform
        </h2>
        <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-md mb-8 leading-relaxed">
          Decoupled RAG system grounded with Taiwan tectonic catalogs, TEM probability models, and emergency triage guidelines.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full text-left">
          {STARTER_PROMPTS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => onSelectPrompt(item.prompt)}
                className="group flex flex-col justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 hover:border-zinc-700 hover:bg-zinc-850 hover:bg-zinc-900 transition text-left"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Icon className="h-4 w-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-emerald-300">
                    {item.title}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto divide-y divide-zinc-800/40">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
