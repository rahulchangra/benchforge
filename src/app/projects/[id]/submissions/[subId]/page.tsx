"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { FadeInSection } from "@/components/animations/motion-components";
import {
  ArrowLeft,
  Save,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code2,
  Terminal,
  FileCode,
  Container,
  Clipboard,
  Check,
} from "lucide-react";
import { AppShell } from "@/components/layout/sidebar";
import { ExportPreviewModal } from "@/components/submissions/export-preview-modal";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Submission {
  id: string;
  olympusProjectId: string;
  repoUrl: string;
  commitHash: string;
  language: string;
  category: string;
  status: string;
  taskTitle: string;
  taskPrompt: string;
  testSh: string | null;
  testPatch: string | null;
  solutionPatch: string | null;
  dockerfile: string | null;
  qualityScore: number | null;
  checks: string | null;
  exportedAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const STATUS_FLOW = ["DRAFT", "GENERATING", "REVIEW", "READY", "EXPORTED"] as const;

const statusVariant: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  DRAFT: "outline",
  GENERATING: "warning",
  REVIEW: "default",
  READY: "success",
  EXPORTED: "success",
  FAILED: "error",
};

/* ------------------------------------------------------------------ */
/* Code Editor Textarea                                                */
/* ------------------------------------------------------------------ */

function CodeEditor({
  label,
  icon: Icon,
  value,
  onChange,
  readOnly = false,
  language = "",
  rows = 12,
}: {
  label: string;
  icon: React.ElementType;
  value: string;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  language?: string;
  rows?: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-neutral-400" />
          <span className="text-xs font-medium text-neutral-300">
            {label}
          </span>
          {language && (
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-500">
              {language}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {value && (
            <span className="text-[10px] text-neutral-600">
              {value.split("\n").length} lines
            </span>
          )}
          <button
            onClick={handleCopy}
            className="rounded p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-300"
            title="Copy"
          >
            {copied ? <Check size={12} /> : <Clipboard size={12} />}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          value={value}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          rows={rows}
          spellCheck={false}
          className={`w-full resize-y bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-neutral-200 placeholder:text-neutral-700 focus:outline-none ${
            readOnly ? "cursor-default opacity-70" : ""
          }`}
          placeholder={`Paste ${label.toLowerCase()} content here...`}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Status Workflow Bar                                                 */
/* ------------------------------------------------------------------ */

function StatusWorkflow({ current }: { current: string }) {
  const currentIdx = STATUS_FLOW.indexOf(
    current as (typeof STATUS_FLOW)[number]
  );

  return (
    <div className="flex items-center gap-1">
      {STATUS_FLOW.map((status, i) => {
        const isPast = currentIdx >= 0 && i < currentIdx;
        const isCurrent = status === current;

        return (
          <div key={status} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-0.5 w-6 ${
                  isPast
                    ? "bg-emerald-500"
                    : isCurrent
                    ? "bg-gradient-to-r from-emerald-500 to-neutral-700"
                    : "bg-neutral-800"
                }`}
              />
            )}
            <div
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                isCurrent
                  ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                  : isPast
                  ? "bg-emerald-500/10 text-emerald-500/60"
                  : "bg-neutral-900 text-neutral-600"
              }`}
            >
              {isPast && <CheckCircle size={10} />}
              {status}
            </div>
          </div>
        );
      })}
      {current === "FAILED" && (
        <div className="ml-2 flex items-center gap-1 rounded-full bg-red-500/20 px-2.5 py-1 text-[10px] font-medium text-red-400 ring-1 ring-red-500/30">
          <XCircle size={10} />
          FAILED
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Quality Checks Panel                                                */
/* ------------------------------------------------------------------ */

function QualityChecksPanel({ checks }: { checks: string | null }) {
  let parsed: { name: string; passed: boolean; message?: string }[] = [];
  try {
    if (checks) parsed = JSON.parse(checks);
  } catch {
    /* ignore */
  }

  if (parsed.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
        <h3 className="text-sm font-medium text-neutral-400">Quality Checks</h3>
        <p className="mt-3 text-xs text-neutral-600">
          No quality checks available yet. Save and generate to run checks.
        </p>
      </div>
    );
  }

  const passCount = parsed.filter((c) => c.passed).length;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-neutral-400">Quality Checks</h3>
        <span className="text-xs text-neutral-500">
          {passCount}/{parsed.length} passing
        </span>
      </div>
      <div className="mt-3 space-y-2">
        {parsed.map((check, i) => (
          <div
            key={i}
            className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2"
          >
            {check.passed ? (
              <CheckCircle size={14} className="shrink-0 text-green-500" />
            ) : (
              <XCircle size={14} className="shrink-0 text-red-500" />
            )}
            <span className="flex-1 text-xs text-neutral-300">
              {check.name}
            </span>
            {check.message && (
              <span className="text-[10px] text-neutral-600">
                {check.message}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Skeleton                                                       */
/* ------------------------------------------------------------------ */

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-neutral-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-7 w-64" />
        </div>
        <Skeleton className="h-8 w-96" />
        <div className="space-y-4">
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Page                                                           */
/* ------------------------------------------------------------------ */

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;
  const subId = params.subId as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportPreview, setShowExportPreview] = useState(false);

  // Editable fields
  const [taskPrompt, setTaskPrompt] = useState("");
  const [testSh, setTestSh] = useState("");
  const [testPatch, setTestPatch] = useState("");
  const [solutionPatch, setSolutionPatch] = useState("");
  const [dockerfile, setDockerfile] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/projects/${projectId}/submissions/${subId}`
        );
        if (!res.ok) throw new Error();
        const json = await res.json();
        const data: Submission = json.data ?? json;
        setSubmission(data);
        setTaskPrompt(data.taskPrompt ?? "");
        setTestSh(data.testSh ?? "");
        setTestPatch(data.testPatch ?? "");
        setSolutionPatch(data.solutionPatch ?? "");
        setDockerfile(data.dockerfile ?? "");
      } catch {
        toast({ type: "error", title: "Failed to load submission" });
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, subId, toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/submissions/${subId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            taskPrompt,
            testSh,
            testPatch,
            solutionPatch,
            dockerfile,
          }),
        }
      );
      if (!res.ok) throw new Error();
      const json = await res.json();
      const updated = json.data ?? json;
      setSubmission(updated);
      toast({ type: "success", title: "Submission saved" });
    } catch {
      toast({ type: "error", title: "Failed to save submission" });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await fetch(
        `/api/projects/${projectId}/submissions/${subId}/export`
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `submission-${subId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast({ type: "success", title: "Export downloaded" });
    } catch {
      toast({ type: "error", title: "Failed to export submission" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <PageSkeleton />;

  if (!submission) {
    return (
      <AppShell>
        <div className="flex min-h-screen items-center justify-center bg-neutral-950">
          <div className="text-center">
            <AlertTriangle size={48} className="mx-auto text-neutral-600" />
            <p className="mt-4 text-neutral-400">Submission not found</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(`/projects/${projectId}`)}
            >
              Back to Project
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  const wordCount = taskPrompt
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

  return (
    <AppShell>
      <div className="min-h-screen bg-neutral-950 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <FadeInSection>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/projects/${projectId}`)}
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-neutral-100">
                  {submission.taskTitle}
                </h1>
                <div className="mt-1 flex items-center gap-3 text-xs text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Code2 size={10} />
                    {submission.language}
                  </span>
                  <span>{submission.category}</span>
                  <a
                    href={submission.repoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline"
                  >
                    {submission.repoUrl.replace(
                      "https://github.com/",
                      ""
                    )}
                  </a>
                  <span className="font-mono">
                    {submission.commitHash.slice(0, 7)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowExportPreview(true)}
                disabled={submission.status === "DRAFT"}
              >
                <Download size={14} />
                Preview & Export
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
              >
                <Save size={14} />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </FadeInSection>

        {/* Status workflow */}
        <FadeInSection delay={0.1}>
          <div className="mt-6 overflow-x-auto">
            <StatusWorkflow current={submission.status} />
          </div>
        </FadeInSection>

        {/* Error banner */}
        {submission.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-lg border border-red-500/20 bg-red-950/30 p-4 text-sm text-red-400"
          >
            <AlertTriangle size={14} className="mb-0.5 inline" />{" "}
            {submission.error}
          </motion.div>
        )}

        {/* Content */}
        <div className="mt-6 space-y-6">
          {/* Task Prompt */}
          <FadeInSection delay={0.15}>
            <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-300">
                  Task Prompt
                </label>
                <span className="text-xs text-neutral-600">
                  {wordCount} words
                </span>
              </div>
              <textarea
                value={taskPrompt}
                onChange={(e) => setTaskPrompt(e.target.value)}
                rows={6}
                className="mt-2 w-full resize-y rounded-lg border border-neutral-700 bg-neutral-950 px-4 py-3 text-sm text-neutral-100 leading-relaxed placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Describe the task..."
              />
            </div>
          </FadeInSection>

          {/* Code editors in a grid */}
          <FadeInSection delay={0.2}>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <CodeEditor
                label="test.sh"
                icon={Terminal}
                value={testSh}
                onChange={setTestSh}
                language="bash"
              />
              <CodeEditor
                label="Dockerfile"
                icon={Container}
                value={dockerfile}
                onChange={setDockerfile}
                language="dockerfile"
              />
            </div>
          </FadeInSection>

          <FadeInSection delay={0.25}>
            <CodeEditor
              label="Test Patch"
              icon={FileCode}
              value={testPatch}
              onChange={setTestPatch}
              language="diff"
              rows={16}
            />
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <CodeEditor
              label="Solution Patch"
              icon={FileCode}
              value={solutionPatch}
              onChange={setSolutionPatch}
              language="diff"
              rows={16}
            />
          </FadeInSection>

          {/* Quality checks */}
          <FadeInSection delay={0.35}>
            <QualityChecksPanel checks={submission.checks} />
          </FadeInSection>

          {/* Bottom save bar */}
          <FadeInSection delay={0.4}>
            <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-900/50 px-6 py-4">
              <div className="text-sm text-neutral-400">
                {submission.qualityScore != null && (
                  <span>
                    Quality Score:{" "}
                    <span className="font-medium text-emerald-400">
                      {(submission.qualityScore * 100).toFixed(0)}%
                    </span>
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/projects/${projectId}`)}
                >
                  Back to Project
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
                >
                  <Save size={14} />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </FadeInSection>
        </div>
      </div>
      </div>

      {/* Export Preview Modal */}
      {submission && (
        <ExportPreviewModal
          open={showExportPreview}
          onClose={() => setShowExportPreview(false)}
          onConfirmExport={handleExport}
          submission={{
            taskTitle: submission.taskTitle,
            taskPrompt,
            testSh,
            testPatch,
            solutionPatch,
            dockerfile,
            language: submission.language,
            category: submission.category,
            repoUrl: submission.repoUrl,
            commitHash: submission.commitHash,
            qualityScore: submission.qualityScore,
          }}
          exporting={exporting}
        />
      )}
    </AppShell>
  );
}

