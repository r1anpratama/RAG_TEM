"use client";

import React from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Cpu, 
  Activity, 
  Map, 
  Bot, 
  ArrowRight, 
  Layers, 
  Building2, 
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  GitFork,
  Radio,
  FileText
} from "lucide-react";

export default function EDREaMPortalPage() {
  const researchPillars = [
    {
      id: "rag-architecture",
      title: "Dual-Track RAG Architecture",
      tag: "Agentic AI & Reflex Engine",
      icon: Cpu,
      description: "Deterministic Track A SCADA reflex (<5ms) coupled with Track B deliberative 4-agent reasoning (Seismic Source, Geotech Graph, Structural Triage, Safety Critic).",
      link: "/dashboard?tab=rag_arch",
      badge: "0.009 ms Reflex",
      color: "text-cyan-400",
      border: "border-cyan-500/30",
      bg: "bg-cyan-500/10",
    },
    {
      id: "eews",
      title: "Real-Time EEWS",
      tag: "Earthquake Early Warning",
      icon: Activity,
      description: "Live S-wave countdown clock, automated microsecond SCADA emergency interlocks, and campus digital twins assessing inter-story drift and collapse risk.",
      link: "/dashboard?tab=eews",
      badge: "Sub-5ms Interlocks",
      color: "text-amber-400",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
    },
    {
      id: "psha",
      title: "TEM PSHA 2025 Hazard Model",
      tag: "Active Faults & Attenuation",
      icon: Map,
      description: "Mapping of 38 Taiwan on-land seismogenic structures, Table 2 multi-fault cascading rupture triggers, and Lin & Lee (2008) GMPE attenuation validation.",
      link: "/dashboard?tab=psha",
      badge: "38 Active Faults",
      color: "text-emerald-400",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
    },
    {
      id: "copilot",
      title: "Grounded AI Copilot",
      tag: "Geotechnical Intelligence",
      icon: Bot,
      description: "Conversational RAG assistant grounded strictly in official TEM PSHA 2025 reports, providing zero-hallucination answers with interactive document citations.",
      link: "/dashboard?tab=copilot",
      badge: "Zero-Hallucination",
      color: "text-sky-400",
      border: "border-sky-500/30",
      bg: "bg-sky-500/10",
    },
  ];

  const partners = [
    { name: "TSMC", category: "Advanced Semiconductor" },
    { name: "ASML", category: "Lithography Systems" },
    { name: "Taipower", category: "National Power Grid" },
    { name: "Central Weather Admin (CWA)", category: "Seismological Authority" },
    { name: "Sinotech Engineering", category: "Geotechnical Infrastructure" },
    { name: "CTCI Foundation", category: "Industrial Engineering" },
    { name: "Thinktron", category: "Geospatial Data Intelligence" },
    { name: "NSTC", category: "National Science & Tech Council" },
    { name: "Temblor, Inc.", category: "Global Seismic Risk Startup" },
    { name: "NVIDIA NVAITC", category: "AI Technology Center" },
  ];

  return (
    <div className="min-h-screen w-full bg-slate_obsidian-900 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* 1. Header & Navigation */}
      <header className="sticky top-0 z-50 flex h-20 w-full items-center justify-between border-b border-slate-800/80 bg-slate_obsidian-900/90 px-6 backdrop-blur-xl lg:px-16">
        <div className="flex items-center space-x-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 shadow-lg shadow-cyan-500/10">
            <ShieldAlert className="h-6 w-6 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-wider text-white">E-DREaM</span>
              <span className="rounded bg-cyan-500/15 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/30">
                NCU CENTER
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Earthquake Disaster & Risk Evaluation and Management Center
            </p>
          </div>
        </div>

        <nav className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-6 text-xs font-semibold text-slate-300">
            <a href="#about" className="hover:text-cyan-400 transition">About Us</a>
            <a href="#pillars" className="hover:text-cyan-400 transition">Research Pillars</a>
            <a href="#partners" className="hover:text-cyan-400 transition">Partners</a>
            <a href="#contact" className="hover:text-cyan-400 transition">Contact</a>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center space-x-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-cyan-500/20 transition-all duration-200 border border-cyan-400/40"
          >
            <span>Launch RAG Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-800/80 px-6 py-20 lg:px-16 lg:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(6,182,212,0.15),rgba(255,255,255,0))]"></div>
        <div className="relative mx-auto max-w-5xl text-center space-y-6">
          <div className="inline-flex items-center space-x-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3.5 py-1 text-xs font-semibold text-cyan-400 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            <span>National Central University × NVIDIA AI Technology Center (NVAITC)</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
            Earthquake Disaster &amp; Risk <br />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-400 bg-clip-text text-transparent">
              Evaluation and Management
            </span>
          </h1>

          <p className="mx-auto max-w-3xl text-sm sm:text-base text-slate-300 leading-relaxed">
            Pioneering multimodal physics-informed Agentic RAG and real-time emergency triage across Taiwan. Integrating Taiwan Earthquake Model (TEM PSHA 2025), TT-SAM AI alerts, and digital twins for critical campus and high-tech semiconductor fabs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/dashboard"
              className="flex items-center space-x-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-xl shadow-cyan-500/25 transition-all duration-200 border border-cyan-400/50"
            >
              <Cpu className="h-4 w-4" />
              <span>Explore 4-Module RAG Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#about"
              className="flex items-center space-x-2 rounded-xl border border-slate-700 bg-slate_obsidian-card px-6 py-3.5 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <span>Learn About E-DREaM</span>
            </a>
          </div>
        </div>
      </section>

      {/* 3. 4 Core Dashboard Features Showcase */}
      <section id="pillars" className="px-6 py-20 lg:px-16 border-b border-slate-800/80 bg-slate_obsidian-900/60">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-3">
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-cyan-400">
              Interactive Dashboard Suite
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              4 Core Visualization Modules for Our RAG Model
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
              Directly visualize how the multimodal RAG framework processes seismic alert packets, executes sub-5ms SCADA interlocks, maps active fault hazards, and provides citation-backed copilot guidance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {researchPillars.map((pillar) => {
              const IconComp = pillar.icon;
              return (
                <Link
                  key={pillar.id}
                  href={pillar.link}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate_obsidian-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/50 hover:shadow-2xl hover:shadow-cyan-500/10"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${pillar.bg} border ${pillar.border}`}>
                        <IconComp className={`h-6 w-6 ${pillar.color}`} />
                      </div>
                      <span className="rounded-full bg-slate-800/80 px-3 py-1 text-[11px] font-mono font-bold text-slate-200 border border-slate-700">
                        {pillar.badge}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                        {pillar.tag}
                      </span>
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition">
                        {pillar.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 pt-6 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
                    <span>Open Module in Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. About E-DREaM Center */}
      <section id="about" className="px-6 py-20 lg:px-16 border-b border-slate-800/80">
        <div className="mx-auto max-w-5xl space-y-8">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-cyan-400">
            Center Introduction
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            National Central University Disaster Chain Research Agency
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
            <p>
              The <strong>Earthquake Disaster &amp; Risk Evaluation and Management Center (E-DREaM)</strong> was established in 2018 at National Central University (NCU), funded under the prestigious Higher Education Sprout Project of the Ministry of Education.
            </p>
            <p>
              The Center gathers experts across the complete disaster chain, uniting the <strong>Department of Earth Sciences</strong>, the <strong>Institute of Applied Geology</strong>, the <strong>Department of Atmospheric Sciences</strong>, the <strong>Institute of Hydrology and Oceanography</strong>, and the <strong>Department of Civil Engineering</strong>.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate_obsidian-card p-6 md:p-8 space-y-4">
            <h4 className="text-base font-bold text-white flex items-center space-x-2">
              <Layers className="h-5 w-5 text-cyan-400" />
              <span>4-Dimensional Seismic Potential &amp; Multi-Hazard Modeling</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Based on decades of seismic and geophysical observations across the Taiwan collision orogeny, E-DREaM develops integrated multi-hazard models analyzing earthquakes, active faults, coseismic landslides, debris flows, soil liquefaction, and extreme weather systems, linking cutting-edge academic AI with the technology, insurance, and semiconductor manufacturing industries.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Partners We've Worked With */}
      <section id="partners" className="px-6 py-20 lg:px-16 border-b border-slate-800/80 bg-slate_obsidian-900/60">
        <div className="mx-auto max-w-5xl space-y-10">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">Collaborations</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Partners We&apos;ve Worked With
            </h2>
            <p className="text-xs text-slate-400">
              Bridging academic geophysical science with industry resilience leaders.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
            {partners.map((partner, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate_obsidian-card p-4 text-center hover:border-slate-700 transition"
              >
                <Building2 className="h-5 w-5 text-cyan-400 mb-2 opacity-80" />
                <span className="text-xs font-bold text-white">{partner.name}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">{partner.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Footer & Contact */}
      <footer id="contact" className="px-6 py-12 lg:px-16 bg-slate_obsidian-card text-xs text-slate-400">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-800 pb-8">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-sm font-bold text-white">E-DREaM Center (National Central University)</h4>
            <p className="text-[11px] text-slate-400">
              College of Earth Sciences, No. 300, Zhongda Rd., Zhongli District, Taoyuan City 320317, Taiwan
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-medium text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Mail className="h-3.5 w-3.5 text-cyan-400" />
              <span>info@e-dream.tw</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Phone className="h-3.5 w-3.5 text-cyan-400" />
              <span>+886 03-4262419</span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 text-[11px] text-slate-500">
          <span>&copy; {new Date().getFullYear()} E-DREaM Center &amp; SeismoAgent-TW. All rights reserved.</span>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard" className="text-cyan-400 hover:underline">
              Live RAG Dashboard
            </Link>
            <a href="https://e-dream.tw/en/" target="_blank" rel="noreferrer" className="hover:text-slate-300 flex items-center space-x-1">
              <span>Official Website</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
