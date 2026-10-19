"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import {
  MetricCard,
  FadeInSection,
  StaggerContainer,
  StaggerItem,
  PulseIndicator,
  AnimatedProgress,
} from "@/components/animations/motion-components";
import {
  Play,
  Pause,
  Settings,
  ArrowLeft,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  BookOpen,
  Bot,
  Upload,
  Search,
  ExternalLink,
  ChevronRight,
  Activity,
  Zap,
  BarChart3,
  Code2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  targetLanguages: string[];
  targetCategories: string[];
  minStars: number;
  requirementsDoc: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    challengeSubmissions: number;
    approvedTaskExamples: number;
    agentRuns: number;
  };
}

interface Submission {
  id: string;
  taskTitle: string;
  repoUrl: string;
  language: string;
  category: string;
  status: string;
  qualityScore: number | null;
  createdAt: string;
}

interface Example {
  id: string;
  repoUrl: string;
  commitHash: string;
  language: string;
  category: string;
  taskPrompt: string;
  createdAt: string;
}

interface AgentRunItem {
  id: string;
  type: string;
  status: string;
  progress: number;
  currentStep: string | null;
  logs: string;
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const statusVariant: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  SETUP: "outline",
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "default",
  DRAFT: "outline",
  GENERATING: "warning",
  REVIEW: "default",
  READY: "success",
  EXPORTED: "success",
  FAILED: "error",
  QUEUED: "outline",
  RUNNING: "warning",
  CANCELLED: "error",
};

/* ------------------------------------------------------------------ */
/* Glass Panel wrapper                                                 */
/* ------------------------------------------------------------------ */

function GlassPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview Tab                                                        */
/* ------------------------------------------------------------------ */

function OverviewTab({ project }: { project: Project }) {
  const counts = project._count ?? {
    challengeSubmissions: 0,
    approvedTaskExamples: 0,
    agentRuns: 0,
  };

  return (
    <div className="space-y-6">
      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Submissions"
          value={counts.challengeSubmissions}
          icon={<FileText size={18} />}
          subtitle="Total challenge submissions"
        />
        <MetricCard
          title="Approved Examples"
          value={counts.approvedTaskExamples}
          icon={<CheckCircle size={18} />}
          subtitle="Knowledge base examples"
        />
        <MetricCard
          title="Agent Runs"
          value={counts.agentRuns}
          icon={<Bot size={18} />}
          subtitle="Automated agent runs"
        />
        <MetricCard
          title="Min Stars"
          value={project.minStars.toLocaleString()}
          icon={<Zap size={18} />}
          subtitle="Repository star threshold"
        />
      </div>

      {/* Project details */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <GlassPanel className="p-6">
          <h3 className="text-sm font-medium text-neutral-400">
            Project Details
          </h3>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Status</span>
              <Badge variant={statusVariant[project.status] ?? "outline"}>
                {project.status}
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Created</span>
              <span className="text-neutral-300">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Last Updated</span>
              <span className="text-neutral-300">
                {new Date(project.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-500">Min Stars</span>
              <span className="text-neutral-300">{project.minStars}</span>
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-6">
          <h3 className="text-sm font-medium text-neutral-400">
            Target Configuration
          </h3>
          <div className="mt-4 space-y-4">
            <div>
              <span className="text-xs text-neutral-500">Languages</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {project.targetLanguages.length > 0 ? (
                  project.targetLanguages.map((lang) => (
                    <span
                      key={lang}
                      className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400"
                    >
                      <Code2 size={10} />
                      {lang}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-600">
                    No languages specified
                  </span>
                )}
              </div>
            </div>
            <div>
              <span className="text-xs text-neutral-500">Categories</span>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {project.targetCategories.length > 0 ? (
                  project.targetCategories.map((cat) => (
                    <span
                      key={cat}
                      className="inline-flex items-center rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-xs text-cyan-400"
                    >
                      {cat}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-neutral-600">
                    No categories specified
                  </span>
                )}
              </div>
            </div>
          </div>
        </GlassPanel>
      </div>

      {/* Description */}
      {project.description && (
        <GlassPanel className="p-6">
          <h3 className="text-sm font-medium text-neutral-400">Description</h3>
          <p className="mt-2 text-sm text-neutral-300 leading-relaxed">
            {project.description}
          </p>
        </GlassPanel>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Submissions Tab                                                     */
/* ------------------------------------------------------------------ */

function SubmissionsTab({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}/submissions`);
        if (!res.ok) throw new Error();
        setSubmissions(await res.json());
      } catch {
        toast({ type: "error", title: "Failed to load submissions" });
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, toast]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4"
          >
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    );
  }

  if (submissions.length === 0) {
    return (
      <GlassPanel className="flex flex-col items-center justify-center py-16">
        <FileText size={32} className="text-neutral-600" />
        <p className="mt-3 text-sm text-neutral-500">
          No submissions yet. Start an agent run to generate them.
        </p>
      </GlassPanel>
    );
  }

  return (
    <StaggerContainer className="space-y-2">
      {submissions.map((sub) => (
        <StaggerItem key={sub.id}>
          <motion.button
            onClick={() =>
              router.push(
                `/projects/${projectId}/submissions/${sub.id}`
              )
            }
            whileHover={{ x: 2 }}
            className="group flex w-full items-center gap-4 rounded-lg border border-neutral-800 bg-neutral-900/50 p-4 text-left transition-colors hover:border-neutral-700"
          >
            <div className="rounded-lg bg-neutral-800 p-2.5">
              <FileText size={16} className="text-neutral-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-200">
                {sub.taskTitle}
              </p>
              <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1">
                  <Code2 size={10} />
                  {sub.language}
                </span>
                <span>{sub.category}</span>
                <span>
                  {new Date(sub.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            {sub.qualityScore != null && (
              <span className="text-xs font-medium text-emerald-400">
                {(sub.qualityScore * 100).toFixed(0)}%
              </span>
            )}
            <Badge variant={statusVariant[sub.status] ?? "outline"}>
              {sub.status}
            </Badge>
            <ChevronRight
              size={16}
              className="text-neutral-600 transition-colors group-hover:text-neutral-400"
            />
          </motion.button>
        </StaggerItem>
      ))}
    </StaggerContainer>
  );
}

/* ------------------------------------------------------------------ */
/* Knowledge Base Tab                                                  */
/* ------------------------------------------------------------------ */

function KnowledgeBaseTab({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [examples, setExamples] = useState<Example[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState({
    repoUrl: "",
    commitHash: "",
    language: "",
    category: "",
    taskPrompt: "",
    testPatch: "",
    solutionPatch: "",
    dockerfile: "",
    testSh: "",
  });

  const fetchExamples = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/examples`);
      if (!res.ok) throw new Error();
      setExamples(await res.json());
    } catch {
      toast({ type: "error", title: "Failed to load examples" });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchExamples();
  }, [fetchExamples]);

  const handleSave = async () => {
    if (!form.repoUrl || !form.taskPrompt) {
      toast({ type: "warning", title: "Repo URL and task prompt are required" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/examples`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast({ type: "success", title: "Example added to knowledge base" });
      setShowForm(false);
      setForm({
        repoUrl: "",
        commitHash: "",
        language: "",
        category: "",
        taskPrompt: "",
        testPatch: "",
        solutionPatch: "",
        dockerfile: "",
        testSh: "",
      });
      fetchExamples();
    } catch {
      toast({ type: "error", title: "Failed to save example" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-400">
          Approved Task Examples ({examples.length})
        </h3>
        <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
          <Upload size={14} />
          {showForm ? "Cancel" : "Add Example"}
        </Button>
      </div>

      {/* Add Example Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <GlassPanel className="space-y-4 p-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input
                  label="Repo URL"
                  placeholder="https://github.com/owner/repo"
                  value={form.repoUrl}
                  onChange={(e) =>
                    setForm({ ...form, repoUrl: e.target.value })
                  }
                />
                <Input
                  label="Commit Hash"
                  placeholder="abc123..."
                  value={form.commitHash}
                  onChange={(e) =>
                    setForm({ ...form, commitHash: e.target.value })
                  }
                />
                <Input
                  label="Language"
                  placeholder="TypeScript"
                  value={form.language}
                  onChange={(e) =>
                    setForm({ ...form, language: e.target.value })
                  }
                />
                <Input
                  label="Category"
                  placeholder="FEATURE_REQUEST"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                  Task Prompt
                </label>
                <textarea
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="Describe the task..."
                  value={form.taskPrompt}
                  onChange={(e) =>
                    setForm({ ...form, taskPrompt: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {(
                  [
                    ["testPatch", "Test Patch"],
                    ["solutionPatch", "Solution Patch"],
                    ["dockerfile", "Dockerfile"],
                    ["testSh", "test.sh"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key}>
                    <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                      {label}
                    </label>
                    <textarea
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={6}
                      placeholder={`Paste ${label} content...`}
                      value={form[key]}
                      onChange={(e) =>
                        setForm({ ...form, [key]: e.target.value })
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600"
                >
                  {saving ? "Saving..." : "Save Example"}
                </Button>
              </div>
            </GlassPanel>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Examples List */}
      {examples.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center py-16">
          <BookOpen size={32} className="text-neutral-600" />
          <p className="mt-3 text-sm text-neutral-500">
            No approved examples yet. Add examples to guide the agent.
          </p>
        </GlassPanel>
      ) : (
        <StaggerContainer className="space-y-2">
          {examples.map((ex) => (
            <StaggerItem key={ex.id}>
              <GlassPanel className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-200 line-clamp-2">
                      {ex.taskPrompt}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <Code2 size={10} />
                        {ex.language}
                      </span>
                      <span>{ex.category}</span>
                      <a
                        href={ex.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-cyan-400 hover:underline"
                      >
                        <ExternalLink size={10} />
                        {ex.repoUrl.replace("https://github.com/", "")}
                      </a>
                      <span className="font-mono">
                        {ex.commitHash.slice(0, 7)}
                      </span>
                    </div>
                  </div>
                </div>
              </GlassPanel>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Agent Runs Tab                                                      */
/* ------------------------------------------------------------------ */

function AgentRunsTab({ projectId }: { projectId: string }) {
  const { toast } = useToast();
  const [runs, setRuns] = useState<AgentRunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const fetchRuns = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/agent`);
      if (!res.ok) throw new Error();
      setRuns(await res.json());
    } catch {
      toast({ type: "error", title: "Failed to load agent runs" });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  const startAgent = async (type: string) => {
    setStarting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) throw new Error();
      toast({ type: "success", title: `${type} agent run started` });
      fetchRuns();
    } catch {
      toast({ type: "error", title: "Failed to start agent" });
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {["CRAWL", "ANALYZE", "GENERATE", "VALIDATE"].map((type) => (
          <Button
            key={type}
            size="sm"
            variant="outline"
            disabled={starting}
            onClick={() => startAgent(type)}
          >
            <Play size={12} />
            {type}
          </Button>
        ))}
      </div>

      {/* Runs list */}
      {runs.length === 0 ? (
        <GlassPanel className="flex flex-col items-center justify-center py-16">
          <Bot size={32} className="text-neutral-600" />
          <p className="mt-3 text-sm text-neutral-500">
            No agent runs yet. Start one above.
          </p>
        </GlassPanel>
      ) : (
        <StaggerContainer className="space-y-2">
          {runs.map((run) => {
            const isExpanded = expandedRun === run.id;
            let parsedLogs: string[] = [];
            try {
              parsedLogs = JSON.parse(run.logs);
            } catch {
              /* ignore */
            }

            return (
              <StaggerItem key={run.id}>
                <GlassPanel className="overflow-hidden">
                  <button
                    onClick={() =>
                      setExpandedRun(isExpanded ? null : run.id)
                    }
                    className="flex w-full items-center gap-4 p-4 text-left"
                  >
                    <div className="flex items-center gap-2">
                      {run.status === "RUNNING" ? (
                        <PulseIndicator active />
                      ) : (
                        <div
                          className={`h-2.5 w-2.5 rounded-full ${
                            run.status === "COMPLETED"
                              ? "bg-green-500"
                              : run.status === "FAILED"
                              ? "bg-red-500"
                              : "bg-neutral-600"
                          }`}
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-200">
                          {run.type}
                        </span>
                        <Badge
                          variant={
                            statusVariant[run.status] ?? "outline"
                          }
                        >
                          {run.status}
                        </Badge>
                      </div>
                      {run.currentStep && (
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {run.currentStep}
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-neutral-500">
                      <p>
                        {new Date(run.createdAt).toLocaleDateString()}
                      </p>
                      {run.status === "RUNNING" && (
                        <AnimatedProgress
                          value={run.progress}
                          className="mt-1 w-24"
                        />
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className={`text-neutral-600 transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded logs */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-neutral-800 bg-neutral-950/50 p-4">
                          {run.error && (
                            <div className="mb-3 rounded-lg border border-red-500/20 bg-red-950/30 p-3 text-xs text-red-400">
                              <AlertTriangle
                                size={12}
                                className="mb-1 inline"
                              />{" "}
                              {run.error}
                            </div>
                          )}
                          <p className="mb-2 text-xs font-medium text-neutral-400">
                            Logs
                          </p>
                          <div className="max-h-64 overflow-y-auto rounded-lg bg-black p-3 font-mono text-xs text-neutral-400">
                            {parsedLogs.length > 0 ? (
                              parsedLogs.map((log, i) => (
                                <div key={i} className="py-0.5">
                                  <span className="text-neutral-600 mr-2">
                                    {String(i + 1).padStart(3, " ")}
                                  </span>
                                  {log}
                                </div>
                              ))
                            ) : (
                              <span className="text-neutral-600">
                                No logs available
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassPanel>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Loading Skeleton                                               */
/* ------------------------------------------------------------------ */

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="ml-auto h-5 w-16 rounded-full" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-80 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        if (!res.ok) throw new Error();
        setProject(await res.json());
      } catch {
        toast({ type: "error", title: "Failed to load project" });
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, toast]);

  const handleStatusChange = async (
    newStatus: "ACTIVE" | "PAUSED"
  ) => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      setProject(await res.json());
      toast({
        type: "success",
        title: `Project ${newStatus.toLowerCase()}`,
      });
    } catch {
      toast({ type: "error", title: "Failed to update project" });
    }
  };

  if (loading) return <PageSkeleton />;

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-neutral-600" />
          <p className="mt-4 text-neutral-400">Project not found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push("/projects")}
          >
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <FadeInSection>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/projects")}
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-neutral-100">
                    {project.name}
                  </h1>
                  <Badge
                    variant={
                      statusVariant[project.status] ?? "outline"
                    }
                  >
                    {project.status}
                  </Badge>
                </div>
                {project.description && (
                  <p className="mt-0.5 text-sm text-neutral-400">
                    {project.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {project.status !== "ACTIVE" ? (
                <Button
                  size="sm"
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600"
                  onClick={() => handleStatusChange("ACTIVE")}
                >
                  <Play size={14} />
                  Start Agent
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleStatusChange("PAUSED")}
                >
                  <Pause size={14} />
                  Pause
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  router.push(`/projects/${projectId}/requirements`)
                }
              >
                <Settings size={14} />
                Requirements
              </Button>
            </div>
          </div>
        </FadeInSection>

        {/* Tabs */}
        <div className="mt-6">
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">
                <BarChart3 size={14} className="mr-1.5" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="submissions">
                <FileText size={14} className="mr-1.5" />
                Submissions
              </TabsTrigger>
              <TabsTrigger value="knowledge">
                <BookOpen size={14} className="mr-1.5" />
                Knowledge Base
              </TabsTrigger>
              <TabsTrigger value="agent">
                <Bot size={14} className="mr-1.5" />
                Agent Runs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab project={project} />
            </TabsContent>
            <TabsContent value="submissions">
              <SubmissionsTab projectId={projectId} />
            </TabsContent>
            <TabsContent value="knowledge">
              <KnowledgeBaseTab projectId={projectId} />
            </TabsContent>
            <TabsContent value="agent">
              <AgentRunsTab projectId={projectId} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
