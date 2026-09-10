"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Square, Paperclip, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  onOpenUpload: () => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  onOpenUpload,
  isStreaming,
  disabled = false,
}: ChatInputProps) {
  const [input, setInput] = useState("");
  const [clientError, setClientError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    if (trimmed.length > 4000) {
      setClientError("Message is too long (max 4,000 characters).");
      return;
    }

    setClientError(null);
    onSend(trimmed);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStreaming) return;
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Validation warning */}
      {clientError && (
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-red-950/70 border border-red-800/80 px-3 py-1.5 text-xs text-red-200">
          <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
          <span>{clientError}</span>
        </div>
      )}

      {/* Main floating pill */}
      <div className="relative flex items-end rounded-2xl border border-zinc-700/80 bg-zinc-900/90 shadow-2xl backdrop-blur focus-within:border-zinc-500 transition-all p-2">
        {/* Upload attachment button */}
        <button
          type="button"
          onClick={onOpenUpload}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          title="Upload Document (.pdf, .txt)"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            if (clientError) setClientError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about Taiwan seismic data, faults, or triage guidelines..."
          rows={1}
          disabled={disabled}
          className="flex-1 max-h-48 resize-none bg-transparent px-3 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
        />

        {/* Action Button: Send or Stop */}
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-zinc-100 hover:bg-red-900/60 hover:text-red-300 transition-colors shadow"
            title="Stop generation"
          >
            <Square className="h-4 w-4 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl transition-all shadow",
              input.trim() && !disabled
                ? "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            )}
            title="Send prompt"
          >
            <ArrowUp className="h-4 w-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Footer hint */}
      <div className="mt-2 text-center text-[11px] text-zinc-500">
        AI responses are grounded using RAG vector similarity. Verify critical seismic triage with official CWB / NCDR bulletins.
      </div>
    </div>
  );
}
