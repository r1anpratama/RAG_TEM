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
  HelpCircle,
  FolderArchive,
  Terminal,
  Activity,
  Zap,
  Radio,
  FileCode2,
  ExternalLink,
  ChevronRight,
  ZoomIn,
  ZoomOut
} from "lucide-react";

interface NodeData {
  id: string;
  title: string;
  subtitle: string;
  tech: string;
  category: "Retrieval" | "Extraction" | "Storage" | "Reasoning" | "Guardrail" | "Entity";
  role: string;
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
  user: {
    id: "user",
    title: "Client Operator / User",
    subtitle: "Emergency Commander / SCADA Ingress",
    tech: "Secure WebSocket / TLS 1.3 REST API",
    category: "Entity",
    role: "Submits seismic emergency queries, triggers simulation scenarios, and inspects real-time physical damage estimates.",
    spec: "Session Auth Bearer Token, Client Ingress Validation",
    hardware: "Edge Device / Web Client",
    latencyTarget: "< 1.0 ms",
    samplePayload: {
      user_id: "NCU_DISASTER_CMD_01",
      query: "Assess M6.91 Shuanglienpo-Hukou cascading PGA & drift ratio for NCU Science Building 4",
      timestamp_utc: "2026-09-11T02:25:00Z"
    }
  },
  guardrails_in: {
    id: "guardrails_in",
    title: "NeMo Guardrails (Input)",
    subtitle: "Input Safety, Jailbreak & Topical Rail",
    tech: "NVIDIA NeMo Guardrails (Colang / Python Critic)",
    category: "Guardrail",
    role: "Validates incoming query for prompt injection, out-of-domain scope, and sensitive critical infrastructure safety guidelines.",
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
  cuvs_store: {
    id: "cuvs_store",
    title: "Vector Database & Object Store (cuVS)",
    subtitle: "GPU-Accelerated Vector Index & Document Chunks",
    tech: "NVIDIA cuVS CAGRA + MinIO / Parquet Storage",
    category: "Storage",
    role: "Houses indexed TEM PSHA 2025 embeddings, borehole stratigraphic logs, and fault alignment tables with microsecond ANN graph search.",
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
  reranking: {
    id: "reranking",
    title: "NeMo Retriever Reranking",
    subtitle: "Cross-Encoder Relevance Scoring",
    tech: "NVIDIA NeMo Retriever Reranking NIM",
    category: "Retrieval",
    role: "Scores retrieved chunk candidates against query with deep attention cross-encoder, filtering out irrelevant literature noise.",
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
  nemotron_super: {
    id: "nemotron_super",
    title: "Llama Nemotron Super 49B",
    subtitle: "Deliberative Multi-Agent Reasoning",
    tech: "NVIDIA Llama-3.1-Nemotron-70B / Super 49B (TensorRT-LLM)",
    category: "Reasoning",
    role: "Executes deep physics reasoning, solves multi-segment fault rupture mechanics, calculates building drift ratio (2.14%), and synthesizes emergency triage.",
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
  nemotron_nano: {
    id: "nemotron_nano",
    title: "Llama Nemotron Nano 8B v1 (Optional)",
    subtitle: "Low-Latency Reflex Summarizer",
    tech: "Llama-3.1-Nemotron-Nano-8B (FP4/FP8 TensorRT-LLM)",
    category: "Reasoning",
    role: "Lightweight sub-10ms model for immediate SCADA telemetry extraction and short warning bulletin generation before full 49B deliberation finishes.",
    spec: "Quantized FP8 / FP4 Engine, 8k window",
    hardware: "NVIDIA L40S / Jetson AGX Orin",
    latencyTarget: "< 25.0 ms",
    samplePayload: {
      quick_summary: "High hazard alert: Mw 6.91 near NCU. SCADA elevator and gas interlocks fired.",
      tokens_per_sec: 142.5
    }
  },
  llm_optional: {
    id: "llm_optional",
    title: "Domain LLM (Optional)",
    subtitle: "Specialized Geotechnical Auxiliary LLM",
    tech: "DeepSeek-R1-Distill / Qwen-2.5-Geotech",
    category: "Reasoning",
    role: "Secondary specialized foundation model for structural mechanics double-checking and code cross-validation.",
    spec: "OpenAI-compatible NIM Microservice",
    hardware: "NVIDIA Hopper GPU",
    latencyTarget: "< 300 ms",
    samplePayload: {
      status: "STANDBY_AUXILIARY",
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
    spec: "Output Rail Validator + Format Enforcement",
    hardware: "TensorRT-LLM",
    latencyTarget: "< 2.0 ms",
    samplePayload: {
      output_verified: true,
      citations_attached: 3,
      red_tag_approved: true
    }
  },
  docs: {
    id: "docs",
    title: "Multimodal Enterprise Documents",
    subtitle: "TEM PSHA 2025, Fault Catalogs, Boreholes",
    tech: "PDF / Excel / GeoJSON / Stratigraphic Boreholes",
    category: "Extraction",
    role: "Source corpus comprising TEM PSHA 2025 draft report, 38 on-land seismogenic structures, geological cross-sections, and NCREE borehole logs.",
    spec: "Multi-page technical reports containing vector maps and data tables",
    hardware: "Object Store / Local Storage",
    latencyTarget: "Offline / Batch",
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
    role: "Parses complex figures, hazard curves, fault alignment maps, and structural damage photographs into clean visual embeddings and tabular text.",
    spec: "High-resolution OCR + Table transformer layout preservation",
    hardware: "NVIDIA GPU Vision Pipeline",
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
    role: "Converts dense scientific PDF pages into semantic markdown, preserving heading hierarchies, footnote citations, and mathematical equations.",
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
    role: "Vectorizes extracted text chunks and rich metadata into high-dimensional vectors and streams them directly into the cuVS CAGRA index.",
    spec: "Batch Embedding Ingestion, 1024-dim, FP16",
    hardware: "NVIDIA CUDA Acceleration",
    latencyTarget: "~ 12 ms / batch",
    samplePayload: {
      chunks_embedded: 1248,
      target_index: "cuVS_CAGRA_TEM_2025",
      upsert_status: "SYNCHRONIZED"
    }
  }
};

const SIMULATION_PIPELINE_STEPS = [
  {
    step: 1,
    node: "user",
    title: "Step 1: User Query Ingress",
    log: "User initiates seismic hazard query for NCU Science Building 4 via secure WebSocket.",
    status: "INFO"
  },
  {
    step: 2,
    node: "guardrails_in",
    title: "Step 2: NeMo Guardrails Input Validation",
    log: "NeMo Guardrails passes query: Jailbreak score 0.00, topic matched to Taiwan seismology.",
    status: "SUCCESS"
  },
  {
    step: 3,
    node: "query_proc",
    title: "Step 3: Query Decomposition & Graph Matching",
    log: "Resolved target entities: Shuanglienpo Fault (ID #2) + Hukou Fault (ID #3) multi-rupture scenario.",
    status: "INFO"
  },
  {
    step: 4,
    node: "retriever_embed_query",
    title: "Step 4: NeMo Retriever Embedding",
    log: "Generated 1024-dim dense query embedding using NV-Embed-QA in 0.003 ms.",
    status: "EXEC"
  },
  {
    step: 5,
    node: "cuvs_store",
    title: "Step 5: cuVS CAGRA GPU Vector Search",
    log: "cuVS GPU index probed 1,248 vectors: 12 candidate chunks retrieved in 0.009 ms.",
    status: "SUCCESS"
  },
  {
    step: 6,
    node: "reranking",
    title: "Step 6: NeMo Retriever Cross-Encoder Reranking",
    log: "Cross-encoder re-ranked chunks -> Top-3 TEM PSHA 2025 literature chunks selected (Top Score: 0.942).",
    status: "EXEC"
  },
  {
    step: 7,
    node: "nemotron_super",
    title: "Step 7: Llama Nemotron Super 49B Deliberation",
    log: "Nemotron Super 49B calculated Lin & Lee GMPE: PGV=72.4 cm/s, Drift=2.14% (RED TAG evacuation).",
    status: "EXEC"
  },
  {
    step: 8,
    node: "reflection",
    title: "Step 8: Reflection Agent Critique Loop",
    log: "Safety Critic cross-checked parameters against Table 2 catalog: 0.0% Hallucination verified.",
    status: "SUCCESS"
  },
  {
    step: 9,
    node: "guardrails_out",
    title: "Step 9: NeMo Guardrails Output Certification",
    log: "Output safety filters verified: citations attached, emergency protocol confirmed.",
    status: "SUCCESS"
  },
  {
    step: 10,
    node: "user",
    title: "Step 10: Response Delivery to Client",
    log: "Response package transmitted to operator dashboard. End-to-end deliberative loop: 0.864s.",
    status: "INFO"
  }
];

export const RagArchitectureView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>("nemotron_super");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryLog[]>([
    {
      id: 1,
      time: "10:25:01.104",
      step: "SYSTEM_READY",
      status: "INFO",
      message: "NVIDIA NeMo Multimodal Agentic RAG pipeline initialized in FP8 mode."
    },
    {
      id: 2,
      time: "10:25:01.108",
      step: "CUVS_INIT",
      status: "SUCCESS",
      message: "cuVS CAGRA index loaded 1,248 document vectors into GPU memory."
    },
    {
      id: 3,
      time: "10:25:01.112",
      step: "GUARDRAIL_READY",
      status: "SUCCESS",
      message: "NeMo Guardrails active with zero-hallucination factual rail enforcement."
    }
  ]);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto scroll logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [telemetryLogs]);

  // Handle Simulation Loop
  const startSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(1);

    // Add initial start log
    const now = new Date();
    const timeStr = now.toTimeString().split(" ")[0] + "." + String(now.getMilliseconds()).padStart(3, "0");
    setTelemetryLogs((prev) => [
      ...prev,
      {
        id: Date.now(),
        time: timeStr,
        step: "SIM_START",
        status: "INFO",
        message: "▶ Initiated End-to-End Query & Retrieval Simulation packet."
      }
    ]);

    let stepIndex = 0;
    const intervalMs = 1200 / playbackSpeed;

    const runNextStep = () => {
      if (stepIndex < SIMULATION_PIPELINE_STEPS.length) {
        const currentData = SIMULATION_PIPELINE_STEPS[stepIndex];
        setSimulationStep(currentData.step);
        setSelectedNode(currentData.node);

        const stepTime = new Date();
        const stepTimeStr = stepTime.toTimeString().split(" ")[0] + "." + String(stepTime.getMilliseconds()).padStart(3, "0");

        setTelemetryLogs((prev) => [
          ...prev.slice(-25),
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
            step: "SIM_COMPLETE",
            status: "SUCCESS",
            message: "✔ End-to-End Simulation completed successfully. All guardrails passed."
          }
        ]);
      }
    };

    simulationTimerRef.current = setTimeout(runNextStep, 400);
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
    setSelectedNode("nemotron_super");
  };

  const selected = NODES_REGISTRY[selectedNode] || NODES_REGISTRY.nemotron_super;

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
                ENTERPRISE WORKFLOW
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interactive dual-pipeline workflow: Real-Time Retrieval (Top) &amp; Multimodal Document Ingestion (Bottom)
            </p>
          </div>
        </div>

        {/* Live Simulation & Canvas Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isSimulating ? (
            <button
              onClick={startSimulation}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-[#76b900] to-emerald-600 hover:from-[#6ca900] hover:to-emerald-500 text-slate-950 text-xs font-bold px-3.5 py-2 rounded-xl transition shadow-md shadow-[#76b900]/20 cursor-pointer"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Simulate End-to-End Flow</span>
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
            title="Reset Simulation State"
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
            title={isFullscreen ? "Exit Fullscreen Canvas" : "Expand to Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{isFullscreen ? "Exit" : "Expand"}</span>
          </button>
        </div>
      </div>

      {/* Main Interactive Stage: Full Width Layout utilizing all screen space */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-4 items-start w-full">
        {/* SVG Diagram Canvas (8 cols on 2xl, full width on xl and below) */}
        <div className="2xl:col-span-8 flex flex-col space-y-4 w-full">
          <div className="relative w-full rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#070d17] overflow-hidden shadow-xl p-3 sm:p-5">
            {/* Background High-Tech Dot Matrix */}
            <div 
              className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: "radial-gradient(#76b900 1.5px, transparent 1.5px)",
                backgroundSize: "28px 28px"
              }}
            />

            {/* SVG Architectural Canvas (viewBox: 1200 x 640 - spacious and collision-free) */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox="0 0 1200 640"
                className="w-full min-w-[900px] h-auto select-none"
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

                  <linearGradient id="grad-green-node" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#16291a" />
                    <stop offset="100%" stopColor="#0b170f" />
                  </linearGradient>

                  <linearGradient id="grad-yellow-node" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2c2208" />
                    <stop offset="100%" stopColor="#191304" />
                  </linearGradient>

                  <linearGradient id="grad-orange-node" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#2e1605" />
                    <stop offset="100%" stopColor="#1a0b02" />
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
                    RETRIEVAL PIPELINE
                  </text>

                  {/* SVG CONNECTING WIRES */}
                  {/* Wire 1: User to Guardrails In (through Query pill) */}
                  <path
                    d="M 110 245 L 150 245 L 235 245"
                    fill="none"
                    stroke={simulationStep === 1 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 1 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 2: Guardrails In to Query Processing */}
                  <path
                    d="M 295 245 L 410 245"
                    fill="none"
                    stroke={simulationStep === 2 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 2 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 3: Query Processing to Retriever Embedding */}
                  <path
                    d="M 470 245 L 610 245"
                    fill="none"
                    stroke={simulationStep === 3 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 3 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 4: Retriever Embedding to cuVS Store */}
                  <path
                    d="M 670 245 L 850 245"
                    fill="none"
                    stroke={simulationStep === 4 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 4 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 5: cuVS Store UP to Reranking (Clean vertical ascent) */}
                  <path
                    d="M 940 200 L 940 178"
                    fill="none"
                    stroke={simulationStep === 5 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 5 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 6: Reranking to Nemotron Super 49B (Solid Left) */}
                  <path
                    d="M 910 145 L 670 145"
                    fill="none"
                    stroke={simulationStep === 6 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 6 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 7: Reranking to Nemotron Nano 8B (Dashed Up & Left) */}
                  <path
                    d="M 940 110 L 940 50 L 815 50"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
                  />

                  {/* Wire 8: Nemotron Nano 8B to Nemotron Super 49B (Dashed Left & Down) */}
                  <path
                    d="M 745 50 L 640 50 L 640 110"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
                  />

                  {/* Wire 9: LLM Optional to Reflection (Dashed Vertical Down) */}
                  <path
                    d="M 440 85 L 440 115"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
                  />

                  {/* Wire 10: Nemotron Super 49B to Reflection */}
                  <path
                    d="M 610 145 L 470 145"
                    fill="none"
                    stroke={simulationStep === 7 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 7 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 11: Reflection to Query Processing (Bidirectional Loop) */}
                  <path
                    d="M 440 178 L 440 212"
                    fill="none"
                    stroke={simulationStep === 8 ? "#eab308" : "#64748b"}
                    strokeWidth={simulationStep === 8 ? "2.5" : "1.5"}
                    strokeDasharray="5,5"
                    markerEnd="url(#arrow-dashed)"
                    markerStart="url(#arrow-dashed)"
                  />

                  {/* Wire 12: Reflection to Guardrails Out */}
                  <path
                    d="M 410 145 L 295 145"
                    fill="none"
                    stroke={simulationStep === 9 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 9 ? "2.5" : "1.5"}
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire 13: Guardrails Out to User (through Response pill, down to User) */}
                  <path
                    d="M 235 145 L 140 145 L 80 145 L 80 215"
                    fill="none"
                    stroke={simulationStep === 10 ? "#76b900" : "#475569"}
                    strokeWidth={simulationStep === 10 ? "2.5" : "1.5"}
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
                        simulationStep === 1 ? 160 :
                        simulationStep === 2 ? 265 :
                        simulationStep === 3 ? 440 :
                        simulationStep === 4 ? 640 :
                        simulationStep === 5 ? 940 :
                        simulationStep === 6 ? 940 :
                        simulationStep === 7 ? 640 :
                        simulationStep === 8 ? 440 :
                        simulationStep === 9 ? 265 :
                        simulationStep === 10 ? 80 : 80
                      }
                      cy={
                        simulationStep === 1 ? 245 :
                        simulationStep === 2 ? 245 :
                        simulationStep === 3 ? 245 :
                        simulationStep === 4 ? 245 :
                        simulationStep === 5 ? 245 :
                        simulationStep === 6 ? 145 :
                        simulationStep === 7 ? 145 :
                        simulationStep === 8 ? 145 :
                        simulationStep === 9 ? 145 :
                        simulationStep === 10 ? 245 : 245
                      }
                    />
                  )}

                  {/* --- NODES IN RETRIEVAL SWIMLANE --- */}

                  {/* 1. USER NODE */}
                  <g
                    transform="translate(50, 215)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("user")}
                  >
                    <circle
                      cx="30"
                      cy="30"
                      r="28"
                      fill="url(#grad-user)"
                      stroke={selectedNode === "user" ? "#38bdf8" : "#0284c7"}
                      strokeWidth={selectedNode === "user" ? "3" : "1.5"}
                      filter={selectedNode === "user" ? "url(#glow-green)" : undefined}
                    />
                    <path
                      d="M 20 44 C 20 37, 40 37, 40 44 Z"
                      fill="#ffffff"
                    />
                    <circle cx="30" cy="24" r="7" fill="#ffffff" />
                    <text x="30" y="74" textAnchor="middle" fill="#f8fafc" className="text-[12px] font-bold">
                      User
                    </text>
                  </g>

                  {/* Query Pill */}
                  <g transform="translate(150, 233)">
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
                  <g transform="translate(145, 133)">
                    <rect
                      x="0"
                      y="0"
                      width="68"
                      height="24"
                      rx="12"
                      fill="#0f172a"
                      stroke="#334155"
                      strokeWidth="1"
                    />
                    <text x="34" y="16" textAnchor="middle" fill="#94a3b8" className="font-mono text-[10px] font-semibold">
                      ... Response
                    </text>
                  </g>

                  {/* 2. NeMo Guardrails (Input) */}
                  <g
                    transform="translate(235, 211)"
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
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      NeMo Guardrails
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                      Optional
                    </text>
                  </g>

                  {/* 3. Query Processing (Yellow) */}
                  <g
                    transform="translate(410, 211)"
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
                    transform="translate(610, 211)"
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

                  {/* 5. Vector Database Object Store cuVS (Spacious Clean Chassis) */}
                  <g
                    transform="translate(855, 205)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("cuvs_store")}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="170"
                      height="80"
                      rx="12"
                      fill="#1e1003"
                      stroke={selectedNode === "cuvs_store" ? "#f97316" : "#ea580c"}
                      strokeWidth={selectedNode === "cuvs_store" ? "2.5" : "1.5"}
                      filter={selectedNode === "cuvs_store" ? "url(#glow-green)" : undefined}
                    />
                    {/* Header Label inside chassis */}
                    <text x="85" y="16" textAnchor="middle" fill="#fdba74" className="font-mono text-[9px] font-bold uppercase tracking-wider">
                      Vector DB &amp; Object Store (cuVS)
                    </text>

                    {/* Left Box: Graph Vector */}
                    <rect x="15" y="24" width="62" height="46" rx="8" fill="#ea580c" fillOpacity="0.85" />
                    <circle cx="46" cy="36" r="3" fill="#fff" />
                    <circle cx="30" cy="56" r="3" fill="#fff" />
                    <circle cx="62" cy="56" r="3" fill="#fff" />
                    <line x1="46" y1="36" x2="30" y2="56" stroke="#fff" strokeWidth="1.5" />
                    <line x1="46" y1="36" x2="62" y2="56" stroke="#fff" strokeWidth="1.5" />
                    <line x1="30" y1="56" x2="62" y2="56" stroke="#fff" strokeWidth="1.5" />

                    {/* Right Box: Database Cylinders */}
                    <rect x="93" y="24" width="62" height="46" rx="8" fill="#c2410c" fillOpacity="0.85" />
                    <ellipse cx="124" cy="36" rx="16" ry="5" fill="#fed7aa" />
                    <ellipse cx="124" cy="47" rx="16" ry="5" fill="#fed7aa" />
                    <ellipse cx="124" cy="58" rx="16" ry="5" fill="#fed7aa" />
                  </g>

                  {/* 6. NeMo Retriever Reranking (Above cuVS) */}
                  <g
                    transform="translate(910, 111)"
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

                  {/* 7. Llama Nemotron Nano 8B v1 (Top Right Optional) */}
                  <g
                    transform="translate(750, 16)"
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
                    <text x="30" y="90" textAnchor="middle" fill="#94a3b8" className="text-[8px] font-medium">
                      Nano 8B v1 (Optional)
                    </text>
                  </g>

                  {/* 8. Llama Nemotron Super 49B (Core Deliberative Reasoning) */}
                  <g
                    transform="translate(610, 111)"
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

                  {/* 9. Domain LLM (Optional - Top Center, Clean single label) */}
                  <g
                    transform="translate(410, 16)"
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
                    <text x="30" y="38" textAnchor="middle" fill="#76b900" className="font-mono text-[11px] font-bold">
                      LLM
                    </text>
                    <text x="30" y="80" textAnchor="middle" fill="#f8fafc" className="text-[9px] font-bold">
                      LLM
                    </text>
                    <text x="30" y="90" textAnchor="middle" fill="#94a3b8" className="text-[8px] font-medium">
                      Optional
                    </text>
                  </g>

                  {/* 10. Reflection Agent (Yellow Document) */}
                  <g
                    transform="translate(410, 111)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("reflection")}
                  >
                    <rect
                      x="8"
                      y="4"
                      width="44"
                      height="58"
                      rx="6"
                      fill="#261b05"
                      stroke={selectedNode === "reflection" ? "#facc15" : "#eab308"}
                      strokeWidth={selectedNode === "reflection" ? "2.5" : "1.5"}
                      filter={selectedNode === "reflection" ? "url(#glow-green)" : undefined}
                    />
                    <path d="M 18 16 L 36 16 M 18 24 L 32 24" stroke="#facc15" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="34" cy="42" r="8" fill="#eab308" opacity="0.9" />
                    <circle cx="34" cy="42" r="3" fill="#18181b" />
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      Reflection
                    </text>
                  </g>

                  {/* 11. NeMo Guardrails (Output) */}
                  <g
                    transform="translate(235, 111)"
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
                    <text x="30" y="82" textAnchor="middle" fill="#f8fafc" className="text-[10px] font-bold">
                      NeMo Guardrails
                    </text>
                    <text x="30" y="94" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                      Optional
                    </text>
                  </g>
                </g>

                {/* ========================================================================= */}
                {/* 2. PIPELINE DIVIDER (Generously Spaced Dashed Horizontal Line) */}
                {/* ========================================================================= */}
                <g id="pipeline-divider">
                  <line
                    x1="20"
                    y1="350"
                    x2="1180"
                    y2="350"
                    stroke="#475569"
                    strokeWidth="1.5"
                    strokeDasharray="6,6"
                  />
                  <text
                    x="24"
                    y="375"
                    fill="#94a3b8"
                    className="font-mono text-[11px] font-bold tracking-widest uppercase"
                  >
                    EXTRACTION PIPELINE
                  </text>
                </g>

                {/* ========================================================================= */}
                {/* 3. EXTRACTION PIPELINE (BOTTOM SWIMLANE) */}
                {/* ========================================================================= */}
                <g id="extraction-swimlane">
                  {/* Wire E1: Docs to Extraction Models (Top Branch) */}
                  <path
                    d="M 160 485 L 230 430 L 410 430"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.5"
                    markerEnd="url(#arrow-solid)"
                  />
                  {/* Clean Label placed above horizontal path without touching node */}
                  <text x="320" y="418" textAnchor="middle" fill="#94a3b8" className="text-[9px] font-medium">
                    Pages as Images, Infographics, Charts, Tables
                  </text>

                  {/* Wire E2: Docs to Nemotron Parse (Bottom Branch) */}
                  <path
                    d="M 160 535 L 230 555 L 410 555"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.5"
                    markerEnd="url(#arrow-solid)"
                  />

                  {/* Wire E3: Extraction Models to Ingestion Embedding */}
                  <path
                    d="M 470 430 L 680 430 L 680 515 L 910 515"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.5"
                    markerEnd="url(#arrow-solid)"
                  />
                  <text x="575" y="420" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[9px] font-semibold">
                    -Text-
                  </text>

                  {/* Wire E4: Nemotron Parse to Ingestion Embedding */}
                  <path
                    d="M 470 555 L 720 555 L 910 530"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="1.5"
                    markerEnd="url(#arrow-solid)"
                  />
                  <text x="595" y="546" textAnchor="middle" fill="#cbd5e1" className="font-mono text-[9px] font-semibold">
                    -Text and Metadata-
                  </text>

                  {/* Wire E5: Ingestion Embedding UP into cuVS Vector Store (DIRECT VERTICAL ASCENT) */}
                  <path
                    d="M 940 485 L 940 290"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2.5"
                    markerEnd="url(#arrow-green)"
                  />
                  {/* Label on the right of the vertical line with plenty of clearance */}
                  <text x="955" y="390" fill="#86efac" className="font-mono text-[10px] font-bold">
                    Into cuVS
                  </text>

                  {/* 1. Multimodal Enterprise Documents (Orange Card) */}
                  <g
                    transform="translate(65, 470)"
                    className="cursor-pointer"
                    onClick={() => setSelectedNode("docs")}
                  >
                    <rect
                      x="0"
                      y="0"
                      width="95"
                      height="80"
                      rx="12"
                      fill="#2e1605"
                      stroke={selectedNode === "docs" ? "#f97316" : "#ea580c"}
                      strokeWidth={selectedNode === "docs" ? "2.5" : "1.5"}
                      filter={selectedNode === "docs" ? "url(#glow-green)" : undefined}
                    />
                    <rect x="30" y="16" width="35" height="40" rx="6" fill="#ea580c" />
                    <circle cx="41" cy="28" r="3.5" fill="#fff" />
                    <path d="M 34 46 L 44 36 L 54 46 Z" fill="#fed7aa" />
                    <text x="47" y="70" textAnchor="middle" fill="#fdba74" className="font-mono text-[8px] font-bold uppercase">
                      TEM PSHA 2025
                    </text>
                    <text x="47" y="98" textAnchor="middle" fill="#f8fafc" className="text-[11px] font-bold">
                      Multimodal
                    </text>
                    <text x="47" y="112" textAnchor="middle" fill="#94a3b8" className="text-[10px] font-medium">
                      Enterprise Docs
                    </text>
                  </g>

                  {/* 2. NeMo Retriever Extraction Models */}
                  <g
                    transform="translate(410, 396)"
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
                    transform="translate(410, 521)"
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
                    transform="translate(910, 486)"
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

          {/* Real-Time Telemetry Log Stream (Professional Live Console) */}
          <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-[#080e1a] text-slate-200 shadow-md overflow-hidden w-full">
            <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1726] border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="h-4 w-4 text-[#76b900]" />
                <span className="font-mono text-xs font-bold text-white tracking-wide">
                  SYSTEM TELEMETRY STREAM &amp; TRACE LOGS
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400">
                <span>Active Step: {simulationStep ? `Step ${simulationStep}/10` : "Idle (Standby)"}</span>
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

        {/* Right Node Inspector Drawer (4 cols on 2xl, full width stacked on smaller screens) */}
        <div className="2xl:col-span-4 flex flex-col space-y-4 w-full">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-[#76b900]" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  NVIDIA Node Inspector
                </span>
              </div>
              <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300">
                {selected.category}
              </span>
            </div>

            {/* Node Title & Subtitle */}
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {selected.title}
              </h3>
              <p className="text-xs font-mono text-[#76b900] font-semibold">
                {selected.tech}
              </p>
            </div>

            {/* Role in Prototype */}
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Role in Prototype
                </label>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selected.role}
                </div>
              </div>

              {/* Hardware Acceleration & Latency */}
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

              {/* Architectural Spec */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Architecture Specification
                </label>
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                  {selected.spec}
                </div>
              </div>

              {/* Sample Telemetry JSON Packet */}
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Sample Telemetry Data Packet
                </label>
                <pre className="p-3 rounded-xl bg-[#060b13] text-[#76b900] font-mono text-[10px] overflow-x-auto border border-slate-800/80 max-h-48 scrollbar-thin">
                  {JSON.stringify(selected.samplePayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>

          {/* NVIDIA Hardware Acceleration Badge Card */}
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
