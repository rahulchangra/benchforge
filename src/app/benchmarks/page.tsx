"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MetricCard,
  FadeInSection,
  StaggerContainer,
  StaggerItem,
  AnimatedProgress,
} from "@/components/animations/motion-components";
import { Skeleton, SkeletonStatCard } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { motion } from "framer-motion";
import {
  FlaskConical,
  Search,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Loader2,
  ShieldCheck,
  Clock,
  Ban,
  Send,
  Trash2,
  RotateCcw,
  ArrowRight,
  BookOpen,
  GitBranch,
  AlertTriangle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type BenchmarkStatus = "DRAFT" | "VALIDATING" | "VALIDATED" | "PUBLISHED" | "REJECTED";

interface BenchmarkItem {
  id: string;
  status: BenchmarkStatus;
  version: number;
  metadata: string | null;
  problemDefinition: string | null;
  environment: string | null;
  validationEvidence: string | null;
  patchInfo: string | null;
  qualityScore: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  repository: { id: string; fullName: string; owner: string; name: string };
  issueCandidate: {
    id: string;
    issue: { id: string; number: number; title: string; state: string; url: string };
  } | null;
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "ALL", label: "All Statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "VALIDATING", label: "Validating" },
  { value: "VALIDATED", label: "Validated" },
  { value: "PUBLISHED", label: "Published" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_BADGE: Record<BenchmarkStatus, { variant: "default" | "success" | "warning" | "error" | "outline"; label: string }> = {
  DRAFT: { variant: "outline", label: "Draft" },
  VALIDATING: { variant: "default", label: "Validating" },
  VALIDATED: { variant: "warning", label: "Validated" },
  PUBLISHED: { variant: "success", label: "Published" },
  REJECTED: { variant: "error", label: "Rejected" },
};

const STATUS_ICON: Record<BenchmarkStatus, React.ReactNode> = {
  DRAFT: <BookOpen size={14} />,
  VALIDATING: <Clock size={14} />,
  VALIDATED: <ShieldCheck size={14} />,
  PUBLISHED: <FileCheck2 size={14} />,
  REJECTED: <Ban size={14} />,
};

const VALID_TRANSITIONS: Record<BenchmarkStatus, BenchmarkStatus[]> = {
  DRAFT: ["VALIDATING", "REJECTED"],
  VALIDATING: ["VALIDATED", "REJECTED"],
  VALIDATED: ["PUBLISHED", "REJECTED"],
  PUBLISHED: [],
  REJECTED: ["DRAFT"],
};

function safeJsonParse(value: string | null): Record<string, unknown> | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function formatDate(d: string | null) {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// JSON section component
// ---------------------------------------------------------------------------
function JsonSection({ title, raw }: { title: string; raw: string | null }) {
  const parsed = safeJsonParse(raw);
  if (!parsed || Object.keys(parsed).length === 0) return null;

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </h3>
      <pre className="overflow-x-auto rounded-lg border border-neutral-800 bg-neutral-950 p-3 text-xs text-neutral-300">
        {JSON.stringify(parsed, null, 2)}
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function BenchmarksPage() {
  const { toast } = useToast();

  // List state
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Status counts
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    DRAFT: 0,
    VALIDATING: 0,
    VALIDATED: 0,
    PUBLISHED: 0,
    REJECTED: 0,
  });

  // Detail / modal state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BenchmarkItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, debouncedSearch]);

  // Fetch list
  const fetchBenchmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", "12");
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`/api/benchmarks?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to fetch benchmarks");

      setBenchmarks(json.data ?? []);
      setTotal(json.pagination?.total ?? 0);
      setTotalPages(json.pagination?.totalPages ?? 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setError(msg);
      toast({ type: "error", title: "Fetch failed", description: msg });
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch, toast]);

  useEffect(() => {
    fetchBenchmarks();
  }, [fetchBenchmarks]);

  // Fetch all to compute status counts (lightweight)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/benchmarks?perPage=1000");
        const json = await res.json();
        const all: BenchmarkItem[] = json.data ?? [];
        const counts: Record<string, number> = { DRAFT: 0, VALIDATING: 0, VALIDATED: 0, PUBLISHED: 0, REJECTED: 0 };
        all.forEach((b) => {
          counts[b.status] = (counts[b.status] ?? 0) + 1;
        });
        setStatusCounts(counts);
      } catch {
        // silent
      }
    })();
  }, [benchmarks]); // recount after list changes

  // Fetch detail
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    (async () => {
      setDetailLoading(true);
      try {
        const res = await fetch(`/api/benchmarks/${selectedId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Not found");
        if (!cancelled) setDetail(json.data);
      } catch (err) {
        if (!cancelled) {
          toast({ type: "error", title: "Load failed", description: err instanceof Error ? err.message : "Unknown error" });
          setSelectedId(null);
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedId, toast]);

  // Status transition
  const handleStatusChange = async (newStatus: BenchmarkStatus) => {
    if (!detail) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/benchmarks/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Transition failed");
      toast({ type: "success", title: "Status updated", description: `Benchmark moved to ${newStatus}` });
      setSelectedId(detail.id);
      fetchBenchmarks();
    } catch (err) {
      toast({ type: "error", title: "Transition failed", description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!detail) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/benchmarks/${detail.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Delete failed");
      toast({ type: "success", title: "Benchmark deleted" });
      setDeleteConfirm(false);
      setSelectedId(null);
      fetchBenchmarks();
    } catch (err) {
      toast({ type: "error", title: "Delete failed", description: err instanceof Error ? err.message : "Unknown error" });
    } finally {
      setActionLoading(false);
    }
  };

  const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold">Benchmark Intelligence</h1>
          <p className="mt-1 text-sm text-neutral-400">
            Manage generated benchmarks &mdash; validate, publish, and track quality scores.
          </p>
        </div>

        {/* Stats row */}
        {loading && benchmarks.length === 0 ? (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonStatCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
            <MetricCard
              title="Total"
              value={totalAll}
              icon={<FlaskConical size={20} />}
            />
            <MetricCard
              title="Draft"
              value={statusCounts.DRAFT}
              icon={<BookOpen size={20} />}
            />
            <MetricCard
              title="Validating"
              value={statusCounts.VALIDATING}
              icon={<Clock size={20} />}
            />
            <MetricCard
              title="Validated"
              value={statusCounts.VALIDATED}
              icon={<ShieldCheck size={20} />}
            />
            <MetricCard
              title="Published"
              value={statusCounts.PUBLISHED}
              icon={<FileCheck2 size={20} />}
            />
            <MetricCard
              title="Rejected"
              value={statusCounts.REJECTED}
              icon={<Ban size={20} />}
            />
          </div>
        )}

        {/* Filter bar */}
        <Card>
          <CardContent className="flex flex-wrap items-center gap-3 p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <Input
                placeholder="Search by issue title\u2026"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Error state */}
        {error && (
          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle size={32} className="mx-auto mb-2 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={fetchBenchmarks}>
                <RotateCcw size={14} className="mr-1" /> Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Loading skeletons */}
        {loading && benchmarks.length === 0 && !error && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-full" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && benchmarks.length === 0 && (
          <Card>
            <CardContent className="p-8">
              <FadeInSection className="py-16 text-center">
                <FlaskConical size={48} className="mx-auto mb-4 text-neutral-700" />
                <p className="text-neutral-500">No benchmarks found.</p>
                <p className="mt-1 text-xs text-neutral-600">
                  {debouncedSearch || statusFilter !== "ALL"
                    ? "Try adjusting your filters."
                    : "Benchmarks are generated from eligible repositories with suitable issues."}
                </p>
              </FadeInSection>
            </CardContent>
          </Card>
        )}

        {/* Benchmarks grid */}
        {!loading && benchmarks.length > 0 && (
          <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benchmarks.map((b) => (
              <StaggerItem key={b.id}>
                <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  <Card
                    className="cursor-pointer transition-colors hover:border-neutral-600"
                    onClick={() => setSelectedId(b.id)}
                  >
                    <CardContent className="p-5 space-y-3">
                      {/* Repo name */}
                      <div className="flex items-center gap-2 text-xs text-neutral-400">
                        <GitBranch size={12} />
                        <span className="truncate">{b.repository.fullName}</span>
                      </div>

                      {/* Issue title */}
                      <p className="text-sm font-medium text-neutral-100 line-clamp-2">
                        {b.issueCandidate?.issue
                          ? `#${b.issueCandidate.issue.number} ${b.issueCandidate.issue.title}`
                          : "No linked issue"}
                      </p>

                      {/* Status + version */}
                      <div className="flex items-center gap-2">
                        <Badge variant={STATUS_BADGE[b.status].variant}>
                          <span className="mr-1 inline-flex">{STATUS_ICON[b.status]}</span>
                          {STATUS_BADGE[b.status].label}
                        </Badge>
                        <span className="text-xs text-neutral-500">v{b.version}</span>
                      </div>

                      {/* Quality score */}
                      {b.qualityScore !== null && b.qualityScore !== undefined && (
                        <AnimatedProgress
                          value={b.qualityScore * 100}
                          label="Quality"
                        />
                      )}

                      {/* Date */}
                      <p className="text-xs text-neutral-500">
                        {b.publishedAt
                          ? `Published ${formatDate(b.publishedAt)}`
                          : `Updated ${formatDate(b.updatedAt)}`}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              Page {page} of {totalPages} &middot; {total} benchmark{total !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} className="mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedId} onOpenChange={(open) => { if (!open) setSelectedId(null); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {detailLoading || !detail ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={32} className="animate-spin text-neutral-500" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Badge variant={STATUS_BADGE[detail.status].variant}>
                    <span className="mr-1 inline-flex">{STATUS_ICON[detail.status]}</span>
                    {STATUS_BADGE[detail.status].label}
                  </Badge>
                  <span className="text-xs text-neutral-500">v{detail.version}</span>
                </DialogTitle>
                <DialogDescription>
                  {detail.repository.fullName}
                  {detail.issueCandidate?.issue && (
                    <> &mdash; #{detail.issueCandidate.issue.number} {detail.issueCandidate.issue.title}</>
                  )}
                </DialogDescription>
              </DialogHeader>

              <DialogBody className="space-y-6">
                {/* Quality score */}
                {detail.qualityScore !== null && detail.qualityScore !== undefined && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Quality Score
                    </h3>
                    <AnimatedProgress value={detail.qualityScore * 100} label={`${(detail.qualityScore * 100).toFixed(1)}%`} />
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-neutral-500">Created</span>
                    <p className="text-neutral-200">{formatDate(detail.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-neutral-500">Updated</span>
                    <p className="text-neutral-200">{formatDate(detail.updatedAt)}</p>
                  </div>
                  {detail.publishedAt && (
                    <div>
                      <span className="text-neutral-500">Published</span>
                      <p className="text-neutral-200">{formatDate(detail.publishedAt)}</p>
                    </div>
                  )}
                </div>

                {/* Metadata sections */}
                <JsonSection title="Metadata" raw={detail.metadata} />
                <JsonSection title="Problem Definition" raw={detail.problemDefinition} />
                <JsonSection title="Environment" raw={detail.environment} />
                <JsonSection title="Validation Evidence" raw={detail.validationEvidence} />
                <JsonSection title="Patch Info" raw={detail.patchInfo} />

                {/* Status transitions */}
                {VALID_TRANSITIONS[detail.status].length > 0 && (
                  <div>
                    <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Status Transitions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {VALID_TRANSITIONS[detail.status].map((next) => (
                        <Button
                          key={next}
                          variant={next === "REJECTED" ? "destructive" : "default"}
                          size="sm"
                          disabled={actionLoading}
                          onClick={() => handleStatusChange(next)}
                        >
                          {actionLoading ? (
                            <Loader2 size={14} className="mr-1 animate-spin" />
                          ) : next === "PUBLISHED" ? (
                            <Send size={14} className="mr-1" />
                          ) : next === "REJECTED" ? (
                            <Ban size={14} className="mr-1" />
                          ) : next === "DRAFT" ? (
                            <RotateCcw size={14} className="mr-1" />
                          ) : (
                            <ArrowRight size={14} className="mr-1" />
                          )}
                          {STATUS_BADGE[next].label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </DialogBody>

              <DialogFooter>
                {detail.status === "DRAFT" && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setDeleteConfirm(true)}
                    disabled={actionLoading}
                  >
                    <Trash2 size={14} className="mr-1" />
                    Delete Draft
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Benchmark?</DialogTitle>
            <DialogDescription>
              This will permanently delete this draft benchmark. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)} disabled={actionLoading}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Trash2 size={14} className="mr-1" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
