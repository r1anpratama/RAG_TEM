"use client";

import React, { useEffect, useState } from "react";
import {
  Plus,
  MessageSquare,
  FileText,
  Upload,
  Database,
  Activity,
  Server,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DocumentItem, HealthStatus } from "@/types/chat";
import { getBackendHealth, getDocuments } from "@/lib/api";
import { cn } from "@/lib/utils";

interface SidebarProps {
  onNewChat: () => void;
  onOpenUpload: () => void;
  refreshTrigger: number;
}

export function Sidebar({ onNewChat, onOpenUpload, refreshTrigger }: SidebarProps) {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [isHealthy, setIsHealthy] = useState<boolean>(false);

  const fetchStatus = async () => {
    try {
      const h = await getBackendHealth();
      setHealth(h);
      setIsHealthy(h.status === "healthy");
    } catch {
      setIsHealthy(false);
    }

    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch {
      // docs fetch failure
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [refreshTrigger]);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 z-20",
        isCollapsed ? "w-16" : "w-64 md:w-72"
      )}
    >
      {/* Sidebar Header */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-zinc-800/80">
        {!isCollapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs ring-1 ring-emerald-500/30">
              ST
            </div>
            <div className="overflow-hidden">
              <h1 className="text-xs font-semibold text-zinc-100 truncate">Prototype</h1>
              <p className="text-[10px] text-zinc-500 truncate">RAG Decoupled Architecture</p>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className={cn(
            "flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-700/70 p-2.5 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-850 hover:text-white transition shadow-sm",
            isCollapsed && "px-0"
          )}
          title="Start a new chat session"
        >
          <Plus className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          {!isCollapsed && <span>New Conversation</span>}
        </button>
      </div>

      {/* Grounding Knowledge Documents Section */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
        <div>
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-1 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                Vector Knowledge Base
              </span>
              <button
                onClick={onOpenUpload}
                className="text-[10px] text-emerald-400 hover:underline inline-flex items-center gap-1"
                title="Upload grounding PDF or TXT"
              >
                <Upload className="h-3 w-3" />
                Upload
              </button>
            </div>
          ) : (
            <div className="flex justify-center mb-2">
              <button
                onClick={onOpenUpload}
                className="rounded p-1.5 text-emerald-400 hover:bg-zinc-800"
                title="Upload Document"
              >
                <Upload className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Document list */}
          <div className="space-y-1">
            {documents.length === 0 ? (
              !isCollapsed && (
                <div className="rounded-lg border border-dashed border-zinc-800 p-3 text-center text-[11px] text-zinc-500">
                  No custom documents yet. Built-in TEM seed catalogs are active.
                </div>
              )
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.document_id}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-900 transition",
                    isCollapsed && "justify-center px-1"
                  )}
                  title={`${doc.filename} (${doc.chunks_count} chunks)`}
                >
                  <FileText className="h-3.5 w-3.5 text-zinc-400 group-hover:text-emerald-400 flex-shrink-0" />
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-zinc-200 text-[11px] font-medium">{doc.filename}</p>
                      <p className="text-[10px] text-zinc-500">{doc.chunks_count} chunks indexed</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sidebar Footer: System Status */}
      <div className="p-3 border-t border-zinc-800/80 bg-zinc-950/80">
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg bg-zinc-900/60 p-2 border border-zinc-800 text-xs",
            isCollapsed && "justify-center p-1.5"
          )}
        >
          <div
            className={cn(
              "h-2 w-2 rounded-full animate-pulse flex-shrink-0",
              isHealthy ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-red-400"
            )}
          />
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-zinc-200 truncate">
                  {isHealthy ? "FastAPI Server Online" : "Backend Offline"}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 truncate">
                {health ? `${health.total_chunks_indexed} chunks in ${health.vector_store}` : "Port 8000"}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
