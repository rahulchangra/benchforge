"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
import { AppShell } from "@/components/layout/sidebar";
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
  Sparkles,
  Save,
  Edit3,
  FileUp,
  Rocket,
  Loader2,
  Download,
  FileArchive,
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

const PIPELINE_STEPS = ["CRAWL", "ANALYZE", "GENERATE", "VALIDATE"] as const;

/* ------------------------------------------------------------------ */
/* Glass Panel wrapper                                                 */
/* ------------------------------------------------------------------ */

function GlassPanel({
  children,
  className = "",
  gradient = false,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-neutral-800 bg-neutral-900/50 backdrop-blur-sm ${gradient ? "bg-gradient-to-br from-neutral-900/80 via-neutral-900/50 to-neutral-900/80" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Overview Tab                                                        */
/* ------------------------------------------------------------------ */

function OverviewTab({
  project,
  onProjectUpdate,
}: {
  project: Project;
  onProjectUpdate: (p: Project) => void;
}) {
  const { toast } = useToast();
  const [editingReqs, setEditingReqs] = useState(false);
  const [reqsDoc, setReqsDoc] = useState(project.requirementsDoc || "");
  const [savingReqs, setSavingReqs] = useState(false);

  const counts = project._count ?? {
    challengeSubmissions: 0,
    approvedTaskExamples: 0,
    agentRuns: 0,
  };

  const handleSaveReqs = async () => {
    setSavingReqs(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirementsDoc: reqsDoc.trim() || null }),
      });
      if (!res.ok) throw new Error();
      const updated = (await res.json()).data;
      onProjectUpdate(updated);
      setEditingReqs(false);
      toast({ type: "success", title: "Requirements document saved" });
    } catch {
      toast({ type: "error", title: "Failed to save requirements" });
    } finally {
      setSavingReqs(false);
    }
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
        <GlassPanel className="p-6" gradient>
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

        <GlassPanel className="p-6" gradient>
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

      {/* Requirements Document */}
      <GlassPanel className="p-6" gradient>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-1.5">
              <FileText size={14} className="text-emerald-400" />
            </div>
            <h3 className="text-sm font-medium text-neutral-400">
              Requirements Document
            </h3>
          </div>
          {!editingReqs ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setReqsDoc(project.requirementsDoc || "");
                setEditingReqs(true);
              }}
            >
              <Edit3 size={12} />
              Edit Requirements
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingReqs(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSaveReqs}
                disabled={savingReqs}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600"
              >
                {savingReqs ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save
              </Button>
            </div>
          )}
        </div>
        <div className="mt-3">
          {editingReqs ? (
            <textarea
              className="w-full rounded-lg border border-emerald-500/30 bg-neutral-950 px-4 py-3 font-mono text-xs text-neutral-100 placeholder:text-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              rows={16}
              placeholder="Paste the Olympus requirements document here..."
              value={reqsDoc}
              onChange={(e) => setReqsDoc(e.target.value)}
            />
          ) : project.requirementsDoc ? (
            <div className="max-h-96 overflow-y-auto rounded-lg bg-neutral-950/80 border border-neutral-800 px-4 py-3">
              <pre className="whitespace-pre-wrap font-mono text-xs text-neutral-300 leading-relaxed">
                {project.requirementsDoc}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-neutral-700 py-8">
              <FileText size={24} className="text-neutral-600" />
              <p className="mt-2 text-xs text-neutral-500">
                No requirements document yet. Click Edit to add one.
              </p>
            </div>
          )}
        </div>
      </GlassPanel>
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
        setSubmissions((await res.json()).data ?? []);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-400">
          Generated Submissions ({submissions.length})
        </h3>
        {submissions.some((s) => s.status === "READY") && (
          <span className="text-xs text-emerald-400 font-medium">
            ✓ Ready for Quest Olympus manual upload
          </span>
        )}
      </div>

      <StaggerContainer className="space-y-2">
        {submissions.map((sub) => (
          <StaggerItem key={sub.id}>
            <div
              onClick={() =>
                router.push(
                  `/projects/${projectId}/submissions/${sub.id}`
                )
              }
              className="group flex w-full items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 text-left transition-all hover:border-neutral-700 hover:shadow-[0_0_20px_-5px_rgba(16,185,129,0.15)] cursor-pointer"
            >
              <div className="rounded-lg bg-neutral-800 p-2.5 shrink-0 group-hover:bg-neutral-700 transition-colors">
                <FileText size={16} className="text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-neutral-200 group-hover:text-white transition-colors">
                  {sub.taskTitle}
                </p>
                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1 font-mono text-neutral-400">
                    <Code2 size={10} />
                    {sub.language}
                  </span>
                  <span className="rounded bg-neutral-800/80 px-1.5 py-0.5 text-[10px] text-neutral-400">
                    {sub.category}
                  </span>
                  <span>
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {sub.qualityScore != null && (
                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-400">
                    {Math.round(sub.qualityScore * 100)}%
                  </span>
                  <p className="text-[10px] text-neutral-500">Quality</p>
                </div>
              )}
              <Badge variant={statusVariant[sub.status] ?? "outline"}>
                {sub.status}
              </Badge>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `/api/projects/${projectId}/submissions/${sub.id}/export`;
                }}
                className="h-8 gap-1 border-neutral-700 bg-neutral-800 text-xs hover:border-emerald-500/50 hover:bg-neutral-800 hover:text-emerald-400 shadow-sm"
              >
                <Download size={12} />
                Export ZIP
              </Button>
              <ChevronRight
                size={16}
                className="text-neutral-600 transition-colors group-hover:text-neutral-400"
              />
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </div>
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

  // File input refs for each text field
  const fileInputRefs = {
    taskPrompt: useRef<HTMLInputElement>(null),
    testPatch: useRef<HTMLInputElement>(null),
    solutionPatch: useRef<HTMLInputElement>(null),
    dockerfile: useRef<HTMLInputElement>(null),
    testSh: useRef<HTMLInputElement>(null),
  };

  const fetchExamples = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/examples`);
      if (!res.ok) throw new Error();
      setExamples((await res.json()).data ?? []);
    } catch {
      toast({ type: "error", title: "Failed to load examples" });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchExamples();
  }, [fetchExamples]);

  const handleFileLoad = (key: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setForm((prev) => ({ ...prev, [key]: text }));
      toast({ type: "success", title: `Loaded ${file.name}` });
    };
    reader.readAsText(file);
  };

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

  // ZIP upload state
  const [uploadingZip, setUploadingZip] = useState(false);
  const zipInputRef = useRef<HTMLInputElement>(null);

  const handleZipUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith(".zip")) {
      toast({ type: "error", title: "Please select a .zip archive" });
      return;
    }
    setUploadingZip(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("repoUrl", form.repoUrl || "https://github.com/example/repo");
      formData.append("commitHash", form.commitHash || "1a2b3c4d5e6f");
      formData.append("language", form.language || "Python");
      formData.append("category", form.category || "BUGFIX");

      const res = await fetch(`/api/projects/${projectId}/examples`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error();
      toast({
        type: "success",
        title: "Approved Task ZIP Ingested",
        description: "Extracted task.md, patches & built Knowledge Tree patterns",
      });
      fetchExamples();
    } catch {
      toast({ type: "error", title: "Failed to upload task ZIP" });
    } finally {
      setUploadingZip(false);
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
      {/* ZIP Upload Card */}
      <GlassPanel className="p-6 relative overflow-hidden" gradient>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
              <FileArchive size={24} />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-neutral-100">
                Upload Approved Task Example (.ZIP)
              </h4>
              <p className="text-xs text-neutral-400">
                Drop your approved task zip package. The agent extracts task.md, test.sh, test.patch, solution.patch, Dockerfile & learns the exact benchmark rules and human prompt style.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleZipUpload(f);
              }}
            />
            <Button
              onClick={() => zipInputRef.current?.click()}
              disabled={uploadingZip}
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 gap-1.5 shadow-lg shadow-emerald-500/10"
            >
              {uploadingZip ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Unpacking & Learning...
                </>
              ) : (
                <>
                  <Upload size={14} />
                  Upload Approved ZIP
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)}>
              {showForm ? "Hide Manual Form" : "Manual Form"}
            </Button>
          </div>
        </div>
      </GlassPanel>

      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-medium text-neutral-400">
          Approved Task Knowledge Base ({examples.length})
        </h3>
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
            <GlassPanel className="space-y-4 p-6" gradient>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-emerald-400" />
                <h4 className="text-sm font-medium text-neutral-200">Add Approved Task Example</h4>
              </div>
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
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-neutral-300">
                    Task Prompt
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRefs.taskPrompt.current?.click()}
                    className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    <FileUp size={10} />
                    Load from file
                  </button>
                  <input
                    ref={fileInputRefs.taskPrompt}
                    type="file"
                    accept=".md,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleFileLoad("taskPrompt", f);
                    }}
                  />
                </div>
                <textarea
                  className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-sm font-medium text-neutral-300">
                        {label}
                      </label>
                      <button
                        type="button"
                        onClick={() => fileInputRefs[key].current?.click()}
                        className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        <FileUp size={10} />
                        Load file
                      </button>
                      <input
                        ref={fileInputRefs[key]}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileLoad(key, f);
                        }}
                      />
                    </div>
                    <textarea
                      className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2 font-mono text-xs text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      rows={6}
                      placeholder={`Paste ${label} content or load from file...`}
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
              <GlassPanel className="p-4 transition-all hover:border-neutral-700">
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
      setRuns((await res.json()).data ?? []);
    } catch {
      toast({ type: "error", title: "Failed to load agent runs" });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Auto-polling when any run is running or queued
  useEffect(() => {
    const hasActiveRun = runs.some(
      (r) => r.status === "RUNNING" || r.status === "QUEUED"
    );
    if (!hasActiveRun) return;

    const interval = setInterval(() => {
      fetchRuns();
    }, 2500);

    return () => clearInterval(interval);
  }, [runs, fetchRuns]);

  const activeRun = runs.find((r) => r.status === "RUNNING");
  const queuedRun = runs.slice().reverse().find((r) => r.status === "QUEUED");
  const currentRunningStep = activeRun?.type ?? queuedRun?.type ?? null;
  const isPipelineActive = runs.some((r) => r.status === "RUNNING" || r.status === "QUEUED");
  const currentStepIndex = currentRunningStep
    ? PIPELINE_STEPS.indexOf(currentRunningStep as (typeof PIPELINE_STEPS)[number])
    : -1;

  const startAgent = async (type: string) => {
    setStarting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Failed to start ${type} agent`);
      }
      toast({ type: "success", title: `${type} agent run started` });
      fetchRuns();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Failed to start agent",
        description: err instanceof Error ? err.message : "Server error",
      });
    } finally {
      setStarting(false);
    }
  };

  const startFullPipeline = async () => {
    setStarting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "FULL_PIPELINE" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to start full pipeline");
      }
      toast({
        type: "success",
        title: "Autonomous Pipeline Initiated",
        description: "Executing CRAWL → ANALYZE → GENERATE → VALIDATE in background",
      });
      await fetchRuns();
    } catch (err: unknown) {
      toast({
        type: "error",
        title: "Failed to start pipeline",
        description: err instanceof Error ? err.message : "Server error",
      });
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
      {/* Pipeline action */}
      <GlassPanel className="p-4" gradient>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-2">
              <Rocket size={16} className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-200">Full Pipeline</h4>
              <p className="text-xs text-neutral-500">Run CRAWL, ANALYZE, GENERATE, VALIDATE sequentially</p>
            </div>
          </div>
          <Button
            onClick={startFullPipeline}
            disabled={isPipelineActive || starting}
            className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/10"
          >
            {isPipelineActive ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Pipeline Active ({currentRunningStep ?? "Processing"})...
              </>
            ) : starting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Rocket size={14} />
                Start Full Pipeline
              </>
            )}
          </Button>
        </div>
        {isPipelineActive && (
          <div className="mt-3 flex gap-1">
            {PIPELINE_STEPS.map((step, i) => (
              <div key={step} className="flex-1">
                <div className="mb-1 text-center text-[10px] text-neutral-500">{step}</div>
                <div className="h-1.5 rounded-full overflow-hidden bg-neutral-800">
                  <motion.div
                    className={`h-full rounded-full ${
                      currentStepIndex >= 0 && i < currentStepIndex
                        ? "bg-emerald-500"
                        : i === currentStepIndex
                        ? "bg-cyan-500"
                        : "bg-neutral-700"
                    }`}
                    initial={{ width: "0%" }}
                    animate={{
                      width:
                        currentStepIndex >= 0 && i < currentStepIndex
                          ? "100%"
                          : i === currentStepIndex
                          ? `${activeRun?.progress ?? 50}%`
                          : "0%",
                    }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {PIPELINE_STEPS.map((type) => (
          <Button
            key={type}
            size="sm"
            variant="outline"
            disabled={starting || isPipelineActive}
            onClick={() => startAgent(type)}
            className="transition-all hover:border-emerald-500/30 hover:shadow-[0_0_15px_-5px_rgba(16,185,129,0.2)]"
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
                <GlassPanel className="overflow-hidden transition-all hover:border-neutral-700">
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
                        <div className="border-t border-neutral-800 bg-neutral-950/70 p-4">
                          {run.error && (
                            <div className="mb-3 rounded-lg border border-red-500/20 bg-red-950/30 p-3 text-xs text-red-400">
                              <AlertTriangle
                                size={12}
                                className="mb-1 inline"
                              />{" "}
                              {run.error}
                            </div>
                          )}
                          <div className="mb-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2 text-neutral-400">
                              <div className="flex gap-1.5">
                                <span className="h-2 w-2 rounded-full bg-red-500/70" />
                                <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
                                <span className="h-2 w-2 rounded-full bg-green-500/70" />
                              </div>
                              <span className="font-mono text-[11px] text-neutral-500">
                                agent.log {run.status === "RUNNING" && "— streaming"}
                              </span>
                            </div>
                            <span className="text-[11px] text-neutral-600 font-mono">
                              {parsedLogs.length} entries
                            </span>
                          </div>
                          <div className="max-h-72 overflow-y-auto rounded-lg bg-black/90 border border-neutral-800/80 p-3 font-mono text-xs">
                            {parsedLogs.length > 0 ? (
                              parsedLogs.map((log, i) => {
                                let logColor = "text-neutral-300";
                                if (
                                  log.includes("[SUCCESS]") ||
                                  log.includes("✔") ||
                                  log.toLowerCase().includes("passed")
                                ) {
                                  logColor = "text-emerald-400";
                                } else if (
                                  log.includes("[ERROR]") ||
                                  log.includes("✖") ||
                                  log.toLowerCase().includes("failed")
                                ) {
                                  logColor = "text-rose-400";
                                } else if (
                                  log.includes("[WARN]") ||
                                  log.includes("[CHECK]") ||
                                  log.includes("──")
                                ) {
                                  logColor = "text-amber-400 font-semibold";
                                } else if (
                                  log.includes("[CRAWL]") ||
                                  log.includes("[ANALYZE]") ||
                                  log.includes("[GENERATE]") ||
                                  log.includes("[VALIDATE]") ||
                                  log.includes("[RESULT]")
                                ) {
                                  logColor = "text-cyan-400";
                                }
                                return (
                                  <div key={i} className={`py-0.5 leading-relaxed ${logColor}`}>
                                    <span className="text-neutral-600 mr-2 select-none">
                                      {String(i + 1).padStart(3, " ")}
                                    </span>
                                    {log}
                                  </div>
                                );
                              })
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
    <AppShell>
      <div className="min-h-screen bg-neutral-950">
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
    </AppShell>
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
        setProject((await res.json()).data);
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
      setProject((await res.json()).data);
      toast({ type: "success", title: `Project ${newStatus.toLowerCase()}` });
    } catch {
      toast({ type: "error", title: "Failed to update project" });
    }
  };

  if (loading) return <PageSkeleton />;

  if (!project) {
    return (
      <AppShell>
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
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-neutral-950">
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
                    {project.status === "ACTIVE" && (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                      </span>
                    )}
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
                    className="bg-gradient-to-r from-emerald-600 to-cyan-600 shadow-lg shadow-emerald-500/10"
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
                <OverviewTab project={project} onProjectUpdate={setProject} />
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
    </AppShell>
  );
}
