"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatContainer } from "@/components/chat/chat-container";
import { ChatInput } from "@/components/chat/chat-input";
import { UploadModal } from "@/components/upload/upload-modal";
import { useRagStream } from "@/hooks/use-rag-stream";

export default function HomePage() {
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    stopStreaming,
    clearMessages,
  } = useRagStream();

  const handleSendPrompt = (prompt: string) => {
    sendMessage(prompt);
  };

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Left Sidebar */}
      <Sidebar
        onNewChat={clearMessages}
        onOpenUpload={() => setIsUploadOpen(true)}
        refreshTrigger={refreshTrigger}
      />

      {/* Main Chat Workspace */}
      <main className="relative flex flex-1 flex-col h-full overflow-hidden bg-zinc-900/20">
        {/* Global Error Banner */}
        {error && (
          <div className="bg-red-950/80 border-b border-red-800/80 px-4 py-2 text-center text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Scrollable Conversation Feed */}
        <ChatContainer
          messages={messages}
          onSelectPrompt={handleSendPrompt}
        />

        {/* Floating Bottom Input Area */}
        <ChatInput
          onSend={handleSendPrompt}
          onStop={stopStreaming}
          onOpenUpload={() => setIsUploadOpen(true)}
          isStreaming={isStreaming}
        />
      </main>

      {/* Upload Document Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </div>
  );
}
