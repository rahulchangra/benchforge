"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/animations/motion-components";
import { useToast } from "@/components/ui/toast";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Plus, ChevronRight, FileText, Tag, Loader2, Trash2, Edit2, ChevronDown, ChevronUp, X } from "lucide-react";

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
  uploadedDocuments?: { id: string; originalName: string; mimeType: string; size: number }[];
  extractedRequirements?: { id: string; content: string; type: string }[];
}

interface Workspace {
  id: string;
  name: string;
}

export default function LearningPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<TaskPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
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

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const getOrCreateWorkspace = async (): Promise<string | null> => {
    try {
      const res = await fetch("/api/learning/workspaces");
      const json = await res.json();
      if (json.success && json.data && json.data.length > 0) {
        return json.data[0].id;
      }
      // Auto-create a default workspace
      const createRes = await fetch("/api/learning/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Default Workspace", description: "Auto-created default workspace", userId: "system" }),
      });
      const createJson = await createRes.json();
      if (createJson.success) return createJson.data.id;
      toast({ type: "error", title: "Workspace error", description: createJson.error ?? "Could not create workspace" });
      return null;
    } catch {
      toast({ type: "error", title: "Workspace error", description: "Network error" });
      return null;
    }
  };

  const createTask = async () => {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const workspaceId = await getOrCreateWorkspace();
      if (!workspaceId) { setCreating(false); return; }

      const res = await fetch("/api/learning/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId,
          title: newTitle.trim(),
          description: newDescription.trim() || undefined,
          domain: newDomain.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: "Task created", description: `"${newTitle}" added successfully.` });
        setNewTitle("");
        setNewDescription("");
        setNewDomain("");
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
      case "APPROVED": return "success" as const;
      case "REJECTED": case "INCORRECT": return "error" as const;
      case "PENDING": return "warning" as const;
      default: return "outline" as const;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Learning Studio</h1>
            <p className="mt-1 text-sm text-neutral-400">Upload approved tasks, extract knowledge, and generate submissions.</p>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus size={16} /> New Task Package
          </Button>
        </div>

        {/* Create form */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <Card>
                <CardHeader><CardTitle>Create Task Package</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <input
                    type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Task title" className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                  <textarea
                    value={newDescription} onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optional)" rows={3}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
                  />
                  <input
                    type="text" value={newDomain} onChange={(e) => setNewDomain(e.target.value)}
                    placeholder="Domain (e.g., Web Development)" className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button disabled={!newTitle.trim() || creating} onClick={createTask} className="gap-2">
                      {creating && <Loader2 size={14} className="animate-spin" />}
                      {creating ? "Creating..." : "Create Package"}
                    </Button>
                    <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task list */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-red-400">{error}</p>
            <Button variant="outline" className="mt-4" onClick={fetchTasks}>Retry</Button>
          </div>
        ) : tasks.length === 0 ? (
          <FadeInSection className="py-16 text-center">
            <BookOpen size={48} className="mx-auto mb-4 text-neutral-700" />
            <p className="text-neutral-500">No task packages yet.</p>
            <p className="mt-1 text-xs text-neutral-600">Create a task package and upload approved solutions to start building knowledge.</p>
          </FadeInSection>
        ) : (
          <StaggerContainer className="space-y-3">
            {tasks.map((task) => (
              <StaggerItem key={task.id}>
                <Card className="transition-colors hover:border-neutral-700">
                  <CardContent className="p-0">
                    <div
                      className="flex items-center gap-4 p-5 cursor-pointer"
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400">
                        <FileText size={20} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-neutral-100">{task.title}</h3>
                          <Badge variant={statusColor(task.approvalStatus)}>{task.approvalStatus}</Badge>
                        </div>
                        {task.description && <p className="mt-0.5 text-sm text-neutral-400 line-clamp-1">{task.description}</p>}
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-neutral-500">
                          {task.domain && <span className="flex items-center gap-1"><Tag size={10} />{task.domain}</span>}
                          <span>{task._count.uploadedDocuments} documents</span>
                          <span>{task._count.extractedRequirements} requirements</span>
                          <span>v{task.version}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-neutral-500 hover:text-red-400"
                          onClick={(e) => { e.stopPropagation(); deleteTask(task.id, task.title); }}
                        >
                          <Trash2 size={14} />
                        </Button>
                        {expandedTask === task.id ? <ChevronUp size={16} className="text-neutral-500" /> : <ChevronDown size={16} className="text-neutral-600" />}
                      </div>
                    </div>

                    {/* Expanded detail */}
                    <AnimatePresence>
                      {expandedTask === task.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="border-t border-neutral-800 px-5 py-4 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-neutral-500">Created</span>
                                <p className="text-neutral-300">{new Date(task.createdAt).toLocaleString()}</p>
                              </div>
                              <div>
                                <span className="text-neutral-500">Updated</span>
                                <p className="text-neutral-300">{new Date(task.updatedAt).toLocaleString()}</p>
                              </div>
                              {task.category && (
                                <div>
                                  <span className="text-neutral-500">Category</span>
                                  <p className="text-neutral-300">{task.category}</p>
                                </div>
                              )}
                              <div>
                                <span className="text-neutral-500">Tags</span>
                                <p className="text-neutral-300">{task.tags ? JSON.parse(task.tags).join(", ") || "None" : "None"}</p>
                              </div>
                            </div>
                            {task.uploadedDocuments && task.uploadedDocuments.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-neutral-300 mb-1">Documents</h4>
                                <div className="space-y-1">
                                  {task.uploadedDocuments.map((doc) => (
                                    <div key={doc.id} className="flex items-center gap-2 text-xs text-neutral-400 bg-neutral-900/50 rounded px-2 py-1">
                                      <FileText size={12} />
                                      <span>{doc.originalName}</span>
                                      <span className="text-neutral-600">{doc.mimeType}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {task.extractedRequirements && task.extractedRequirements.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-neutral-300 mb-1">Requirements</h4>
                                <div className="space-y-1">
                                  {task.extractedRequirements.map((req) => (
                                    <div key={req.id} className="text-xs text-neutral-400 bg-neutral-900/50 rounded px-2 py-1">
                                      <Badge variant="outline" className="mr-2 text-[10px]">{req.type}</Badge>
                                      {req.content}
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
      </div>
    </AppShell>
  );
}
