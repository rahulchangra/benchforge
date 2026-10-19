"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
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
  Cpu,
  Layers,
  Activity,
  Sliders,
  Copy,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Interactive Demos Data                                              */
/* ------------------------------------------------------------------ */

const interactiveDemos = [
  {
    id: "prompt",
    label: "Humanized Prompt",
    title: "Natural Developer Problem Description",
    subtitle: "Clean issue statement written in authentic open-source developer voice, free of robotic AI disclaimers.",
    code: `# Issue: Flask Blueprint trailing slash routing mismatch

When mounting a Blueprint with a trailing slash in its url_prefix (e.g. url_prefix='/api/'), nested route handlers registered with an empty path raise 404 instead of dispatching to index.

## Reproduction Steps
\`\`\`python
from flask import Flask, Blueprint

app = Flask(__name__)
bp = Blueprint('api', __name__, url_prefix='/api/')

@bp.route('')
def index():
    return 'ok'

app.register_blueprint(bp)
# GET /api/ returns 404 instead of expected 200 OK
\`\`\`

## Expected Behavior
Empty route string on blueprint with trailing slash url_prefix should resolve cleanly to root index.`,
  },
  {
    id: "test",
    label: "Isolated Test Diff",
    title: "Reproducible Regression Test Patch",
    subtitle: "Isolated test file patch that rigorously fails before the fix and passes once applied.",
    code: `diff --git a/tests/test_blueprints.py b/tests/test_blueprints.py
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
    label: "Solution Patch",
    title: "Targeted Minimal Bugfix Diff",
    subtitle: "Precise code modification addressing the root cause without extraneous formatting churn.",
    code: `diff --git a/src/flask/blueprints.py b/src/flask/blueprints.py
--- a/src/flask/blueprints.py
+++ b/src/flask/blueprints.py
@@ -88,4 +88,6 @@ class Blueprint(Scaffold):
         if url_prefix is not None:
+            if url_prefix.endswith('/') and rule == '':
+                rule = '/'
             rule = '/'.join((url_prefix.rstrip('/'), rule.lstrip('/')))`,
  },
  {
    id: "validation",
    label: "Automated Checks",
    title: "6-Point Objective Quality Scoring",
    subtitle: "Rigorous verification checking diff validity, test isolation, and reproducible containerization.",
    code: `[1/6] ✔ Unified Diff Syntax: Both test.patch and solution.patch pass unified diff parser
[2/6] ✔ Test Directory Isolation: Diffs exclusively modify tests/ and test suites
[3/6] ✔ Test Script Validation: test.sh includes bash shebang and exit-code propagation
[4/6] ✔ Container Environment: Dockerfile specifies pinned base image and reproducible build
[5/6] ✔ Prompt Word Count: Task prompt meets 40-word technical depth minimum (184 words)
[6/6] ✔ Issue Evidence: Verified commit hash & PR merge status confirmed

Quality Score: 100% (6/6 checks passed) -> Status: READY_FOR_EXPORT`,
  },
];

const bentoFeatures = [
  {
    span: "col-span-12 lg:col-span-7",
    icon: GitBranch,
    tag: "Autonomous Engine",
    title: "Repository Discovery & GitHub Crawl",
    description:
      "Intelligently scans GitHub Search for repositories with >= 500 stars and permissive licenses. Automatically indexes closed issues with verifiable test-backed pull requests.",
    badge: ">= 500 Stars",
  },
  {
    span: "col-span-12 lg:col-span-5",
    icon: Shield,
    tag: "Compliance",
    title: "License & LOC Verification",
    description:
      "Deterministic allowlist validation against 45+ SPDX identifiers (MIT, Apache 2.0, BSD). Excludes non-permissive or ambiguous licenses with auditable reasoning.",
    badge: "100% Permissive",
  },
  {
    span: "col-span-12 lg:col-span-5",
    icon: Brain,
    tag: "Knowledge Base",
    title: "Knowledge Tree Synthesis",
    description:
      "Transforms approved task solutions into reusable prompt patterns, test strategies, and Docker recipes so the agent continuously adapts.",
    badge: "Self-Adapting",
  },
  {
    span: "col-span-12 lg:col-span-7",
    icon: Download,
    tag: "Export Pipeline",
    title: "1-Click Quest Olympus Package Export",
    description:
      "Generate and download submission-ready ZIP archives containing task.md, test.sh, test.patch, solution.patch, and Dockerfile ready for Quest Olympus upload.",
    badge: "Instant .ZIP",
  },
];

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  // Scroll animations via Framer Motion
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  // Parallax transforms for Hero section
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.94]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.4]);
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, 40]);

  // Floating parallax chip transforms
  const chipY1 = useTransform(scrollYProgress, [0, 0.4], [0, -60]);
  const chipY2 = useTransform(scrollYProgress, [0, 0.4], [0, -90]);

  const handleCopy = () => {
    navigator.clipboard.writeText(interactiveDemos[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#050508] text-neutral-100 selection:bg-emerald-500 selection:text-black overflow-x-hidden"
    >
      {/* ── Apple-Style Top Scroll Progress Bar ── */}
      <motion.div
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 left-0 right-0 h-[2.5px] origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 z-50 shadow-[0_0_12px_rgba(16,185,129,0.8)]"
      />

      {/* ── Ambient Background Lighting (Aurora Effect) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 aurora-bg opacity-70" />
      <div className="pointer-events-none fixed inset-0 z-0 cyber-dots opacity-30" />

      {/* ── Apple-Grade Floating Dynamic Island Navigation Pill ── */}
      <header className="fixed top-5 left-0 right-0 z-40 flex justify-center px-4">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="apple-glass-pill flex h-14 items-center justify-between gap-6 px-4 md:px-6 rounded-full max-w-4xl w-full"
        >
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-black text-black shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              BF
            </div>
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              BenchForge
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
            <a href="#pipeline" className="hover:text-white transition-colors">
              Pipeline
            </a>
            <a href="#demos" className="hover:text-white transition-colors">
              Artifacts
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#stats" className="hover:text-white transition-colors">
              Metrics
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <Link href="/projects">
              <button className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/[0.06] transition-colors">
                Projects
              </button>
            </Link>
            <Link href="/dashboard">
              <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-all shadow-md shadow-white/10 active:scale-95">
                <span>Dashboard</span>
                <ChevronRight size={14} />
              </button>
            </Link>
          </div>
        </motion.div>
      </header>

      {/* ── Hero Section (Apple Pro Scrolling Experience) ── */}
      <section className="relative min-h-screen flex items-center justify-center pt-32 pb-20 px-6 overflow-hidden">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto w-full"
        >
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Vision & Pitch */}
            <div className="text-center lg:text-left lg:col-span-7 space-y-6">
              {/* VisionOS Glass Badge */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] backdrop-blur-xl shadow-inner"
              >
                <PulseIndicator active />
                <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">
                  Quest Olympus AI Challenge Engine
                </span>
              </motion.div>

              {/* Headline with Apple Specular Gradient */}
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.02] text-white">
                Benchmark.{" "}
                <br className="hidden sm:block" />
                <span className="apple-hero-gradient">Automated.</span>
                <br />
                <GradientText from="from-emerald-400" via="via-cyan-300" to="to-teal-200">
                  Perfection.
                </GradientText>
              </h1>

              <p className="max-w-2xl text-base sm:text-lg text-neutral-400 leading-relaxed mx-auto lg:mx-0">
                Turn real-world GitHub issues into verified coding benchmark challenges.
                Our autonomous agent crawls public repositories, synthesizes authentic developer prompts,
                isolates test diffs, and compiles downloadable packages.
              </p>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/dashboard">
                  <button className="group relative flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-[0_0_35px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_45px_-5px_rgba(16,185,129,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    <Rocket size={16} />
                    <span>Launch Full Pipeline</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <Link href="/projects">
                  <button className="apple-glass-pill flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.1] transition-all">
                    <BookOpen size={16} className="text-cyan-400" />
                    <span>Explore Knowledge Studio</span>
                  </button>
                </Link>
              </div>

              {/* Apple Spec Highlights */}
              <div className="pt-6 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>&gt;= 500 Stars Filter</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  <span>Permissive SPDX Licenses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                  <span>100% Non-AI Prompts</span>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Holographic Core */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              {/* Parallax Floating Glass Chip 1 */}
              <motion.div
                style={{ y: chipY1 }}
                className="apple-glass absolute -top-8 -left-6 z-20 hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">99.4% Validation</p>
                  <p className="text-[10px] text-neutral-400">Diff Syntax & Isolation</p>
                </div>
              </motion.div>

              {/* Parallax Floating Glass Chip 2 */}
              <motion.div
                style={{ y: chipY2 }}
                className="apple-glass absolute -bottom-6 -right-4 z-20 hidden sm:flex items-center gap-3 px-4 py-2.5 rounded-2xl shadow-2xl"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Terminal size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Real GitHub PRs</p>
                  <p className="text-[10px] text-neutral-400">Flask, Express, Tokio</p>
                </div>
              </motion.div>

              {/* 3D Glass Container with Border Beam */}
              <div className="apple-glass-card relative w-full max-w-[460px] aspect-square rounded-[36px] p-6 flex items-center justify-center">
                <BorderBeam size={280} duration={14} colorFrom="#10b981" colorTo="#06b6d4" />
                <CyberCore3D className="h-full w-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ambient bottom transition mask */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050508]" />
      </section>

      {/* ── Apple-Style Interactive Code & Artifact Showcase ── */}
      <section id="demos" className="relative py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto space-y-10">
          <FadeInSection className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Verifiable Outputs
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Crafted in Authentic Developer Voice.
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-neutral-400">
              Inspect the exact humanized prompts, isolated test patches, and objective quality scoring produced by BenchForge.
            </p>
          </FadeInSection>

          {/* Liquid Glass Tab Switcher */}
          <div className="flex justify-center">
            <div className="apple-glass-pill p-1.5 rounded-full flex flex-wrap gap-1 max-w-xl justify-center">
              {interactiveDemos.map((demo, idx) => (
                <button
                  key={demo.id}
                  onClick={() => setActiveTab(idx)}
                  className={`relative px-4 py-2 rounded-full text-xs font-semibold transition-all duration-300 ${
                    activeTab === idx
                      ? "text-white bg-white/[0.15] shadow-lg shadow-black/40 border border-white/[0.15]"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {demo.label}
                </button>
              ))}
            </div>
          </div>

          {/* macOS Glass Terminal Showcase Card */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="apple-glass-card rounded-[28px] overflow-hidden"
          >
            {/* Terminal Window Header (macOS Traffic Lights) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/40">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f56] shadow-sm" />
                <span className="h-3 w-3 rounded-full bg-[#ffbd2e] shadow-sm" />
                <span className="h-3 w-3 rounded-full bg-[#27c93f] shadow-sm" />
                <span className="ml-3 text-xs font-mono text-neutral-400">
                  {interactiveDemos[activeTab].title}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-neutral-500 hidden sm:inline font-mono">
                  Quest Olympus Spec
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-white/[0.1] bg-white/[0.04] text-[11px] text-neutral-300 hover:bg-white/[0.08] transition-colors"
                >
                  {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Subtitle bar */}
            <div className="px-6 py-2.5 bg-neutral-900/40 border-b border-white/[0.04] text-xs text-neutral-400">
              {interactiveDemos[activeTab].subtitle}
            </div>

            {/* Code Body */}
            <pre className="p-6 md:p-8 max-h-[420px] overflow-auto font-mono text-xs text-neutral-300 leading-relaxed bg-black/60">
              <code>{interactiveDemos[activeTab].code}</code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* ── Apple-Style Bento Grid Capabilities ── */}
      <section id="features" className="relative py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto space-y-14">
          <FadeInSection className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              Bento Architecture
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Designed for Benchmark Precision.
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-neutral-400">
              Every component works synchronously to crawl, verify, synthesize, and export benchmark datasets.
            </p>
          </FadeInSection>

          {/* Bento Grid */}
          <div className="grid grid-cols-12 gap-6">
            {bentoFeatures.map((bento, i) => {
              const Icon = bento.icon;
              return (
                <div key={bento.title} className={`${bento.span}`}>
                  <SpotlightCard className="apple-glass-card h-full rounded-[28px] p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30">
                          <Icon size={22} />
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/[0.06] border border-white/[0.1] text-neutral-300">
                          {bento.badge}
                        </span>
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        {bento.tag}
                      </span>
                      <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 mb-3">
                        {bento.title}
                      </h3>
                      <p className="text-sm text-neutral-400 leading-relaxed">
                        {bento.description}
                      </p>
                    </div>

                    <div className="pt-6 mt-6 border-t border-white/[0.06] flex items-center justify-between">
                      <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                        <Check size={14} /> Automated & Verified
                      </span>
                      <ArrowRight size={14} className="text-neutral-500" />
                    </div>
                  </SpotlightCard>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 4-Stage Autonomous Pipeline ── */}
      <section id="pipeline" className="relative py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto space-y-14">
          <FadeInSection className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-violet-400">
              Pipeline Execution
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Sequential 4-Stage Agent Engine
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-neutral-400">
              From raw GitHub issue search to downloadable Olympus .ZIP package.
            </p>
          </FadeInSection>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                num: "01",
                name: "CRAWL",
                color: "text-emerald-400",
                desc: "Queries GitHub search with star and license filters. Identifies closed issues with test-backed PRs.",
              },
              {
                num: "02",
                name: "ANALYZE",
                color: "text-cyan-400",
                desc: "Assesses reproducibility, issue context, self-contained scope, and clean diff isolation.",
              },
              {
                num: "03",
                name: "GENERATE",
                color: "text-blue-400",
                desc: "Synthesizes authentic task.md, test.sh, test.patch, solution.patch, and Dockerfile.",
              },
              {
                num: "04",
                name: "VALIDATE",
                color: "text-purple-400",
                desc: "Executes 6 automated quality checks, computes final score, and enables 1-click ZIP export.",
              },
            ].map((stage) => (
              <SpotlightCard key={stage.name} className="apple-glass-card rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-black font-mono text-neutral-600">
                    {stage.num}
                  </span>
                  <span className={`text-xs font-bold font-mono tracking-wider ${stage.color}`}>
                    {stage.name}
                  </span>
                </div>
                <h4 className="text-base font-bold text-white mb-2">{stage.name} PHASE</h4>
                <p className="text-xs text-neutral-400 leading-relaxed">{stage.desc}</p>
              </SpotlightCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Apple-Grade Stats Ribbon ── */}
      <section id="stats" className="relative py-24 px-6 border-t border-white/[0.06] bg-black/40">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Repositories Analyzed", value: 14200, suffix: "+" },
              { label: "Benchmarks Synthesized", value: 4800, suffix: "+" },
              { label: "License & LOC Audits", value: 65000, suffix: "+" },
              { label: "Validation Rate", value: 99, suffix: ".4%" },
            ].map((stat, i) => (
              <FadeInSection key={stat.label} delay={i * 0.1} className="text-center space-y-2">
                <div className="text-4xl sm:text-5xl lg:text-6xl font-black font-mono text-white tracking-tight">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2.5} />
                </div>
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                  {stat.label}
                </p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-14 px-6 text-xs text-neutral-500 bg-[#030305]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-[10px] font-bold text-black">
              BF
            </div>
            <span className="font-semibold text-neutral-300">BenchForge SaaS</span>
            <span>— Quest Olympus Challenge Automation</span>
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
            <Link href="/repositories" className="hover:text-neutral-300 transition-colors">
              Repositories
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
