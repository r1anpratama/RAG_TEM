"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { uploadDocument } from "@/lib/api";
import { validateUploadFile } from "@/lib/validators";
import { formatBytes } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError(null);
    setSuccessInfo(null);
    if (!file) return;

    const val = validateUploadFile(file);
    if (!val.valid) {
      setError(val.error || "Invalid file");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const val = validateUploadFile(file);
    if (!val.valid) {
      setError(val.error || "Invalid file");
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const resp = await uploadDocument(selectedFile);
      setSuccessInfo(`Indexed ${resp.chunks_indexed} chunks into Vector DB.`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    setSelectedFile(null);
    setError(null);
    setSuccessInfo(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isUploading}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
        >
          <X className="h-4 w-4" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Upload Grounding Document</h3>
        <p className="text-xs text-zinc-400 mb-4">
          Upload PDF or TXT reports to enrich RAG vector embeddings. Maximum file size is 10 MB.
        </p>

        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-700 hover:border-emerald-500/80 bg-zinc-950/50 p-6 text-center cursor-pointer transition"
        >
          <UploadCloud className="h-8 w-8 text-emerald-400 mb-2" />
          <p className="text-xs font-medium text-zinc-200">
            Click to browse or drag and drop
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">PDF or TXT up to 10 MB</p>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,application/pdf,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Selected file preview */}
        {selectedFile && (
          <div className="mt-4 flex items-center justify-between rounded-lg bg-zinc-800/80 p-3 border border-zinc-700">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <div className="overflow-hidden">
                <p className="truncate text-xs font-medium text-zinc-200">{selectedFile.name}</p>
                <p className="text-[10px] text-zinc-400">{formatBytes(selectedFile.size)}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
              className="text-xs text-zinc-400 hover:text-red-400 p-1"
            >
              Remove
            </button>
          </div>
        )}

        {/* Status Alerts */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-950/60 border border-red-800 p-2.5 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {successInfo && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-950/60 border border-emerald-800 p-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-400" />
            <span>{successInfo}</span>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 transition"
          >
            {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isUploading ? "Chunking & Indexing..." : "Upload & Index"}
          </button>
        </div>
      </div>
    </div>
  );
}
