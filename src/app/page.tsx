"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/animations/motion-components";
import {
  GitBranch, Shield, Code2, FlaskConical, BookOpen, Brain,
  Network, FileEdit, ArrowRight, CheckCircle2, Zap,
} from "lucide-react";

const features = [
  { icon: GitBranch, title: "Repository Discovery", description: "Search and discover GitHub repositories with intelligent filtering by language, activity, and technical domain." },
  { icon: Shield, title: "License Verification", description: "Enforce an exact license allowlist with auditable verification against 45+ approved SPDX identifiers." },
  { icon: Code2, title: "Deterministic LOC", description: "Count source lines of code at pinned commits with language-aware comment exclusion and reproducible results." },
  { icon: FlaskConical, title: "Benchmark Generation", description: "Generate versioned benchmark packages with problem definitions, reproduction steps, and validation evidence." },
  { icon: BookOpen, title: "Task Learning", description: "Upload approved tasks, extract concepts, and build a persistent knowledge base from reviewed solutions." },
  { icon: Brain, title: "Knowledge Trees", description: "Navigate hierarchical concept trees with evidence-backed relationships across domains and topics." },
  { icon: Network, title: "Concept Graph", description: "Explore cross-concept relationships with typed edges, confidence scores, and source evidence." },
  { icon: FileEdit, title: "Smart Composer", description: "Generate original task submissions grounded in accumulated knowledge with requirement validation." },
];

const pipelineSteps = [
  { label: "Discover", icon: GitBranch },
  { label: "License", icon: Shield },
  { label: "LOC", icon: Code2 },
  { label: "Analyze", icon: Zap },
  { label: "Generate", icon: FlaskConical },
  { label: "Validate", icon: CheckCircle2 },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed top-0 z-50 w-full border-b border-neutral-800/50 bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">BF</div>
            <span className="text-lg font-semibold">BenchForge</span>
          </div>
          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors">Features</a>
            <a href="#pipeline" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors">Pipeline</a>
            <a href="#learning" className="text-sm text-neutral-400 hover:text-neutral-200 transition-colors">Learning Studio</a>
          </nav>
          <Link href="/dashboard"><Button size="sm">Open Dashboard</Button></Link>
        </div>
      </header>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.08),transparent_70%)]" />
        <div className="relative mx-auto max-w-5xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900/50 px-4 py-1.5 text-xs text-neutral-400">
              <span className="flex h-1.5 w-1.5 rounded-full bg-green-500" />
              AI-Powered Benchmark Intelligence
            </div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Discover. Benchmark.<br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Learn. Generate.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-400 md:text-xl">
              Transform GitHub repositories into reproducible coding benchmarks.
              Learn from approved solutions to generate original, evidence-backed submissions.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/dashboard"><Button size="lg" className="gap-2">Get Started <ArrowRight size={18} /></Button></Link>
              <Link href="/repositories"><Button variant="outline" size="lg">Explore Repositories</Button></Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="pipeline" className="border-t border-neutral-800 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInSection className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Eligibility Pipeline</h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-400">Every repository passes through deterministic gates. No score overrides license and LOC requirements.</p>
          </FadeInSection>
          <FadeInSection delay={0.2} className="mt-16">
            <div className="flex items-center justify-between gap-2 overflow-x-auto py-4">
              {pipelineSteps.map((step, i) => (
                <div key={step.label} className="flex items-center gap-2">
                  <motion.div className="flex flex-col items-center gap-2" initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }}>
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-neutral-700 bg-neutral-900 text-blue-400"><step.icon size={24} /></div>
                    <span className="text-xs font-medium text-neutral-300">{step.label}</span>
                  </motion.div>
                  {i < pipelineSteps.length - 1 && <div className="mx-1 h-px w-8 bg-neutral-700 md:w-16" />}
                </div>
              ))}
            </div>
          </FadeInSection>
        </div>
      </section>

      <section id="features" className="border-t border-neutral-800 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInSection className="text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Two Engines, One Platform</h2>
            <p className="mx-auto mt-4 max-w-2xl text-neutral-400">Benchmark Intelligence discovers and validates. Learning Studio captures knowledge and generates.</p>
          </FadeInSection>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, i) => (
              <FadeInSection key={feature.title} delay={i * 0.08}>
                <div className="group rounded-xl border border-neutral-800 bg-neutral-900/30 p-6 transition-colors hover:border-neutral-700 hover:bg-neutral-900/60">
                  <div className="mb-4 inline-flex rounded-lg bg-blue-600/10 p-2.5 text-blue-400 group-hover:bg-blue-600/20"><feature.icon size={20} /></div>
                  <h3 className="mb-2 font-semibold text-neutral-100">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-neutral-400">{feature.description}</p>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      <section id="learning" className="border-t border-neutral-800 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-12 md:grid-cols-2">
            <FadeInSection>
              <h2 className="text-3xl font-bold md:text-4xl">Learning Studio</h2>
              <p className="mt-4 text-neutral-400">Upload approved task packages. Extract reusable concepts. Build persistent knowledge trees.</p>
              <ul className="mt-8 space-y-4">
                {["Upload PDFs, code, and documentation", "Extract requirements and solution patterns", "Build hierarchical knowledge trees", "Cross-concept relationship graphs", "Evidence-backed submission generation", "Human review and feedback loops"].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-neutral-300">
                    <CheckCircle2 size={16} className="shrink-0 text-green-400" />{item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href="/learning"><Button variant="outline" className="gap-2">Open Learning Studio <ArrowRight size={16} /></Button></Link>
              </div>
            </FadeInSection>
            <FadeInSection delay={0.2}>
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900/30 p-8">
                <div className="space-y-4">
                  {["Domain: Web Development", "Topic: Authentication", "Concept: JWT Token Validation", "Pattern: Middleware Guard"].map((node, i) => (
                    <motion.div key={node} className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3"
                      initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                      style={{ marginLeft: i * 16 }}>
                      <Brain size={14} className="text-blue-400" />
                      <span className="text-sm text-neutral-300">{node}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      <footer className="border-t border-neutral-800 py-12">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-neutral-500">BenchForge - AI-Powered GitHub Benchmark and Knowledge Learning Platform</p>
        </div>
      </footer>
    </div>
  );
}
