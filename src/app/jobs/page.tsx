"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";
import {
  MetricCard,
  AnimatedProgress,
  PulseIndicator,
  StaggerContainer,
  StaggerItem,
} from "@/components/animations/motion-components";
import { useToast } from "@/components/ui/toast";
import { timeAgo } from "@/lib/utils";
import {
  Activity,
  FlaskConical,
  BookOpen,
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Ban,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Square,
  RotateCcw,
  Loader2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────

type JobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
type JobType = "benchmark" | "learning";

interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  progress: number;
  currentStep: string | null;
  logs: string[];
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
  retryCount: number;
  createdAt: string;
  issueCandidateId?: string;
  taskPackageId?: string;
}

interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

interface JobsResponse {
  data: Job[];
  pagination: Pagination;
}

// ── Helpers ────────────────────────────────────────────

const STATUS_CONFIG: Record<
  JobStatus,
  { label: string; variant: "default" | "success" | "warning" | "error" | "outline"; icon: React.ElementType }
> = {
  QUEUED: { label: "Queued", variant: "outline", icon: Clock },
  RUNNING: { label: "Running", variant: "default", icon: Play },
  COMPLETED: { label: "Completed", variant: "success", icon: CheckCircle2 },
  FAILED: { label: "Failed", variant: "error", icon: XCircle },
  CANCELLED: { label: "Cancelled", variant: "warning", icon: Ban },
};

function JobStatusBadge({ status }: { status: JobStatus }) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;
  return (
    <Badge variant={config.variant} className="gap-1">
      {status === "RUNNING" ? (
        <PulseIndicator active className="mr-0.5" />
      ) : (
        <Icon size={12} />
      )}
      {config.label}
    </Badge>
  );
}

function JobTypeIcon({ type }: { type: JobType }) {
  if (type === "benchmark") {
    return (
      <div className="rounded-lg bg-blue-500/10 p-2 text-blue-400">
        <FlaskConical size={18} />
      </div>
    );
  }
  return (
    <div className="rounded-lg bg-purple-500/10 p-2 text-purple-400">
      <BookOpen size={18} />
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────

export default function JobsPage() {
  const { toast } = useToast();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchJobs = useCallback(
    async (page = pagination.page) => {
      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.set("status", statusFilter);
        if (typeFilter !== "all") params.set("type", typeFilter);
        params.set("page", String(page));
        params.set("pageSize", String(pagination.pageSize));

        const res = await fetch(`/api/jobs?${params.toString()}`);
        const json: JobsResponse = await res.json();
        setJobs(json.data ?? []);
        if (json.pagination) setPagination(json.pagination);
      } catch {
        // silent retry on next interval
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, typeFilter, pagination.page, pagination.pageSize]
  );

  // Initial fetch + filter changes
  useEffect(() => {
    setLoading(true);
    fetchJobs(1);
  }, [statusFilter, typeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-refresh every 10s when there are active jobs
  useEffect(() => {
    const hasActive = jobs.some(
      (j) => j.status === "QUEUED" || j.status === "RUNNING"
    );
    if (!hasActive) return;

    const interval = setInterval(() => {
      fetchJobs();
    }, 10_000);
    return () => clearInterval(interval);
  }, [jobs, fetchJobs]);

  const stats = {
    queued: jobs.filter((j) => j.status === "QUEUED").length,
    running: jobs.filter((j) => j.status === "RUNNING").length,
    completed: jobs.filter((j) => j.status === "COMPLETED").length,
    failed: jobs.filter((j) => j.status === "FAILED").length,
  };

  const handleAction = async (
    jobId: string,
    action: "cancel" | "retry",
    type: JobType
  ) => {
    setActionLoading(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, type }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as Record<string, string>).error ?? `Failed to ${action} job`
        );
      }
      toast({
        type: "success",
        title: action === "cancel" ? "Job cancelled" : "Job retried",
        description: `Job ${jobId.slice(0, 8)}\u2026 has been ${action === "cancel" ? "cancelled" : "queued for retry"}.`,
      });
      fetchJobs();
    } catch (err) {
      toast({
        type: "error",
        title: `Failed to ${action} job`,
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handlePageChange = (newPage: number) => {
    setLoading(true);
    fetchJobs(newPage);
  };

  const logRef = useRef<HTMLPreElement>(null);
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [expandedJobId, jobs]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Job Monitor</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Track benchmark and learning jobs in real time.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLoading(true);
              fetchJobs();
            }}
            className="gap-1.5"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
        </div>

        {/* Live Stats */}
        {loading && jobs.length === 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
        ) : (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <MetricCard
                title="Queued"
                value={stats.queued}
                icon={<Clock size={20} />}
                subtitle="Waiting to run"
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                title="Running"
                value={stats.running}
                icon={<Play size={20} />}
                subtitle="In progress"
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                title="Completed"
                value={stats.completed}
                icon={<CheckCircle2 size={20} />}
                subtitle="Successfully finished"
              />
            </StaggerItem>
            <StaggerItem>
              <MetricCard
                title="Failed"
                value={stats.failed}
                icon={<XCircle size={20} />}
                subtitle="Needs attention"
              />
            </StaggerItem>
          </StaggerContainer>
        )}

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="QUEUED">Queued</SelectItem>
              <SelectItem value="RUNNING">Running</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              <SelectItem value="benchmark">Benchmark</SelectItem>
              <SelectItem value="learning">Learning</SelectItem>
            </SelectContent>
          </Select>

          <span className="ml-auto text-xs text-neutral-500">
            {pagination.total} job{pagination.total !== 1 ? "s" : ""} total
          </span>
        </div>

        {/* Jobs List */}
        <div className="space-y-2">
          {loading && jobs.length === 0 ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity
                  size={48}
                  className="mx-auto mb-4 text-neutral-700"
                />
                <p className="text-neutral-500">No jobs found.</p>
                <p className="mt-1 text-xs text-neutral-600">
                  Jobs appear here when you trigger benchmarks or learning tasks.
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => {
              const isExpanded = expandedJobId === job.id;
              const isActive = job.status === "QUEUED" || job.status === "RUNNING";
              const canRetry = job.status === "FAILED" || job.status === "CANCELLED";

              return (
                <Card key={job.id} className="overflow-hidden">
                  <button
                    className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-neutral-800/30"
                    onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                  >
                    <JobTypeIcon type={job.type} />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-200 truncate">
                          {job.type === "benchmark" ? "Benchmark" : "Learning"} Job
                        </span>
                        <span className="text-xs text-neutral-600 font-mono">
                          {job.id.slice(0, 8)}
                        </span>
                        {job.retryCount > 0 && (
                          <Badge variant="outline" className="gap-1 text-[10px]">
                            <RotateCcw size={10} />
                            {job.retryCount}
                          </Badge>
                        )}
                      </div>

                      {job.status === "RUNNING" ? (
                        <div className="mt-1.5 max-w-sm">
                          <AnimatedProgress
                            value={job.progress}
                            label={job.currentStep ?? "Processing\u2026"}
                          />
                        </div>
                      ) : (
                        <p className="mt-0.5 text-xs text-neutral-500 truncate">
                          {job.currentStep ??
                            (job.status === "QUEUED"
                              ? "Waiting in queue\u2026"
                              : job.error
                                ? `Error: ${job.error}`
                                : "\u2014")}
                        </p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <JobStatusBadge status={job.status} />
                      <span className="text-xs text-neutral-500 w-16 text-right">
                        {timeAgo(job.createdAt)}
                      </span>
                      {isExpanded ? (
                        <ChevronDown size={16} className="text-neutral-500" />
                      ) : (
                        <ChevronRight size={16} className="text-neutral-500" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-neutral-800 bg-neutral-950/40">
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                          <div>
                            <span className="text-neutral-500">Created</span>
                            <p className="mt-0.5 text-neutral-300">
                              {new Date(job.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <span className="text-neutral-500">Started</span>
                            <p className="mt-0.5 text-neutral-300">
                              {job.startedAt ? new Date(job.startedAt).toLocaleString() : "\u2014"}
                            </p>
                          </div>
                          <div>
                            <span className="text-neutral-500">Completed</span>
                            <p className="mt-0.5 text-neutral-300">
                              {job.completedAt ? new Date(job.completedAt).toLocaleString() : "\u2014"}
                            </p>
                          </div>
                          <div>
                            <span className="text-neutral-500">Progress</span>
                            <p className="mt-0.5 text-neutral-300">{job.progress}%</p>
                          </div>
                        </div>

                        {job.error && (
                          <div className="rounded-lg border border-red-500/30 bg-red-950/30 p-3">
                            <p className="text-xs font-medium text-red-400">Error</p>
                            <p className="mt-1 text-sm text-red-300">{job.error}</p>
                          </div>
                        )}

                        <div>
                          <p className="mb-2 text-xs font-medium text-neutral-400">Logs</p>
                          <pre
                            ref={isExpanded ? logRef : undefined}
                            className="max-h-64 overflow-auto rounded-lg bg-neutral-950 border border-neutral-800 p-3 font-mono text-xs text-neutral-300 leading-relaxed"
                          >
                            {job.logs && job.logs.length > 0
                              ? job.logs.join("\n")
                              : "No log output yet."}
                          </pre>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {isActive && (
                            <Button
                              variant="destructive"
                              size="sm"
                              disabled={actionLoading === job.id}
                              onClick={() => handleAction(job.id, "cancel", job.type)}
                              className="gap-1.5"
                            >
                              {actionLoading === job.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Square size={14} />
                              )}
                              Cancel
                            </Button>
                          )}
                          {canRetry && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={actionLoading === job.id}
                              onClick={() => handleAction(job.id, "retry", job.type)}
                              className="gap-1.5"
                            >
                              {actionLoading === job.id ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <RotateCcw size={14} />
                              )}
                              Retry
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-neutral-400">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
