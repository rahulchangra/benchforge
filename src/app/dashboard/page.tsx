"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/sidebar";
import {
  MetricCard,
  AnimatedProgress,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/motion-components";
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

  return <>{count}</>;
}

function GlassMetricCard({
  title,
  value,
  icon,
  subtitle,
  gradient = "from-emerald-500 to-cyan-500",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  subtitle?: string;
  gradient?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-xl border border-neutral-800/50 bg-neutral-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-neutral-700/50 hover:bg-neutral-900/70"
    >
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-neutral-100">
            <AnimatedCounter value={typeof value === "number" ? value : 0} />
          </p>
          {subtitle && <p className="mt-1 text-xs text-neutral-500">{subtitle}</p>}
        </div>
        <div
          className={`rounded-lg bg-gradient-to-br ${gradient} p-2.5 text-white shadow-lg opacity-80`}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

const quickActions = [
  {
    label: "New Project",
    href: "/projects",
    icon: FolderKanban,
    gradient: "from-emerald-500 to-cyan-500",
  },
  {
    label: "Start Agent",
    href: "/jobs",
    icon: Bot,
    gradient: "from-violet-500 to-purple-500",
  },
  {
    label: "View Submissions",
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
    repositories: { discovered: 0, licenseEligible: 0, locEligible: 0 },
    issues: { discovered: 0 },
    benchmarks: { generated: 0, published: 0, validationRate: 0 },
    learningStudio: {
      taskPackages: 0,
      knowledgeNodes: 0,
      knowledgeEdges: 0,
      generatedDrafts: 0,
    },
    jobs: { active: 0 },
    recentActivity: [],
  };

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-neutral-400">
            Overview of benchmark generation and learning studio activity.
          </p>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex flex-wrap gap-3"
        >
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.label} href={action.href}>
                <Button
                  variant="outline"
                  className="gap-2 border-neutral-800 bg-neutral-900/50 text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100 transition-all duration-200"
                >
                  <Icon size={16} />
                  {action.label}
                </Button>
              </Link>
            );
          })}
        </motion.div>

        {/* Engine A: Benchmark Intelligence */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4 text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
          >
            Benchmark Intelligence
          </motion.h2>
          <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <GlassMetricCard
                title="Repositories"
                value={d.repositories.discovered}
                icon={<GitBranch size={20} />}
                subtitle="Discovered"
                gradient="from-emerald-500 to-cyan-500"
              />
            </StaggerItem>
            <StaggerItem>
              <GlassMetricCard
                title="License Eligible"
                value={d.repositories.licenseEligible}
                icon={<Shield size={20} />}
                subtitle="Passed verification"
                gradient="from-cyan-500 to-blue-500"
              />
            </StaggerItem>
            <StaggerItem>
              <GlassMetricCard
                title="LOC Eligible"
                value={d.repositories.locEligible}
                icon={<Code2 size={20} />}
                subtitle="> 200 code LOC"
                gradient="from-blue-500 to-violet-500"
              />
            </StaggerItem>
            <StaggerItem>
              <GlassMetricCard
                title="Issues Found"
                value={d.issues.discovered}
                icon={<Bug size={20} />}
                subtitle="Technical issues"
                gradient="from-violet-500 to-purple-500"
              />
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Middle metrics row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid gap-4 md:grid-cols-3"
        >
          <GlassMetricCard
            title="Benchmarks"
            value={d.benchmarks.generated}
            icon={<FlaskConical size={20} />}
            subtitle={`${d.benchmarks.published} published`}
            gradient="from-amber-500 to-orange-500"
          />
          <Card className="border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp size={14} className="text-emerald-400" />
                Validation Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AnimatedProgress
                value={d.benchmarks.validationRate}
                label="Benchmarks validated"
              />
            </CardContent>
          </Card>
          <GlassMetricCard
            title="Active Jobs"
            value={d.jobs.active}
            icon={<Activity size={20} />}
            subtitle="Currently running"
            gradient="from-rose-500 to-pink-500"
          />
        </motion.div>

        {/* Engine B: Learning Studio */}
        <div>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-4 text-sm font-semibold uppercase tracking-wider bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent"
          >
            Learning Studio
          </motion.h2>
          <StaggerContainer
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
            staggerDelay={0.08}
          >
            <StaggerItem>
              <GlassMetricCard
                title="Task Packages"
                value={d.learningStudio.taskPackages}
                icon={<BookOpen size={20} />}
                subtitle="Uploaded"
                gradient="from-violet-500 to-purple-500"
              />
            </StaggerItem>
            <StaggerItem>
              <GlassMetricCard
                title="Knowledge Nodes"
                value={d.learningStudio.knowledgeNodes}
                icon={<Brain size={20} />}
                subtitle="In tree"
                gradient="from-purple-500 to-pink-500"
              />
            </StaggerItem>
            <StaggerItem>
              <GlassMetricCard
                title="Relationships"
                value={d.learningStudio.knowledgeEdges}
                icon={<Network size={20} />}
                subtitle="Concept edges"
                gradient="from-pink-500 to-rose-500"
              />
            </StaggerItem>
            <StaggerItem>
              <GlassMetricCard
                title="Drafts Generated"
                value={d.learningStudio.generatedDrafts}
                icon={<FileEdit size={20} />}
                subtitle="Submissions"
                gradient="from-rose-500 to-amber-500"
              />
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Projects Overview + Recent Activity side by side */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Projects Overview */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban size={18} className="text-emerald-400" />
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    Projects Overview
                  </span>
                </CardTitle>
                <Link href="/projects">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-neutral-400 hover:text-neutral-200 gap-1"
                  >
                    View all <ArrowRight size={14} />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {projects.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Rocket size={32} className="mb-3 text-neutral-600" />
                    <p className="text-sm text-neutral-500">
                      No projects yet. Create your first Olympus project to get started.
                    </p>
                    <Link href="/projects" className="mt-3">
                      <Button
                        size="sm"
                        className="gap-2 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white border-0"
                      >
                        <Zap size={14} />
                        New Project
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {projects.map((project, i) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        className="flex items-center justify-between rounded-lg border border-neutral-800/50 bg-neutral-950/50 px-4 py-3 transition-colors hover:border-neutral-700/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400">
                            <FolderKanban size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-neutral-200">
                              {project.name}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {project.challengeCount ?? 0} challenges
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant={
                            project.status === "active" ? "default" : "outline"
                          }
                          className={
                            project.status === "active"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : ""
                          }
                        >
                          {project.status}
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Recent Activity Timeline */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
          >
            <Card className="border-neutral-800/50 bg-neutral-900/50 backdrop-blur-sm h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock size={18} className="text-cyan-400" />
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                    Recent Activity
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {d.recentActivity.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Activity size={32} className="mb-3 text-neutral-600" />
                    <p className="text-sm text-neutral-500">
                      No recent activity. Start by discovering repositories or
                      uploading task packages.
                    </p>
                  </div>
                ) : (
                  <div className="relative space-y-0">
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-cyan-500/30 via-emerald-500/20 to-transparent" />
                    {d.recentActivity.map((activity, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 + i * 0.08 }}
                        className="relative flex items-start gap-4 py-3"
                      >
                        <div className="relative z-10 mt-1 flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-full border-2 border-cyan-500/50 bg-neutral-950 ml-[10px]" />
                        <div className="flex flex-1 items-center gap-3 rounded-lg border border-neutral-800/30 bg-neutral-950/50 px-4 py-2.5">
                          <Badge
                            variant={
                              activity.action === "eligibility_check"
                                ? "default"
                                : "outline"
                            }
                            className="shrink-0"
                          >
                            {activity.action}
                          </Badge>
                          <span className="text-sm text-neutral-300">
                            {activity.entityType}
                          </span>
                          <span className="ml-auto text-xs text-neutral-500">
                            {new Date(activity.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
