export interface SourceCitation {
  source_id: string;
  title: string;
  snippet: string;
  score: number;
  source_type?: string;
}

/** Citation as serialized by the FastAPI backend (SourceCitation pydantic model). */
export interface WireCitation {
  document_name?: string;
  page_or_section?: string;
  snippet?: string;
  score?: number;
  source_id?: string;
  title?: string;
  source_type?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  citations?: SourceCitation[];
  isStreaming?: boolean;
}

export type StreamEventType = "token" | "citation" | "citations" | "done" | "error";

export interface StreamEventData {
  event: StreamEventType;
  token?: string;
  citations?: WireCitation[];
  error?: string;
}

export interface DocumentItem {
  document_id: string;
  filename: string;
  chunks_count: number;
  uploaded_at: string;
  file_size_bytes: number;
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  total_chunks_indexed: number;
  vector_store: string;
}
