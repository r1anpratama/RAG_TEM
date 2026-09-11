"use client";

import React, { useState } from "react";
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
  RotateCcw,
  ArrowRight,
  Maximize2,
  HelpCircle,
  FolderArchive,
  Image as ImageIcon
} from "lucide-react";

export const RagArchitectureView: React.FC = () => {
  const [selectedNode, setSelectedNode] = useState<string>("nemotron_super");
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStep, setSimulationStep] = useState<number>(0);

  const triggerSimulation = () => {
    setIsSimulating(true);
    setSimulationStep(1);
    const steps = [
      "user",
      "guardrails_in",
      "query_proc",
      "retriever_embed_query",
      "cuvs_store",
      "reranking",
      "nemotron_super",
      "reflection",
      "guardrails_out",
      "user_response"
    ];
    
    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setSimulationStep(current + 1);
        setSelectedNode(steps[current]);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsSimulating(false);
          setSimulationStep(0);
        }, 1500);
      }
    }, 900);
  };

  const nodesInfo: { 
    [key: string]: { 
      title: string; 
      layer: string;
      tech: string;
      role: string; 
      spec: string;
      payload: string;
    } 
  } = {
    user: {
      title: "User / Emergency Triage Officer",
      layer: "Client Interface",
      tech: "Next.js 15 + React 19 Frontend",
      role: "Submits seismic triage queries, scenario parameters (e.g. Mw 6.91 Shuanglienpo rupture), or structural safety inquiries for critical infrastructure.",
      spec: "Web client / REST & SSE Stream",
      payload: '{\n  "query": "Evaluate Shuanglienpo Mw 6.91 cascading rupture and NCU Science B4 drift",\n  "timestamp": "2026-09-11T10:04:00Z"\n}',
    },
    guardrails_in: {
      title: "NeMo Guardrails (Input Validation)",
      layer: "Retrieval Pipeline",
      tech: "NVIDIA NeMo Guardrails (Colang 2.0 / Self-Check Rails)",
      role: "Filters prompt injection, enforces domain grounding strictly to Taiwan seismotectonics, and ensures query safety compliance before LLM execution.",
      spec: "Input Safety & Jailbreak Defense (< 2ms latency)",
      payload: '{\n  "allowed": true,\n  "topic": "Taiwan_Geotechnical_PSHA",\n  "sanitized_query": "Evaluate Shuanglienpo Mw 6.91 cascading rupture..."\n}',
    },
    query_proc: {
      title: "Query Processing & Entity Parsing",
      layer: "Retrieval Pipeline",
      tech: "NeMo Query Decomposition & HyDE Generator",
      role: "Extracts seismogenic fault IDs (#2 Shuanglienpo), spatial target coordinates (NCU B4: 24.968, 121.192), and generates hypothetical embeddings.",
      spec: "Bidirectional loop with Reflection Agent for iterative refinement",
      payload: '{\n  "fault_entities": ["Shuanglienpo (#2)", "Hukou (#3)"],\n  "target_asset": "NCU_SCIENCE_B4",\n  "regime": "Crustal_Reverse"\n}',
    },
    retriever_embed_query: {
      title: "NeMo Retriever Embedding (Query)",
      layer: "Retrieval Pipeline",
      tech: "NVIDIA nv-embed-v2 / NeMo Retriever Microservice",
      role: "Encodes the parsed geotechnical question into a dense 4096-dimensional vector representation optimized for cross-domain scientific retrieval.",
      spec: "Dense 4096-dim TensorRT-LLM FP8 Inference",
      payload: '{\n  "embedding_dim": 4096,\n  "token_count": 18,\n  "model": "nvidia/nv-embed-v2"\n}',
    },
    cuvs_store: {
      title: "Vector Database & Object Store (cuVS)",
      layer: "Accelerated Storage Layer",
      tech: "NVIDIA cuVS (CAGRA / IVF-PQ GPU ANN) + S3 Object Storage",
      role: "Performs million-scale nearest-neighbor vector similarity search with microsecond latency over TEM PSHA 2025 fault graphs and borehole datasets.",
      spec: "GPU-accelerated vector index (cuVS) with high recall (>99%)",
      payload: '{\n  "indexed_nodes": 45,\n  "attributed_edges": 78,\n  "vector_search_latency_ms": 1.4,\n  "top_k_retrieved": 5\n}',
    },
    reranking: {
      title: "NeMo Retriever Reranking",
      layer: "Retrieval Pipeline",
      tech: "NVIDIA NeMo Retriever Reranking (Cross-Encoder / Nemotron-4B)",
      role: "Re-scores retrieved candidate chunks from TEM PSHA 2025 Table 2, ensuring multi-fault rupture interaction context ranks highest before reasoning.",
      spec: "Cross-Attentive Reranking Score >= 0.88 Threshold",
      payload: '{\n  "ranked_documents": [\n    {"doc_id": "TEM_PSHA_2025_TAB2", "score": 0.962},\n    {"doc_id": "LIN_LEE_2008_CRUSTAL_GMPE", "score": 0.914}\n  ]\n}',
    },
    nemotron_super: {
      title: "Llama Nemotron Super 49B",
      layer: "Retrieval Pipeline (Core Reasoning)",
      tech: "NVIDIA Llama-3.1-Nemotron-70B / Super 49B (TensorRT-LLM)",
      role: "Executes multi-agent deliberative reasoning, calculates structural inter-story drift ratio (2.14%), and synthesizes physics-grounded emergency triage directives.",
      spec: "FP8 TensorRT-LLM Acceleration on NVIDIA GPU",
      payload: '{\n  "reasoning_track": "Track B Deliberative",\n  "predicted_pgv": 72.4,\n  "drift_ratio_pct": 2.14,\n  "triage_recommendation": "IMMEDIATE EVACUATION (RED)"\n}',
    },
    nemotron_nano: {
      title: "Llama Nemotron Nano 8B v1 (Optional)",
      layer: "Speculative & Auxiliary Worker",
      tech: "NVIDIA Nemotron-Mini-4B / Nano-8B",
      role: "Assists with speculative decoding speedup, JSON schema sanitization, and lightweight sub-task parallelization.",
      spec: "Ultra-low latency edge/auxiliary inference",
      payload: '{\n  "role": "Speculative Draft & JSON Validator",\n  "throughput_tokens_per_sec": 140\n}',
    },
    reflection: {
      title: "Reflection & Physics GMPE Verifier",
      layer: "Retrieval Pipeline",
      tech: "Autonomous Agentic Reflection Loop",
      role: "Critiques candidate triage outputs against Lin & Lee (2008) theoretical attenuation curves within +/- 2.5 sigma bounds. Triggers re-query if violated.",
      spec: "Zero-Hallucination Physics Grounding Enforcement",
      payload: '{\n  "physics_check": "PASSED",\n  "observed_pgv": 72.4,\n  "gmpe_median": 76.1,\n  "z_score": -0.12,\n  "within_2_5_sigma": true\n}',
    },
    llm_optional: {
      title: "LLM (Optional Second Opinion)",
      layer: "Advisory Verifier",
      tech: "Ensemble LLM / Domain Foundation Model",
      role: "Provides independent cross-validation for complex cascading ruptures (e.g. Shuanglienpo ID 2 triggering Hukou ID 3).",
      spec: "Consensus evaluation for high-stakes municipal decisions",
      payload: '{\n  "consensus_agreement": 0.98,\n  "fault_cascade_valid": true\n}',
    },
    guardrails_out: {
      title: "NeMo Guardrails (Output Verification)",
      layer: "Retrieval Pipeline (Egress)",
      tech: "NVIDIA NeMo Guardrails (Self-Check Output Rails)",
      role: "Final safety rail ensuring responses contain exact citations to TEM PSHA 2025 and contain zero fabricated statistics before user transmission.",
      spec: "Fact-checking against retrieved source tokens (0.0% Hallucination)",
      payload: '{\n  "fact_check_score": 1.0,\n  "citations_verified": ["TEM PSHA 2025 Table 2", "Lin & Lee 2008"],\n  "output_approved": true\n}',
    },
    multimodal_docs: {
      title: "Multimodal Enterprise Documents",
      layer: "Extraction Pipeline (Ingestion)",
      tech: "Raw Data Catalogs & Seismic Blueprints",
      role: "Taiwan active fault catalogs, TEM PSHA 2025 PDF reports, CWA seismic waveform records, and university building engineering schematics.",
      spec: "Multi-format ingest: PDF, TIFF, GeoJSON, Excel, SEG-Y",
      payload: '{\n  "ingested_sources": [\n    "TEM_PSHA_2025_Report.pdf",\n    "Taiwan_38_Active_Faults.xlsx",\n    "NCU_Building_Blueprints.dwg"\n  ]\n}',
    },
    extraction_models: {
      title: "NeMo Retriever Extraction Models",
      layer: "Extraction Pipeline",
      tech: "NVIDIA NeMo Visual Language Models (VLM) for Extraction",
      role: "Extracts diagrams, fault strike/dip infographics, geological cross-sections, and seismic hazard contour maps directly from scanned page images.",
      spec: "Multimodal visual reasoning for tabular & chart data",
      payload: '{\n  "visual_elements_extracted": 38,\n  "chart_types": ["Hazard Curve", "Cross Section", "Fault Map"]\n}',
    },
    nemotron_parse: {
      title: "Nemotron Parse",
      layer: "Extraction Pipeline",
      tech: "NVIDIA Nemotron-Parse (Specialized Document Parser)",
      role: "High-accuracy layout analysis converting complex scientific tables (e.g. Table 2 multi-rupture probabilities) into structured Markdown and JSON.",
      spec: "Document Layout Decomposition & Table Extraction",
      payload: '{\n  "tables_parsed": 12,\n  "accuracy_rate": 0.994,\n  "output_format": "structured_markdown_with_tables"\n}',
    },
    retriever_embed_doc: {
      title: "NeMo Retriever Embedding (Document)",
      layer: "Extraction Pipeline",
      tech: "NVIDIA nv-embed-v2 (GPU Batch Pipeline)",
      role: "Transforms extracted texts, tables, and visual descriptions into dense semantic vectors and uploads them directly into the cuVS index.",
      spec: "Batch throughput > 10,000 chunks/min on NVIDIA GPU",
      payload: '{\n  "total_chunks_indexed": 348,\n  "embedding_target": "cuVS_vector_db",\n  "storage_status": "COMMITTED"\n}',
    },
  };

  const selected = nodesInfo[selectedNode] || nodesInfo["nemotron_super"];

  // Render an NVIDIA Green Cube Network Node Icon
  const NvidiaNodeIcon = ({ active }: { active?: boolean }) => (
    <div className={`relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
      active 
        ? "bg-[#76b900]/25 text-[#76b900] ring-2 ring-[#76b900] shadow-[0_0_15px_rgba(118,185,0,0.5)]" 
        : "bg-[#76b900]/15 text-[#76b900] dark:bg-[#76b900]/10 border border-[#76b900]/30 hover:border-[#76b900] hover:bg-[#76b900]/20"
    }`}>
      {/* NVIDIA Iconic Hex-Cube shape */}
      <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    </div>
  );

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-5 shadow-sm dark:shadow-md gap-4 transition-colors duration-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="rounded bg-[#76b900]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#76b900] border border-[#76b900]/30 uppercase tracking-wider">
              NVIDIA NeMo Reference Architecture
            </span>
            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
              NCU E-DREaM Lab × NVAITC
            </span>
          </div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
            Multimodal Agentic RAG Workflow Architecture
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Enterprise seismic hazard intelligence powered by NeMo Retriever, Nemotron Parse, cuVS Vector Store, and Llama Nemotron reasoning.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={triggerSimulation}
            disabled={isSimulating}
            className="flex items-center space-x-1.5 rounded-xl bg-[#76b900] hover:bg-[#68a400] text-slate-950 font-bold px-3.5 py-2 text-xs transition shadow-md shadow-[#76b900]/20 disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{isSimulating ? `Tracing Step ${simulationStep}/10...` : "Simulate RAG Flow"}</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Workflow Diagram Canvas */}
        <div className="xl:col-span-8 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b0f19] p-5 shadow-sm dark:shadow-xl overflow-x-auto relative">
          {/* Simulation status pill */}
          {isSimulating && (
            <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 bg-slate-900/90 text-[#76b900] border border-[#76b900]/40 px-3 py-1 rounded-full text-[11px] font-mono shadow-lg animate-pulse">
              <span className="h-2 w-2 rounded-full bg-[#76b900] animate-ping"></span>
              <span>Active Signal: {selected.title}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SECTION 1: RETRIEVAL PIPELINE (TOP SWIMLANE) */}
          {/* ========================================================================= */}
          <div className="mb-8 relative">
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 font-mono">
                Retrieval Pipeline
              </span>
              <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800"></span>
            </div>

            {/* Diagram Row 1 (Top Level: User -> Guardrails -> Query Processing -> Embedding -> cuVS) */}
            <div className="flex items-center justify-between min-w-[760px] relative py-4">
              {/* User Node */}
              <div 
                onClick={() => setSelectedNode("user")}
                className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "user" ? "scale-105" : ""}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                  selectedNode === "user"
                    ? "bg-blue-600 text-white ring-4 ring-blue-500/30 shadow-lg shadow-blue-500/30"
                    : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-2 border-blue-500/40 hover:bg-blue-500/25"
                }`}>
                  <User className="h-6 w-6" />
                </div>
                <span className="mt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  User
                </span>
              </div>

              {/* Connecting badge: Query Arrow Right */}
              <div className="flex flex-col items-center px-1">
                <span className="flex items-center space-x-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[9px] font-mono text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-blue-500">&gt;_</span>
                  <span>Query</span>
                </span>
                <div className="w-12 h-0.5 bg-slate-300 dark:bg-slate-700 relative my-1">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-slate-400 dark:border-l-slate-600"></div>
                </div>
              </div>

              {/* NeMo Guardrails (Input) */}
              <div 
                onClick={() => setSelectedNode("guardrails_in")}
                className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "guardrails_in" ? "scale-105" : ""}`}
              >
                <NvidiaNodeIcon active={selectedNode === "guardrails_in"} />
                <span className="mt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  NeMo Guardrails
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                  Optional
                </span>
              </div>

              {/* Arrow */}
              <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-slate-400 dark:border-l-slate-600"></div>
              </div>

              {/* Query Processing */}
              <div 
                onClick={() => setSelectedNode("query_proc")}
                className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "query_proc" ? "scale-105" : ""}`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                  selectedNode === "query_proc"
                    ? "bg-amber-500 text-white ring-4 ring-amber-500/30 shadow-lg shadow-amber-500/30"
                    : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/25"
                }`}>
                  <Settings className="h-5 w-5 animate-spin-slow" />
                </div>
                <span className="mt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Query
                </span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  Processing
                </span>
              </div>

              {/* Arrow */}
              <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-slate-400 dark:border-l-slate-600"></div>
              </div>

              {/* NeMo Retriever Embedding (Query) */}
              <div 
                onClick={() => setSelectedNode("retriever_embed_query")}
                className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "retriever_embed_query" ? "scale-105" : ""}`}
              >
                <NvidiaNodeIcon active={selectedNode === "retriever_embed_query"} />
                <span className="mt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  NeMo Retriever
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  Embedding
                </span>
              </div>

              {/* Arrow */}
              <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-slate-400 dark:border-l-slate-600"></div>
              </div>

              {/* Vector Database & Object Store (cuVS) */}
              <div 
                onClick={() => setSelectedNode("cuvs_store")}
                className={`cursor-pointer flex flex-col items-center p-2.5 rounded-xl border transition-all ${
                  selectedNode === "cuvs_store"
                    ? "border-orange-500 bg-orange-500/15 ring-2 ring-orange-500/40 shadow-lg shadow-orange-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-orange-500/50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40">
                    <Database className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col items-center p-1.5 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40">
                    <HardDrive className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-1.5 text-center">
                  <span className="block text-[10px] font-bold text-slate-900 dark:text-white leading-tight">
                    Vector Database Object Store
                  </span>
                  <span className="text-[9px] font-mono font-black text-orange-600 dark:text-orange-400 uppercase tracking-wide">
                    cuVS
                  </span>
                </div>
              </div>
            </div>

            {/* Diagram Row 2 (Upper Feedback & Reasoning Loop: Reranking -> Nemotron Super / Nano -> Reflection -> Output Guardrails -> User Response) */}
            <div className="flex items-center justify-between min-w-[760px] relative mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              {/* Left return: Response arriving back to User */}
              <div className="flex items-center space-x-2 pl-4">
                <span className="flex items-center space-x-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 text-[9px] font-mono text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-emerald-500">&bull;&bull;&bull;</span>
                  <span>Response</span>
                </span>
                <div className="w-10 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-r-[5px] border-r-slate-400 dark:border-r-slate-600"></div>
                </div>
              </div>

              {/* NeMo Guardrails (Output) */}
              <div 
                onClick={() => setSelectedNode("guardrails_out")}
                className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "guardrails_out" ? "scale-105" : ""}`}
              >
                <NvidiaNodeIcon active={selectedNode === "guardrails_out"} />
                <span className="mt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                  NeMo Guardrails
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                  Optional
                </span>
              </div>

              {/* Arrow left from Reflection to Guardrails */}
              <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-r-[5px] border-r-slate-400 dark:border-r-slate-600"></div>
              </div>

              {/* Reflection & Optional LLM Node */}
              <div className="flex flex-col items-center">
                {/* Optional LLM above Reflection */}
                <div 
                  onClick={() => setSelectedNode("llm_optional")}
                  className={`cursor-pointer flex flex-col items-center mb-2 group transition-transform ${selectedNode === "llm_optional" ? "scale-105" : ""}`}
                >
                  <NvidiaNodeIcon active={selectedNode === "llm_optional"} />
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                    LLM
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    Optional
                  </span>
                  <div className="w-0.5 h-3 border-l-2 border-dashed border-slate-400 dark:border-slate-600 mt-1"></div>
                </div>

                {/* Reflection Node */}
                <div 
                  onClick={() => setSelectedNode("reflection")}
                  className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "reflection" ? "scale-105" : ""}`}
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                    selectedNode === "reflection"
                      ? "bg-amber-500 text-white ring-4 ring-amber-500/30 shadow-lg shadow-amber-500/30"
                      : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/40 hover:bg-amber-500/25"
                  }`}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <span className="mt-1 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    Reflection
                  </span>
                </div>
              </div>

              {/* Arrow left from Nemotron Super 49B to Reflection */}
              <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-r-[5px] border-r-slate-400 dark:border-r-slate-600"></div>
              </div>

              {/* Llama Nemotron Super 49B + Nano 8B Box */}
              <div className="flex flex-col items-center">
                {/* Llama Nemotron Nano 8B v1 (Optional) */}
                <div 
                  onClick={() => setSelectedNode("nemotron_nano")}
                  className={`cursor-pointer flex flex-col items-center mb-2 group transition-transform ${selectedNode === "nemotron_nano" ? "scale-105" : ""}`}
                >
                  <NvidiaNodeIcon active={selectedNode === "nemotron_nano"} />
                  <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 text-center">
                    Llama Nemotron Nano 8B v1
                  </span>
                  <span className="text-[8px] text-slate-400 font-mono">
                    Optional
                  </span>
                  <div className="w-0.5 h-3 border-l-2 border-dashed border-slate-400 dark:border-slate-600 mt-1"></div>
                </div>

                {/* Llama Nemotron Super 49B */}
                <div 
                  onClick={() => setSelectedNode("nemotron_super")}
                  className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "nemotron_super" ? "scale-105" : ""}`}
                >
                  <NvidiaNodeIcon active={selectedNode === "nemotron_super"} />
                  <span className="mt-1 text-[11px] font-bold text-slate-800 dark:text-slate-200 text-center">
                    Llama Nemotron
                  </span>
                  <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                    Super 49B
                  </span>
                </div>
              </div>

              {/* Arrow left from Reranking to Super 49B */}
              <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-r-[5px] border-r-slate-400 dark:border-r-slate-600"></div>
              </div>

              {/* NeMo Retriever Reranking */}
              <div 
                onClick={() => setSelectedNode("reranking")}
                className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "reranking" ? "scale-105" : ""}`}
              >
                <NvidiaNodeIcon active={selectedNode === "reranking"} />
                <span className="mt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 text-center">
                  NeMo Retriever
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  Reranking
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* DASHED HORIZONTAL PIPELINE DIVIDER */}
          {/* ========================================================================= */}
          <div className="relative my-6">
            <div className="border-t-2 border-dashed border-slate-300 dark:border-slate-700 w-full"></div>
            <div className="absolute -top-3 left-0 bg-white dark:bg-[#0b0f19] pr-3 text-[10px] font-mono uppercase font-bold text-slate-400 dark:text-slate-400">
              Extraction Pipeline
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SECTION 2: EXTRACTION PIPELINE (BOTTOM SWIMLANE) */}
          {/* ========================================================================= */}
          <div className="pt-2 min-w-[760px]">
            <div className="flex items-center justify-between py-4">
              {/* Multimodal Enterprise Documents */}
              <div 
                onClick={() => setSelectedNode("multimodal_docs")}
                className={`cursor-pointer flex flex-col items-center p-3 rounded-xl border transition-all ${
                  selectedNode === "multimodal_docs"
                    ? "border-orange-500 bg-orange-500/15 ring-2 ring-orange-500/40 shadow-lg shadow-orange-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-orange-500/50"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/40">
                  <FolderArchive className="h-5 w-5" />
                </div>
                <span className="mt-1.5 text-[11px] font-bold text-slate-900 dark:text-white text-center max-w-[120px] leading-tight">
                  Multimodal Enterprise Documents
                </span>
              </div>

              {/* Branch Arrows leading out to Extraction Models and Nemotron Parse */}
              <div className="flex flex-col space-y-6">
                {/* Branch 1 label */}
                <div className="flex items-center space-x-2">
                  <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 max-w-[110px] text-right leading-tight">
                    Pages as Images, Infographics, Charts, Tables
                  </span>
                  <div className="w-8 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-slate-400 dark:border-l-slate-600"></div>
                  </div>
                </div>

                {/* Branch 2 line */}
                <div className="flex items-center justify-end space-x-2">
                  <div className="w-16 h-0.5 bg-slate-300 dark:bg-slate-700 relative">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px] border-l-slate-400 dark:border-l-slate-600"></div>
                  </div>
                </div>
              </div>

              {/* Center Extraction Processing Nodes */}
              <div className="flex flex-col space-y-5">
                {/* NeMo Retriever Extraction Models */}
                <div 
                  onClick={() => setSelectedNode("extraction_models")}
                  className={`cursor-pointer flex items-center space-x-3 p-2.5 rounded-xl border transition-all ${
                    selectedNode === "extraction_models"
                      ? "border-[#76b900] bg-[#76b900]/15 ring-2 ring-[#76b900]/40"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] hover:border-[#76b900]/50"
                  }`}
                >
                  <NvidiaNodeIcon active={selectedNode === "extraction_models"} />
                  <div>
                    <span className="block text-[11px] font-bold text-slate-900 dark:text-white">
                      NeMo Retriever
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Extraction Models
                    </span>
                  </div>
                </div>

                {/* Nemotron Parse */}
                <div 
                  onClick={() => setSelectedNode("nemotron_parse")}
                  className={`cursor-pointer flex items-center space-x-3 p-2.5 rounded-xl border transition-all ${
                    selectedNode === "nemotron_parse"
                      ? "border-[#76b900] bg-[#76b900]/15 ring-2 ring-[#76b900]/40"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] hover:border-[#76b900]/50"
                  }`}
                >
                  <NvidiaNodeIcon active={selectedNode === "nemotron_parse"} />
                  <div>
                    <span className="block text-[11px] font-bold text-slate-900 dark:text-white">
                      Nemotron Parse
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                      Document Parser
                    </span>
                  </div>
                </div>
              </div>

              {/* Transition labels */}
              <div className="flex flex-col space-y-8">
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Text
                </span>
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Text and Metadata
                </span>
              </div>

              {/* NeMo Retriever Embedding (Document) */}
              <div 
                onClick={() => setSelectedNode("retriever_embed_doc")}
                className={`cursor-pointer flex flex-col items-center group transition-transform ${selectedNode === "retriever_embed_doc" ? "scale-105" : ""}`}
              >
                <NvidiaNodeIcon active={selectedNode === "retriever_embed_doc"} />
                <span className="mt-1.5 text-[11px] font-bold text-slate-800 dark:text-slate-200 text-center">
                  NeMo Retriever
                </span>
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  Embedding
                </span>
              </div>

              {/* Upward Line pointing up into cuVS */}
              <div className="flex flex-col items-center justify-center pr-8">
                <div className="h-14 border-r-2 border-slate-300 dark:border-slate-700 relative">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-slate-400 dark:border-b-slate-600"></div>
                </div>
                <span className="text-[9px] font-mono text-[#76b900] font-bold mt-1">
                  Into cuVS
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Node Specification Inspector & Telemetry */}
        <div className="xl:col-span-4 flex flex-col space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-5 shadow-sm dark:shadow-md transition-colors duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <span className="text-[11px] font-mono font-bold text-[#76b900] uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>NVIDIA Node Inspector</span>
              </span>
              <span className="rounded bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                {selected.layer}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              {selected.title}
            </h3>
            <p className="text-xs font-mono text-[#76b900] font-semibold mb-3">
              {selected.tech}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Role in Prototype
                </label>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                  {selected.role}
                </p>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  NVIDIA Architecture Specification
                </label>
                <div className="rounded-xl bg-slate-100 dark:bg-slate-900 p-2.5 font-mono text-[11px] text-cyan-700 dark:text-cyan-300 border border-slate-200 dark:border-slate-800">
                  {selected.spec}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Sample JSON Data Packet
                </label>
                <pre className="rounded-xl bg-slate-950 p-3 font-mono text-[10px] text-emerald-400 overflow-x-auto border border-slate-800 max-h-40">
                  {selected.payload}
                </pre>
              </div>
            </div>
          </div>

          {/* Quick Benchmark Specs */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111c2e] p-4 shadow-sm dark:shadow-md space-y-2">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              NVIDIA Hardware Acceleration
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-700 dark:text-slate-300">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Inference Engine</span>
                <span className="font-bold text-[#76b900]">TensorRT-LLM</span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Vector Index</span>
                <span className="font-bold text-orange-500">cuVS CAGRA</span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Precision</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">FP8 / FP16</span>
              </div>
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/60 p-2 border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block">Guardrails Latency</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">&lt; 2.0 ms</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
