"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/components/ui/toast";
import { SkeletonTableRow } from "@/components/ui/skeleton";
import { FadeInSection } from "@/components/animations/motion-components";
import { timeAgo } from "@/lib/utils";
import {
  Bug,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";

/* ---------- types ---------- */

interface Repository {
  id: string;
  fullName: string;
  owner: string;
  name: string;
  primaryLanguage: string | null;
}

interface IssueCandidate {
  id: string;
  technicalScore: number | null;
  reproductionFeasibility: number | null;
  complexityScore: number | null;
  benchmarkSuitability: number | null;
  assessmentNotes: string | null;
  status: string;
  rejectionReason: string | null;
}

interface Issue {
  id: string;
  repositoryId: string;
  number: number;
  title: string;
  body: string | null;
  labels: string;
  state: string;
  url: string;
  authorLogin: string | null;
  createdAtGh: string;
  issueCandidate: IssueCandidate | null;
  repository: { id: string; fullName: string; owner: string; name: string };
}

interface Pagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/* ---------- helpers ---------- */

function parseLabels(labels: string): string[] {
  try {
    const parsed = JSON.parse(labels);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function statusVariant(status: string) {
  switch (status) {
    case "approved":
      return "success" as const;
    case "rejected":
      return "error" as const;
    default:
      return "warning" as const;
  }
}

/* ---------- main page ---------- */

export default function IssuesPage() {
  const { toast } = useToast();

  const [repos, setRepos] = useState<Repository[]>([]);
  const [repoId, setRepoId] = useState<string>("__all__");
  const [stateFilter, setStateFilter] = useState<string>("__all__");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hasCandidateOnly, setHasCandidateOnly] = useState(false);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);

  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    technicalScore: 0.5,
    reproductionFeasibility: 0.5,
    complexityScore: 0.5,
    benchmarkSuitability: 0.5,
    assessmentNotes: "",
    status: "pending",
    rejectionReason: "",
  });

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch repos on mount
  useEffect(() => {
    fetch("/api/repositories")
      .then((r) => r.json())
      .then((res) => {
        if (res.data) setRepos(res.data);
      })
      .catch(() => {});
  }, []);

  // Fetch issues
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("pageSize", "20");
      if (repoId !== "__all__") params.set("repositoryId", repoId);
      if (stateFilter !== "__all__") params.set("state", stateFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);
      if (hasCandidateOnly) params.set("has_candidate", "true");

      const res = await fetch(`/api/issues?${params}`);
      const json = await res.json();
      if (json.data) {
        setIssues(json.data);
        setPagination(json.pagination ?? null);
      }
    } catch {
      toast({ type: "error", title: "Failed to load issues" });
    } finally {
      setLoading(false);
    }
  }, [page, repoId, stateFilter, debouncedSearch, hasCandidateOnly, toast]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [repoId, stateFilter, debouncedSearch, hasCandidateOnly]);

  // Discover issues
  async function handleDiscover() {
    if (repoId === "__all__") {
      toast({ type: "warning", title: "Select a repository first" });
      return;
    }
    setDiscovering(true);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId: repoId }),
      });
      const json = await res.json();
      if (res.ok) {
        toast({
          type: "success",
          title: "Issues discovered",
          description: `${json.data?.upserted ?? 0} issues synced from GitHub`,
        });
        fetchIssues();
      } else {
        toast({ type: "error", title: json.error ?? "Discovery failed" });
      }
    } catch {
      toast({ type: "error", title: "Discovery request failed" });
    } finally {
      setDiscovering(false);
    }
  }

  // Open issue detail
  async function openDetail(issue: Issue) {
    setSelectedIssue(issue);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}`);
      const json = await res.json();
      if (json.data) {
        const d = json.data;
        setSelectedIssue(d);
        const c = d.issueCandidate;
        setForm({
          technicalScore: c?.technicalScore ?? 0.5,
          reproductionFeasibility: c?.reproductionFeasibility ?? 0.5,
          complexityScore: c?.complexityScore ?? 0.5,
          benchmarkSuitability: c?.benchmarkSuitability ?? 0.5,
          assessmentNotes: c?.assessmentNotes ?? "",
          status: c?.status ?? "pending",
          rejectionReason: c?.rejectionReason ?? "",
        });
      }
    } catch {
      toast({ type: "error", title: "Failed to load issue details" });
    } finally {
      setDetailLoading(false);
    }
  }

  // Save assessment
  async function handleSave() {
    if (!selectedIssue) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        technicalScore: form.technicalScore,
        reproductionFeasibility: form.reproductionFeasibility,
        complexityScore: form.complexityScore,
        benchmarkSuitability: form.benchmarkSuitability,
        assessmentNotes: form.assessmentNotes || undefined,
        status: form.status,
      };
      if (form.status === "rejected") {
        payload.rejectionReason = form.rejectionReason || undefined;
      }

      const res = await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        toast({ type: "success", title: "Assessment saved" });
        setSelectedIssue(null);
        fetchIssues();
      } else {
        const json = await res.json();
        toast({ type: "error", title: json.error ?? "Save failed" });
      }
    } catch {
      toast({ type: "error", title: "Save request failed" });
    } finally {
      setSaving(false);
    }
  }

  const totalPages = pagination?.totalPages ?? 1;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Issues Explorer</h1>
            <p className="mt-1 text-sm text-neutral-400">
              Browse discovered issues and assess benchmark suitability.
            </p>
          </div>
          <Button
            onClick={handleDiscover}
            disabled={discovering || repoId === "__all__"}
          >
            {discovering ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <RefreshCw size={16} className="mr-2" />
            )}
            Discover Issues
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="w-56">
                <label className="mb-1 block text-xs font-medium text-neutral-400">
                  Repository
                </label>
                <Select value={repoId} onValueChange={setRepoId}>
                  <SelectTrigger>
                    <SelectValue placeholder="All repositories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All repositories</SelectItem>
                    {repos.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <label className="mb-1 block text-xs font-medium text-neutral-400">
                  State
                </label>
                <Select value={stateFilter} onValueChange={setStateFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All states" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[200px] flex-1">
                <label className="mb-1 block text-xs font-medium text-neutral-400">
                  Search
                </label>
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
                  />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search issues..."
                    className="pl-9"
                  />
                </div>
              </div>

              <button
                onClick={() => setHasCandidateOnly((v) => !v)}
                className={`flex h-10 items-center gap-2 rounded-lg border px-3 text-sm transition-colors ${
                  hasCandidateOnly
                    ? "border-blue-500/50 bg-blue-500/10 text-blue-400"
                    : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
                }`}
              >
                <Filter size={14} />
                With candidates
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Issues table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="divide-y divide-neutral-800">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonTableRow key={i} columns={6} />
                ))}
              </div>
            ) : issues.length === 0 ? (
              <FadeInSection className="py-16 text-center">
                <Bug size={48} className="mx-auto mb-4 text-neutral-700" />
                <p className="text-neutral-500">No issues found.</p>
                <p className="mt-1 text-xs text-neutral-600">
                  {repoId === "__all__"
                    ? "Select a repository and click \u2018Discover Issues\u2019 to get started."
                    : "Try adjusting filters or discover issues from GitHub."}
                </p>
              </FadeInSection>
            ) : (
              <>
                {/* Table header */}
                <div className="hidden border-b border-neutral-800 px-4 py-3 text-xs font-medium text-neutral-500 sm:grid sm:grid-cols-12 sm:gap-4">
                  <div className="col-span-3">Repository</div>
                  <div className="col-span-4">Issue</div>
                  <div className="col-span-1">State</div>
                  <div className="col-span-1">Author</div>
                  <div className="col-span-1">Created</div>
                  <div className="col-span-2">Candidate</div>
                </div>

                <div className="divide-y divide-neutral-800/50">
                  {issues.map((issue) => {
                    const labels = parseLabels(issue.labels);
                    return (
                      <button
                        key={issue.id}
                        onClick={() => openDetail(issue)}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-neutral-800/40 sm:grid sm:grid-cols-12 sm:items-center sm:gap-4"
                      >
                        <div className="col-span-3 truncate text-sm text-neutral-300">
                          {issue.repository?.fullName ?? "\u2014"}
                        </div>

                        <div className="col-span-4 mt-1 sm:mt-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-neutral-500">
                              #{issue.number}
                            </span>
                            <span className="truncate text-sm font-medium text-neutral-100">
                              {issue.title}
                            </span>
                          </div>
                          {labels.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {labels.slice(0, 3).map((l) => (
                                <Badge key={l} variant="outline" className="text-[10px]">
                                  {l}
                                </Badge>
                              ))}
                              {labels.length > 3 && (
                                <span className="text-[10px] text-neutral-500">
                                  +{labels.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="col-span-1 mt-1 sm:mt-0">
                          <Badge variant={issue.state === "open" ? "success" : "default"}>
                            {issue.state}
                          </Badge>
                        </div>

                        <div className="col-span-1 mt-1 truncate text-xs text-neutral-400 sm:mt-0">
                          {issue.authorLogin ?? "\u2014"}
                        </div>

                        <div className="col-span-1 mt-1 text-xs text-neutral-500 sm:mt-0">
                          {timeAgo(issue.createdAtGh)}
                        </div>

                        <div className="col-span-2 mt-1 sm:mt-0">
                          {issue.issueCandidate ? (
                            <Badge variant={statusVariant(issue.issueCandidate.status)}>
                              {issue.issueCandidate.status}
                            </Badge>
                          ) : (
                            <span className="text-xs text-neutral-600">No assessment</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination && totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-500">
              Showing {issues.length} of {pagination.total} issues
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft size={16} />
              </Button>
              <span className="text-sm text-neutral-400">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail dialog */}
      <Dialog
        open={!!selectedIssue}
        onOpenChange={(open) => {
          if (!open) setSelectedIssue(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          {selectedIssue && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-neutral-500">#{selectedIssue.number}</span>
                  <span className="truncate">{selectedIssue.title}</span>
                </DialogTitle>
                <DialogDescription>
                  {selectedIssue.repository?.fullName} &middot;{" "}
                  <Badge variant={selectedIssue.state === "open" ? "success" : "default"}>
                    {selectedIssue.state}
                  </Badge>
                  <a
                    href={selectedIssue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 text-blue-400 hover:underline"
                  >
                    View on GitHub <ExternalLink size={12} />
                  </a>
                </DialogDescription>
              </DialogHeader>

              <DialogBody>
                {detailLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {parseLabels(selectedIssue.labels).length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {parseLabels(selectedIssue.labels).map((l) => (
                          <Badge key={l} variant="outline">{l}</Badge>
                        ))}
                      </div>
                    )}

                    {selectedIssue.body && (
                      <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                        <p className="mb-2 text-xs font-medium text-neutral-500">Description</p>
                        <div className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm text-neutral-300">
                          {selectedIssue.body}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-neutral-200">Benchmark Assessment</p>

                      <div className="grid grid-cols-2 gap-4">
                        {([
                          ["technicalScore", "Technical Score"],
                          ["reproductionFeasibility", "Reproduction Feasibility"],
                          ["complexityScore", "Complexity Score"],
                          ["benchmarkSuitability", "Benchmark Suitability"],
                        ] as const).map(([key, label]) => (
                          <div key={key}>
                            <label className="mb-1 flex items-center justify-between text-xs text-neutral-400">
                              <span>{label}</span>
                              <span className="font-mono text-neutral-300">
                                {(form[key as keyof typeof form] as number).toFixed(2)}
                              </span>
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.01"
                              value={form[key as keyof typeof form] as number}
                              onChange={(e) =>
                                setForm((f) => ({ ...f, [key]: parseFloat(e.target.value) }))
                              }
                              className="w-full accent-blue-500"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-400">Status</label>
                        <Select
                          value={form.status}
                          onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="approved">Approved</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-neutral-400">Assessment Notes</label>
                        <textarea
                          value={form.assessmentNotes}
                          onChange={(e) => setForm((f) => ({ ...f, assessmentNotes: e.target.value }))}
                          rows={3}
                          className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Notes about benchmark suitability..."
                        />
                      </div>

                      {form.status === "rejected" && (
                        <div>
                          <label className="mb-1 block text-xs font-medium text-neutral-400">Rejection Reason</label>
                          <textarea
                            value={form.rejectionReason}
                            onChange={(e) => setForm((f) => ({ ...f, rejectionReason: e.target.value }))}
                            rows={2}
                            className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Why was this issue rejected?"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </DialogBody>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedIssue(null)}>Cancel</Button>
                <Button onClick={handleSave} disabled={saving || detailLoading}>
                  {saving && <Loader2 size={16} className="mr-2 animate-spin" />}
                  Save Assessment
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
