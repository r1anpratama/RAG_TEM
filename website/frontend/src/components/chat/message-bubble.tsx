"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { Bot, User, BookOpen, ChevronDown, ChevronUp, Copy, Check } from "lucide-react";
import { ChatMessage, SourceCitation } from "@/types/chat";
import { cn } from "@/lib/utils";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showCitations, setShowCitations] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const handleCopy = () => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex w-full gap-4 px-4 py-5 transition-colors",
        isUser ? "bg-slate-50 dark:bg-zinc-900/40" : "bg-transparent border-t border-slate-200 dark:border-zinc-800/40"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 pt-0.5">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-semibold shadow-md",
            isUser
              ? "bg-zinc-700 text-slate-800 dark:text-zinc-200"
              : "bg-emerald-600/90 text-white ring-1 ring-emerald-400/40"
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-3 overflow-hidden text-sm leading-relaxed">
        {/* Header (Role + Timestamp + Action) */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-zinc-400">
          <span className="font-medium text-slate-700 dark:text-zinc-300">
            {isUser ? "You" : "RAG Assistant"}
          </span>
          <div className="flex items-center gap-2">
            <span>{message.timestamp}</span>
            {!isUser && message.content && (
              <button
                onClick={handleCopy}
                className="rounded p-1 text-slate-500 dark:text-zinc-400 hover:bg-zinc-800 hover:text-slate-800 dark:text-zinc-200"
                title="Copy response"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Markdown Output with XSS Sanitization */}
        <div className="prose prose-invert max-w-none break-words text-slate-800 dark:text-zinc-200">
          <ReactMarkdown
            rehypePlugins={[rehypeSanitize]}
            components={{
              p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
              ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-slate-700 dark:text-zinc-300">{children}</li>,
              h1: ({ children }) => <h1 className="text-xl font-bold text-white mb-2 mt-4">{children}</h1>,
              h2: ({ children }) => <h2 className="text-lg font-semibold text-white mb-2 mt-3">{children}</h2>,
              h3: ({ children }) => <h3 className="text-base font-semibold text-zinc-100 mb-1 mt-2">{children}</h3>,
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-emerald-500/80 bg-zinc-800/40 px-3 py-1.5 rounded-r my-2 text-slate-700 dark:text-zinc-300 text-xs italic">
                  {children}
                </blockquote>
              ),
              code: ({ className, children, ...props }) => (
                <code
                  className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-emerald-300"
                  {...props}
                >
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="my-3 overflow-x-auto rounded-lg bg-zinc-950 p-3 text-xs font-mono border border-zinc-800">
                  {children}
                </pre>
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>

          {/* Streaming Cursor */}
          {message.isStreaming && (
            <span className="inline-block h-4 w-1.5 ml-1 animate-pulse bg-emerald-400 align-middle" />
          )}
        </div>

        {/* Source Citations Section */}
        {message.citations && message.citations.length > 0 && (
          <div className="pt-2 border-t border-zinc-800/60 mt-3">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400/90 hover:text-emerald-300 transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>
                {message.citations.length} Grounding Source
                {message.citations.length > 1 ? "s" : ""}
              </span>
              {showCitations ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showCitations && (
              <div className="grid grid-cols-1 gap-2 mt-2 pt-2">
                {message.citations.map((cite, idx) => (
                  <div
                    key={`${cite.source_id}-${idx}`}
                    className="rounded-lg border border-zinc-800 bg-zinc-900/80 p-2.5 text-xs text-slate-700 dark:text-zinc-300 hover:border-zinc-700 transition"
                  >
                    <div className="flex items-center justify-between font-medium text-slate-800 dark:text-zinc-200">
                      <span className="truncate max-w-[80%]">
                        [{idx + 1}] {cite.title}
                      </span>
                      <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-emerald-400 font-mono">
                        {(cite.score * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="mt-1.5 text-slate-500 dark:text-zinc-400 text-[11px] leading-normal line-clamp-3">
                      "{cite.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
