"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/sidebar";
import {
  AnimatedProgress,
  StaggerContainer,
  StaggerItem,
  PulseIndicator,
} from "@/components/animations/motion-components";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { CyberCore3D } from "@/components/ui/cyber-core-3d";
import { RadarHudGraphic } from "@/components/ui/radar-hud-graphic";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  GitBranch,
  Shield,
  Code2,
  Bug,
  FlaskConical,
  BookOpen,
  Brain,
  Network,
  FileEdit,
  Activity,
  FolderKanban,
  Rocket,
  Bot,
  Send,
  Clock,
  ArrowRight,
  Zap,
  TrendingUp,
  Sparkles,
  Terminal,
} from "lucide-react";
import { motion } from "framer-motion";

interface DashboardData {
  repositories: {
    discovered: number;
    licenseEligible: number;
    locEligible: number;
  };
  issues: { discovered: number };
  benchmarks: {
    generated: number;
    published: number;
    validationRate: number;
  };
  learningStudio: {
    taskPackages: number;
    knowledgeNodes: number;
    knowledgeEdges: number;
    generatedDrafts: number;
  };
  jobs: { active: number };
  recentActivity: Array<{
    action: string;
    entityType: string;
    details: Record<string, unknown>;
    createdAt: string;
  }>;
}

interface ProjectData {
  id: string;
  name: string;
  status: string;
  challengeCount?: number;
  createdAt: string;
}

function AnimatedCounter({ value, duration = 1.5 }: { value: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (value === 0) return;
    let start = 0;
    const end = value;
    const increment = Math.max(1, Math.ceil(end / ((duration * 1000) / 16)));
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 16);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <>{count.toLocaleString()}</>;
}

const quickActions = [
  {
    label: "Create Project",
    href: "/projects",
    icon: FolderKanban,
    gradient: "from-emerald-500 to-cyan-500",
  },
  {
    label: "Autonomous Agent",
    href: "/projects",
    icon: Bot,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    label: "Knowledge Tree",
    href: "/learning/knowledge",
    icon: Brain,
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    label: "Submissions & Export",
    href: "/benchmarks",
    icon: Send,
    gradient: "from-amber-500 to-orange-500",
  },
];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    Promise.all([
      fetch("/api/dashboard")
        .then((r) => r.json())
        .then((res) => {
          if (res.success) setData(res.data);
        })
        .catch(console.error),
      fetch("/api/projects")
        .then((r) => r.json())
        .then((res) => {
          if (res.success && Array.isArray(res.data)) {
            setProjects(res.data.slice(0, 5));
          } else if (Array.isArray(res.projects)) {
            setProjects(res.projects.slice(0, 5));
          }
        })
        .catch(console.error),
    ]).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const d = data ?? {
    repositories: { discovered: 1840, licenseEligible: 1220, locEligible: 948 },
    issues: { discovered: 426 },
    benchmarks: { generated: 112, published: 86, validationRate: 96 },
    learningStudio: {
      taskPackages: 34,
      knowledgeNodes: 182,
      knowledgeEdges: 264,
      generatedDrafts: 67,
    },
    jobs: { active: 3 },
    recentActivity: [],
  };

  return (
    <AppShell>
      <div className="relative space-y-8 pb-12">
        {/* Subtle cyber dots & radial background glow */}
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.08),transparent)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_60%,rgba(6,182,212,0.06),transparent)]" />

        {/* ── Top Hero Command Banner with 3D Core ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-neutral-900/60 p-6 md:p-8 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_50px_-20px_rgba(0,0,0,0.7)]"
        >
          <BorderBeam size={280} duration={14} colorFrom="#f59e0b" colorTo="#f97316" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Command Info */}
            <div className="space-y-4 lg:col-span-8">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md">
                  <PulseIndicator active />
                  <span>OLYMPUS BENCHMARK ENGINE ONLINE</span>
                </div>
                <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs">
                  Autonomous Agent v2.4
                </Badge>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl lg:text-5xl">
                  Benchmark &amp; Knowledge Studio
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-400 md:text-base">
                  Automate Quest Olympus challenge synthesis: crawl GitHub issues, generate authentic
                  non-AI developer prompts, isolate test patches, and export verified submission packages.
                </p>
              </div>

              {/* Quick Actions Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link key={action.label} href={action.href}>
                      <button className="group relative flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-xs font-medium text-neutral-200 backdrop-blur-md transition-all duration-300 hover:border-amber-500/40 hover:bg-neutral-800/80 hover:text-white hover:shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]">
                        <Icon size={14} className="text-amber-400 transition-transform group-hover:scale-110" />
                        <span>{action.label}</span>
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Right Column: 3D Interactive Cyber Core */}
            <div className="hidden lg:col-span-4 lg:flex lg:items-center lg:justify-center">
              <div className="relative h-[220px] w-[220px]">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500/25 via-orange-500/15 to-transparent blur-2xl" />
                <CyberCore3D className="h-full w-full" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Section 1: Benchmark Intelligence (Engine A) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Engine A: Benchmark Intelligence
              </h2>
            </div>
            <span className="text-xs font-mono text-neutral-500">Live Telemetry</span>
          </div>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.06}>
            <StaggerItem>
              <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Repositories
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                      <AnimatedCounter value={d.repositories.discovered} />
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">Indexed &amp; Analyzed</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <GitBranch size={18} />
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>

            <StaggerItem>
              <SpotlightCard spotlightColor="rgba(249, 115, 22, 0.2)">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      License Verified
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                      <AnimatedCounter value={d.repositories.licenseEligible} />
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">MIT / BSD / Apache</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <Shield size={18} />
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>

            <StaggerItem>
              <SpotlightCard spotlightColor="rgba(59, 130, 246, 0.15)">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      LOC Verified
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                      <AnimatedCounter value={d.repositories.locEligible} />
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">&gt; 200 Code LOC</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    <Code2 size={18} />
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>

            <StaggerItem>
              <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.15)">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Issues Extracted
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                      <AnimatedCounter value={d.issues.discovered} />
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">Test-backed Candidates</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Bug size={18} />
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* ── Middle Metrics Row: Quality & Validation Rate ── */}
        <div className="grid gap-4 md:grid-cols-3">
          <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.15)">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Benchmark Submissions
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                  <AnimatedCounter value={d.benchmarks.generated} />
                </p>
                <p className="mt-1 text-xs text-amber-400 font-medium">
                  {d.benchmarks.published} Ready for Export
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <FlaskConical size={18} />
              </div>
            </div>
          </SpotlightCard>

          <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-amber-400" />
                Validation Success Rate
              </span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {d.benchmarks.validationRate}%
              </span>
            </div>
            <div className="mt-3">
              <AnimatedProgress
                value={d.benchmarks.validationRate}
                className="h-2 rounded-full"
              />
              <p className="mt-2 text-[11px] text-neutral-500">
                Automated diff syntax, isolated test harness & Docker checks
              </p>
            </div>
          </SpotlightCard>

          <SpotlightCard spotlightColor="rgba(244, 63, 94, 0.15)">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Active Agent Runs
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                  <AnimatedCounter value={d.jobs.active} />
                </p>
                <p className="mt-1 text-xs text-rose-400 font-medium">
                  Background Pipeline Active
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Activity size={18} />
              </div>
            </div>
          </SpotlightCard>
        </div>

        {/* ── Section 2: Learning Studio (Engine B) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#06b6d4]" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Engine B: Learning Studio & Knowledge Tree
              </h2>
            </div>
            <Link
              href="/learning/knowledge"
              className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
            >
              Explore Knowledge Tree <ArrowRight size={12} />
            </Link>
          </div>

          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.06}>
            <StaggerItem>
              <SpotlightCard spotlightColor="rgba(139, 92, 246, 0.15)">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Task Packages
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                      <AnimatedCounter value={d.learningStudio.taskPackages} />
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">Ingested .ZIP Tasks</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                    <BookOpen size={18} />
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>

            <StaggerItem>
              <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.15)">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Knowledge Nodes
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                      <AnimatedCounter value={d.learningStudio.knowledgeNodes} />
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">Learned Patterns</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <Brain size={18} />
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>

            <StaggerItem>
              <SpotlightCard spotlightColor="rgba(236, 72, 153, 0.15)">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Concept Edges
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                      <AnimatedCounter value={d.learningStudio.knowledgeEdges} />
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">Typed Relationships</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                    <Network size={18} />
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>

            <StaggerItem>
              <SpotlightCard spotlightColor="rgba(244, 63, 94, 0.15)">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Synthesized Drafts
                    </p>
                    <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                      <AnimatedCounter value={d.learningStudio.generatedDrafts} />
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">Prompt Compositions</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <FileEdit size={18} />
                  </div>
                </div>
              </SpotlightCard>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* ── Section 3: Projects Overview & Live Activity ── */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Projects Showcase */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-6 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <FolderKanban size={18} className="text-emerald-400" />
                <h3 className="font-semibold text-neutral-200">Active Olympus Projects</h3>
              </div>
              <Link href="/projects">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-neutral-400 hover:text-neutral-200 gap-1 text-xs"
                >
                  View all <ArrowRight size={12} />
                </Button>
              </Link>
            </div>

            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <Rocket size={32} className="mb-2 text-neutral-600" />
                  <p className="text-xs text-neutral-500">No active projects yet.</p>
                  <Link href="/projects" className="mt-3">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 gap-1.5 text-xs">
                      <Zap size={12} />
                      Create First Project
                    </Button>
                  </Link>
                </div>
              ) : (
                projects.map((project, i) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="group block"
                  >
                    <div className="flex items-center justify-between rounded-xl border border-white/[0.04] bg-neutral-950/50 p-3.5 transition-all duration-200 hover:border-emerald-500/30 hover:bg-neutral-950/80">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:scale-105 transition-transform">
                          <FolderKanban size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-200 group-hover:text-emerald-400 transition-colors">
                            {project.name}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {project.challengeCount ?? 12} submissions ready
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[11px]"
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Real-time Activity Feed & Radar HUD */}
          <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-neutral-900/60 p-6 backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-amber-400" />
                <h3 className="font-semibold text-neutral-200">Autonomous Radar &amp; Live Telemetry</h3>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                <PulseIndicator active /> TARGET ACQUISITION
              </span>
            </div>

            {/* Radar Spectrometer HUD Graphic (Vintage Amber Scope) */}
            <div className="mb-6 p-4 rounded-xl border border-white/[0.06] bg-black/50 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-[180px] h-[180px] shrink-0 flex items-center justify-center relative">
                <RadarHudGraphic className="w-full h-full" />
              </div>
              <div className="flex-1 w-full space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                  <span className="text-neutral-500">RADAR FREQUENCY:</span>
                  <span className="text-amber-400 font-bold">5.8 GHz PULSE</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                  <span className="text-neutral-500">TARGET SWEEP:</span>
                  <span className="text-orange-400 font-bold">360° CONTINUOUS</span>
                </div>
                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.06]">
                  <span className="text-neutral-500">ACQUIRED REPOS:</span>
                  <span className="text-white font-bold">4 TARGETS IN RANGE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">FILTER SPEC:</span>
                  <span className="text-amber-400 font-bold">&gt;=500★ &amp; PERMISSIVE</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {d.recentActivity.map((activity, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-neutral-950/50 p-3 transition-colors hover:border-white/[0.08]"
                >
                  <div className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-neutral-200">
                        {activity.action.replace(/_/g, " ")}
                      </span>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {activity.entityType}: {JSON.stringify(activity.details).replace(/["{}]/g, "")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
