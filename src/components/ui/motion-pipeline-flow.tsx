"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { GitBranch, ShieldCheck, Code2, FlaskConical, Download, Sparkles, Check, Play, Zap } from "lucide-react";

const STAGES = [
  {
    id: "crawl",
    name: "01. CRAWL",
    title: "GitHub Repository Discovery",
    desc: "Crawl active repos >= 500 stars with closed issues and test-backed PRs.",
    icon: GitBranch,
    color: "#10b981",
    metric: "14.2k Repos",
  },
  {
    id: "analyze",
    name: "02. ANALYZE",
    title: "License & AST Verification",
    desc: "Deterministic SPDX compliance (MIT/BSD/Apache) and LOC audit.",
    icon: ShieldCheck,
    color: "#06b6d4",
    metric: "45+ SPDX Allowed",
  },
  {
    id: "generate",
    name: "03. GENERATE",
    title: "Prompt & Patch Synthesis",
    desc: "Produces authentic developer voice, isolated test.patch, and minimal solution.",
    icon: Code2,
    color: "#8b5cf6",
    metric: "Non-AI Voice",
  },
  {
    id: "validate",
    name: "04. VALIDATE",
    title: "Olympus Package Export",
    desc: "6 automated quality checks, objective score, and 1-click ZIP export.",
    icon: Download,
    color: "#f59e0b",
    metric: "100% Validated",
  },
];

export function MotionPipelineFlow() {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <div className="relative w-full overflow-hidden rounded-[32px] border border-white/[0.12] bg-[#07070c]/80 p-8 md:p-12 backdrop-blur-3xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)]">
      {/* Background Kinetic Glows */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />

      {/* Header HUD */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 pb-6 border-b border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              KINETIC MOTION GRAPHIC
            </span>
          </div>
          <h3 className="text-2xl font-black text-white tracking-tight">
            Autonomous Pipeline Flow
          </h3>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-400">
            <span className="text-emerald-400 font-bold">FLOW VELOCITY:</span>
            <span>60 FPS REALTIME</span>
          </div>
        </div>
      </div>

      {/* Kinetic Interactive SVG Pipeline Diagram */}
      <div className="relative z-10 mb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Animated Connecting SVG Laser Lines */}
          <div className="hidden md:block absolute top-[44px] left-[12%] right-[12%] h-[2px] z-0 pointer-events-none">
            {/* Background track line */}
            <div className="h-full w-full bg-white/[0.08]" />
            {/* Moving laser light beam */}
            <motion.div
              className="h-full w-24 bg-gradient-to-r from-transparent via-cyan-400 to-emerald-400 shadow-[0_0_12px_#06b6d4]"
              animate={{ x: ["-100%", "500%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />
          </div>

          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const isCurrent = activeStage === idx;

            return (
              <motion.div
                key={stage.id}
                whileHover={{ y: -6, scale: 1.02 }}
                onClick={() => setActiveStage(idx)}
                className={`relative z-10 cursor-pointer rounded-2xl p-6 transition-all duration-300 border ${
                  isCurrent
                    ? "bg-white/[0.08] border-white/[0.25] shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]"
                    : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.14] hover:bg-white/[0.04]"
                }`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform group-hover:scale-110"
                    style={{
                      background: `radial-gradient(circle at 30% 30%, ${stage.color}40, ${stage.color}15)`,
                      border: `1px solid ${stage.color}60`,
                    }}
                  >
                    <Icon size={20} style={{ color: stage.color }} />
                  </div>
                  <span className="font-mono text-xs font-bold text-neutral-400">
                    {stage.name}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-white mb-1.5">{stage.title}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed mb-4">{stage.desc}</p>

                {/* Status indicator */}
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[11px] font-mono">
                  <span className="text-neutral-500">Output:</span>
                  <span className="font-semibold" style={{ color: stage.color }}>
                    {stage.metric}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Kinetic Telemetry Terminal View for Active Stage */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-white/[0.08] bg-black/60 p-6">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-neutral-300 font-semibold">
              ACTIVE STAGE TELEMETRY: {STAGES[activeStage].name}
            </span>
          </div>
          <span className="text-neutral-500">STATUS: OPTIMAL (LATENCY 8ms)</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Input Payload</span>
            <p className="text-xs font-mono text-white mt-1">GitHub Repos &gt;= 500★</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Processing Mode</span>
            <p className="text-xs font-mono text-emerald-400 mt-1">Autonomous Multi-Agent AST</p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Target Evaluation</span>
            <p className="text-xs font-mono text-cyan-400 mt-1">Quest Olympus Challenge ZIP</p>
          </div>
        </div>
      </div>
    </div>
  );
}
