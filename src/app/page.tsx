"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { InteractiveCyberGlobe } from "@/components/ui/interactive-cyber-globe";
import { CardTilt3D } from "@/components/ui/card-tilt-3d";
import { BorderBeam } from "@/components/ui/border-beam";
import {
  FadeInSection,
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
  Terminal,
  Download,
  Check,
  ChevronRight,
  Copy,
  Cpu,
  Layers,
  Sparkles,
  MapPin,
  Compass,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Interactive Demos Data                                              */
/* ------------------------------------------------------------------ */

const interactiveDemos = [
  {
    id: "prompt",
    label: "01. Humanized Prompt",
    title: "Natural Developer Problem Description",
    subtitle: "Real issue statement written in authentic open-source developer voice, free of robotic AI boilerplate.",
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
    label: "02. Isolated Test Diff",
    title: "Reproducible Regression Test Patch",
    subtitle: "Isolated test file patch that strictly verifies the bug before the fix and passes once applied.",
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
    label: "03. Solution Patch",
    title: "Targeted Minimal Bugfix Diff",
    subtitle: "Precise code modification addressing the root cause without extraneous formatting churn.",
    code: `diff --git a/src/flask/blueprints.py b/src/flask/blueprints.py
--- a/src/flask/blueprints.py
+++ b/src/flask/blueprints.py
@@ -88,4 +88,6 @@ class Blueprint(Scaffold):
         if url_prefix is not None:
+            if url_prefix.endswith('/') and rule == '':
                rule = '/'
             rule = '/'.join((url_prefix.rstrip('/'), rule.lstrip('/')))`,
  },
  {
    id: "validation",
    label: "04. Automated Checks",
    title: "6-Point Objective Quality Scoring",
    subtitle: "Rigorous verification checking diff syntax, test directory isolation, and reproducible containerization.",
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
    tag: "Repository Intelligence",
    title: "Global Repository Crawl & Issue Miner",
    description:
      "Indexes public repositories across GitHub with >= 500 stars and permissive open-source licenses. Automatically matches closed issues with merged pull requests and test suites.",
    badge: ">= 500 Stars Filter",
    color: "#10b981",
  },
  {
    span: "col-span-12 lg:col-span-5",
    icon: Shield,
    tag: "Strict Compliance",
    title: "License & Deterministic LOC Audit",
    description:
      "Auditable verification against 45+ approved SPDX licenses (MIT, Apache-2.0, BSD). Excludes ambiguous and copyleft licenses with transparent decision logs.",
    badge: "100% Permissive",
    color: "#06b6d4",
  },
  {
    span: "col-span-12 lg:col-span-5",
    icon: Brain,
    tag: "Adaptive Learning",
    title: "Knowledge Tree & Recipe Synthesis",
    description:
      "Learns from uploaded approved tasks. Automatically extracts prompt structures, testing frameworks (pytest, vitest, cargo), and container setups into your project tree.",
    badge: "Self-Adapting",
    color: "#8b5cf6",
  },
  {
    span: "col-span-12 lg:col-span-7",
    icon: Download,
    tag: "Export Pipeline",
    title: "1-Click Quest Olympus Package Export",
    description:
      "Bundles the entire challenge package into an Olympus-compliant .ZIP archive containing task.md, test.sh, test.patch, solution.patch, and Dockerfile ready for immediate upload.",
    badge: "Instant .ZIP Archive",
    color: "#f59e0b",
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
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // Parallax transforms for Hero
  const heroScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.93]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.22], [1, 0.35]);
  const heroY = useTransform(scrollYProgress, [0, 0.22], [0, 50]);

  const handleCopy = () => {
    navigator.clipboard.writeText(interactiveDemos[activeTab].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#030306] text-neutral-100 selection:bg-emerald-500 selection:text-black overflow-x-hidden font-sans"
    >
      {/* ── Apple-Style Top Scroll Hairline ── */}
      <motion.div
        style={{ scaleX: smoothProgress }}
        className="fixed top-0 left-0 right-0 h-[2.5px] origin-left bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 z-50 shadow-[0_0_15px_rgba(16,185,129,0.9)]"
      />

      {/* ── Ambient Background Lighting (Aurora & Cyber Matrix) ── */}
      <div className="pointer-events-none fixed inset-0 z-0 aurora-bg opacity-75" />
      <div className="pointer-events-none fixed inset-0 z-0 cyber-dots opacity-25" />

      {/* ── VisionOS Floating Island Header ── */}
      <header className="fixed top-5 left-0 right-0 z-40 flex justify-center px-4">
        <motion.div
          initial={{ y: -25, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="apple-glass-pill flex h-14 items-center justify-between gap-6 px-4 md:px-7 rounded-full max-w-4xl w-full border border-white/[0.12] shadow-2xl"
        >
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 text-xs font-black text-black shadow-md shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              BF
            </div>
            <span className="text-sm font-bold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              BenchForge
            </span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-400">
            <a href="#map" className="hover:text-white transition-colors">
              Cyber Map
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
              <button className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-all shadow-md shadow-white/10 active:scale-95">
                <span>Dashboard</span>
                <ChevronRight size={14} />
              </button>
            </Link>
          </div>
        </motion.div>
      </header>

      {/* ── Hero Section with Animated Interactive 3D Cyber Globe ── */}
      <section id="map" className="relative min-h-screen flex items-center justify-center pt-28 pb-16 px-6 overflow-hidden">
        <motion.div
          style={{ scale: heroScale, opacity: heroOpacity, y: heroY }}
          className="relative z-10 max-w-7xl mx-auto w-full"
        >
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Vision & Pitch */}
            <div className="text-center lg:text-left lg:col-span-6 space-y-6">
              {/* VisionOS Spec Badge */}
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 backdrop-blur-xl">
                <PulseIndicator active />
                <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">
                  Quest Olympus AI Benchmark Platform
                </span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.04] text-white">
                Global Code.{" "}
                <br className="hidden sm:block" />
                <span className="apple-hero-gradient">Verified Benchmarks.</span>
                <br />
                <GradientText from="from-emerald-400" via="via-cyan-300" to="to-teal-200">
                  Zero AI Fluff.
                </GradientText>
              </h1>

              <p className="max-w-xl text-base sm:text-lg text-neutral-400 leading-relaxed mx-auto lg:mx-0">
                Move your cursor over the interactive Cyber Map. Our autonomous engine continuously scans global
                repositories (&gt;= 500 stars, permissive license), generates isolated regression test patches,
                and outputs submission-ready packages.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/dashboard">
                  <button className="group relative flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold text-sm shadow-[0_0_35px_-5px_rgba(16,185,129,0.5)] hover:shadow-[0_0_45px_-5px_rgba(16,185,129,0.7)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                    <Rocket size={16} />
                    <span>Start Autonomous Pipeline</span>
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>
                <Link href="/projects">
                  <button className="apple-glass-pill flex items-center gap-2 px-6 py-4 rounded-full text-sm font-medium text-neutral-300 hover:text-white hover:bg-white/[0.1] transition-all">
                    <BookOpen size={16} className="text-cyan-400" />
                    <span>Knowledge Studio</span>
                  </button>
                </Link>
              </div>

              {/* HUD Telemetry Stats */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-5 text-xs text-neutral-400 font-mono">
                <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.08]">
                  <Compass size={13} className="text-emerald-400" />
                  <span>Interactive 3D Mouse Parallax</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/[0.03] px-3 py-1.5 rounded-lg border border-white/[0.08]">
                  <Check size={13} className="text-cyan-400" />
                  <span>100% Human Prompt Voice</span>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive 3D Cyber Globe & Topology Map */}
            <div className="lg:col-span-6 flex items-center justify-center relative">
              <div className="apple-glass-card relative w-full max-w-[520px] aspect-square rounded-[36px] p-2 flex items-center justify-center overflow-hidden border border-white/[0.14] shadow-[0_30px_70px_-20px_rgba(0,0,0,0.9)]">
                <BorderBeam size={300} duration={14} colorFrom="#10b981" colorTo="#06b6d4" />
                <InteractiveCyberGlobe className="h-full w-full" radius={2.25} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Ambient bottom transition mask */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#030306]" />
      </section>

      {/* ── Apple-Style Interactive Code & Artifact Showcase ── */}
      <section id="demos" className="relative py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto space-y-10">
          <FadeInSection className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
              Verifiable Outputs
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Synthesized Artifact Preview.
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
            transition={{ duration: 0.35 }}
            className="apple-glass-card rounded-[28px] overflow-hidden border border-white/[0.12] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
          >
            {/* Terminal Window Header (macOS Traffic Lights) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/50">
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
            <pre className="p-6 md:p-8 max-h-[400px] overflow-auto font-mono text-xs text-neutral-300 leading-relaxed bg-black/70">
              <code>{interactiveDemos[activeTab].code}</code>
            </pre>
          </motion.div>
        </div>
      </section>

      {/* ── 3D Tilt Bento Grid Architecture ── */}
      <section id="features" className="relative py-28 px-6 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto space-y-14">
          <FadeInSection className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400">
              3D Interactive Bento
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Designed for Benchmark Precision.
            </h2>
            <p className="max-w-2xl mx-auto text-sm text-neutral-400">
              Hover over each card to experience real-time 3D tilt perspective and dynamic specular reflection.
            </p>
          </FadeInSection>

          {/* 3D Bento Grid */}
          <div className="grid grid-cols-12 gap-6">
            {bentoFeatures.map((bento) => {
              const Icon = bento.icon;
              return (
                <div key={bento.title} className={`${bento.span}`}>
                  <CardTilt3D glowColor="rgba(16, 185, 129, 0.25)">
                    <div className="flex flex-col justify-between h-full">
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
                    </div>
                  </CardTilt3D>
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
              <div key={stage.name} className="apple-glass-card rounded-2xl p-6">
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
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Apple-Grade Stats Ribbon ── */}
      <section id="stats" className="relative py-24 px-6 border-t border-white/[0.06] bg-black/50">
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
      <footer className="border-t border-white/[0.06] py-14 px-6 text-xs text-neutral-500 bg-[#020204]">
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
