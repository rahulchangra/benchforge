"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Shield,
  BookOpen,
  Brain,
  FlaskConical,
  CheckCircle2,
  ChevronDown,
  Menu,
  X,
  Package,
  Search,
  Send,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Star,
  FileCode,
  Microscope,
  Blocks,
  Workflow,
  ScanSearch,
  Scale,
  Sparkles,
  Download,
  Timer,
  Activity,
  Gauge,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  FadeInSection,
  StaggerContainer,
  StaggerItem,
  RevealOnScroll,
  AnimatedCounter,
} from "@/components/animations/motion-components";
import { CyberCore3D } from "@/components/ui/cyber-core-3d";
import * as Accordion from "@radix-ui/react-accordion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
} from "recharts";

/* ─── Marquee ─── */
const tickerItems = [
  "14.2K+ Repos Indexed",
  "3.8K+ Benchmarks Generated",
  "50K+ License Checks/Day",
  "45+ SPDX Licenses",
  "Zero AI Slop",
  "99.9% Deterministic Accuracy",
  "1-Click Export",
  "6 Quality Gates",
];

function MarqueeTicker() {
  const doubled = [...tickerItems, ...tickerItems, ...tickerItems];
  return (
    <div className="relative w-full overflow-hidden border-y border-neutral-800 bg-neutral-950/80 py-4">
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="mx-8 inline-flex items-center gap-2 text-sm font-medium text-neutral-400"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <FadeInSection className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div className="flex items-center gap-4">
        <span className="border-l-2 border-orange-500 pl-4 font-mono text-sm text-orange-500">
          {number}
        </span>
        <h2 className="text-lg font-medium uppercase tracking-wide text-neutral-400">
          {title}
        </h2>
      </div>
      <p className="max-w-xl text-sm leading-relaxed text-neutral-500 md:text-right">
        {description}
      </p>
    </FadeInSection>
  );
}

/* ─── SVG Icons for socials ─── */
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
function TwitterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}
function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}
function GmailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.545l8.073-6.052C21.69 2.28 24 3.434 24 5.457z" />
    </svg>
  );
}

/* ─── Donut Chart Component ─── */
function DonutChart({ data }: { data: { value: number; color: string; label: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  let cumulative = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-36 w-36">
      {data.map((d, i) => {
        const start = (cumulative / total) * 360;
        cumulative += d.value;
        const end = (cumulative / total) * 360;
        const startRad = ((start - 90) * Math.PI) / 180;
        const endRad = ((end - 90) * Math.PI) / 180;
        const r = 45;
        const cx = 60, cy = 60;
        const x1 = cx + r * Math.cos(startRad);
        const y1 = cy + r * Math.sin(startRad);
        const x2 = cx + r * Math.cos(endRad);
        const y2 = cy + r * Math.sin(endRad);
        const large = end - start > 180 ? 1 : 0;
        return (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
            fill={d.color}
            stroke="#0a0a0a"
            strokeWidth="2"
          />
        );
      })}
      <circle cx="60" cy="60" r="28" fill="#0a0a0a" />
    </svg>
  );
}

/* ─── Performance Data ─── */
const perfData = [
  { quarter: "Q1", value: 72 },
  { quarter: "Q2", value: 85 },
  { quarter: "Q3", value: 91 },
  { quarter: "Q4", value: 96 },
];

const evolutionMetrics = [
  { label: "Crawling", value: 94 },
  { label: "Verification", value: 98 },
  { label: "Synthesis", value: 86 },
  { label: "Export", value: 97 },
  { label: "Uptime", value: 99 },
];

/* ─── FAQ Data ─── */
const faqItems = [
  {
    q: "What exactly is BenchForge?",
    a: "BenchForge is an AI-powered platform that transforms GitHub repositories into reproducible coding benchmarks. It crawls real repos with \u2265 500 stars, extracts genuine issues with test-backed PRs, and outputs submission-ready packages \u2014 all with deterministic verification and zero AI-generated boilerplate.",
  },
  {
    q: "How does the benchmark pipeline work?",
    a: "Our 4-stage pipeline: Crawl (discover eligible repos) \u2192 Verify (SPDX license + LOC audit) \u2192 Synthesize (humanized prompts + test patches) \u2192 Export (Olympus-compliant ZIP). Every step is deterministic and auditable.",
  },
  {
    q: "What licenses are supported?",
    a: "We check against 45+ approved SPDX identifiers including MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, and MPL-2.0. Copyleft and ambiguous licenses are excluded with transparent decision logs.",
  },
  {
    q: "Is the output really free of AI slop?",
    a: "Yes. Every prompt is written in authentic open-source developer voice. We extract real issue descriptions from actual GitHub issues, not LLM-generated text. Test patches come from real merged PRs.",
  },
  {
    q: "How does Knowledge Studio work?",
    a: "Upload approved task packages (PDFs, code, docs). BenchForge extracts concepts, builds hierarchical knowledge trees with typed edges and confidence scores, and uses accumulated knowledge to generate original submissions.",
  },
  {
    q: "Can I self-host BenchForge?",
    a: "Yes. BenchForge ships with Docker Compose files for both development and production. You can run the entire stack locally with SQLite or connect to your own PostgreSQL instance.",
  },
];

/* ─── Testimonials ─── */
const testimonials = [
  {
    text: "BenchForge transformed our benchmark workflow. The deterministic pipeline means every output is reproducible and auditable. We went from spending days crafting challenges to generating them in minutes.",
    name: "Alex Chen",
    role: "Senior Engineer at CodeCraft",
  },
  {
    text: "The Knowledge Studio is a game-changer. Being able to upload approved tasks, extract patterns, and generate new submissions grounded in real evidence \u2014 that's something no other tool offers.",
    name: "Sarah Kim",
    role: "ML Research Lead",
  },
  {
    text: "Zero AI slop isn't just marketing \u2014 the prompts genuinely read like a real developer wrote them. The license auditing alone saves us hours per week.",
    name: "Marcus Wei",
    role: "Open Source Maintainer",
  },
];

/* ─── Pricing ─── */
const plans = [
  {
    tier: "Starter",
    audience: "For individual developers",
    price: 0,
    yearly: 0,
    features: [
      "10 repo crawls/day",
      "Basic license checks",
      "5 benchmark exports/mo",
      "Community support",
      "1 seat",
    ],
    seats: 1,
    cta: "Get Started Free",
  },
  {
    tier: "Pro",
    audience: "For serious benchmarkers",
    price: 29,
    yearly: 24,
    features: [
      "Unlimited crawls",
      "Full SPDX audit",
      "Unlimited exports",
      "Knowledge Studio access",
      "Priority support",
      "5 seats",
    ],
    seats: 5,
    cta: "Select Plan",
    popular: true,
  },
  {
    tier: "Enterprise",
    audience: "For teams & organizations",
    price: 99,
    yearly: 83,
    features: [
      "All Pro features",
      "Custom license policies",
      "API access",
      "Dedicated support",
      "Custom integrations",
      "25 seats",
    ],
    seats: 25,
    cta: "Select Plan",
  },
];

/* ═══════════════════════════════════════════════ */
/*  LANDING PAGE                                   */
/* ═══════════════════════════════════════════════ */

export default function LandingPage() {
  const [mobileNav, setMobileNav] = useState(false);
  const [yearly, setYearly] = useState(false);
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  const navLinks = [
    { label: "Work", href: "#work" },
    { label: "Services", href: "#services" },
    { label: "Process", href: "#process" },
    { label: "Analytics", href: "#analytics" },
    { label: "Pricing", href: "#pricing" },
    { label: "FAQ", href: "#faq" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-neutral-950 text-neutral-100">
      {/* ── Header ── */}
      <header className="fixed top-0 z-50 w-full border-b border-white/[0.06] bg-neutral-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500 text-sm font-bold text-white">
              BF
            </div>
            <span className="text-lg font-semibold tracking-tight">BenchForge</span>
          </Link>
          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-neutral-400 transition-colors hover:text-white"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden lg:block">
              <button className="rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-orange-600">
                Launch Dashboard
              </button>
            </Link>
            <button
              className="lg:hidden text-neutral-300"
              onClick={() => setMobileNav(!mobileNav)}
            >
              {mobileNav ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
        {/* Mobile nav */}
        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-neutral-800 bg-neutral-950 lg:hidden"
            >
              <div className="flex flex-col gap-4 p-6">
                {navLinks.map((l) => (
                  <a
                    key={l.label}
                    href={l.href}
                    onClick={() => setMobileNav(false)}
                    className="text-sm text-neutral-300 hover:text-white"
                  >
                    {l.label}
                  </a>
                ))}
                <Link href="/dashboard">
                  <button className="mt-2 w-full rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white">
                    Launch Dashboard
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-screen items-center overflow-hidden pt-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(249,115,22,0.08),transparent)]" />
        {/* Subtle grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="relative z-10 mx-auto max-w-7xl px-6 py-24 w-full">
          <div className="flex flex-col gap-16 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <motion.p
                className="mb-6 text-sm text-neutral-500"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                You build code,{" "}
                <span className="text-neutral-300 font-medium">we benchmark it.</span>
              </motion.p>
              <motion.h1
                className="text-5xl font-bold leading-[1.1] tracking-tight md:text-6xl lg:text-7xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {"\u2014 "}The smarter way to{" "}
                <em className="not-italic text-orange-500">discover, benchmark,</em> and{" "}
                <em className="not-italic text-orange-500">learn</em> from real code.
              </motion.h1>
              <motion.div
                className="mt-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <p className="mb-2 text-sm font-semibold text-neutral-200">
                  See BenchForge in action
                </p>
                <p className="mb-6 text-sm text-neutral-500">
                  Explore our benchmark pipeline live.
                </p>
                <Link href="/dashboard">
                  <button className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-orange-600">
                    <Workflow size={16} />
                    Launch Dashboard
                  </button>
                </Link>
              </motion.div>
            </div>
            {/* Right side: Cyber Core 3D */}
            <motion.div
              className="flex flex-col gap-4 lg:min-w-[500px] lg:h-[500px]"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
            >
              <div className="w-full h-full min-h-[400px] rounded-2xl border border-neutral-800 bg-neutral-900/60 backdrop-blur-sm overflow-hidden">
                <CyberCore3D className="w-full h-full" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Marquee ── */}
      <MarqueeTicker />

      {/* ── 001 Our Work ── */}
      <section id="work" className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            number="001"
            title="Our Work"
            description="Designed with precision, automated for reproducibility and built to help you benchmark faster, with zero AI slop."
          />

          {/* Featured Product */}
          <FadeInSection className="mb-12">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 md:p-12">
              <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
                <div className="max-w-lg">
                  <p className="mb-2 text-xs font-medium uppercase tracking-widest text-orange-500">
                    Featured Product
                  </p>
                  <h3 className="text-3xl font-bold text-white md:text-4xl">Benchmark Engine</h3>
                  <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                    Transform how your codebase is evaluated. Benchmark Engine combines deterministic
                    LOC counting with intelligent issue extraction to create reproducible challenge
                    packages.
                  </p>
                </div>
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-orange-500">
                  <ArrowRight size={24} className="text-white" />
                </div>
              </div>
            </div>
          </FadeInSection>

          {/* Product Lineup */}
          <FadeInSection delay={0.1} className="mb-4 flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Product Lineup{" "}
              <span className="ml-2 font-mono text-orange-500">4/4</span>
            </p>
          </FadeInSection>
          <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
            {[
              {
                icon: <Search size={20} />,
                title: "Repository Crawler",
                desc: "Automated discovery engine that indexes GitHub repos with \u2265 500 stars and permissive licenses.",
              },
              {
                icon: <Scale size={20} />,
                title: "License Auditor",
                desc: "Deterministic SPDX compliance checker against 45+ approved open-source licenses.",
              },
              {
                icon: <Brain size={20} />,
                title: "Knowledge Tree",
                desc: "Self-learning knowledge base that extracts concepts from approved task packages.",
              },
              {
                icon: <Package size={20} />,
                title: "Package Exporter",
                desc: "One-click Olympus-compliant ZIP export with task.md, test.patch, solution.patch, and Dockerfile.",
              },
            ].map((p) => (
              <StaggerItem key={p.title}>
                <div className="group relative rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 transition-colors hover:border-neutral-700">
                  <div className="mb-4 text-neutral-400">{p.icon}</div>
                  <h4 className="mb-2 font-semibold text-neutral-100">{p.title}</h4>
                  <p className="text-sm leading-relaxed text-neutral-500">{p.desc}</p>
                  <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white opacity-0 transition-opacity group-hover:opacity-100">
                    <ArrowRight size={16} />
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── 002 Services ── */}
      <section id="services" className="relative border-t border-neutral-800/50 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            number="002"
            title="Our Services"
            description="Flexible solutions for building modern benchmark infrastructure. Future-proof systems that scale seamlessly."
          />

          {/* Service list */}
          <div className="mb-16 space-y-0 border-t border-neutral-800">
            {[
              {
                num: "01",
                title: "Repository Intelligence",
                desc: "A smart crawler that discovers production GitHub repos, extracts closed issues with test-backed PRs, and indexes them for benchmark synthesis.",
                tag: "discovery",
              },
              {
                num: "02",
                title: "License & LOC Verification",
                desc: "Deterministic SPDX compliance and human-written LOC audit with language-aware comment exclusion.",
                tag: "verification",
              },
              {
                num: "03",
                title: "Benchmark Synthesis",
                desc: "Produces genuine developer-voice prompts, isolated test.patch diffs, and targeted minimal fixes without AI boilerplate.",
                tag: "synthesis",
              },
              {
                num: "04",
                title: "Knowledge Learning",
                desc: "Uploads approved tasks, extracts reusable concepts, builds persistent knowledge trees for intelligent generation.",
                tag: "learning",
              },
            ].map((s) => (
              <RevealOnScroll key={s.num}>
                <div className="group flex flex-col gap-4 border-b border-neutral-800 py-8 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-6">
                    <span className="font-mono text-sm text-orange-500">{s.num}</span>
                    <h3 className="text-xl font-semibold text-neutral-100 md:text-2xl">
                      {s.title}
                    </h3>
                  </div>
                  <p className="max-w-md text-sm text-neutral-500 md:text-right">{s.desc}</p>
                  <span className="rounded-full border border-neutral-700 px-3 py-1 text-xs text-neutral-500">
                    {s.tag}
                  </span>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          {/* Core Services card */}
          <FadeInSection>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8">
              <p className="mb-2 text-sm text-neutral-500">
                Core Services{" "}
                <span className="ml-2 font-mono text-orange-500">4/4</span>
              </p>
              <h3 className="text-xl font-semibold text-neutral-200">
                Modular, deterministic tools for modern benchmark infrastructure
              </h3>
              <p className="mt-4 text-sm text-neutral-500">
                We create reproducible systems that scale seamlessly and adapt to your evaluation
                needs. BenchForge{"'"}s key capabilities: discover, verify, synthesize, and export.
              </p>
              <Link href="/dashboard">
                <button className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-orange-500 transition-colors hover:text-orange-400">
                  Explore Services in Depth <ArrowRight size={14} />
                </button>
              </Link>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── 003 Process ── */}
      <section id="process" className="relative border-t border-neutral-800/50 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            number="003"
            title="Our Process"
            description="Optimized processes through deterministic workflows. Seamless operations from crawl to export."
          />

          <div className="grid gap-6 md:grid-cols-2">
            {[
              {
                step: "Step 1 \u2014 Smart Crawl",
                desc: "BenchForge's crawler analyzes GitHub searching for repos \u2265 500 stars with permissive licenses and real test suites. One query discovers thousands of eligible repositories.",
                metric: "14.2k",
                metricLabel: "repos indexed",
                time: "30",
                timeUnit: "sec",
                timeLabel: "Average crawl time",
              },
              {
                step: "Step 2 \u2014 Verify & Audit",
                desc: "Deterministic license check against 45+ SPDX identifiers plus language-aware LOC counting at pinned commits.",
                metric: "45+",
                metricLabel: "licenses checked",
                time: "< 1",
                timeUnit: "sec",
                timeLabel: "Per check",
              },
              {
                step: "Step 3 \u2014 Synthesize Benchmark",
                desc: "Extract real issues, generate humanized prompts, isolate test patches, and produce minimal solution diffs.",
                metric: "100%",
                metricLabel: "human voice",
                time: "0%",
                timeUnit: "",
                timeLabel: "AI slop",
              },
              {
                step: "Step 4 \u2014 Export Package",
                desc: "Bundle into Olympus-compliant ZIP with automated quality checks and deterministic scoring.",
                metric: "6",
                metricLabel: "quality checks",
                time: "1-click",
                timeUnit: "",
                timeLabel: "export",
              },
            ].map((s, i) => (
              <RevealOnScroll key={i} delay={i * 0.1}>
                <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8">
                  <p className="mb-4 text-sm font-semibold text-orange-500">{s.step}</p>
                  <p className="mb-6 text-sm leading-relaxed text-neutral-400">{s.desc}</p>
                  <div className="flex items-end gap-8">
                    <div>
                      <p className="text-3xl font-bold text-white">{s.metric}</p>
                      <p className="text-xs text-neutral-600">{s.metricLabel}</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {s.time}
                        {s.timeUnit && (
                          <span className="ml-1 text-sm text-neutral-500">{s.timeUnit}</span>
                        )}
                      </p>
                      <p className="text-xs text-neutral-600">{s.timeLabel}</p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            ))}
          </div>

          <FadeInSection delay={0.3} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600">
                Launch Dashboard
              </button>
            </Link>
            <p className="text-sm text-neutral-600">
              Questions about our process? We{"'"}re here to help.
            </p>
          </FadeInSection>
        </div>
      </section>

      {/* ── 004 Smart Analytics ── */}
      <section id="analytics" className="relative border-t border-neutral-800/50 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            number="004"
            title="Smart Analytics"
            description="Monitor pipeline performance with actionable data insights. Real-time metrics that help you make better decisions, faster."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {/* System Health */}
            <FadeInSection className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500">
                System Health
              </p>
              <p className="mb-4 text-xs text-neutral-600">Real-time pipeline vitals</p>
              <div className="flex items-center gap-6">
                <DonutChart
                  data={[
                    { value: 72, color: "#f97316", label: "Optimal" },
                    { value: 22, color: "#525252", label: "Stable" },
                    { value: 6, color: "#a3a3a3", label: "Processing" },
                  ]}
                />
                <div className="space-y-2">
                  {[
                    { pct: "72%", label: "Optimal", color: "text-orange-500" },
                    { pct: "22%", label: "Stable", color: "text-neutral-400" },
                    { pct: "6%", label: "Processing", color: "text-neutral-500" },
                  ].map((h) => (
                    <div key={h.label} className="flex items-center gap-2">
                      <span className={cn("text-sm font-bold", h.color)}>{h.pct}</span>
                      <span className="text-xs text-neutral-500">{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </FadeInSection>

            {/* Response Times */}
            <FadeInSection delay={0.1} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <p className="mb-4 text-xs uppercase tracking-widest text-neutral-500">
                Response Time Optimization
              </p>
              <div className="space-y-6">
                {[
                  { region: "GitHub API", tz: "", from: "24ms", to: "11ms", status: "Enhanced", dots: 3 },
                  { region: "NPM Registry", tz: "", from: "37ms", to: "19ms", status: "Optimized", dots: 4 },
                  { region: "Crawler Engine", tz: "", from: "120ms", to: "45ms", status: "Scaling", dots: 2 },
                ].map((r) => (
                  <div key={r.region}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-neutral-300">{r.region}</span>
                      <span className="text-xs text-neutral-600">{r.status}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      {Array.from({ length: r.dots }).map((_, i) => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                      ))}
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {r.from} {"\u2192"} {r.to}
                    </p>
                  </div>
                ))}
              </div>
            </FadeInSection>

            {/* Evolution Score */}
            <FadeInSection delay={0.2} className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500">
                System Evolution
              </p>
              <p className="mb-4 text-xs text-neutral-600">The pulse of progress</p>
              <div className="mb-4 flex items-baseline gap-1">
                <span className="text-4xl font-bold text-white">91</span>
                <span className="text-lg text-neutral-500">/</span>
                <span className="text-lg text-neutral-500">100</span>
              </div>
              <div className="space-y-3">
                {evolutionMetrics.map((m) => (
                  <div key={m.label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-neutral-400">{m.label}</span>
                      <span className="text-neutral-500">{m.value}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-800">
                      <motion.div
                        className="h-full rounded-full bg-orange-500"
                        initial={{ width: 0 }}
                        whileInView={{ width: `${m.value}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </FadeInSection>
          </div>

          {/* Performance chart */}
          <FadeInSection delay={0.15} className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <p className="mb-1 text-xs uppercase tracking-widest text-neutral-500">
                Performance
              </p>
              <p className="mb-4 text-xs text-neutral-600">Quarterly benchmark throughput</p>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perfData}>
                    <XAxis dataKey="quarter" tick={{ fill: "#737373", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#525252", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {perfData.map((_, i) => (
                        <Cell key={i} fill={i === perfData.length - 1 ? "#f97316" : "#404040"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
              <p className="mb-4 text-xs uppercase tracking-widest text-neutral-500">
                Global Pipeline Status
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Repos Analyzed", value: "14.2K+", color: "text-orange-500" },
                  { label: "Benchmarks Built", value: "3.8K+", color: "text-white" },
                  { label: "License Checks", value: "50K+/day", color: "text-white" },
                  { label: "Uptime", value: "99.9%", color: "text-orange-500" },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
                    <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                    <p className="mt-1 text-xs text-neutral-600">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Second Marquee ── */}
      <MarqueeTicker />

      {/* ── 005 Pricing ── */}
      <section id="pricing" className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            number="005"
            title="Pricing"
            description="Flexible, transparent plans. Built for clarity and growth. Scale at your own pace."
          />

          {/* Toggle */}
          <FadeInSection className="mb-12 flex justify-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-neutral-800 bg-neutral-900/60 px-4 py-2">
              <button
                onClick={() => setYearly(false)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  !yearly ? "bg-orange-500 text-white" : "text-neutral-400 hover:text-white",
                )}
              >
                Monthly
              </button>
              <button
                onClick={() => setYearly(true)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  yearly ? "bg-orange-500 text-white" : "text-neutral-400 hover:text-white",
                )}
              >
                Yearly
              </button>
              {yearly && (
                <span className="text-xs text-orange-500">You save 16%</span>
              )}
            </div>
          </FadeInSection>

          <StaggerContainer className="grid gap-6 md:grid-cols-3" staggerDelay={0.1}>
            {plans.map((plan) => (
              <StaggerItem key={plan.tier}>
                <div
                  className={cn(
                    "relative rounded-2xl border p-8 transition-colors",
                    plan.popular
                      ? "border-orange-500/50 bg-neutral-900/60"
                      : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700",
                  )}
                >
                  {plan.popular && (
                    <span className="absolute -top-3 left-6 rounded-full bg-orange-500 px-3 py-0.5 text-xs font-medium text-white">
                      Popular
                    </span>
                  )}
                  <p className="text-xs text-neutral-500">{plan.audience}</p>
                  <h3 className="mt-2 text-xl font-bold text-white">{plan.tier}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-white">
                      ${yearly ? plan.yearly : plan.price}
                    </span>
                    <span className="text-sm text-neutral-500">/mo</span>
                  </div>
                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-neutral-400">
                        <CheckCircle2 size={14} className="shrink-0 text-orange-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    className={cn(
                      "mt-8 w-full rounded-full py-2.5 text-sm font-semibold transition-colors",
                      plan.popular
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "border border-neutral-700 text-neutral-300 hover:border-neutral-600 hover:text-white",
                    )}
                  >
                    {plan.cta}
                  </button>
                  <p className="mt-3 text-center text-xs text-neutral-600">
                    Seats: {plan.seats}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* ── 006 FAQ ── */}
      <section id="faq" className="relative border-t border-neutral-800/50 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            number="006"
            title="Questions & Answers"
            description="Simple explanations to help you get started faster. Spend less time guessing and more time benchmarking."
          />

          <FadeInSection>
            <Accordion.Root type="single" collapsible className="space-y-0 border-t border-neutral-800">
              {faqItems.map((item, i) => (
                <Accordion.Item
                  key={i}
                  value={`faq-${i}`}
                  className="border-b border-neutral-800"
                >
                  <Accordion.Trigger className="group flex w-full items-center justify-between py-6 text-left">
                    <span className="text-sm font-medium text-neutral-200 transition-colors group-hover:text-white md:text-base">
                      {item.q}
                    </span>
                    <ChevronDown
                      size={16}
                      className="shrink-0 text-neutral-500 transition-transform duration-200 group-data-[state=open]:rotate-180"
                    />
                  </Accordion.Trigger>
                  <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <p className="pb-6 text-sm leading-relaxed text-neutral-500">{item.a}</p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </FadeInSection>

          <FadeInSection delay={0.2} className="mt-12 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-200">You still have questions?</p>
                <p className="mt-1 text-sm text-neutral-500">
                  Let our experts show you how BenchForge can work for your specific requirements.
                </p>
              </div>
              <a href="#contact">
                <button className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600">
                  Let{"'"}s have a chat
                </button>
              </a>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── 007 Team ── */}
      <section id="team" className="relative border-t border-neutral-800/50 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            number="007"
            title="Meet the Team"
            description="We shape BenchForge every day, focusing on clear decisions and getting things done right."
          />

          <FadeInSection>
            <div className="mx-auto max-w-2xl rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 md:p-12">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
                <Users size={28} />
              </div>
              <h3 className="text-xl font-bold text-white">Rahul Changra</h3>
              <p className="mt-1 text-sm text-orange-500">Founder & Lead Engineer</p>
              <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                I built BenchForge to fundamentally change how coding benchmarks are created. As the
                lead architect, I designed the deterministic pipeline, the knowledge learning system,
                and the Olympus-compliant export engine. My focus is on building tools that produce
                real, verifiable outputs {"\u2014"} zero AI slop, zero hallucinated boilerplate.
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── 008 Testimonials ── */}
      <section className="relative border-t border-neutral-800/50 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeader
            number="008"
            title="What Our Users Say"
            description="Trusted by engineers and teams that value speed, reproducibility, and zero AI slop."
          />

          <FadeInSection>
            <div className="relative mx-auto max-w-3xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonialIdx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-8 md:p-12"
                >
                  <Sparkles size={24} className="mb-6 text-orange-500" />
                  <p className="text-lg leading-relaxed text-neutral-300 md:text-xl">
                    {"\u201C"}{testimonials[testimonialIdx].text}{"\u201D"}
                  </p>
                  <div className="mt-8">
                    <p className="font-semibold text-white">
                      {testimonials[testimonialIdx].name}
                    </p>
                    <p className="text-sm text-neutral-500">
                      {testimonials[testimonialIdx].role}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  onClick={() =>
                    setTestimonialIdx((p) => (p === 0 ? testimonials.length - 1 : p - 1))
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex gap-2">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setTestimonialIdx(i)}
                      className={cn(
                        "h-2 w-2 rounded-full transition-colors",
                        i === testimonialIdx ? "bg-orange-500" : "bg-neutral-700",
                      )}
                    />
                  ))}
                </div>
                <button
                  onClick={() =>
                    setTestimonialIdx((p) => (p === testimonials.length - 1 ? 0 : p + 1))
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-neutral-400 transition-colors hover:border-neutral-600 hover:text-white"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── Let's Talk / Contact ── */}
      <section id="contact" className="relative border-t border-neutral-800/50 py-28">
        <div className="mx-auto max-w-7xl px-6">
          <FadeInSection>
            <h2 className="text-6xl font-bold text-orange-500 md:text-8xl lg:text-9xl">
              Let{"'"}s Talk.
            </h2>
          </FadeInSection>

          <div className="mt-16 grid gap-12 md:grid-cols-2">
            {/* Left col */}
            <FadeInSection delay={0.1}>
              <div className="space-y-8">
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-neutral-300">Follow us</h3>
                  <div className="flex items-center gap-4">
                    {[
                      { icon: <GithubIcon className="h-5 w-5" />, label: "GitHub", href: "https://github.com/rahulchangra" },
                      { icon: <LinkedinIcon className="h-5 w-5" />, label: "LinkedIn", href: "https://www.linkedin.com/in/rahul-changra-0b0217218/" },
                      { icon: <GmailIcon className="h-5 w-5" />, label: "Gmail", href: "mailto:changrarahul55@gmail.com" },
                    ].map((s) => (
                      <a
                        key={s.label}
                        href={s.href || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-800 text-neutral-400 transition-colors hover:border-neutral-700 hover:text-white"
                      >
                        {s.icon}
                      </a>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="mb-4 text-sm font-semibold text-neutral-300">What we offer</h3>
                  <ul className="space-y-2">
                    {[
                      "Deterministic benchmark generation",
                      "Real-time repository intelligence",
                      "Knowledge-driven learning",
                      "Automated package export",
                      "Around-the-clock monitoring",
                    ].map((o) => (
                      <li key={o} className="flex items-center gap-2 text-sm text-neutral-500">
                        <span className="h-1 w-1 rounded-full bg-neutral-600" />
                        {o}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </FadeInSection>

            {/* Right col: Contact form */}
            <FadeInSection delay={0.2}>
              <div>
                <p className="mb-2 text-sm text-neutral-400">
                  Got a question, challenge, or idea?
                </p>
                <p className="mb-8 text-xs text-neutral-600">
                  Fill out the form {"\u2014"} we{"'"}ll get back to you shortly.
                </p>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                  }}
                >
                  {["Your Name", "Your Email", "Your Company"].map((ph) => (
                    <input
                      key={ph}
                      type={ph === "Your Email" ? "email" : "text"}
                      placeholder={ph}
                      className="w-full border-b border-neutral-800 bg-transparent py-3 text-sm text-neutral-200 placeholder-neutral-600 outline-none transition-colors focus:border-orange-500"
                    />
                  ))}
                  <textarea
                    placeholder="Your Message"
                    rows={4}
                    className="w-full border-b border-neutral-800 bg-transparent py-3 text-sm text-neutral-200 placeholder-neutral-600 outline-none transition-colors focus:border-orange-500 resize-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-orange-600"
                  >
                    <Send size={14} />
                    Send Message
                  </button>
                </form>
              </div>
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-neutral-800 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-500 text-xs font-bold text-white">
                BF
              </div>
              <span className="text-sm font-medium text-neutral-400">BenchForge</span>
            </div>
            <nav className="flex flex-wrap gap-6">
              {[
                { label: "Dashboard", href: "/dashboard" },
                { label: "Projects", href: "/projects" },
                { label: "Knowledge Base", href: "/learning" },
                { label: "Repositories", href: "/repositories" },
              ].map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-sm text-neutral-500 transition-colors hover:text-neutral-300"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="mt-8 border-t border-neutral-800/50 pt-8">
            <p className="text-xs text-neutral-600">
              {"\u00A9"} {new Date().getFullYear()} BenchForge. AI-Powered GitHub Benchmark & Knowledge Learning Platform.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
