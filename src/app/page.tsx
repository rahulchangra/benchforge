"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { CyberCore3D } from "@/components/ui/cyber-core-3d";
import {
  FadeInSection,
  StaggerContainer,
  StaggerItem,
  AnimatedCounter,
  GradientText,
  PulseIndicator,
} from "@/components/animations/motion-components";
import {
  GitBranch,
  Shield,
  Code2,
  FlaskConical,
  BookOpen,
  Brain,
  Network,
  FileEdit,
  ArrowRight,
  CheckCircle2,
  Zap,
  Rocket,
  Sparkles,
  Terminal,
  Download,
  Check,
  ChevronRight,
  Play,
  Cpu,
} from "lucide-react";

/* ---------- Data ---------- */

const features = [
  {
    icon: GitBranch,
    title: "Repository Discovery",
    description:
      "Automated GitHub crawler targeting repositories with >= 500 stars, active commit histories, and permissive licenses.",
  },
  {
    icon: Shield,
    title: "License & LOC Verification",
    description:
      "Deterministic verification against approved SPDX licenses (MIT, Apache-2.0, BSD) and reproducible line-of-code thresholds.",
  },
  {
    icon: Code2,
    title: "Non-AI Problem Synthesis",
    description:
      "Synthesizes human-sounding open-source bug reports and reproduction guides without robotic AI disclaimers.",
  },
  {
    icon: FlaskConical,
    title: "Isolated Test Harnesses",
    description:
      "Generates clean test.patch diffs and reproducible test.sh scripts that fail on bug and pass on solution.",
  },
  {
    icon: BookOpen,
    title: "ZIP Task Ingestion",
    description:
      "Unpack approved Olympus benchmark .zip packages to extract prompt conventions, test harnesses, and container specs.",
  },
  {
    icon: Brain,
    title: "Knowledge Tree Synthesis",
    description:
      "Automatically transforms approved solutions into reusable prompt patterns, test strategies, and Docker recipes.",
  },
  {
    icon: Network,
    title: "Concept Graph",
    description:
      "Explore typed relationships between runtime patterns, testing frameworks, and architecture components with confidence scores.",
  },
  {
    icon: Download,
    title: "1-Click Olympus Export",
    description:
      "Export submission-ready ZIP archives containing task.md, test.sh, test.patch, solution.patch, and Dockerfile.",
  },
];

const pipelineSteps = [
  { label: "Crawl", icon: GitBranch, color: "text-emerald-400" },
  { label: "Analyze", icon: Shield, color: "text-cyan-400" },
  { label: "Synthesize", icon: Code2, color: "text-blue-400" },
  { label: "Validate", icon: CheckCircle2, color: "text-violet-400" },
  { label: "Export", icon: Download, color: "text-amber-400" },
];

const stats = [
  { label: "Repositories Analyzed", value: 14200, suffix: "+" },
  { label: "Benchmarks Synthesized", value: 4800, suffix: "+" },
  { label: "License & LOC Audits", value: 65000, suffix: "+" },
  { label: "Pipeline Success Rate", value: 99, suffix: ".4%" },
];

const interactiveDemos = [
  {
    id: "prompt",
    title: "01. Humanized Prompt Synthesis",
    subtitle: "Clean open-source bug report format without AI boilerplate",
    content: `# Issue: Flask Blueprint trailing slash routing mismatch

When mounting a Blueprint with a trailing slash in its url_prefix (e.g. url_prefix='/api/'), nested route handlers registered with an empty path raise 404 instead of dispatching to index.

## Reproduction
\`\`\`python
from flask import Flask, Blueprint

app = Flask(__name__)
bp = Blueprint('api', __name__, url_prefix='/api/')

@bp.route('')
def index():
    return 'ok'

app.register_blueprint(bp)
# GET /api/ returns 404 instead of 200 OK
\`\`\`

## Expected Behavior
Empty route string on blueprint with trailing slash url_prefix should resolve cleanly to root index.`,
  },
  {
    id: "test",
    title: "02. Isolated Test Patch",
    subtitle: "Regression test diff verifying the bug before solution",
    content: `diff --git a/tests/test_blueprints.py b/tests/test_blueprints.py
--- a/tests/test_blueprints.py
+++ b/tests/test_blueprints.py
@@ -142,6 +142,14 @@ def test_blueprint_prefix_slash():
+    bp = Blueprint('api', __name__, url_prefix='/api/')
+    @bp.route('')
+    def index():
+        return 'ok'
+    app.register_blueprint(bp)
+    client = app.test_client()
+    rv = client.get('/api/')
+    assert rv.status_code == 200`,
  },
  {
    id: "solution",
    title: "03. Clean Solution Diff",
    subtitle: "Targeted bugfix patch without irrelevant repository changes",
    content: `diff --git a/src/flask/blueprints.py b/src/flask/blueprints.py
--- a/src/flask/blueprints.py
+++ b/src/flask/blueprints.py
@@ -88,4 +88,6 @@ class Blueprint(Scaffold):
         if url_prefix is not None:
+            if url_prefix.endswith('/') and rule == '':
+                rule = '/'
             rule = '/'.join((url_prefix.rstrip('/'), rule.lstrip('/')))`,
  },
  {
    id: "checks",
    title: "04. Automated Quality Checks",
    subtitle: "6-point validation with objective quality scoring",
    content: `✔ Diff Syntax Check: Both test.patch and solution.patch pass unified diff parser
✔ Test Isolation Check: Test patch only touches tests/ directories
✔ Execution Script Check: test.sh includes bash shebang and exit-code propagation
✔ Dockerfile Check: Clean base image with pinned toolchain specified
✔ Word Count Heuristic: Task prompt has 184 words (meets 40-word depth minimum)
✔ Quality Score: 100% (6/6 automated checks passed) -> Status: READY_FOR_EXPORT`,
  },
];

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState(0);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100 selection:bg-emerald-500 selection:text-black">
      {/* ── Sticky Ultra-Glassy Header ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.08] bg-neutral-950/75 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-bold text-white shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
              BF
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              BenchForge
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {["Pipeline", "Demos", "Features", "Stats"].map((s) => (
              <a
                key={s}
                href={`#${s.toLowerCase()}`}
                className="text-xs font-medium text-neutral-400 transition-colors hover:text-white"
              >
                {s}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/projects">
              <Button
                size="sm"
                variant="outline"
                className="hidden sm:inline-flex border-white/[0.1] bg-white/[0.03] text-xs hover:bg-white/[0.08]"
              >
                Projects
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-400"
              >
                Launch Studio
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section with 3D Cyber Core ── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20 pb-16">
        {/* Background ambient lighting glows */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.12),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_120%,rgba(6,182,212,0.08),transparent)]" />
        <div className="pointer-events-none absolute inset-0 cyber-dots opacity-40" />

        <div className="relative z-10 mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Headline & Value Proposition */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              className="text-center lg:col-span-7 lg:text-left"
            >
              {/* Ping Badge */}
              <motion.div
                className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs backdrop-blur-md"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <PulseIndicator active />
                <span className="font-semibold text-emerald-400">
                  Quest Olympus AI Benchmark Platform
                </span>
              </motion.div>

              <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
                Autonomous Coding{" "}
                <GradientText from="from-emerald-400" via="via-cyan-400" to="to-teal-300">
                  Benchmark Synthesis.
                </GradientText>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
                Transform public GitHub repositories into reproducible benchmark challenges.
                The agent crawls real closed issues, generates authentic human developer prompts,
                isolates test diffs, and exports verified packages for Quest Olympus.
              </p>

              {/* CTAs */}
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row lg:justify-start">
                <Link href="/dashboard">
                  <button className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02] hover:shadow-emerald-500/35">
                    <span className="relative z-10 flex items-center gap-2">
                      <Rocket size={16} />
                      Start Autonomous Pipeline
                    </span>
                    <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>

                <Link href="/projects">
                  <button className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-neutral-300 backdrop-blur-md transition-colors hover:border-white/[0.2] hover:bg-white/[0.08] hover:text-white">
                    <BookOpen size={16} />
                    Knowledge Studio
                  </button>
                </Link>
              </div>

              {/* Spec Tag Pills */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3 lg:justify-start text-xs text-neutral-400">
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
                  <Check size={12} className="text-emerald-400" />
                  <span>&gt;= 500 Stars Filter</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
                  <Check size={12} className="text-emerald-400" />
                  <span>Permissive Licenses</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
                  <Check size={12} className="text-emerald-400" />
                  <span>Non-AI Prompts</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5">
                  <Check size={12} className="text-emerald-400" />
                  <span>1-Click ZIP Export</span>
                </div>
              </div>
            </motion.div>

            {/* Right Column: 3D Interactive Cyber Core */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.9, delay: 0.3 }}
              className="lg:col-span-5 flex items-center justify-center"
            >
              <div className="relative w-full max-w-[440px] aspect-square rounded-3xl border border-white/[0.08] bg-neutral-900/40 p-4 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_25px_60px_-15px_rgba(0,0,0,0.8)]">
                <BorderBeam size={220} duration={12} colorFrom="#10b981" colorTo="#06b6d4" />
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                    Neural Benchmark Core
                  </span>
                </div>
                <CyberCore3D className="h-full w-full" />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-neutral-950" />
      </section>

      {/* ── Interactive Demo Showcase with BorderBeam ── */}
      <section id="demos" className="relative border-t border-white/[0.06] py-24">
        <div className="relative mx-auto max-w-6xl px-6">
          <FadeInSection className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Pipeline Output
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
              Generated Benchmark Artifacts
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-400">
              Explore the exact humanized prompts, isolated test patches, and automated validation outputs synthesized by BenchForge.
            </p>
          </FadeInSection>

          {/* Tab buttons */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
            {interactiveDemos.map((demo, idx) => (
              <button
                key={demo.id}
                onClick={() => setActiveDemo(idx)}
                className={`relative px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeDemo === idx
                    ? "bg-white/[0.1] text-emerald-400 border border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                    : "bg-white/[0.02] text-neutral-400 border border-white/[0.06] hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {demo.title}
              </button>
            ))}
          </div>

          {/* Interactive Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-900/70 p-6 md:p-8 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_50px_-15px_rgba(0,0,0,0.6)]">
            <BorderBeam size={260} duration={14} colorFrom="#06b6d4" colorTo="#10b981" />
            <div className="flex items-center justify-between mb-4 border-b border-white/[0.06] pb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {interactiveDemos[activeDemo].title}
                </h3>
                <p className="text-xs text-neutral-400">
                  {interactiveDemos[activeDemo].subtitle}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-mono text-neutral-500">Olympus Ready</span>
              </div>
            </div>

            <pre className="max-h-[380px] overflow-x-auto overflow-y-auto rounded-xl bg-black/80 border border-white/[0.04] p-5 font-mono text-xs text-neutral-300 leading-relaxed">
              <code>{interactiveDemos[activeDemo].content}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ── 4-Stage Pipeline ── */}
      <section id="pipeline" className="relative border-t border-white/[0.06] py-24">
        <div className="relative mx-auto max-w-7xl px-6">
          <FadeInSection className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Architecture
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
              The 4-Stage Autonomous Pipeline
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-400">
              Full background sequence executing from raw GitHub query to downloadable ZIP submission.
            </p>
          </FadeInSection>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {pipelineSteps.map((step, i) => {
              const Icon = step.icon;
              return (
                <SpotlightCard key={step.label} spotlightColor="rgba(6, 182, 212, 0.15)">
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-bold text-neutral-500">
                      STAGE 0{i + 1}
                    </span>
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] ${step.color}`}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white mb-1.5">{step.label}</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    {i === 0 && "Search public repos with >= 500 stars and closed issues with tests."}
                    {i === 1 && "Evaluate against Olympus reproducibility, scope, and license rules."}
                    {i === 2 && "Synthesize human prompt, isolated test.patch, and clean solution."}
                    {i === 3 && "Run 6 automated checks: diff syntax, isolation, Dockerfile, score."}
                    {i === 4 && "Package as submission-ready .ZIP archive with 1-click download."}
                  </p>
                </SpotlightCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Capabilities & Features Grid with SpotlightCard ── */}
      <section id="features" className="relative border-t border-white/[0.06] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInSection className="text-center mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Features
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl text-white">
              Engineering Features
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-neutral-400">
              Engineered for high accuracy, verifiable test diffs, and authentic developer voice.
            </p>
          </FadeInSection>

          <StaggerContainer className="grid gap-5 md:grid-cols-2 lg:grid-cols-4" staggerDelay={0.06}>
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={feature.title}>
                  <SpotlightCard className="h-full">
                    <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400 border border-emerald-500/20">
                      <Icon size={20} />
                    </div>
                    <h3 className="mb-2 font-bold text-neutral-100 text-sm">{feature.title}</h3>
                    <p className="text-xs leading-relaxed text-neutral-400">
                      {feature.description}
                    </p>
                  </SpotlightCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Stats Ribbon ── */}
      <section id="stats" className="relative border-t border-white/[0.06] py-20 bg-neutral-900/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <FadeInSection key={stat.label} delay={i * 0.1} className="text-center">
                <div className="text-4xl font-extrabold tracking-tight text-white md:text-5xl font-mono">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2.5} />
                </div>
                <p className="mt-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  {stat.label}
                </p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-12 text-center text-xs text-neutral-500">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">BenchForge</span>
            <span>— Quest Olympus Challenge Creation SaaS</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="hover:text-neutral-300 transition-colors">
              Dashboard
            </Link>
            <Link href="/projects" className="hover:text-neutral-300 transition-colors">
              Projects
            </Link>
            <Link href="/learning" className="hover:text-neutral-300 transition-colors">
              Knowledge Base
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
