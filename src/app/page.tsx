"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  FadeInSection,
  StaggerContainer,
  StaggerItem,
  GlowCard,
  AnimatedCounter,
  ParallaxSection,
  GradientText,
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
  Target,
  Sparkles,
  Globe,
  Lock,
  Cpu,
  BarChart3,
} from "lucide-react";

/* ---------- 3D Scene (dynamic, SSR off) ---------- */

const Canvas3D = dynamic(
  () => import("@react-three/fiber").then((m) => m.Canvas),
  { ssr: false },
);

function FloatingMesh() {
  const drei = require("@react-three/drei");
  const Float = drei.Float;
  const MeshDistortMaterial = drei.MeshDistortMaterial;
  return (
    <Float speed={1.5} rotationIntensity={0.4} floatIntensity={1.2}>
      <mesh scale={2.4}>
        <icosahedronGeometry args={[1, 4]} />
        <MeshDistortMaterial
          color="#10b981"
          roughness={0.2}
          metalness={0.8}
          distort={0.35}
          speed={1.5}
        />
      </mesh>
    </Float>
  );
}

function StarField() {
  const drei = require("@react-three/drei");
  const Stars = drei.Stars;
  return (
    <Stars radius={100} depth={60} count={1500} factor={4} saturation={0} fade speed={1} />
  );
}

function Scene3D() {
  return (
    <div className="absolute inset-0 opacity-60">
      <Suspense fallback={null}>
        <Canvas3D
          camera={{ position: [0, 0, 6], fov: 45 }}
          style={{ background: "transparent" }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.3} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <pointLight position={[-5, -5, -5]} color="#06b6d4" intensity={0.5} />
          <FloatingMesh />
          <StarField />
        </Canvas3D>
      </Suspense>
    </div>
  );
}

/* ---------- Data ---------- */

const features = [
  {
    icon: GitBranch,
    title: "Repository Discovery",
    description:
      "Search and discover GitHub repositories with intelligent filtering by language, activity, and technical domain.",
  },
  {
    icon: Shield,
    title: "License Verification",
    description:
      "Enforce an exact license allowlist with auditable verification against 45+ approved SPDX identifiers.",
  },
  {
    icon: Code2,
    title: "Deterministic LOC",
    description:
      "Count source lines of code at pinned commits with language-aware comment exclusion and reproducible results.",
  },
  {
    icon: FlaskConical,
    title: "Benchmark Generation",
    description:
      "Generate versioned benchmark packages with problem definitions, reproduction steps, and validation evidence.",
  },
  {
    icon: BookOpen,
    title: "Task Learning",
    description:
      "Upload approved tasks, extract concepts, and build a persistent knowledge base from reviewed solutions.",
  },
  {
    icon: Brain,
    title: "Knowledge Trees",
    description:
      "Navigate hierarchical concept trees with evidence-backed relationships across domains and topics.",
  },
  {
    icon: Network,
    title: "Concept Graph",
    description:
      "Explore cross-concept relationships with typed edges, confidence scores, and source evidence.",
  },
  {
    icon: FileEdit,
    title: "Smart Composer",
    description:
      "Generate original task submissions grounded in accumulated knowledge with requirement validation.",
  },
];

const pipelineSteps = [
  { label: "Discover", icon: GitBranch, color: "text-emerald-400" },
  { label: "License", icon: Shield, color: "text-cyan-400" },
  { label: "LOC", icon: Code2, color: "text-blue-400" },
  { label: "Analyze", icon: Zap, color: "text-violet-400" },
  { label: "Generate", icon: FlaskConical, color: "text-amber-400" },
  { label: "Validate", icon: CheckCircle2, color: "text-green-400" },
];

const stats = [
  { label: "Repositories Analyzed", value: 12400, suffix: "+" },
  { label: "Benchmarks Generated", value: 3800, suffix: "+" },
  { label: "License Checks / Day", value: 50000, suffix: "+" },
  { label: "Uptime", value: 99, suffix: ".9%" },
];

/* ---------- Page ---------- */

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      {/* ── Sticky Header ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-neutral-950/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 text-sm font-bold text-white">
              BF
            </div>
            <span className="text-lg font-semibold tracking-tight">BenchForge</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            {["Features", "Pipeline", "Stats", "Learning"].map((s) => (
              <a
                key={s}
                href={`#${s.toLowerCase()}`}
                className="text-sm text-neutral-400 transition-colors hover:text-white"
              >
                {s}
              </a>
            ))}
          </nav>
          <Link href="/dashboard">
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white hover:opacity-90"
            >
              Open Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(16,185,129,0.12),transparent)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(6,182,212,0.08),transparent)]" />

        {/* 3D Canvas */}
        <Scene3D />

        {/* Hero content */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Badge */}
            <motion.div
              className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-5 py-2 text-xs backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-neutral-300">AI-Powered Benchmark Intelligence</span>
            </motion.div>

            <h1 className="text-5xl font-bold leading-[1.1] tracking-tight md:text-7xl lg:text-8xl">
              Discover. Benchmark.
              <br />
              <GradientText className="mt-1">Learn. Generate.</GradientText>
            </h1>

            <motion.p
              className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-neutral-400 md:text-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Transform GitHub repositories into reproducible coding benchmarks.
              Learn from approved solutions to generate original, evidence-backed submissions.
            </motion.p>

            <motion.div
              className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <Link href="/dashboard">
                <button className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-shadow hover:shadow-xl hover:shadow-emerald-500/30">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, ease: "linear" }}
                    style={{ skewX: "-12deg" }}
                  />
                  <span className="relative z-10">Get Started</span>
                  <ArrowRight size={16} className="relative z-10 transition-transform group-hover:translate-x-0.5" />
                </button>
              </Link>
              <Link href="/repositories">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/[0.08] bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.06]"
                >
                  Explore Repositories
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-950" />
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="relative border-t border-white/[0.04] py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, i) => (
              <FadeInSection key={stat.label} delay={i * 0.1} className="text-center">
                <div className="text-4xl font-bold tracking-tight text-white md:text-5xl">
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} duration={2.5} />
                </div>
                <p className="mt-2 text-sm text-neutral-500">{stat.label}</p>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pipeline ── */}
      <section id="pipeline" className="relative border-t border-white/[0.04] py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(16,185,129,0.04),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <FadeInSection className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-emerald-400">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Eligibility Pipeline
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
              Every repository passes through deterministic gates. No score overrides license and
              LOC requirements.
            </p>
          </FadeInSection>

          <FadeInSection delay={0.2} className="mt-20">
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-2">
              {pipelineSteps.map((step, i) => (
                <React.Fragment key={step.label}>
                  <motion.div
                    className="flex flex-col items-center gap-3"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.12 }}
                  >
                    <div
                      className={`flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm ${step.color}`}
                    >
                      <step.icon size={26} />
                    </div>
                    <span className="text-xs font-medium text-neutral-300">{step.label}</span>
                  </motion.div>
                  {i < pipelineSteps.length - 1 && (
                    <motion.div
                      className="hidden h-px w-12 md:block lg:w-20"
                      style={{
                        background:
                          "linear-gradient(90deg, rgba(16,185,129,0.3), rgba(6,182,212,0.3))",
                      }}
                      initial={{ scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.12 + 0.1, duration: 0.5 }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative border-t border-white/[0.04] py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInSection className="text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
              Capabilities
            </p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
              Two Engines, One Platform
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
              Benchmark Intelligence discovers and validates. Learning Studio captures knowledge
              and generates.
            </p>
          </FadeInSection>

          <StaggerContainer className="mt-16 grid gap-5 md:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
            {features.map((feature) => (
              <StaggerItem key={feature.title}>
                <GlowCard>
                  <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-400">
                    <feature.icon size={20} />
                  </div>
                  <h3 className="mb-2 font-semibold text-neutral-100">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-400">
                    {feature.description}
                  </p>
                </GlowCard>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Learning Studio ── */}
      <section id="learning" className="relative border-t border-white/[0.04] py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_70%_50%,rgba(6,182,212,0.05),transparent)]" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <FadeInSection>
              <p className="text-sm font-medium uppercase tracking-widest text-cyan-400">
                Learning Studio
              </p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-5xl">
                Build Knowledge,{" "}
                <GradientText from="from-cyan-400" via="via-blue-400" to="to-violet-400">
                  Generate Solutions
                </GradientText>
              </h2>
              <p className="mt-6 text-lg leading-relaxed text-neutral-400">
                Upload approved task packages. Extract reusable concepts. Build persistent
                knowledge trees that power intelligent generation.
              </p>
              <ul className="mt-10 space-y-4">
                {[
                  "Upload PDFs, code, and documentation",
                  "Extract requirements and solution patterns",
                  "Build hierarchical knowledge trees",
                  "Cross-concept relationship graphs",
                  "Evidence-backed submission generation",
                  "Human review and feedback loops",
                ].map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-3 text-sm text-neutral-300"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
                    {item}
                  </motion.li>
                ))}
              </ul>
              <div className="mt-10">
                <Link href="/learning">
                  <Button
                    variant="outline"
                    className="gap-2 border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06]"
                  >
                    Open Learning Studio <ArrowRight size={16} />
                  </Button>
                </Link>
              </div>
            </FadeInSection>

            {/* Animated knowledge tree */}
            <FadeInSection delay={0.2}>
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm">
                <div className="space-y-4">
                  {[
                    { label: "Domain: Web Development", icon: Globe },
                    { label: "Topic: Authentication", icon: Lock },
                    { label: "Concept: JWT Token Validation", icon: Cpu },
                    { label: "Pattern: Middleware Guard", icon: Target },
                  ].map((node, i) => (
                    <motion.div
                      key={node.label}
                      className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-3.5 backdrop-blur-sm"
                      initial={{ opacity: 0, x: -24 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                      style={{ marginLeft: i * 20 }}
                    >
                      <node.icon size={14} className="text-cyan-400" />
                      <span className="text-sm text-neutral-300">{node.label}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Connecting lines (decorative) */}
                <div className="mt-6 flex items-center gap-3 px-4">
                  {[Sparkles, BarChart3, Rocket].map((Icon, i) => (
                    <motion.div
                      key={i}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-emerald-400"
                      initial={{ opacity: 0, scale: 0.5 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + i * 0.1 }}
                    >
                      <Icon size={16} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative border-t border-white/[0.04] py-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(16,185,129,0.06),transparent)]" />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <FadeInSection>
            <Sparkles className="mx-auto mb-6 h-10 w-10 text-emerald-400" />
            <h2 className="text-3xl font-bold tracking-tight md:text-5xl">
              Ready to transform your{" "}
              <GradientText>benchmark workflow</GradientText>?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-neutral-400">
              Start discovering repositories, generating benchmarks, and building knowledge trees
              in minutes.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/dashboard">
                <button className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-10 py-4 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition-shadow hover:shadow-xl hover:shadow-emerald-500/30">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 1,
                      ease: "linear",
                    }}
                    style={{ skewX: "-12deg" }}
                  />
                  <Rocket size={18} className="relative z-10" />
                  <span className="relative z-10">Launch Dashboard</span>
                </button>
              </Link>
              <Link href="/repositories">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06]"
                >
                  Explore Repositories
                </Button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative border-t border-white/[0.06] py-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500 text-xs font-bold text-white">
                BF
              </div>
              <span className="text-sm font-medium text-neutral-400">BenchForge</span>
            </div>
            <p className="text-xs text-neutral-600">
              AI-Powered GitHub Benchmark and Knowledge Learning Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
