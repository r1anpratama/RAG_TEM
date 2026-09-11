"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  User, 
  Bot, 
  Cpu, 
  Database, 
  HardDrive, 
  FileText, 
  Settings, 
  Layers, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle, 
  Play, 
  Pause, 
  RotateCcw, 
  ArrowRight, 
  Maximize2, 
  Minimize2, 
  Terminal, 
  FileCode2, 
  SlidersHorizontal,
  Info,
  Layers2,
  ChevronDown
} from "lucide-react";

interface NodeData {
  id: string;
  title: string;
  subtitle: string;
  tech: string;
  category: "Retrieval" | "Extraction" | "Storage" | "Reasoning" | "Guardrail" | "Entity";
  role: string;
  componentObjective: string;
  inputData: string;
  outputArtifact: string;
  spec: string;
  hardware: string;
  latencyTarget: string;
  samplePayload: Record<string, any>;
}

interface TelemetryLog {
  id: number;
  time: string;
  step: string;
  status: "INFO" | "SUCCESS" | "WARN" | "EXEC";
  message: string;
}

const NODES_REGISTRY: Record<string, NodeData> = {
  docs: {
    id: "docs",
    title: "Multimodal Enterprise Documents",
    subtitle: "TEM PSHA 2025, Active Faults, Borehole Logs",
    tech: "PDF / Excel / GeoJSON / Stratigraphic Logs",
    category: "Extraction",
    role: "Primary corpus repository containing Taiwan seismic hazard assessments, active fault parameters, and campus borehole strata.",
    componentObjective: "Ingests and structures heterogeneous multimodal geotechnical reports into isolated visual and semantic text channels.",
    inputData: "Official TEM PSHA 2025 report draft (142 pages), 38 active fault database (Fault Parameters_update.xlsx), fault trace GeoJSON, and NCREE borehole logs.",
    outputArtifact: "Standardized raw document corpus partitioned into graphic figures, tabular coefficients, and technical text.",
    spec: "Multi-page technical reports containing vector fault maps and hazard attenuation charts",
    hardware: "Local High-Speed Storage / S3 Object Store",
    latencyTarget: "Offline / Batch Ingestion",
    samplePayload: {
      primary_document: "TEM PSHA2025-draft.pdf",
      total_pages: 142,
      fault_tables: 38,
      borehole_logs: 12
    }
  },
  extraction_models: {
    id: "extraction_models",
    title: "NeMo Retriever Extraction Models",
    subtitle: "Visual Document Feature Extraction",
    tech: "NVIDIA NeMo Multimodal Extraction NIM (LayoutLM / OCR)",
    category: "Extraction",
    role: "Extracts high-resolution curves, fault alignment diagrams, and GMPE attenuation tables from scientific PDF pages.",
    componentObjective: "Executes GPU-accelerated vision OCR and layout analysis to convert non-textual hazard curves and regression tables into structured data.",
    inputData: "PDF pages featuring seismic hazard curves, fault trace maps, and geotechnical strata cross-sections.",
    outputArtifact: "Clean tabular matrices, numeric regression coefficients, and structured text summaries.",
    spec: "High-resolution OCR + Table transformer layout preservation",
    hardware: "NVIDIA GPU Vision Pipeline (TensorRT)",
    latencyTarget: "~ 45 ms / page",
    samplePayload: {
      extracted_elements: ["Hazard Curve Figure 4.2", "PGA Contour Map", "GMPE Regression Table"],
      output_stream: "Clean Structured Text"
    }
  },
  nemotron_parse: {
    id: "nemotron_parse",
    title: "Nemotron Parse",
    subtitle: "Document Hierarchy & Markdown Parsing",
    tech: "NVIDIA Nemotron Parse NIM",
    category: "Extraction",
    role: "Parses hierarchical document structure, headers, and equation formatting from official Taiwanese seismic publications.",
    componentObjective: "Converts intricate multi-column geotechnical PDF chapters into pristine GitHub Flavored Markdown with preserved mathematical equations.",
    inputData: "Raw chapter text streams, formula blocks, and footnote references.",
    outputArtifact: "Clean Markdown with preserved LaTeX attenuation formulas and metadata.",
    spec: "Hierarchical header preservation, multi-column reading order",
    hardware: "NVIDIA L40S GPU",
    latencyTarget: "~ 20 ms / page",
    samplePayload: {
      markdown_sections: 48,
      formulas_preserved: ["ln(PGA) = c1 + c2*M + c3*ln(R + h)"],
      output_format: "Clean Markdown & Metadata"
    }
  },
  retriever_embed_docs: {
    id: "retriever_embed_docs",
    title: "NeMo Retriever Embedding (Ingestion)",
    subtitle: "Document Chunk Vectorization",
    tech: "NV-Embed-QA / NeMo Retriever Embedding NIM",
    category: "Extraction",
    role: "Encodes structured textual chunks and table summaries into dense 1024-dimensional semantic embedding vectors.",
    componentObjective: "Generates high-fidelity dense embeddings for all chunked paragraphs and fault tables to facilitate cuVS nearest-neighbor indexing.",
    inputData: "Segmented text chunks (1,200 character window with 200 character overlap) and metadata attributes.",
    outputArtifact: "1,248 dense float32 embedding vectors (1024-dim) with metadata payloads.",
    spec: "1024-dimension float32 embeddings, 512 max token window",
    hardware: "NVIDIA TensorRT GPU Acceleration",
    latencyTarget: "< 0.005 ms / chunk",
    samplePayload: {
      chunk_count: 1248,
      embedding_dim: 1024,
      target_index: "cuVS CAGRA HNSW GPU Graph"
    }
  },
  user: {
    id: "user",
    title: "User / Disaster Decision Operator",
    subtitle: "Human Operator & Emergency Action Dispatch",
    tech: "Interactive Operator Terminal & Decision Interface",
    category: "Entity",
    role: "Initiates real-time seismic queries and receives physics-grounded disaster mitigation directives.",
    componentObjective: "Serves as the mission control gateway for structural engineers, emergency managers, and campus facility directors.",
    inputData: "Live emergency query: 'Assess M6.91 Shuanglienpo-Hukou cascading PGA & drift ratio for NCU Science Building 4'.",
    outputArtifact: "Interactive display of Red Tag directives, structural collapse risk, and elevator SCADA actuators.",
    spec: "Dual-track latency display (sub-10ms Reflex vs sub-1.2s Deliberative)",
    hardware: "Local Workstation / Enterprise Dashboard",
    latencyTarget: "< 1.2 s End-to-End",
    samplePayload: {
      query: "Assess M6.91 Shuanglienpo-Hukou cascading PGA & drift ratio for NCU Science Building 4",
      user_role: "Chief Structural Safety Engineer",
      timestamp: "2026-09-11T10:35:00.000Z"
    }
  },
  guardrails_in: {
    id: "guardrails_in",
    title: "NeMo Guardrails (Input)",
    subtitle: "Input Safety & Injection Defense",
    tech: "NVIDIA NeMo Guardrails NIM (Colang 2.0 Policy)",
    category: "Guardrail",
    role: "Validates operator prompts against prompt injection, jailbreaking, and off-topic earthquake hallucination attempts.",
    componentObjective: "Enforces input safety policies, filters out off-domain questions, and normalizes seismic query syntax before execution.",
    inputData: "Raw user string query from web dashboard.",
    outputArtifact: "Sanitized and canonicalized query string certified safe for reasoning.",
    spec: "Colang 2.0 runtime policy, Self-Check Input Rail",
    hardware: "TensorRT Optimized Microservice",
    latencyTarget: "< 8.0 ms",
    samplePayload: {
      input_passed: true,
      jailbreak_risk: 0.00,
      topic_classification: "TAIWAN_EARTHQUAKE_ENGINEERING"
    }
  },
  query_proc: {
    id: "query_proc",
    title: "Query Processing",
    subtitle: "Intent Classification & Entity Resolution",
    tech: "NeMo Query Decomposition & Knowledge Graph Linker",
    category: "Retrieval",
    role: "Decomposes complex multi-fault queries, resolves fault names to Table 2 IDs, and coordinates reflection feedback loops.",
    componentObjective: "Parses user query into structured retrieval filters (target fault name, magnitude Mw, site coordinates, and GMPE coefficients).",
    inputData: "Sanitized prompt from NeMo Guardrails or self-correction signals from Reflection Agent.",
    outputArtifact: "Structured query entity tuple: {fault_id: 2, name: 'Shuanglienpo', depth: 7.2, target: 'NCU Science 4'}.",
    spec: "Entity extraction + GeoGraph schema resolution",
    hardware: "CPU / TensorRT Inference",
    latencyTarget: "< 12.0 ms",
    samplePayload: {
      detected_faults: ["Shuanglienpo", "Hukou"],
      target_building: "NCU Science Building 4",
      analysis_type: "CASCADING_PGA_DRIFT"
    }
  },
  retriever_embed_query: {
    id: "retriever_embed_query",
    title: "NeMo Retriever Embedding (Query)",
    subtitle: "Query Semantic Vectorization",
    tech: "NV-Embed-QA (FP16 / INT8)",
    category: "Retrieval",
    role: "Transforms decomposed queries into dense 1024-dim vectors aligned with document chunk vectors.",
    componentObjective: "Encodes the query intent into the shared vector space for ultra-fast GPU cosine similarity comparison in cuVS.",
    inputData: "Structured query string and entity keywords.",
    outputArtifact: "1024-dimensional query vector.",
    spec: "NV-Embed-QA-v1, 1024 dimensions",
    hardware: "NVIDIA TensorRT GPU Engine",
    latencyTarget: "< 3.0 ms",
    samplePayload: {
      query_vector_dim: 1024,
      norm: 1.000,
      top_tokens: ["Shuanglienpo", "M6.91", "PGA", "NCU"]
    }
  },
  cuvs_store: {
    id: "cuvs_store",
    title: "Vector DB & Object Store (cuVS)",
    subtitle: "GPU-Accelerated Vector & Graph Store",
    tech: "NVIDIA cuVS (CAGRA / HNSW) + Object Store",
    category: "Storage",
    role: "Central storage and indexing engine. Stores multimodal text embeddings, raw figures, and catalogs. Delivers sub-millisecond similarity search directly into NeMo Retriever Reranking.",
    componentObjective: "Performs GPU-accelerated Approximate Nearest Neighbor (ANN) search over Taiwanese active fault records with 10x throughput.",
    inputData: "Query vector (1024-dim) from Query Embedding OR chunk vectors from Document Ingestion.",
    outputArtifact: "Top-12 candidate chunks with cosine similarity distance scores and object storage pointers.",
    spec: "cuVS CAGRA graph index, < 0.01 ms search latency, S3 payload store",
    hardware: "NVIDIA GPU Memory (HBM3e / GDDR6)",
    latencyTarget: "< 0.01 ms (CAGRA GPU)",
    samplePayload: {
      index_type: "cuVS CAGRA GPU Graph",
      total_vectors_indexed: 1248,
      query_latency_ms: 0.009,
      candidates_retrieved: 12
    }
  },
  reranking: {
    id: "reranking",
    title: "NeMo Retriever Reranking",
    subtitle: "Cross-Encoder Relevance Scoring",
    tech: "NV-Rerank-QA / NeMo Retriever Reranking NIM",
    category: "Retrieval",
    role: "Re-ranks candidates retrieved from cuVS directly, ensuring only verified geotechnical parameters reach the reasoning LLM.",
    componentObjective: "Eliminates low-relevance vector chunks by scoring document relevance against the seismic query with cross-attention.",
    inputData: "Top-12 candidate chunks from Vector DB & Object Store (cuVS).",
    outputArtifact: "Top-3 gold-standard chunks (TEM PSHA 2025 Table 2, Lin & Lee 2008 GMPE formulas).",
    spec: "Cross-encoder scoring, Top-K precision filter",
    hardware: "NVIDIA L40S / H100 GPU",
    latencyTarget: "< 15.0 ms",
    samplePayload: {
      input_candidates: 12,
      top_k_selected: 3,
      top_score: 0.942,
      selected_sources: ["TEM PSHA 2025 Table 2", "Lin & Lee (2008) Coefficients"]
    }
  },
  nemotron_nano: {
    id: "nemotron_nano",
    title: "Llama Nemotron Nano 8B v1",
    subtitle: "Low-Latency Reflex Summarizer",
    tech: "Llama-3.1-Nemotron-Nano-8B (FP4/FP8 TensorRT-LLM)",
    category: "Reasoning",
    role: "Lightweight sub-10ms model for immediate SCADA telemetry extraction and short warning bulletin generation before full 49B deliberation finishes.",
    componentObjective: "Executes ultra-low latency (< 25 ms) reflex triggers to immediately fire elevator stops and gas shutoff actuators.",
    inputData: "Initial station telemetry and peak ground motion alert packet.",
    outputArtifact: "Sub-5ms SCADA actuator trigger commands.",
    spec: "Quantized FP8 / FP4 Engine, 8k window",
    hardware: "NVIDIA L40S / Jetson AGX Orin",
    latencyTarget: "< 25.0 ms",
    samplePayload: {
      quick_summary: "High hazard alert: Mw 6.91 near NCU. SCADA elevator and gas interlocks fired.",
      tokens_per_sec: 142.5
    }
  },
  nemotron_super: {
    id: "nemotron_super",
    title: "Llama Nemotron Super 49B",
    subtitle: "Deliberative Multi-Agent Reasoning",
    tech: "NVIDIA Llama-3.1-Nemotron-70B / Super 49B (TensorRT-LLM)",
    category: "Reasoning",
    role: "Executes deep physics reasoning, solves multi-segment fault rupture mechanics, calculates building drift ratio (2.14%), and synthesizes emergency triage.",
    componentObjective: "Computes Lin & Lee (2008) GMPE equations, models multi-segment rupture cascading, and evaluates facility collapse risk.",
    inputData: "Top-3 TEM PSHA 2025 chunks from NeMo Retriever Reranking, fault geotechnical parameters, and GMPE regression constants.",
    outputArtifact: "Physics-grounded hazard estimate: PGV 72.4 cm/s, structural drift 2.14%, and Red Tag evacuation directive.",
    spec: "FP8 TensorRT-LLM inference, 128k context, Speculative Decoding",
    hardware: "NVIDIA Hopper / Blackwell (H100/H200/B200)",
    latencyTarget: "0.85 - 1.2 s",
    samplePayload: {
      reasoning_track: "Track B Deliberative",
      predicted_pgv: 72.4,
      structural_drift_pct: 2.14,
      safety_tag: "RED TAG (IMMEDIATE EVACUATION)",
      reinforcement_grounding: "100% Physics Verified"
    }
  },
  llm_optional: {
    id: "llm_optional",
    title: "Domain LLM",
    subtitle: "Auxiliary LLM (Claude / ChatGPT)",
    tech: "Claude / ChatGPT",
    category: "Reasoning",
    role: "Secondary foundation model (Claude / ChatGPT) for structural mechanics double-checking and cross-validation.",
    componentObjective: "Provides auxiliary model consensus and multi-LLM cross-validation on non-linear structural response parameters.",
    inputData: "Structural mechanical verification code and seismic scenario context.",
    outputArtifact: "Consensus verification score and validation report.",
    spec: "Anthropic / OpenAI API Microservice",
    hardware: "Cloud API / NVIDIA NIM Gateway",
    latencyTarget: "< 300 ms",
    samplePayload: {
      status: "STANDBY_AUXILIARY",
      model_family: "Claude / ChatGPT",
      confidence: 0.981
    }
  },
  reflection: {
    id: "reflection",
    title: "Reflection Agent",
    subtitle: "Factual Critique & Self-Correction Loop",
    tech: "SafetyCriticWorker + NeMo Self-Correction Loop",
    category: "Guardrail",
    role: "Performs adversarial cross-checking of all generated parameters against ground-truth catalogs. Loops back to Query Processing if numerical inconsistency is detected.",
    componentObjective: "Verifies generated slip rates, dip angles, and magnitudes against official Table 2 catalog. Initiates self-correction loop if any mismatch is found.",
    inputData: "Numerical claims synthesized by the reasoning LLM.",
    outputArtifact: "Zero Hallucination verification certificate (0.0% Numerical Hallucination).",
    spec: "Zero Hallucination Guarantee: Slip Rate, Dip, Mw exact match",
    hardware: "Deterministic Rule Critic + TensorRT Micro-Agent",
    latencyTarget: "< 4.0 ms",
    samplePayload: {
      hallucination_detected: false,
      fault_verified: "Shuanglienpo (Slip: 1.5mm/yr, Dip: 45°)",
      loop_action: "CERTIFIED_PROCEED"
    }
  },
  guardrails_out: {
    id: "guardrails_out",
    title: "NeMo Guardrails (Output)",
    subtitle: "Output Safety & Hallucination Mitigation",
    tech: "NeMo Guardrails Output Policy (Self-Check Hallucination Rail)",
    category: "Guardrail",
    role: "Final security and safety checkpoint before response is returned to the human operator.",
    componentObjective: "Ensures evacuation advice strictly adheres to Taiwan seismic safety protocols and verifies no confidential data leaks.",
    inputData: "Draft response payload from Deliberation LLM.",
    outputArtifact: "Sanitized, verified, and legally compliant hazard advisory report.",
    spec: "Output verification rail, PII Redaction, Taiwan Building Code validation",
    hardware: "NeMo Guardrails Microservice",
    latencyTarget: "< 8.0 ms",
    samplePayload: {
      output_verified: true,
      hallucination_score: 0.00,
      pii_detected: false,
      status: "APPROVED_FOR_DISPATCH"
    }
  }
};

// MODE 1: Complete Ingestion-to-Decision Pipeline (12 Steps)
// Notice: Step 5 (Vector DB cuVS) goes DIRECTLY to Step 6 (NeMo Retriever Reranking)!
const INGESTION_TO_DECISION_STEPS = [
  {
    step: 1,
    node: "docs",
    coords: { x: 95, y: 545 },
    title: "Step 1: Document Ingestion",
    log: "Ingesting TEM PSHA 2025 PDF (142 pages), 38 Fault Catalogs, and NCREE borehole logs.",
    status: "INFO",
    activeWire: null
  },
  {
    step: 2,
    node: "extraction_models",
    coords: { x: 460, y: 485 },
    title: "Step 2: Vision Feature Extraction",
    log: "NeMo Retriever Vision NIM parsed hazard curves & GMPE attenuation tables into clean structured text.",
    status: "EXEC",
    activeWire: "wire-e1"
  },
  {
    step: 3,
    node: "nemotron_parse",
    coords: { x: 460, y: 605 },
    title: "Step 3: Hierarchy & Markdown Parsing",
    log: "Nemotron Parse extracted report chapters to GitHub Markdown with intact attenuation formulas.",
    status: "EXEC",
    activeWire: "wire-e2"
  },
  {
    step: 4,
    node: "retriever_embed_docs",
    coords: { x: 970, y: 545 },
    title: "Step 4: Chunk Vectorization",
    log: "NeMo Retriever Embedding vectorized 1,248 document chunks into 1024-dim dense vectors.",
    status: "EXEC",
    activeWire: "wire-e3-e4"
  },
  {
    step: 5,
    node: "cuvs_store",
    coords: { x: 970, y: 304 },
    title: "Step 5: Vector DB & Object Store (cuVS)",
    log: "cuVS CAGRA indexed 1,248 vectors into high-bandwidth GPU memory (<0.01ms ANN search).",
    status: "SUCCESS",
    activeWire: "wire-e5"
  },
  {
    step: 6,
    node: "reranking",
    coords: { x: 970, y: 170 },
    title: "Step 6: NeMo Retriever Reranking",
    log: "cuVS vectors dispatched directly UP into NeMo Retriever Reranking -> Cross-Encoder filtered Top-3 candidate chunks.",
    status: "EXEC",
    activeWire: "wire-5"
  },
  {
    step: 7,
    node: "nemotron_nano",
    coords: { x: 810, y: 60 },
    title: "Step 7: Llama Nemotron Nano 8B v1",
    log: "Nemotron Nano 8B executed sub-5ms reflex trigger: elevator interlock & gas shutoff command dispatched.",
    status: "SUCCESS",
    activeWire: "wire-7"
  },
  {
    step: 8,
    node: "nemotron_super",
    coords: { x: 670, y: 170 },
    title: "Step 8: Llama Nemotron Super 49B",
    log: "Nemotron Super 49B calculated Lin & Lee GMPE equations: PGV=72.4 cm/s, Drift=2.14% (RED TAG directive).",
    status: "EXEC",
    activeWire: "wire-6"
  },
  {
    step: 9,
    node: "llm_optional",
    coords: { x: 460, y: 60 },
    title: "Step 9: Domain LLM (Claude / ChatGPT)",
    log: "Auxiliary Domain LLM cross-validated non-linear structural ductility calculations (Consensus score 0.981).",
    status: "SUCCESS",
    activeWire: "wire-9"
  },
  {
    step: 10,
    node: "reflection",
    coords: { x: 460, y: 170 },
    title: "Step 10: Reflection Agent Critique",
    log: "Safety Critic verified parameters against Table 2 ground truth: 0.0% numerical hallucination verified.",
    status: "SUCCESS",
    activeWire: "wire-10-11"
  },
  {
    step: 11,
    node: "guardrails_out",
    coords: { x: 280, y: 170 },
    title: "Step 11: NeMo Guardrails Output Check",
    log: "NeMo Guardrails verified output: Safety policy passed, evacuation directive certified for dispatch.",
    status: "SUCCESS",
    activeWire: "wire-12"
  },
  {
    step: 12,
    node: "user",
    coords: { x: 80, y: 300 },
    title: "Step 12: Decision Delivered to Operator",
    log: "Emergency response payload successfully delivered to Operator: Red Tag evacuation directive active.",
    status: "SUCCESS",
    activeWire: "wire-13"
  }
];

// MODE 2: Query Retrieval Pipeline (10 Steps)
// Notice: Step 5 (Vector DB cuVS) goes DIRECTLY to Step 6 (NeMo Retriever Reranking)!
const QUERY_RETRIEVAL_STEPS = [
  {
    step: 1,
    node: "user",
    coords: { x: 80, y: 300 },
    title: "Step 1: User Query Ingress",
    log: "Operator query: 'Assess M6.91 Shuanglienpo-Hukou cascading PGA & drift ratio for NCU Science Building 4'.",
    status: "INFO",
    activeWire: null
  },
  {
    step: 2,
    node: "guardrails_in",
    coords: { x: 280, y: 300 },
    title: "Step 2: NeMo Guardrails Input Check",
    log: "NeMo Guardrails passed: Jailbreak score 0.00, verified within Taiwan seismology safety policy.",
    status: "SUCCESS",
    activeWire: "wire-1"
  },
  {
    step: 3,
    node: "query_proc",
    coords: { x: 460, y: 300 },
    title: "Step 3: Query Decomposition",
    log: "Resolved target entities: Shuanglienpo Fault (#2) + Hukou (#3) multi-rupture scenario via GeoGraph.",
    status: "INFO",
    activeWire: "wire-2"
  },
  {
    step: 4,
    node: "retriever_embed_query",
    coords: { x: 670, y: 300 },
    title: "Step 4: Query Embedding",
    log: "Generated 1024-dim dense query embedding using NV-Embed-QA in 0.003 ms.",
    status: "EXEC",
    activeWire: "wire-3"
  },
  {
    step: 5,
    node: "cuvs_store",
    coords: { x: 970, y: 304 },
    title: "Step 5: Vector DB & Object Store (cuVS)",
    log: "cuVS GPU index probed 1,248 vectors: 12 candidate chunks retrieved in 0.009 ms.",
    status: "SUCCESS",
    activeWire: "wire-4"
  },
  {
    step: 6,
    node: "reranking",
    coords: { x: 970, y: 170 },
    title: "Step 6: NeMo Retriever Reranking",
    log: "Direct vertical ascent from cuVS into NeMo Retriever Reranking -> Top-3 TEM PSHA 2025 chunks filtered.",
    status: "EXEC",
    activeWire: "wire-5"
  },
  {
    step: 7,
    node: "nemotron_nano",
    coords: { x: 810, y: 60 },
    title: "Step 7: Llama Nemotron Nano 8B v1",
    log: "Nemotron Nano 8B executed sub-5ms SCADA elevator stop and natural gas shutoff actuators.",
    status: "SUCCESS",
    activeWire: "wire-7"
  },
  {
    step: 8,
    node: "nemotron_super",
    coords: { x: 670, y: 170 },
    title: "Step 8: Llama Nemotron Super 49B",
    log: "Nemotron Super 49B calculated Lin & Lee GMPE: PGV=72.4 cm/s, Drift=2.14% (RED TAG evacuation).",
    status: "EXEC",
    activeWire: "wire-6"
  },
  {
    step: 9,
    node: "reflection",
    coords: { x: 460, y: 170 },
    title: "Step 9: Reflection Agent Critique",
    log: "Safety Critic verified parameters against Table 2 catalog: 0.0% Hallucination verified.",
    status: "SUCCESS",
    activeWire: "wire-10-11"
  },
  {
    step: 10,
    node: "guardrails_out",
    coords: { x: 280, y: 170 },
    title: "Step 10: Guardrails Out & Dispatch",
    log: "Output safety verified. Final earthquake advisory and Red Tag evacuation directive returned to User.",
    status: "SUCCESS",
    activeWire: "wire-12-13"
  }
];

export const RagArchitectureView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>("docs");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [simulationMode, setSimulationMode] = useState<"e2e" | "retrieval">("e2e");
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([]);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"overview" | "specs" | "telemetry">("overview");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  const currentSteps = simulationMode === "e2e" ? INGESTION_TO_DECISION_STEPS : QUERY_RETRIEVAL_STEPS;
  const currentStepData = currentSteps.find(s => s.step === simulationStep);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [telemetryLogs]);

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(0);
    const startNode = simulationMode === "e2e" ? "docs" : "user";
    setSelectedNode(startNode);

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");

    setTelemetryLogs([
      {
        id: Date.now(),
        time: timeStr,
        step: "INIT",
        status: "INFO",
        message: simulationMode === "e2e" 
          ? "▶ Initializing End-to-End Pipeline: Document Ingestion -> cuVS Store -> NeMo Retriever -> LLM Reasoning -> Decision."
          : "▶ Initializing Query Retrieval Pipeline: User Query -> Guardrails -> cuVS Store -> NeMo Retriever -> LLM Reasoning -> Decision."
      }
    ]);

    let stepIndex = 0;
    const intervalMs = 1300 / playbackSpeed;

    const runNextStep = () => {
      if (stepIndex < currentSteps.length) {
        const currentData = currentSteps[stepIndex];
        setSimulationStep(currentData.step);
        setSelectedNode(currentData.node);

        const stepTime = new Date();
        const stepTimeStr = stepTime.toTimeString().split(" ")[0] + "." + String(stepTime.getMilliseconds()).padStart(3, "0");

        setTelemetryLogs((prev) => [
          ...prev.slice(-30),
          {
            id: Date.now() + stepIndex,
            time: stepTimeStr,
            step: currentData.title.split(":")[0],
            status: currentData.status as any,
            message: currentData.log
          }
        ]);

        stepIndex++;
        simulationTimerRef.current = setTimeout(runNextStep, intervalMs);
      } else {
        setIsSimulating(false);
        setSimulationStep(0);
        setSelectedNode(simulationMode === "e2e" ? "user" : "nemotron_super");
        const endTime = new Date();
        const endTimeStr = endTime.toTimeString().split(" ")[0] + "." + String(endTime.getMilliseconds()).padStart(3, "0");
        setTelemetryLogs((prev) => [
          ...prev,
          {
            id: Date.now() + 999,
            time: endTimeStr,
            step: "CYCLE_COMPLETE",
            status: "SUCCESS",
            message: "✔ Pipeline execution successfully completed: All stages verified with zero error."
          }
        ]);
      }
    };

    simulationTimerRef.current = setTimeout(runNextStep, 300);
  };

  const pauseSimulation = () => {
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
    }
    setIsSimulating(false);
  };

  const resetSimulation = () => {
    if (simulationTimerRef.current) {
      clearTimeout(simulationTimerRef.current);
    }
    setIsSimulating(false);
    setSimulationStep(0);
    setSelectedNode(simulationMode === "e2e" ? "docs" : "user");
  };

  const activeWire = currentStepData?.activeWire || null;

  const isWireActive = (wireId: string) => {
    if (!isSimulating || !activeWire) return false;
    if (activeWire === wireId) return true;
    if (activeWire === "wire-e3-e4" && (wireId === "wire-e3" || wireId === "wire-e4")) return true;
    if (activeWire === "wire-10-11" && (wireId === "wire-10" || wireId === "wire-11")) return true;
    if (activeWire === "wire-12-13" && (wireId === "wire-12" || wireId === "wire-13")) return true;
    return false;
  };

  const selected = NODES_REGISTRY[selectedNode] || NODES_REGISTRY.docs;

  return (
    <div className={`flex flex-col space-y-4 w-full transition-all duration-200 ${isFullscreen ? "fixed inset-0 z-50 bg-[#070d17] p-6 overflow-y-auto" : ""}`}>
      {/* Top Header & Simulation Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-[#0f172a] p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#76b900]/15 border border-[#76b900]/40 text-[#76b900] shadow-sm">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                NVIDIA NeMo Multimodal Agentic RAG Architecture
              </h2>
              <span className="rounded bg-[#76b900]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#76b900] border border-[#76b900]/30">
                SYSTEM WORKFLOW
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pipeline Flow: Multimodal Extraction &rarr; Vector DB &amp; Object Store (cuVS) &rarr; NeMo Retriever Reranking &rarr; Deliberative Reasoning &rarr; Operator Decision
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Flow Mode Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl p-0.5 border border-slate-200 dark:border-slate-800 text-xs">
            <button
              onClick={() => { if (!isSimulating) setSimulationMode("e2e"); }}
              disabled={isSimulating}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                simulationMode === "e2e"
                  ? "bg-[#76b900] text-slate-950 font-bold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              End-to-End Flow (12 Steps)
            </button>
            <button
              onClick={() => { if (!isSimulating) setSimulationMode("retrieval"); }}
              disabled={isSimulating}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                simulationMode === "retrieval"
                  ? "bg-[#76b900] text-slate-950 font-bold shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Query Retrieval (10 Steps)
            </button>
          </div>

          {!isSimulating ? (
            <button
              onClick={startSimulation}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-[#76b900] to-emerald-600 hover:from-[#6ca900] hover:to-emerald-500 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-[#76b900]/20 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Simulate Pipeline</span>
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause</span>
            </button>
          )}

          <button
            onClick={resetSimulation}
            className="flex items-center space-x-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-2.5 py-2 rounded-xl transition cursor-pointer"
            title="Reset Pipeline"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 rounded-xl p-1 border border-slate-200 dark:border-slate-800 text-xs font-mono">
            <button
              onClick={() => setPlaybackSpeed(1)}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${playbackSpeed === 1 ? "bg-white dark:bg-slate-800 text-[#76b900] font-bold shadow-sm" : "text-slate-500"}`}
            >
              1x
            </button>
            <button
              onClick={() => setPlaybackSpeed(2)}
              className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${playbackSpeed === 2 ? "bg-white dark:bg-slate-800 text-[#76b900] font-bold shadow-sm" : "text-slate-500"}`}
            >
              2x
            </button>
          </div>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Grid: SVG Workflow Canvas (Left) + Specifications Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 w-full">
        {/* Left Column: Resolution-Independent SVG Architecture Canvas */}
        <div className="lg:col-span-8 xl:col-span-9 flex flex-col space-y-3 w-full">
          <div className="relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 p-2 sm:p-4 shadow-lg overflow-hidden w-full">
            {/* Ambient Background Grid Pattern */}
            <div 
              className="absolute inset-0 opacity-15 pointer-events-none" 
              style={{ 
                backgroundImage: "radial-gradient(circle at 1px 1px, #76b900 1px, transparent 0)", 
                backgroundSize: "28px 28px" 
              }} 
            />

            {/* SVG Architectural Canvas */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 1200 700"
                className="w-full h-auto min-w-[950px] select-none block"
                style={{ filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))" }}
              >
                <defs>
                  {/* Active Marching Dashes CSS Animation */}
                  <style>{`
                    @keyframes flowDashes {
                      from { stroke-dashoffset: 28; }
                      to { stroke-dashoffset: 0; }
                    }
                    .active-wire-flow {
                      stroke: #76b900 !important;
                      stroke-width: 3.5px !important;
                      stroke-dasharray: 8 6 !important;
                      animation: flowDashes 0.7s linear infinite !important;
                      filter: drop-shadow(0 0 5px #76b900);
                    }
                    .active-wire-vertical-flow {
                      stroke: #76b900 !important;
                      stroke-width: 4px !important;
                      stroke-dasharray: 8 6 !important;
                      animation: flowDashes 0.5s linear infinite !important;
                      filter: drop-shadow(0 0 7px #76b900);
                    }
                  `}</style>

                  {/* Directional Markers */}
                  <marker
                    id="arrow-solid"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#64748b" />
                  </marker>

                  <marker
                    id="arrow-green"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#76b900" />
                  </marker>

                  <marker
                    id="arrow-active"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0.5 L 9 5 L 0 9.5 z" fill="#76b900" />
                  </marker>

                  <marker
                    id="arrow-dashed"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#94a3b8" />
                  </marker>

                  {/* Glow Filters */}
                  <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Gradients */}
                  <linearGradient id="grad-user" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0284c7" />
                    <stop offset="100%" stopColor="#0369a1" />
                  </linearGradient>
                </defs>

                {/* ========================================================================= */}
                {/* 1. RETRIEVAL PIPELINE (TOP SWIMLANE) */}
                {/* ========================================================================= */}
                <g id="retrieval-swimlane">
                  <text
                    x="24"
                    y="32"
                    fill="#94a3b8"
                    className="font-mono text-[11px] font-bold tracking-widest uppercase"
                  >
                    RETRIEVAL PIPELINE (ONLINE DECISION LAYER)
                  </text>

                  {/* SVG CONNECTING WIRES */}
                  {/* Wire 1: User to Guardrails In */}
                  <path
                    d="M 108 300 L 140 300 M 198 300 L 250 300"
                    fill="none"
                    stroke={isWireActive("wire-1") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-1") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-1") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-1") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 2: Guardrails In to Query Processing */}
                  <path
                    d="M 310 300 L 430 300"
                    fill="none"
                    stroke={isWireActive("wire-2") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-2") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-2") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-2") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 3: Query Processing to Retriever Embedding */}
                  <path
                    d="M 490 300 L 640 300"
                    fill="none"
                    stroke={isWireActive("wire-3") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-3") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-3") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-3") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 4: Retriever Embedding to cuVS Store */}
                  <path
                    d="M 700 300 L 880 300"
                    fill="none"
                    stroke={isWireActive("wire-4") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-4") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-4") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-4") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 5: cuVS Store DIRECTLY UP to NeMo Retriever Reranking */}
                  <path
                    d="M 970 260 L 970 208"
                    fill="none"
                    stroke={isWireActive("wire-5") ? "#76b900" : "#22c55e"}
                    strokeWidth={isWireActive("wire-5") ? "4" : "2"}
                    markerEnd="url(#arrow-green)"
                    className={isWireActive("wire-5") ? "active-wire-vertical-flow" : undefined}
                  />

                  {/* Wire 6: Reranking to Nemotron Super 49B */}
                  <path
                    d="M 940 170 L 700 170"
                    fill="none"
                    stroke={isWireActive("wire-6") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-6") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-6") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-6") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 7: Reranking to Nemotron Nano 8B (Dashed Up & Left) */}
                  <path
                    d="M 970 136 L 970 60 L 840 60"
                    fill="none"
                    stroke={isWireActive("wire-7") ? "#76b900" : "#64748b"}
                    strokeWidth={isWireActive("wire-7") ? "3" : "1.5"}
                    strokeDasharray="5,5"
                    markerEnd={isWireActive("wire-7") ? "url(#arrow-active)" : "url(#arrow-dashed)"}
                    className={isWireActive("wire-7") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 8: Nemotron Nano 8B to Nemotron Super 49B (Dashed Left & Down) */}
                  <path
                    d="M 780 60 L 670 60 L 670 136"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
                  />

                  {/* Wire 9: Domain LLM to Reflection */}
                  <path
                    d="M 460 94 L 460 141"
                    fill="none"
                    stroke={isWireActive("wire-9") ? "#76b900" : "#64748b"}
                    strokeWidth={isWireActive("wire-9") ? "3" : "1.5"}
                    strokeDasharray="5,5"
                    markerEnd={isWireActive("wire-9") ? "url(#arrow-active)" : "url(#arrow-dashed)"}
                    className={isWireActive("wire-9") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 10: Nemotron Super 49B to Reflection */}
                  <path
                    d="M 640 170 L 484 170"
                    fill="none"
                    stroke={isWireActive("wire-10") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-10") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-10") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-10") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 11: Reflection to Query Processing (Bidirectional Loop) */}
                  <path
                    d="M 460 226 L 460 262"
                    fill="none"
                    stroke={isWireActive("wire-11") ? "#eab308" : "#64748b"}
                    strokeWidth={isWireActive("wire-11") ? "3" : "1.5"}
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
                    markerStart="url(#arrow-dashed)"
                    className={isWireActive("wire-11") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 12: Reflection to Guardrails Out */}
                  <path
                    d="M 436 170 L 310 170"
                    fill="none"
                    stroke={isWireActive("wire-12") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-12") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-12") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-12") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire 13: Guardrails Out to User */}
                  <path
                    d="M 250 170 L 205 170 M 135 170 L 80 170 L 80 270"
                    fill="none"
                    stroke={isWireActive("wire-13") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-13") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-13") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-13") ? "active-wire-flow" : undefined}
                  />

                  {/* 1. USER NODE */}
                  <g
                    transform="translate(52, 272)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("user")}
                  >
                    <circle
                      cx="28"
                      cy="28"
                      r="28"
                      fill="url(#grad-user)"
                      stroke={selectedNode === "user" ? "#76b900" : "#0284c7"}
                      strokeWidth={selectedNode === "user" ? "3" : "1.5"}
                      filter={selectedNode === "user" ? "url(#glow-green)" : undefined}
                    />
                    <path d="M 18 42 C 18 35, 38 35, 38 42 Z" fill="#ffffff" />
                    <circle cx="28" cy="22" r="6.5" fill="#ffffff" />
                    <text x="28" y="72" textAnchor="middle" fill="#f8fafc" className="text-[12px] font-bold">
                      User
                    </text>
                  </g>

                  {/* Query Pill */}
                  <g transform="translate(140, 288)">
                    <rect
                      x="0"
                      y="0"
                      width="58"
                      height="24"
                      rx="12"
                      fill="#0f172a"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text x="29" y="16" textAnchor="middle" fill="#94a3b8" className="font-mono text-[10px] font-semibold">
                      &gt;_ Query
                    </text>
                  </g>

                  {/* Response Pill */}
                  <g transform="translate(135, 158)">
                    <rect
                      x="0"
                      y="0"
                      width="70"
                      height="24"
                      rx="12"
                      fill="#0f172a"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text x="35" y="16" textAnchor="middle" fill="#86efac" className="font-mono text-[10px] font-semibold">
                      Response
                    </text>
                  </g>

                  {/* 2. NeMo Guardrails (Input) */}
                  <g
                    transform="translate(250, 266)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("guardrails_in")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "guardrails_in" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "guardrails_in" ? "2.5" : "1.5"}
                      filter={selectedNode === "guardrails_in" ? "url(#glow-green)" : undefined}
                    />
                    <path d="M 18 26 L 30 19 L 42 26 L 30 33 Z" fill="#22c55e" opacity="0.8" />
                    <path d="M 18 34 L 30 27 L 42 34 L 30 41 Z" fill="#22c55e" opacity="0.6" />
                    <path d="M 18 42 L 30 35 L 42 42 L 30 49 Z" fill="#22c55e" opacity="0.4" />
                    <text x="30" y="84" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      NeMo Guardrails
                    </text>
                  </g>

                  {/* 3. Query Processing (Yellow) */}
                  <g
                    transform="translate(430, 266)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("query_proc")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#251a05"
                      stroke={selectedNode === "query_proc" ? "#facc15" : "#eab308"}
                      strokeWidth={selectedNode === "query_proc" ? "2.5" : "1.5"}
                      filter={selectedNode === "query_proc" ? "url(#glow-green)" : undefined}
                    />
                    <circle cx="30" cy="34" r="10" fill="none" stroke="#eab308" strokeWidth="3" strokeDasharray="4,2" />
                    <circle cx="30" cy="34" r="4" fill="#eab308" />
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      Query
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      Processing
                    </text>
                  </g>

                  {/* 4. NeMo Retriever Embedding (Query) */}
                  <g
                    transform="translate(640, 266)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("retriever_embed_query")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "retriever_embed_query" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "retriever_embed_query" ? "2.5" : "1.5"}
                      filter={selectedNode === "retriever_embed_query" ? "url(#glow-green)" : undefined}
                    />
                    <circle cx="30" cy="34" r="12" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                    <circle cx="24" cy="28" r="2.5" fill="#76b900" />
                    <circle cx="36" cy="28" r="2.5" fill="#76b900" />
                    <circle cx="30" cy="40" r="2.5" fill="#76b900" />
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      NeMo Retriever
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                      Embedding
                    </text>
                  </g>

                  {/* 5. Vector DB & Object Store (cuVS) - Central Hub */}
                  <g
                    transform="translate(880, 260)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("cuvs_store")}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="180"
                      height="88"
                      rx="14"
                      fill="#041b0f"
                      stroke={selectedNode === "cuvs_store" ? "#76b900" : "#166534"}
                      strokeWidth={selectedNode === "cuvs_store" ? "3" : "2"}
                      filter={selectedNode === "cuvs_store" ? "url(#glow-green)" : undefined}
                    />
                    {/* Header bar inside chassis */}
                    <rect x="0" y="0" width="180" height="26" rx="14" fill="#064e28" opacity="0.7" />
                    <text x="90" y="17" textAnchor="middle" fill="#86efac" className="font-mono text-[9px] font-bold uppercase tracking-wider">
                      Vector DB &amp; Object Store (cuVS)
                    </text>
                    {/* Database & GPU cylinders */}
                    <path d="M 28 42 C 28 38, 48 38, 48 42 C 48 46, 28 46, 28 42 Z" fill="#22c55e" />
                    <path d="M 28 42 L 28 58 C 28 62, 48 62, 48 58 L 48 42 Z" fill="#15803d" opacity="0.8" />
                    <path d="M 28 50 C 28 54, 48 54, 48 50" fill="none" stroke="#86efac" strokeWidth="1" />
                    <path d="M 28 58 C 28 62, 48 62, 48 58" fill="none" stroke="#86efac" strokeWidth="1" />
                    {/* cuVS badge */}
                    <rect x="58" y="38" width="108" height="22" rx="6" fill="#14532d" />
                    <text x="112" y="52" textAnchor="middle" fill="#f8fafc" className="font-mono text-[10px] font-bold">
                      cuVS GPU Accelerated
                    </text>
                    <text x="112" y="76" textAnchor="middle" fill="#86efac" className="font-mono text-[9px]">
                      &lt;0.01ms ANN Search
                    </text>
                  </g>

                  {/* 6. NeMo Retriever Reranking */}
                  <g
                    transform="translate(940, 136)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("reranking")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "reranking" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "reranking" ? "2.5" : "1.5"}
                      filter={selectedNode === "reranking" ? "url(#glow-green)" : undefined}
                    />
                    <path d="M 20 28 L 40 28 M 24 34 L 36 34 M 27 40 L 33 40" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      NeMo Retriever
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                      Reranking
                    </text>
                  </g>

                  {/* 7. Llama Nemotron Nano 8B v1 */}
                  <g
                    transform="translate(780, 26)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("nemotron_nano")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "nemotron_nano" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "nemotron_nano" ? "2.5" : "1.5"}
                      filter={selectedNode === "nemotron_nano" ? "url(#glow-green)" : undefined}
                    />
                    <circle cx="30" cy="34" r="8" fill="none" stroke="#22c55e" strokeWidth="2" />
                    <text x="30" y="80" textAnchor="middle" fill="#f8fafc" className="text-[9px] font-bold">
                      Llama Nemotron
                    </text>
                    <text x="30" y="92" textAnchor="middle" fill="#86efac" className="text-[9px] font-semibold">
                      Nano 8B v1
                    </text>
                  </g>

                  {/* 8. Llama Nemotron Super 49B */}
                  <g
                    transform="translate(640, 136)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("nemotron_super")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0e2314"
                      stroke={selectedNode === "nemotron_super" ? "#76b900" : "#4ade80"}
                      strokeWidth={selectedNode === "nemotron_super" ? "3" : "2"}
                      filter={selectedNode === "nemotron_super" ? "url(#glow-green)" : undefined}
                    />
                    <circle cx="30" cy="34" r="13" fill="none" stroke="#76b900" strokeWidth="1.5" />
                    <circle cx="30" cy="34" r="4" fill="#76b900" />
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      Llama Nemotron
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#86efac" className="text-[9px] font-semibold">
                      Super 49B
                    </text>
                  </g>

                  {/* 9. Domain LLM (Claude / ChatGPT) */}
                  <g
                    transform="translate(430, 26)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("llm_optional")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "llm_optional" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "llm_optional" ? "2.5" : "1.5"}
                      filter={selectedNode === "llm_optional" ? "url(#glow-green)" : undefined}
                    />
                    <text x="30" y="39" textAnchor="middle" fill="#76b900" className="font-mono text-[11px] font-bold">
                      LLM
                    </text>
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      Domain LLM
                    </text>
                  </g>

                  {/* 10. Reflection Agent */}
                  <g
                    transform="translate(438, 141)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("reflection")}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="44"
                      height="58"
                      rx="6"
                      fill="#261b05"
                      stroke={selectedNode === "reflection" ? "#facc15" : "#eab308"}
                      strokeWidth={selectedNode === "reflection" ? "2.5" : "1.5"}
                      filter={selectedNode === "reflection" ? "url(#glow-green)" : undefined}
                    />
                    <path d="M 10 14 L 32 14 M 10 22 L 28 22" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="28" cy="40" r="8" fill="#eab308" opacity="0.9" />
                    <circle cx="28" cy="40" r="3" fill="#18181b" />
                    <text x="22" y="74" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      Reflection
                    </text>
                  </g>

                  {/* 11. NeMo Guardrails (Output) */}
                  <g
                    transform="translate(250, 136)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("guardrails_out")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "guardrails_out" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "guardrails_out" ? "2.5" : "1.5"}
                      filter={selectedNode === "guardrails_out" ? "url(#glow-green)" : undefined}
                    />
                    <path d="M 18 26 L 30 19 L 42 26 L 30 33 Z" fill="#22c55e" opacity="0.8" />
                    <path d="M 18 34 L 30 27 L 42 34 L 30 41 Z" fill="#22c55e" opacity="0.6" />
                    <path d="M 18 42 L 30 35 L 42 42 L 30 49 Z" fill="#22c55e" opacity="0.4" />
                    <text x="30" y="84" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      NeMo Guardrails
                    </text>
                  </g>
                </g>

                {/* ========================================================================= */}
                {/* 2. PIPELINE DIVIDER (Dashed Horizontal Line) */}
                {/* ========================================================================= */}
                <g id="pipeline-divider">
                  <line
                    x1="20"
                    y1="410"
                    x2="1180"
                    y2="410"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="6,6"
                  />
                  <text
                    x="24"
                    y="435"
                    fill="#94a3b8"
                    className="font-mono text-[11px] font-bold tracking-widest uppercase"
                  >
                    EXTRACTION PIPELINE (OFFLINE INGESTION &amp; INDEXING)
                  </text>
                </g>

                {/* ========================================================================= */}
                {/* 3. EXTRACTION PIPELINE (BOTTOM SWIMLANE) */}
                {/* ========================================================================= */}
                <g id="extraction-swimlane">
                  {/* Wire E1: Docs to Extraction Models */}
                  <path
                    d="M 145 525 L 230 485 L 430 485"
                    fill="none"
                    stroke={isWireActive("wire-e1") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-e1") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-e1") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-e1") ? "active-wire-flow" : undefined}
                  />
                  <text x="330" y="472" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                    Pages as Images, Infographics, Charts, Tables
                  </text>

                  {/* Wire E2: Docs to Nemotron Parse */}
                  <path
                    d="M 145 565 L 230 605 L 430 605"
                    fill="none"
                    stroke={isWireActive("wire-e2") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-e2") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-e2") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-e2") ? "active-wire-flow" : undefined}
                  />

                  {/* Wire E3: Extraction Models to Ingestion Embedding */}
                  <path
                    d="M 490 485 L 720 485 L 720 535 L 940 535"
                    fill="none"
                    stroke={isWireActive("wire-e3") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-e3") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-e3") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-e3") ? "active-wire-flow" : undefined}
                  />
                  <text x="605" y="475" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[9px] font-semibold">
                    -Text-
                  </text>

                  {/* Wire E4: Nemotron Parse to Ingestion Embedding */}
                  <path
                    d="M 490 605 L 740 605 L 740 555 L 940 555"
                    fill="none"
                    stroke={isWireActive("wire-e4") ? "#76b900" : "#475569"}
                    strokeWidth={isWireActive("wire-e4") ? "3.5" : "1.5"}
                    markerEnd={isWireActive("wire-e4") ? "url(#arrow-active)" : "url(#arrow-solid)"}
                    className={isWireActive("wire-e4") ? "active-wire-flow" : undefined}
                  />
                  <text x="615" y="595" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[9px] font-semibold">
                    -Text and Metadata-
                  </text>

                  {/* Wire E5: Ingestion Embedding DIRECTLY UP into cuVS Vector Store */}
                  <path
                    d="M 970 511 L 970 348"
                    fill="none"
                    stroke={isWireActive("wire-e5") ? "#76b900" : "#22c55e"}
                    strokeWidth={isWireActive("wire-e5") ? "4" : "2.5"}
                    markerEnd="url(#arrow-green)"
                    className={isWireActive("wire-e5") ? "active-wire-vertical-flow" : undefined}
                  />
                  <text x="988" y="430" fill="#86efac" className="font-mono text-[10px] font-bold">
                    Into cuVS
                  </text>

                  {/* 1. Multimodal Enterprise Documents */}
                  <g
                    transform="translate(45, 505)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("docs")}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="100"
                      height="80"
                      rx="12"
                      fill="#2e1605"
                      stroke={selectedNode === "docs" ? "#f97316" : "#ea580c"}
                      strokeWidth={selectedNode === "docs" ? "2.5" : "1.5"}
                      filter={selectedNode === "docs" ? "url(#glow-green)" : undefined}
                    />
                    <rect x="32" y="16" width="36" height="40" rx="6" fill="#ea580c" />
                    <circle cx="43" cy="28" r="3.5" fill="#fff" />
                    <path d="M 36 46 L 46 36 L 56 46 Z" fill="#fed7aa" />
                    <text x="50" y="70" textAnchor="middle" fill="#fdba74" className="font-mono text-[8px] font-bold uppercase">
                      TEM PSHA 2025
                    </text>
                    <text x="50" y="98" textAnchor="middle" fill="#f8fafc" className="text-[11px] font-bold">
                      Multimodal
                    </text>
                    <text x="50" y="112" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-medium">
                      Enterprise Docs
                    </text>
                  </g>

                  {/* 2. NeMo Retriever Extraction Models */}
                  <g
                    transform="translate(430, 451)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("extraction_models")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "extraction_models" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "extraction_models" ? "2.5" : "1.5"}
                      filter={selectedNode === "extraction_models" ? "url(#glow-green)" : undefined}
                    />
                    <rect x="20" y="24" width="20" height="20" rx="3" fill="none" stroke="#76b900" strokeWidth="1.5" />
                    <circle cx="26" cy="30" r="2" fill="#76b900" />
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      NeMo Retriever
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                      Extraction Models
                    </text>
                  </g>

                  {/* 3. Nemotron Parse */}
                  <g
                    transform="translate(430, 571)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("nemotron_parse")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "nemotron_parse" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "nemotron_parse" ? "2.5" : "1.5"}
                      filter={selectedNode === "nemotron_parse" ? "url(#glow-green)" : undefined}
                    />
                    <path d="M 22 28 L 38 28 M 22 34 L 38 34 M 22 40 L 32 40" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      Nemotron Parse
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                      Document Parser
                    </text>
                  </g>

                  {/* 4. NeMo Retriever Embedding (Docs) */}
                  <g
                    transform="translate(940, 511)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("retriever_embed_docs")}
                  >
                    <polygon
                      points="30,0 60,17 60,51 30,68 0,51 0,17"
                      fill="#0a1a10"
                      stroke={selectedNode === "retriever_embed_docs" ? "#76b900" : "#22c55e"}
                      strokeWidth={selectedNode === "retriever_embed_docs" ? "2.5" : "1.5"}
                      filter={selectedNode === "retriever_embed_docs" ? "url(#glow-green)" : undefined}
                    />
                    <circle cx="30" cy="34" r="12" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                    <circle cx="24" cy="28" r="2.5" fill="#76b900" />
                    <circle cx="36" cy="28" r="2.5" fill="#76b900" />
                    <circle cx="30" cy="40" r="2.5" fill="#76b900" />
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      NeMo Retriever
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                      Embedding
                    </text>
                  </g>
                </g>

                {/* ========================================================================= */}
                {/* 4. CRISP HIGH-TECH BEACON AT ACTIVE NODE (NO BLURRY SMUDGE) */}
                {/* ========================================================================= */}
                {isSimulating && currentStepData && (
                  <g 
                    transform={`translate(${currentStepData.coords.x}, ${currentStepData.coords.y})`}
                    className="pointer-events-none"
                  >
                    {/* Subtle outer radar ring */}
                    <circle r="18" fill="none" stroke="#76b900" strokeWidth="1.5" className="animate-ping" opacity="0.5" />
                    {/* Luminous emerald core ring */}
                    <circle r="10" fill="#76b900" fillOpacity="0.3" stroke="#a3e635" strokeWidth="2" />
                    {/* Solid bright white center point */}
                    <circle r="4.5" fill="#ffffff" stroke="#76b900" strokeWidth="1.5" />
                    {/* Floating Stage Identifier Badge */}
                    <g transform="translate(0, -26)">
                      <rect 
                        x="-52" 
                        y="-10" 
                        width="104" 
                        height="20" 
                        rx="10" 
                        fill="#0b1320" 
                        stroke="#76b900" 
                        strokeWidth="1.5" 
                      />
                      <text 
                        x="0" 
                        y="4" 
                        textAnchor="middle" 
                        fill="#86efac" 
                        className="font-mono text-[9px] font-bold tracking-tight"
                      >
                        STAGE {currentStepData.step}/{currentSteps.length}
                      </text>
                    </g>
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Real-Time Telemetry Log Stream */}
          <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#080e1a] text-slate-200 shadow-md overflow-hidden w-full">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1726] border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-[#76b900]" />
                <span className="font-mono text-xs font-bold text-white tracking-wide">
                  SYSTEM TELEMETRY STREAM &amp; AUDIT LOGS
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span>Current Stage: {simulationStep ? `Stage ${simulationStep}/${currentSteps.length} (${selected.title})` : "Standby (Click Simulate to Start)"}</span>
                <span>|</span>
                <button
                  onClick={() => setTelemetryLogs([])}
                  className="hover:text-white transition cursor-pointer"
                >
                  Clear Logs
                </button>
              </div>
            </div>

            <div
              ref={logContainerRef}
              className="h-44 overflow-y-auto p-3 font-mono text-xs space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800"
            >
              {telemetryLogs.map((log) => (
                <div key={log.id} className="flex items-start space-x-2.5 leading-relaxed">
                  <span className="text-slate-500 shrink-0 text-[10px]">{log.time}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-bold tracking-wider shrink-0 ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                        : log.status === "EXEC"
                        ? "bg-sky-950 text-sky-400 border border-sky-800"
                        : log.status === "WARN"
                        ? "bg-amber-950 text-amber-400 border border-amber-800"
                        : "bg-slate-800 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {log.status}
                  </span>
                  <span className="text-[#76b900] font-semibold shrink-0">[{log.step}]</span>
                  <span className="text-slate-300">{log.message}</span>
                </div>
              ))}
              {telemetryLogs.length === 0 && (
                <div className="text-slate-500 italic text-center py-10">
                  Telemetry stream ready. Press &quot;Simulate Pipeline&quot; to inspect microsecond lifecycle traces.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Node Specifications & Role Inspector Drawer */}
        <div className="lg:col-span-4 xl:col-span-3 flex flex-col space-y-3 w-full">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 shadow-sm flex flex-col h-full">
            {/* Drawer Header with Category Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                Component Inspector
              </span>
              <span className="rounded bg-[#76b900]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#76b900] border border-[#76b900]/30">
                {selected.category}
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl mb-4 text-xs font-semibold">
              <button
                onClick={() => setActiveInspectorTab("overview")}
                className={`flex items-center justify-center space-x-1 flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  activeInspectorTab === "overview"
                    ? "bg-[#76b900] text-slate-950 font-bold shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <Info className="h-3.5 w-3.5" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveInspectorTab("specs")}
                className={`flex items-center justify-center space-x-1 flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  activeInspectorTab === "specs"
                    ? "bg-[#76b900] text-slate-950 font-bold shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Specs</span>
              </button>
              <button
                onClick={() => setActiveInspectorTab("telemetry")}
                className={`flex items-center justify-center space-x-1 flex-1 py-1.5 rounded-lg transition cursor-pointer ${
                  activeInspectorTab === "telemetry"
                    ? "bg-[#76b900] text-slate-950 font-bold shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                <FileCode2 className="h-3.5 w-3.5" />
                <span>Telemetry JSON</span>
              </button>
            </div>

            {/* Node Title & Tech Header */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selected.title}
              </h3>
              <p className="text-xs font-mono text-[#76b900] font-semibold">
                {selected.tech}
              </p>
            </div>

            {/* Tab 1: Operational Overview */}
            {activeInspectorTab === "overview" && (
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Operational Objective
                  </label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selected.componentObjective}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Component Role in Prototype
                  </label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {selected.role}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-slate-400 block font-bold mb-0.5">
                      Input Data Stream
                    </span>
                    <span className="text-xs text-slate-800 dark:text-slate-200 block">
                      {selected.inputData}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-mono uppercase text-[#76b900] block font-bold mb-0.5">
                      Generated Output / Artifact
                    </span>
                    <span className="text-xs text-slate-800 dark:text-slate-200 block">
                      {selected.outputArtifact}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Technical Specifications */}
            {activeInspectorTab === "specs" && (
              <div className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-slate-400 block">
                      Target Latency
                    </span>
                    <span className="font-mono text-xs font-bold text-[#76b900]">
                      {selected.latencyTarget}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                    <span className="text-[9px] font-mono uppercase text-slate-500 dark:text-slate-400 block">
                      Execution Engine
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {selected.hardware}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    NVIDIA Specification
                  </label>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                    {selected.spec}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Telemetry JSON */}
            {activeInspectorTab === "telemetry" && (
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-[#080e1a] border border-slate-800 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  <pre>{JSON.stringify(selected.samplePayload, null, 2)}</pre>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
                  Live JSON schema extracted from the local NVIDIA NIM runtime microservice.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
