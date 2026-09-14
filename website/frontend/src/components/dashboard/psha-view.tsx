"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import {
  Activity,
  ArrowRight,
  Bot,
  FileText,
  GitFork,
  Link2,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  Waves,
} from "lucide-react";
import { GmpeCurve } from "@/components/mission-control/gmpe-curve";
import { MessageBubble } from "@/components/chat/message-bubble";
import { useRagStream } from "@/hooks/use-rag-stream";
import { API_BASE_URL } from "@/lib/api";
import { FaultTrace, PshaColorMode, PshaDataset, PshaPairing } from "@/types/triage";

const PshaHazardMap = dynamic(
  () => import("@/components/mission-control/psha-hazard-map").then((m) => m.PshaHazardMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-xs text-slate-400 dark:border-slate-800 dark:bg-slate_obsidian-900">
        Loading 38 Taiwan seismogenic structures...
      </div>
    ),
  }
);

/** Grounded statements published in TEM PSHA2025 (Gao et al., 2026). */
const PAPER_RESULTS: { section: string; text: string }[] = [
  {
    section: "Fig. 13 (a) · 10% in 50 yr",
    text: "Mean hazard map including site amplification, 475-year return period.",
  },
  {
    section: "Fig. 13 (b)–(c)",
    text: "Median hazard map of the complete TEM PSHA framework, plus the median-minus-mean difference map.",
  },
  {
    section: "Fig. 13 (d) · 2% in 50 yr",
    text: "Median hazard map for a 2475-year return period.",
  },
  {
    section: "Appendix Fig. a",
    text: "Median hazard map on engineering bedrock (Vs30 = 760 m/s), 10% in 50 years.",
  },
  {
    section: "§7 · GMPE logic tree (crustal)",
    text: "Chao 2020 = 0.183, Lin 2009 = 0.156, Lin et al. 2011 = 0.200, Phung 2020a = 0.169, Boore 2014 = 0.146, Campbell & Bozorgnia 2014 = 0.146.",
  },
  {
    section: "§7 · GMPE logic tree (subduction)",
    text: "Chao 2020 = 0.232, Lin & Lee 2008 = 0.256, Phung 2020b = 0.276, Abrahamson & Gülerce 2020 = 0.236.",
  },
  {
    section: "§2 / §8 · Model scope",
    text: "320 km study radius, catalog 1900–2023, epsilon of 2 on GMPE uncertainty, Vs30 on a 2 km grid (TWSSHAC Level 3).",
  },
  {
    section: "§5 · Offshore structures",
    text: "55 offshore structures raise hazard along coastal Hsinchu and Kaohsiung; the normal-fault-dominated northeast is little affected at the 475-year return period.",
  },
];

const STARTER_PROMPTS = [
  "Which structures pair in TEM PSHA2025 Table 2?",
  "Give me the full parameter card for fault ID 2.",
  "What are the final hazard map results of TEM PSHA2025?",
  "What are the GMPE logic tree weights for shallow crustal sources?",
  "Which structures changed hazard compared with TEM PSHA2020?",
];

const COLOR_MODES: { id: PshaColorMode; label: string }[] = [
  { id: "structures", label: "Structures" },
  { id: "kinematics", label: "Kinematics" },
  { id: "mw_max", label: "Max Mw" },
  { id: "slip_rate", label: "Slip rate" },
];

interface PSHAViewProps {
  faults: FaultTrace[];
}

export const PSHAView: React.FC<PSHAViewProps> = ({ faults }) => {
  const [dataset, setDataset] = useState<PshaDataset | null>(null);
  const [colorMode, setColorMode] = useState<PshaColorMode>("structures");
  const [selectedFaultId, setSelectedFaultId] = useState<number | null>(2);
  const [focusedPairingLabel, setFocusedPairingLabel] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [query, setQuery] = useState<string>("");
  const [input, setInput] = useState<string>("");

  const { messages, isStreaming, error, sendMessage, stopStreaming, clearMessages } = useRagStream();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/psha/dataset`)
      .then((res) => res.json())
      .then((data: PshaDataset) => setDataset(data))
      .catch((err) => console.error("Failed to load TEM PSHA2025 dataset", err));
  }, []);

  const pairings = useMemo(() => dataset?.pairings ?? [], [dataset]);
  const areaSources = useMemo(() => dataset?.area_sources ?? [], [dataset]);
  const summary = dataset?.summary;

  const visibleFaults = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return faults.filter((f) => {
      const matchesType =
        typeFilter === "ALL" ||
        (typeFilter === "MIXED" ? f.fault_type.includes("/") : f.fault_type === typeFilter);
      if (!matchesType) return false;
      if (!needle) return true;
      return (
        f.name.toLowerCase().includes(needle) || String(f.fault_id) === needle.replace("#", "")
      );
    });
  }, [faults, typeFilter, query]);

  const selectedFault = useMemo(
    () => faults.find((f) => f.fault_id === selectedFaultId) ?? null,
    [faults, selectedFaultId]
  );

  const selectedPairings = useMemo(
    () => pairings.filter((p) => selectedFault && p.fault_ids.includes(selectedFault.fault_id)),
    [pairings, selectedFault]
  );

  const handleSelectFault = useCallback((fault: FaultTrace) => {
    setSelectedFaultId(fault.fault_id);
    setFocusedPairingLabel(null);
  }, []);

  const handleSelectPairing = useCallback((pairing: PshaPairing) => {
    setFocusedPairingLabel(pairing.pairing_label);
    setSelectedFaultId(pairing.fault_ids[0]);
  }, []);

  const askAboutFault = (fault: FaultTrace) => {
    sendMessage(`Give me the full parameter card for fault ID ${fault.fault_id}.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    sendMessage(input);
    setInput("");
  };

  const strongest = [...faults].sort((a, b) => b.mw_max - a.mw_max)[0];
  const fastest = [...faults].sort((a, b) => b.slip_rate_mm_yr - a.slip_rate_mm_yr)[0];

  const kpis = [
    {
      label: "On-land structures",
      value: `${summary?.total_faults ?? faults.length}`,
      note: "TEM PSHA2025 Table 1",
      icon: Waves,
    },
    {
      label: "Table 2 pairings",
      value: `${summary?.multi_rupture_pairings ?? pairings.length}`,
      note: "Multiple-structure ruptures",
      icon: GitFork,
    },
    {
      label: "Strongest source",
      value: strongest ? `Mw ${strongest.mw_max}` : "—",
      note: strongest ? `ID ${strongest.fault_id} · ${strongest.name}` : "loading",
      icon: Activity,
    },
    {
      label: "Fastest slipping",
      value: fastest ? `${fastest.slip_rate_mm_yr} mm/yr` : "—",
      note: fastest ? `ID ${fastest.fault_id} · ${fastest.name}` : "loading",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Banner */}
      <div className="flex flex-col items-start justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate_obsidian-card md:flex-row md:items-center">
        <div>
          <span className="block font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-500 dark:text-cyan-400">
            Probabilistic Seismic Hazard Analysis
          </span>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            TEM PSHA2025 Hazard Console — 38 on-land seismogenic structures
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gao et al. (2026), <em>Probabilistic Seismic Hazard Assessment for Taiwan: Updates and
            Improvements in TEM PSHA2025</em> — sources, Table 2 coseismic pairings, and GMPE logic
            tree, each trace clickable and every figure answerable in the assistant beside the map.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="rounded border border-slate-300 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:text-slate-300">
            320 km study radius
          </span>
          <span className="rounded border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 font-bold text-cyan-600 dark:text-cyan-300">
            ε = 2 GMPE
          </span>
          <span className="rounded border border-slate-300 px-2.5 py-1 text-slate-600 dark:border-slate-800 dark:text-slate-300">
            475 / 2475-yr RP
          </span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate_obsidian-card"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {kpi.label}
                </span>
                <Icon className="h-3.5 w-3.5 text-cyan-500" />
              </div>
              <div className="mt-1 font-mono text-lg font-extrabold text-slate-900 dark:text-white">
                {kpi.value}
              </div>
              <div className="truncate text-[10px] text-slate-500 dark:text-slate-400" title={kpi.note}>
                {kpi.note}
              </div>
            </div>
          );
        })}
      </div>

      {/* Map + assistant */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-8">
          {/* Map controls */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate_obsidian-card">
            <div className="flex items-center gap-1">
              {[
                { id: "ALL", label: "All" },
                { id: "R", label: "Reverse" },
                { id: "N", label: "Normal" },
                { id: "SS", label: "Strike-slip" },
                { id: "MIXED", label: "Mixed" },
              ].map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setTypeFilter(chip.id)}
                  className={`rounded px-2 py-1 text-[10px] font-bold transition ${
                    typeFilter === chip.id
                      ? "bg-cyan-500 text-slate-950"
                      : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 px-2 py-1 dark:border-slate-700">
                <Search className="h-3 w-3 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find structure or ID"
                  className="w-32 bg-transparent text-[11px] text-slate-800 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                />
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-300 p-0.5 dark:border-slate-700">
                {COLOR_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setColorMode(mode.id)}
                    className={`rounded px-2 py-1 text-[10px] font-bold transition ${
                      colorMode === mode.id
                        ? "bg-slate-900 text-white dark:bg-cyan-500 dark:text-slate-950"
                        : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="h-[560px] overflow-hidden rounded-xl">
            <PshaHazardMap
              faults={visibleFaults}
              pairings={pairings}
              areaSources={areaSources}
              colorMode={colorMode}
              selectedFaultId={selectedFaultId}
              focusedPairingLabel={focusedPairingLabel}
              onSelectFault={handleSelectFault}
              onSelectPairing={handleSelectPairing}
            />
          </div>

          {/* Structure dossier */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate_obsidian-card">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Structure dossier
                </h3>
                {selectedFault && (
                  <button
                    onClick={() => askAboutFault(selectedFault)}
                    disabled={isStreaming}
                    className="flex items-center gap-1 rounded border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-600 transition hover:bg-cyan-500/20 disabled:opacity-40 dark:text-cyan-300"
                  >
                    <Sparkles className="h-3 w-3" />
                    Ask the assistant
                  </button>
                )}
              </div>

              {selectedFault ? (
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="font-mono text-[10px] text-cyan-500">ID {selectedFault.fault_id}</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedFault.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Fault type {selectedFault.fault_type} · {selectedFault.coordinates.length} trace
                      vertices
                    </div>
                  </div>
                  <dl className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                    {[
                      ["Max Mw", selectedFault.mw_max],
                      ["Slip rate", `${selectedFault.slip_rate_mm_yr} mm/yr`],
                      ["Dip", `${selectedFault.dip_deg}°`],
                      ["Rake", selectedFault.rake_deg ?? "—"],
                      ["Max depth", `${selectedFault.depth_max_km ?? "—"} km`],
                      [
                        "Table 2 links",
                        selectedPairings.length > 0 ? selectedPairings.length : "none",
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={String(label)}
                        className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-2 py-1 dark:border-slate-800 dark:bg-slate-900/60"
                      >
                        <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
                        <dd className="font-bold text-slate-800 dark:text-slate-100">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="text-[10px] leading-relaxed text-slate-400">
                    Parameters: <code>Fault Parameters_update.xlsx</code> (project authoritative).
                    Table 1 length/width/area columns exist only inside the paper PDF and are
                    therefore not shown rather than guessed.
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-400">
                  Click any fault trace on the map to open its dossier.
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate_obsidian-card">
              <div className="flex items-center space-x-2 border-b border-slate-200 pb-2 dark:border-slate-800">
                <Link2 className="h-3.5 w-3.5 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Table 2 · coseismic pairings
                </h3>
              </div>
              <div className="mt-2 max-h-[210px] space-y-1.5 overflow-y-auto pr-1">
                {pairings.map((p) => {
                  const isSelectedStructure = selectedFault
                    ? p.fault_ids.includes(selectedFault.fault_id)
                    : false;
                  const isFocused = p.pairing_label === focusedPairingLabel;
                  return (
                    <button
                      key={p.pairing_label}
                      onClick={() => handleSelectPairing(p)}
                      className={`flex w-full items-center justify-between rounded-lg border px-2 py-1.5 text-left text-[11px] transition ${
                        isFocused
                          ? "border-cyan-500 bg-cyan-500/10"
                          : isSelectedStructure
                          ? "border-amber-500/50 bg-amber-500/5"
                          : "border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
                      }`}
                    >
                      <span className="truncate pr-2 text-slate-700 dark:text-slate-200">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {p.pairing_label.split(" ")[0]}
                        </span>{" "}
                        {p.fault_names[0]} + {p.fault_names[1]}
                      </span>
                      <span className="shrink-0 text-right">
                        <span className="block font-mono font-extrabold text-amber-500">
                          Mw {p.combined_mw}
                        </span>
                        <span className="block font-mono text-[9px] text-slate-400">
                          {p.recurrence_interval_yr.toLocaleString()} yr
                        </span>
                      </span>
                    </button>
                  );
                })}
                {pairings.length === 0 && (
                  <p className="text-xs text-slate-400">
                    Table 2 pairings unavailable — is the FastAPI backend running?
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Docked AI assistant */}
        <div className="lg:col-span-4">
          <div className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate_obsidian-card">
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-500/30 bg-cyan-500/10 text-cyan-500">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                    <span>PSHA Hazard Assistant</span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Grounded on the 38-structure catalog, Table 2 &amp; the paper text — no invented
                    values
                  </div>
                </div>
              </div>
              <button
                onClick={clearMessages}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:text-white"
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {error && (
              <div className="border-b border-rose-500/30 bg-rose-500/15 px-3 py-1.5 text-center text-[11px] font-medium text-rose-500 dark:text-rose-300">
                {error}
              </div>
            )}

            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="space-y-2 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-500">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Ask about the map</span>
                  </div>
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="group flex w-full items-center justify-between gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-left text-[11px] text-slate-600 transition hover:border-cyan-500/40 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="h-3 w-3 shrink-0 text-slate-400 transition group-hover:text-cyan-500" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-slate-200 dark:divide-slate-800/60">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} />
                  ))}
                </div>
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-200 p-3 dark:border-slate-800"
            >
              <div className="flex items-center space-x-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 transition focus-within:border-cyan-500/60 dark:border-slate-800 dark:bg-slate-900/80">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="e.g. what is the recurrence of 02+04?"
                  className="flex-1 bg-transparent text-[11px] text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
                  disabled={isStreaming}
                />
                {isStreaming ? (
                  <button
                    type="button"
                    onClick={stopStreaming}
                    className="rounded-lg bg-rose-500 px-2.5 py-1 text-[11px] font-bold text-white transition hover:bg-rose-400"
                  >
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex items-center gap-1 rounded-lg bg-cyan-500 px-2.5 py-1 text-[11px] font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-40"
                  >
                    <span>Send</span>
                    <Send className="h-3 w-3" />
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[9px] text-slate-400">
                Answers cite the source record; ask “fault ID N”, “Table 2”, or any paper section.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom rail: GMPE + paper results */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          {/* GMPE for the Table 2 "02+04" Shuanglienpo + Hukou case (Mw 6.91) at 2.8 km */}
          <GmpeCurve magnitude={6.91} observedPgv={72.4} observedDistanceKm={2.8} />
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate_obsidian-card lg:col-span-7">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <FileText className="h-3.5 w-3.5 text-cyan-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Paper results · TEM PSHA2025
              </h3>
            </div>
            <span className="rounded border border-cyan-500/25 bg-cyan-500/10 px-2 py-0.5 font-mono text-[9px] text-cyan-600 dark:text-cyan-300">
              Gao et al. (2026) · preprint
            </span>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-1.5 md:grid-cols-2">
            {PAPER_RESULTS.map((item) => (
              <div
                key={item.section}
                className="rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/60"
              >
                <div className="font-mono text-[10px] font-bold text-cyan-600 dark:text-cyan-300">
                  {item.section}
                </div>
                <div className="mt-0.5 text-[11px] leading-snug text-slate-600 dark:text-slate-300">
                  {item.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
