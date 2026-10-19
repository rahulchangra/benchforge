"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/animations/motion-components";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Plus,
  FileText,
  Tag,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileArchive,
  Layers,
  Container,
  Terminal,
  FileCode,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { ZipTaskExtractor } from "@/components/learning/zip-task-extractor";
import { DocumentViewerModal } from "@/components/learning/document-viewer-modal";

interface UploadedDoc {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  extractedText?: string | null;
}

interface ExtractedReq {
  id: string;
  content: string;
  type: string;
  priority?: string;
}

interface TaskPackage {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
  category: string | null;
  approvalStatus: string;
  tags: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  _count: { uploadedDocuments: number; extractedRequirements: number };
  uploadedDocuments?: UploadedDoc[];
  extractedRequirements?: ExtractedReq[];
}

export default function LearningPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createMode, setCreateMode] = useState<"zip" | "manual">("zip");
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>("ws-default");

  // Manual creation form state
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<UploadedDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/learning/tasks");
      const data = await res.json();
      if (data.success) setTasks(data.data ?? []);
      else setError(data.error ?? "Failed to load tasks");
    } catch {
      setError("Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  }, []);

  const getOrCreateWorkspace = useCallback(async (): Promise<string> => {
    try {
      const res = await fetch("/api/learning/workspaces");
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        setActiveWorkspaceId(json.data[0].id);
        return json.data[0].id;
      }
      // Auto-create a default workspace
      const createRes = await fetch("/api/learning/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Default Workspace",
          description: "Auto-created default workspace",
          userId: "system",
        }),
      });
      const createJson = await createRes.json();
      if (createJson.success && createJson.data) {
        setActiveWorkspaceId(createJson.data.id);
        return createJson.data.id;
      }
      return "ws-default";
    } catch {
      return "ws-default";
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    getOrCreateWorkspace();
  }, [fetchTasks, getOrCreateWorkspace]);

  const handleManualCreateTask = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const workspaceId = await getOrCreateWorkspace();

      const res = await fetch("/api/learning/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          domain: newDomain.trim() || undefined,
          category: newCategory.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({
          type: "success",
          title: "Task created",
          description: `"${newTitle}" added successfully.`,
        });
        setNewTitle("");
        setNewDescription("");
        setNewDomain("");
        setNewCategory("");
        setShowCreate(false);
        fetchTasks();
      } else {
        toast({ type: "error", title: "Create failed", description: json.error ?? "Unknown error" });
      }
    } catch {
      toast({ type: "error", title: "Create failed", description: "Network error" });
    } finally {
      setCreating(false);
    }
  };

  const deleteTask = async (taskId: string, taskTitle: string) => {
    if (!confirm(`Delete "${taskTitle}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/learning/tasks/${taskId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: "Task deleted" });
        fetchTasks();
      } else {
        toast({ type: "error", title: "Delete failed", description: json.error ?? "Unknown error" });
      }
    } catch {
      toast({ type: "error", title: "Delete failed", description: "Network error" });
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "APPROVED":
        return "success" as const;
      case "REJECTED":
      case "INCORRECT":
        return "error" as const;
      case "PENDING":
        return "warning" as const;
      default:
        return "outline" as const;
    }
  };

  const getDocBadgeStyle = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("test.patch") || lower.includes("tests.patch")) {
      return {
        icon: <Layers size={11} className="text-emerald-400" />,
        badgeClass: "bg-emerald-950/40 text-emerald-300 border-emerald-800 hover:bg-emerald-900/50",
      };
    }
    if (lower.includes("solution.patch") || lower.includes("fix.patch")) {
      return {
        icon: <Layers size={11} className="text-purple-400" />,
        badgeClass: "bg-purple-950/40 text-purple-300 border-purple-800 hover:bg-purple-900/50",
      };
    }
    if (lower.includes("problem.md") || lower.includes("task.md") || lower.endsWith(".md")) {
      return {
        icon: <FileText size={11} className="text-blue-400" />,
        badgeClass: "bg-blue-950/40 text-blue-300 border-blue-800 hover:bg-blue-900/50",
      };
    }
    if (lower.includes("dockerfile")) {
      return {
        icon: <Container size={11} className="text-amber-400" />,
        badgeClass: "bg-amber-950/40 text-amber-300 border-amber-800 hover:bg-amber-900/50",
      };
    }
    if (lower.endsWith(".sh")) {
      return {
        icon: <Terminal size={11} className="text-cyan-400" />,
        badgeClass: "bg-cyan-950/40 text-cyan-300 border-cyan-800 hover:bg-cyan-900/50",
      };
    }
    return {
      icon: <FileCode size={11} className="text-neutral-400" />,
      badgeClass: "bg-neutral-900 text-neutral-300 border-neutral-700 hover:bg-neutral-800",
    };
  };

  return (
    <AppShell>
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-100 flex items-center gap-2.5">
              <span>Learning Studio</span>
              <Badge variant="outline" className="text-[11px] font-normal text-blue-400 border-blue-800 bg-blue-950/30">
                Task Library & Extraction
              </Badge>
            </h1>
            <p className="mt-1 text-sm text-neutral-400">
              Upload benchmark task archives (.zip), extract patches and Dockerfiles automatically, and synthesize knowledge graphs.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                setShowCreate(!showCreate);
                setCreateMode("zip");
              }}
              className="gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md"
            >
              <FileArchive size={16} /> Upload Task ZIP
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(!showCreate);
                setCreateMode("manual");
              }}
              className="gap-1.5 border-neutral-800 hover:border-neutral-700"
            >
              <Plus size={16} /> New Package
            </Button>
          </div>
        </div>

        {/* Creation Card (ZIP Extractor or Manual) */}
        <AnimatePresence>
          {showCreate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <Card className="border-neutral-800/80 bg-neutral-900/80 shadow-2xl backdrop-blur-xl">
                <CardHeader className="pb-3 border-b border-neutral-800/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-neutral-100 flex items-center gap-2">
                        {createMode === "zip" ? (
                          <>
                            <FileArchive className="text-blue-400" size={18} />
                            <span>Upload & Auto-Extract Task Archive (.ZIP)</span>
                          </>
                        ) : (
                          <>
                            <Plus className="text-blue-400" size={18} />
                            <span>Create Task Package (Manual)</span>
                          </>
                        )}
                      </CardTitle>
                      <p className="text-xs text-neutral-400 mt-1">
                        {createMode === "zip"
                          ? "Select or drop a benchmark zip file to automatically extract problem statement, test patch, solution patch, Dockerfile, and runner commands."
                          : "Manually fill in task package parameters and create a blank container."}
                      </p>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
                      <button
                        type="button"
                        onClick={() => setCreateMode("zip")}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                          createMode === "zip"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        ZIP Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateMode("manual")}
                        className={`text-xs px-2.5 py-1 rounded font-medium transition-all ${
                          createMode === "manual"
                            ? "bg-blue-600 text-white shadow-sm"
                            : "text-neutral-400 hover:text-neutral-200"
                        }`}
                      >
                        Manual
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-4">
                  {createMode === "zip" ? (
                    <ZipTaskExtractor
                      workspaceId={activeWorkspaceId}
                      onSuccess={() => {
                        setShowCreate(false);
                        fetchTasks();
                      }}
                      onCancel={() => setShowCreate(false)}
                    />
                  ) : (
                    /* Manual Input Form */
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Task title"
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                      />
                      <textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Description (optional)"
                        rows={3}
                        className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          placeholder="Domain (e.g., Python Backend & Systems)"
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          value={newCategory}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="Category (e.g., Bug Fix / Concurrency)"
                          className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          disabled={!newTitle.trim() || creating}
                          onClick={handleManualCreateTask}
                          className="gap-2"
                        >
                          {creating && <Loader2 size={14} className="animate-spin" />}
                          {creating ? "Creating..." : "Create Package"}
                        </Button>
                        <Button variant="ghost" onClick={() => setShowCreate(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-red-400">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchTasks}>
              Retry
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <FadeInSection className="py-16 text-center border border-dashed border-neutral-800 rounded-2xl bg-neutral-950/40">
            <BookOpen size={48} className="mx-auto mb-4 text-neutral-700" />
            <h3 className="text-base font-medium text-neutral-300">No task packages yet</h3>
            <p className="mt-1 text-xs text-neutral-500 max-w-sm mx-auto">
              Upload a benchmark task .ZIP archive with reproduction patches and Dockerfiles to start building knowledge.
            </p>
            <Button
              className="mt-4 gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500"
              onClick={() => {
                setShowCreate(true);
                setCreateMode("zip");
              }}
            >
              <FileArchive size={15} /> Upload Task ZIP Archive
            </Button>
          </FadeInSection>
        ) : (
          <StaggerContainer className="space-y-3">
            {tasks.map((task) => (
              <StaggerItem key={task.id}>
                <Card className="transition-all hover:border-neutral-700 bg-neutral-900/50 backdrop-blur-sm">
                  <CardContent className="p-0">
                    <div
                      className="flex items-center gap-4 p-5 cursor-pointer"
                      onClick={() =>
                        setExpandedTask(expandedTask === task.id ? null : task.id)
                      }
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 border border-blue-500/20 text-blue-400 shrink-0">
                        <FileArchive size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-neutral-100 truncate">{task.title}</h3>
                          <Badge variant={statusColor(task.approvalStatus)}>
                            {task.approvalStatus}
                          </Badge>
                          {task.category && (
                            <Badge variant="outline" className="text-[10px] text-neutral-400 border-neutral-800">
                              {task.category}
                            </Badge>
                          )}
                        </div>
                        {task.description && (
                          <p className="mt-1 text-xs text-neutral-400 line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                          {task.domain && (
                            <span className="flex items-center gap-1 text-neutral-300">
                              <Tag size={11} className="text-blue-400" />
                              {task.domain}
                            </span>
                          )}
                          <span className="text-neutral-400">
                            {task._count?.uploadedDocuments ?? task.uploadedDocuments?.length ?? 0} extracted files
                          </span>
                          <span className="text-neutral-400">
                            {task._count?.extractedRequirements ?? task.extractedRequirements?.length ?? 0} requirements
                          </span>
                          <span>v{task.version}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-neutral-500 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id, task.title);
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                        {expandedTask === task.id ? (
                          <ChevronUp size={16} className="text-neutral-500" />
                        ) : (
                          <ChevronDown size={16} className="text-neutral-600" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {expandedTask === task.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-neutral-800/80 px-5 py-4 space-y-4 bg-neutral-950/40">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                              <div>
                                <span className="text-neutral-500 block">Created</span>
                                <p className="text-neutral-300 font-medium mt-0.5">
                                  {new Date(task.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div>
                                <span className="text-neutral-500 block">Status</span>
                                <p className="text-neutral-300 font-medium mt-0.5">
                                  {task.approvalStatus}
                                </p>
                              </div>
                              <div>
                                <span className="text-neutral-500 block">Category</span>
                                <p className="text-neutral-300 font-medium mt-0.5">
                                  {task.category || "General"}
                                </p>
                              </div>
                              <div>
                                <span className="text-neutral-500 block">Tags</span>
                                <p className="text-neutral-300 font-medium mt-0.5">
                                  {task.tags
                                    ? JSON.parse(task.tags).join(", ") || "None"
                                    : "None"}
                                </p>
                              </div>
                            </div>

                            {/* Extracted Artifacts */}
                            {task.uploadedDocuments && task.uploadedDocuments.length > 0 && (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                                    <FileCode size={13} className="text-blue-400" />
                                    Extracted Benchmark Artifacts ({task.uploadedDocuments.length})
                                  </h4>
                                  <span className="text-[11px] text-neutral-500">
                                    Click any artifact to view diff & contents
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {task.uploadedDocuments.map((doc) => {
                                    const { icon, badgeClass } = getDocBadgeStyle(doc.originalName);
                                    return (
                                      <button
                                        key={doc.id}
                                        type="button"
                                        onClick={() => setViewingDoc(doc)}
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition-all cursor-pointer ${badgeClass}`}
                                      >
                                        {icon}
                                        <span className="font-mono font-medium">
                                          {doc.originalName}
                                        </span>
                                        <span className="text-[10px] opacity-75">
                                          ({(doc.size / 1024).toFixed(1)} KB)
                                        </span>
                                        <ExternalLink size={10} className="opacity-50" />
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Extracted Requirements */}
                            {task.extractedRequirements && task.extractedRequirements.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                                  <Sparkles size={13} className="text-yellow-400" />
                                  Synthesized Requirements ({task.extractedRequirements.length})
                                </h4>
                                <div className="space-y-1.5">
                                  {task.extractedRequirements.map((req) => (
                                    <div
                                      key={req.id}
                                      className="text-xs text-neutral-300 bg-neutral-900/70 border border-neutral-800/80 rounded-lg p-2.5 flex items-start gap-2"
                                    >
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] shrink-0 font-mono"
                                      >
                                        {req.type}
                                      </Badge>
                                      <span className="flex-1">{req.content}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}

        {/* Modal for viewing document diffs / text */}
        <DocumentViewerModal
          isOpen={viewingDoc !== null}
          onClose={() => setViewingDoc(null)}
          document={viewingDoc}
        />
      </div>
    </AppShell>
  );
}
