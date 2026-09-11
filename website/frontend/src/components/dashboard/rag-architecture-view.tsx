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
  FolderArchive, 
  Terminal, 
  Activity, 
  Zap, 
  FileCode2, 
  Sliders, 
  SlidersHorizontal,
  Info,
  Layers2
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
    subtitle: "Document Parser & Hierarchy Extractor",
    tech: "NVIDIA Nemotron Parse NIM",
    category: "Extraction",
    role: "Converts dense scientific documentation into clean GitHub Flavored Markdown with preserved mathematical equations.",
    componentObjective: "Preserves document hierarchy, scientific notation, Lin & Lee attenuation formulas, and attaches semantic metadata tags.",
    inputData: "Dense narrative technical text, seismic methodology footnotes, and attenuation formulas.",
    outputArtifact: "Structured semantic Markdown with intact equations and annotated JSON metadata.",
    spec: "Nemotron-Parse-v1 (Markdown + JSON Metadata output)",
    hardware: "NVIDIA TensorRT-LLM Inference",
    latencyTarget: "~ 30 ms / page",
    samplePayload: {
      format: "GitHub Flavored Markdown",
      equations_parsed: 14,
      metadata_keys: ["author", "seismic_zone", "version_year"]
    }
  },
  retriever_embed_docs: {
    id: "retriever_embed_docs",
    title: "NeMo Retriever Embedding (Ingestion)",
    subtitle: "Chunk Vectorization & Upsert to cuVS",
    tech: "NV-Embed-QA / NeMo Retriever NIM",
    category: "Extraction",
    role: "Transforms text chunks and metadata into dense 1024-dimensional semantic vectors and streams them into cuVS.",
    componentObjective: "Encodes 1,248 document chunks (1,200 chars, 200 overlap) into dense vectors optimized for technical domain QA.",
    inputData: "1,248 structured text chunks and metadata from document parsers.",
    outputArtifact: "1,248 normalized 1024-dimensional dense vectors ready for GPU graph indexing.",
    spec: "Batch Embedding Ingestion, 1024-dim, FP16",
    hardware: "NVIDIA CUDA Acceleration",
    latencyTarget: "~ 12 ms / batch",
    samplePayload: {
      chunks_embedded: 1248,
      target_index: "cuVS_CAGRA_TEM_2025",
      upsert_status: "SYNCHRONIZED"
    }
  },
  cuvs_store: {
    id: "cuvs_store",
    title: "Vector Database & Object Store (cuVS)",
    subtitle: "GPU-Accelerated Vector Index & Document Chunks",
    tech: "NVIDIA cuVS CAGRA + MinIO / Parquet Storage",
    category: "Storage",
    role: "High-performance vector and document store maintaining the TEM PSHA 2025 corpus in GPU memory.",
    componentObjective: "Maintains an ultra-fast CAGRA (CUDA Anisotropic Graph) index for microsecond approximate nearest neighbor (ANN) retrieval.",
    inputData: "1,248 document vectors and raw document chunk objects.",
    outputArtifact: "GPU graph index serving nearest-neighbor candidate chunks in < 0.01 ms.",
    spec: "cuVS CAGRA Graph Index (C-API / Python bindings), < 0.01ms probe",
    hardware: "NVIDIA CUDA / High-Bandwidth GPU VRAM",
    latencyTarget: "< 0.01 ms",
    samplePayload: {
      index_type: "CAGRA_GRAPH",
      total_vectors: 1248,
      nearest_chunks: [
        { chunk_id: "TEM-P042-C0084", distance: 0.124 },
        { chunk_id: "TEM-P043-C0085", distance: 0.141 },
        { chunk_id: "BOR-NCU-B4-01", distance: 0.189 }
      ]
    }
  },
  user: {
    id: "user",
    title: "Client Operator / User",
    subtitle: "Emergency Commander / SCADA Ingress",
    tech: "Secure WebSocket / TLS 1.3 REST API",
    category: "Entity",
    role: "Submits seismic emergency queries, triggers simulation scenarios, and inspects real-time physical damage estimates.",
    componentObjective: "Provides low-latency bi-directional communication between the emergency operations desk and the backend AI system.",
    inputData: "Operator queries or automated telemetry ingress: 'Assess M6.91 Shuanglienpo-Hukou cascading PGA for NCU Science Building 4'.",
    outputArtifact: "Authenticated, timestamped query payload.",
    spec: "Session Auth Bearer Token, Client Ingress Validation",
    hardware: "Edge Device / Web Client",
    latencyTarget: "< 1.0 ms",
    samplePayload: {
      user_id: "NCU_DISASTER_CMD_01",
      query: "Assess M6.91 Shuanglienpo-Hukou cascading PGA & drift ratio for NCU Science Building 4",
      timestamp_utc: "2026-09-11T02:35:00Z"
    }
  },
  guardrails_in: {
    id: "guardrails_in",
    title: "NeMo Guardrails (Input)",
    subtitle: "Input Safety, Jailbreak & Topical Rail",
    tech: "NVIDIA NeMo Guardrails (Colang / Python Critic)",
    category: "Guardrail",
    role: "Validates incoming query for prompt injection, out-of-domain scope, and critical infrastructure safety policies.",
    componentObjective: "Enforces input safety policies, intercepts jailbreak attempts, and validates domain alignment before LLM execution.",
    inputData: "Raw user query string.",
    outputArtifact: "Sanitized query and pass/fail policy classification.",
    spec: "Deterministic Rule Matching + Micro-LLM Input Classifier",
    hardware: "NVIDIA TensorRT-LLM (Low-latency)",
    latencyTarget: "< 2.0 ms",
    samplePayload: {
      input_passed: true,
      jailbreak_score: 0.00,
      topic_classification: "TAIWAN_SEISMOLOGY_EMERGENCY",
      action: "ALLOW_INGRESS"
    }
  },
  query_proc: {
    id: "query_proc",
    title: "Query Processing",
    subtitle: "Decomposition & Spatial-Graph Entity Matcher",
    tech: "LangChain / NeMo Query Decomposer + NetworkX",
    category: "Retrieval",
    role: "Extracts seismogenic fault IDs, target campus facilities, coordinates, and resolves multi-fault rupture pairs via GeoGraph.",
    componentObjective: "Deconstructs query intent, extracts fault identifiers, resolves spatial proximity, and maps cascading rupture scenarios.",
    inputData: "Sanitized user query.",
    outputArtifact: "Identified fault entities, campus target metadata, and required GMPE calculation intents.",
    spec: "Spatial Entity Normalization against 38 Active Faults Catalog",
    hardware: "CPU / Tensor Core",
    latencyTarget: "< 5.0 ms",
    samplePayload: {
      extracted_faults: ["Shuanglienpo Fault (ID #2)", "Hukou Fault (ID #3)"],
      target_facility: "NCU Science Building 4",
      calc_intent: "GMPE_CRUSTAL_LIN_LEE_2008"
    }
  },
  retriever_embed_query: {
    id: "retriever_embed_query",
    title: "NeMo Retriever Embedding (Query)",
    subtitle: "Real-Time Query Vector Encoding",
    tech: "NV-Embed-QA / NVIDIA NeMo Retriever NIM",
    category: "Retrieval",
    role: "Encodes structured query into dense 1024-dimensional vector space optimized for scientific and geotechnical literature search.",
    componentObjective: "Converts structured query entities into a dense vector embedding in < 3 ms for matching against cuVS.",
    inputData: "Structured query text and extracted seismic entities.",
    outputArtifact: "Normalized 1024-dimensional dense query vector.",
    spec: "NV-Embed-QA 4096 context, Cosine Similarity normalized",
    hardware: "NVIDIA TensorRT Inference Engine",
    latencyTarget: "< 3.0 ms",
    samplePayload: {
      embedding_dim: 1024,
      norm: 1.000,
      prefix: "query: ",
      tokens_processed: 28
    }
  },
  reranking: {
    id: "reranking",
    title: "NeMo Retriever Reranking",
    subtitle: "Cross-Encoder Relevance Scoring",
    tech: "NVIDIA NeMo Retriever Reranking NIM",
    category: "Retrieval",
    role: "Scores retrieved chunk candidates against query with deep attention cross-encoder, filtering out irrelevant literature noise.",
    componentObjective: "Applies cross-encoder attention over the top 12 candidates from cuVS to isolate the 3 most precise literature citations.",
    inputData: "12 candidate document chunks from cuVS initial vector search.",
    outputArtifact: "Top-3 high-relevance literature citations with confidence scores > 0.94.",
    spec: "Precision Cross-Encoder (Top-K Reordering from 12 to 3 chunks)",
    hardware: "NVIDIA TensorRT-LLM FP16",
    latencyTarget: "< 8.0 ms",
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
    inputData: "Top-3 TEM PSHA 2025 chunks, fault geotechnical parameters, and GMPE regression constants.",
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
    subtitle: "Factual Consistency & Output Sanitization",
    tech: "NVIDIA NeMo Guardrails Output Safety Rail",
    category: "Guardrail",
    role: "Final safety filter ensuring response adheres to civil defense formatting, zero PII leakage, and verified geotechnical citation stamps.",
    componentObjective: "Sanitizes output payload, formats civil defense directive according to Taiwan CWA/NCDR SOP, and attaches verified citation stamps.",
    inputData: "Verified emergency report draft.",
    outputArtifact: "Final certified emergency dispatch payload.",
    spec: "Output Rail Validator + Format Enforcement",
    hardware: "TensorRT-LLM",
    latencyTarget: "< 2.0 ms",
    samplePayload: {
      output_verified: true,
      citations_attached: 3,
      red_tag_approved: true
    }
  }
};

const FULL_PIPELINE_STEPS = [
  {
    step: 1,
    node: "docs",
    title: "Step 1: Document Ingestion",
    log: "Ingesting TEM PSHA 2025 PDF (142 pages), 38 Fault Catalogs, and NCREE borehole logs.",
    status: "INFO"
  },
  {
    step: 2,
    node: "extraction_models",
    title: "Step 2: Vision Feature Extraction",
    log: "NeMo Vision NIM parsed hazard curves & GMPE attenuation tables into clean structured text.",
    status: "EXEC"
  },
  {
    step: 3,
    node: "nemotron_parse",
    title: "Step 3: Hierarchy & Markdown Parsing",
    log: "Nemotron Parse extracted report chapters to GitHub Markdown with intact attenuation formulas.",
    status: "EXEC"
  },
  {
    step: 4,
    node: "retriever_embed_docs",
    title: "Step 4: Chunk Vectorization",
    log: "Vectorized 1,248 document chunks (1200 char window, 200 overlap) into 1024-dim dense vectors.",
    status: "EXEC"
  },
  {
    step: 5,
    node: "cuvs_store",
    title: "Step 5: cuVS CAGRA GPU Indexing",
    log: "cuVS CAGRA indexed 1,248 vectors into high-bandwidth GPU memory. Ready for <0.01ms ANN search.",
    status: "SUCCESS"
  },
  {
    step: 6,
    node: "user",
    title: "Step 6: User Query Ingress",
    log: "Operator query: 'Assess M6.91 Shuanglienpo-Hukou cascading PGA & drift ratio for NCU Science Building 4'.",
    status: "INFO"
  },
  {
    step: 7,
    node: "guardrails_in",
    title: "Step 7: NeMo Guardrails Input Check",
    log: "NeMo Guardrails passed: Jailbreak score 0.00, verified within Taiwan seismology safety policy.",
    status: "SUCCESS"
  },
  {
    step: 8,
    node: "query_proc",
    title: "Step 8: Query Decomposition",
    log: "Resolved target entities: Shuanglienpo Fault (#2) + Hukou (#3) multi-rupture scenario via GeoGraph.",
    status: "INFO"
  },
  {
    step: 9,
    node: "retriever_embed_query",
    title: "Step 9: Query Embedding",
    log: "Generated 1024-dim dense query embedding using NV-Embed-QA in 0.003 ms.",
    status: "EXEC"
  },
  {
    step: 10,
    node: "cuvs_store",
    title: "Step 10: cuVS GPU Vector Probing",
    log: "cuVS GPU index probed 1,248 vectors: 12 candidate chunks retrieved in 0.009 ms.",
    status: "SUCCESS"
  },
  {
    step: 11,
    node: "reranking",
    title: "Step 11: Cross-Encoder Reranking",
    log: "Cross-encoder re-ranked chunks -> Top-3 TEM PSHA 2025 literature chunks selected (Top Score: 0.942).",
    status: "EXEC"
  },
  {
    step: 12,
    node: "nemotron_nano",
    title: "Step 12: Nemotron Nano 8B Reflex",
    log: "Nemotron Nano 8B executed sub-5ms SCADA elevator stop and natural gas shutoff actuators.",
    status: "SUCCESS"
  },
  {
    step: 13,
    node: "nemotron_super",
    title: "Step 13: Nemotron Super 49B Deliberation",
    log: "Nemotron Super 49B calculated Lin & Lee GMPE: PGV=72.4 cm/s, Drift=2.14% (RED TAG evacuation).",
    status: "EXEC"
  },
  {
    step: 14,
    node: "reflection",
    title: "Step 14: Reflection Agent Critique",
    log: "Safety Critic verified parameters against Table 2 catalog: 0.0% Hallucination verified.",
    status: "SUCCESS"
  },
  {
    step: 15,
    node: "guardrails_out",
    title: "Step 15: NeMo Guardrails Output Certification",
    log: "Output safety filters verified: citations attached, RED TAG emergency directive certified.",
    status: "SUCCESS"
  }
];

export const RagArchitectureView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>("docs");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeInspectorTab, setActiveInspectorTab] = useState<"overview" | "specs" | "telemetry">("overview");
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([
    {
      id: 1,
      time: "10:35:00.000",
      step: "SYSTEM_READY",
      status: "INFO",
      message: "NVIDIA NeMo Multimodal Agentic RAG pipeline initialized: Ingestion -> cuVS -> Retrieval & Reasoning."
    }
  ]);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [telemetryLogs]);

  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(1);

    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
    setTelemetryLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        time: timeStr,
        step: "CYCLE_START",
        status: "INFO",
        message: "▶ Executing End-to-End Workflow: Phase 1 (Ingestion & cuVS Indexing) -> Phase 2 (Query Ingress & Multi-Agent Deliberation)."
      }
    ]);

    let stepIndex = 0;
    const intervalMs = 1300 / playbackSpeed;

    const runNextStep = () => {
      if (stepIndex < FULL_PIPELINE_STEPS.length) {
        const currentData = FULL_PIPELINE_STEPS[stepIndex];
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
        setSelectedNode("nemotron_super");
        const endTime = new Date();
        const endTimeStr = endTime.toTimeString().split(" ")[0] + "." + String(endTime.getMilliseconds()).padStart(3, "0");
        setTelemetryLogs((prev) => [
          ...prev,
          {
            id: Date.now() + 999,
            time: endTimeStr,
            step: "CYCLE_COMPLETE",
            status: "SUCCESS",
            message: "✔ End-to-End Workflow Execution successfully validated: Ingestion, cuVS Indexing, and Physics-Grounded Reasoning certified."
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
    setSelectedNode("docs");
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
              End-to-End Execution: 1. Extraction Pipeline (Data Ingestion) &rarr; 2. cuVS GPU Indexing &rarr; 3. Real-Time Retrieval &amp; Deliberative Reasoning
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isSimulating ? (
            <button
              onClick={startSimulation}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-[#76b900] to-emerald-600 hover:from-[#6ca900] hover:to-emerald-500 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-[#76b900]/20 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Simulate End-to-End Pipeline</span>
            </button>
          ) : (
            <button
              onClick={pauseSimulation}
              className="flex items-center space-x-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md cursor-pointer"
            >
              <Pause className="h-3.5 w-3.5 fill-current" />
              <span>Pause Simulation</span>
            </button>
          )}

          <button
            onClick={resetSimulation}
            className="flex items-center space-x-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-2.5 py-2 rounded-xl transition cursor-pointer"
            title="Reset Pipeline to Initial State"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 text-[11px] font-mono">
            {[1, 2].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded-lg transition ${
                  playbackSpeed === spd
                    ? "bg-[#76b900] text-slate-950 font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center space-x-1 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium px-2.5 py-2 rounded-xl transition cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Expand to Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? "Exit" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage: Full Width Layout */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-4 items-start w-full">
        {/* SVG Diagram Canvas (8 cols on 2xl) */}
        <div className="2xl:col-span-8 flex flex-col space-y-4 w-full">
          <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#070d17] overflow-hidden shadow-xl p-3 sm:p-5">
            {/* Background Grid */}
            <div 
              className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#76b900 1.5px, transparent 1.5px)",
                backgroundSize: "28px 28px"
              }}
            />

            {/* SVG Architectural Canvas (1200 x 700 - Spacious & Collision-Free) */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 1200 700"
                className="w-full min-w-[920px] h-auto select-none"
                style={{ filter: "drop-shadow(0 2px 10px rgba(0,0,0,0.18))" }}
              >
                <defs>
                  {/* Arrow markers */}
                  <marker
                    id="arrow-solid"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 8 5 L 0 9 z" fill="#64748b" />
                  </marker>

                  <marker
                    id="arrow-green"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 9 5 L 0 9 z" fill="#76b900" />
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
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-pulse" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="8" result="blur" />
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
                    stroke={simulationStep === 6 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 6 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 2: Guardrails In to Query Processing */}
                  <path
                    d="M 310 300 L 430 300"
                    fill="none"
                    stroke={simulationStep === 7 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 7 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 3: Query Processing to Retriever Embedding */}
                  <path
                    d="M 490 300 L 640 300"
                    fill="none"
                    stroke={simulationStep === 8 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 8 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 4: Retriever Embedding to cuVS Store */}
                  <path
                    d="M 700 300 L 880 300"
                    fill="none"
                    stroke={simulationStep === 9 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 9 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 5: cuVS Store UP to Reranking */}
                  <path
                    d="M 970 260 L 970 208"
                    fill="none"
                    stroke={simulationStep === 10 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 10 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 6: Reranking to Nemotron Super 49B */}
                  <path
                    d="M 940 170 L 700 170"
                    fill="none"
                    stroke={simulationStep === 13 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 13 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 7: Reranking to Nemotron Nano 8B (Dashed Up & Left) */}
                  <path
                    d="M 970 136 L 970 60 L 840 60"
                    fill="none"
                    stroke={simulationStep === 12 ? "#76b900" : "#64748b"}
                    strokeWidth={simulationStep === 12 ? "2.5" : "1.5"}
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
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
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
                  />

                  {/* Wire 10: Nemotron Super 49B to Reflection */}
                  <path
                    d="M 640 170 L 484 170"
                    fill="none"
                    stroke={simulationStep === 14 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 14 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 11: Reflection to Query Processing (Bidirectional Loop) */}
                  <path
                    d="M 460 226 L 460 262"
                    fill="none"
                    stroke={simulationStep === 14 ? "#eab308" : "#64748b"}
                    strokeWidth={simulationStep === 14 ? "2.5" : "1.5"}
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
                    markerStart="url(#arrow-dashed)"
                  />

                  {/* Wire 12: Reflection to Guardrails Out */}
                  <path
                    d="M 436 170 L 310 170"
                    fill="none"
                    stroke={simulationStep === 15 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 15 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 13: Guardrails Out to User */}
                  <path
                    d="M 250 170 L 205 170 M 135 170 L 80 170 L 80 270"
                    fill="none"
                    stroke={simulationStep === 15 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 15 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* ACTIVE PACKET SIMULATION PARTICLE */}
                  {isSimulating && (
                    <circle
                      r="7"
                      fill="#76b900"
                      filter="url(#glow-pulse)"
                      className="animate-ping"
                      cx={
                        simulationStep === 1 ? 95 :
                        simulationStep === 2 ? 460 :
                        simulationStep === 3 ? 460 :
                        simulationStep === 4 ? 970 :
                        simulationStep === 5 ? 970 :
                        simulationStep === 6 ? 170 :
                        simulationStep === 7 ? 280 :
                        simulationStep === 8 ? 460 :
                        simulationStep === 9 ? 670 :
                        simulationStep === 10 ? 970 :
                        simulationStep === 11 ? 970 :
                        simulationStep === 12 ? 810 :
                        simulationStep === 13 ? 670 :
                        simulationStep === 14 ? 460 :
                        simulationStep === 15 ? 280 : 95
                      }
                      cy={
                        simulationStep === 1 ? 545 :
                        simulationStep === 2 ? 485 :
                        simulationStep === 3 ? 605 :
                        simulationStep === 4 ? 545 :
                        simulationStep === 5 ? 300 :
                        simulationStep === 6 ? 300 :
                        simulationStep === 7 ? 300 :
                        simulationStep === 8 ? 300 :
                        simulationStep === 9 ? 300 :
                        simulationStep === 10 ? 300 :
                        simulationStep === 11 ? 170 :
                        simulationStep === 12 ? 60 :
                        simulationStep === 13 ? 170 :
                        simulationStep === 14 ? 170 :
                        simulationStep === 15 ? 170 : 545
                      }
                    />
                  )}

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
                      stroke={selectedNode === "user" ? "#38bdf8" : "#0284c7"}
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
                    <text x="35" y="16" textAnchor="middle" fill="#94a3b8" className="font-mono text-[10px] font-semibold">
                      ... Response
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

                  {/* 5. Vector Database Object Store cuVS */}
                  <g
                    transform="translate(880, 260)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("cuvs_store")}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="180"
                      height="85"
                      rx="12"
                      fill="#1e1003"
                      stroke={selectedNode === "cuvs_store" ? "#f97316" : "#ea580c"}
                      strokeWidth={selectedNode === "cuvs_store" ? "2.5" : "1.5"}
                      filter={selectedNode === "cuvs_store" ? "url(#glow-green)" : undefined}
                    />
                    <text x="90" y="18" textAnchor="middle" fill="#fdba74" className="font-mono text-[9px] font-bold uppercase tracking-wider">
                      Vector DB &amp; Object Store (cuVS)
                    </text>

                    {/* Left Box: Graph Vector */}
                    <rect x="18" y="27" width="66" height="46" rx="8" fill="#ea580c" fillOpacity="0.85" />
                    <circle cx="51" cy="40" r="3" fill="#fff" />
                    <circle cx="35" cy="60" r="3" fill="#fff" />
                    <circle cx="67" cy="60" r="3" fill="#fff" />
                    <line x1="51" y1="40" x2="35" y2="60" stroke="#fff" strokeWidth="1.5" />
                    <line x1="51" y1="40" x2="67" y2="60" stroke="#fff" strokeWidth="1.5" />
                    <line x1="35" y1="60" x2="67" y2="60" stroke="#fff" strokeWidth="1.5" />

                    {/* Right Box: Database Cylinders */}
                    <rect x="96" y="27" width="66" height="46" rx="8" fill="#c2410c" fillOpacity="0.85" />
                    <ellipse cx="129" cy="38" rx="17" ry="5" fill="#fed7aa" />
                    <ellipse cx="129" cy="49" rx="17" ry="5" fill="#fed7aa" />
                    <ellipse cx="129" cy="60" rx="17" ry="5" fill="#fed7aa" />
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
                    <path d="M 22 28 L 38 28 M 22 34 L 34 34 M 22 40 L 30 40" stroke="#76b900" strokeWidth="2.5" strokeLinecap="round" />
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

                  {/* 9. Domain LLM */}
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
                    stroke={simulationStep === 2 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 2 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />
                  <text x="330" y="472" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                    Pages as Images, Infographics, Charts, Tables
                  </text>

                  {/* Wire E2: Docs to Nemotron Parse */}
                  <path
                    d="M 145 565 L 230 605 L 430 605"
                    fill="none"
                    stroke={simulationStep === 3 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 3 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire E3: Extraction Models to Ingestion Embedding */}
                  <path
                    d="M 490 485 L 720 485 L 720 535 L 940 535"
                    fill="none"
                    stroke={simulationStep === 4 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 4 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />
                  <text x="605" y="475" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[9px] font-semibold">
                    -Text-
                  </text>

                  {/* Wire E4: Nemotron Parse to Ingestion Embedding */}
                  <path
                    d="M 490 605 L 740 605 L 740 555 L 940 555"
                    fill="none"
                    stroke={simulationStep === 4 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 4 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />
                  <text x="615" y="595" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[9px] font-semibold">
                    -Text and Metadata-
                  </text>

                  {/* Wire E5: Ingestion Embedding UP into cuVS Vector Store (DIRECT VERTICAL ASCENT) */}
                  <path
                    d="M 970 511 L 970 348"
                    fill="none"
                    stroke={simulationStep === 5 ? "#76b900" : "#22c55e"}
                    strokeWidth={simulationStep === 5 ? "3.5" : "2.5"}
                    markerEnd="url(#arrow-green)"
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
                <span>Current Stage: {simulationStep ? `Stage ${simulationStep}/15` : "Standby (Click Simulate to Start)"}</span>
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
                    className={`px-1.5 py-0.2 rounded text-[10px] font-bold shrink-0 ${
                      log.status === "SUCCESS"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : log.status === "EXEC"
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : log.status === "WARN"
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-slate-700/40 text-slate-300 border border-slate-700"
                    }`}
                  >
                    {log.step}
                  </span>
                  <span className="text-slate-300 flex-1">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Node Inspector Drawer */}
        <div className="2xl:col-span-4 flex flex-col space-y-4 w-full">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-lg">
            {/* Header & Category Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-[#76b900]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Node Inspector
                </span>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                {selected.category}
              </span>
            </div>

            {/* Inspector Navigation Tabs */}
            <div className="flex items-center space-x-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 mb-4 text-xs font-medium">
              <button
                onClick={() => setActiveInspectorTab("overview")}
                className={`flex items-center justify-center space-x-1 flex-1 py-1.5 rounded-lg transition ${
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
                className={`flex items-center justify-center space-x-1 flex-1 py-1.5 rounded-lg transition ${
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
                className={`flex items-center justify-center space-x-1 flex-1 py-1.5 rounded-lg transition ${
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
                      Execution Layer
                    </span>
                    <span className="font-mono text-[11px] font-bold text-cyan-600 dark:text-cyan-400 truncate block">
                      {selected.hardware}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Architecture Specification
                  </label>
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                    {selected.spec}
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: JSON Data Packet */}
            {activeInspectorTab === "telemetry" && (
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Sample Telemetry Data Packet
                </label>
                <pre className="p-3 rounded-xl bg-[#060b13] text-[#76b900] font-mono text-[10px] overflow-x-auto border border-slate-800/80 max-h-64 scrollbar-thin">
                  {JSON.stringify(selected.samplePayload, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* NVIDIA AI Enterprise Hardware Stack */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-4 shadow-sm text-xs">
            <h4 className="font-mono text-xs font-bold text-slate-900 dark:text-white uppercase mb-3 flex items-center space-x-2">
              <Zap className="h-3.5 w-3.5 text-[#76b900]" />
              <span>NVIDIA AI Enterprise Stack</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[9px]">INFERENCE</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">TensorRT-LLM</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[9px]">VECTOR INDEX</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">cuVS CAGRA</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[9px]">PRECISION</span>
                <span className="text-[#76b900] font-bold">FP8 / FP4</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block text-[9px]">GUARDRAIL LATENCY</span>
                <span className="text-emerald-500 font-bold">&lt; 2.0 ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
