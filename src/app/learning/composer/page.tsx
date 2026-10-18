"use client";

import { AppShell } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/animations/motion-components";
import { useToast } from "@/components/ui/toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { FileEdit, Send, Brain, CheckCircle2, Loader2, ThumbsUp, ThumbsDown, Clock, Eye, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Workspace {
  id: string;
  name: string;
  _count: { taskPackages: number; knowledgeNodes: number; generatedDrafts: number };
}

interface TaskPackage {
  id: string;
  title: string;
  description: string | null;
  domain: string | null;
}

interface Draft {
  id: string;
  taskTitle: string;
  taskDescription: string | null;
  generatedContent: string;
  approvalStatus: string;
  version: number;
  createdAt: string;
  workspace: { id: string; name: string };
  _count: { humanReviews: number; learningFeedback: number };
}

interface KnowledgeNode {
  id: string;
  name: string;
  type: string;
  definition: string | null;
  confidence: number;
}

export default function TaskComposerPage() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [tasks, setTasks] = useState<TaskPackage[]>([]);
  const [selectedTask, setSelectedTask] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [requirements, setRequirements] = useState("{}");
  const [generatedContent, setGeneratedContent] = useState("");
  const [generating, setGenerating] = useState(false);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [updatingDraft, setUpdatingDraft] = useState<string | null>(null);

  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);
  const [loadingNodes, setLoadingNodes] = useState(false);

  // Fetch workspaces
  useEffect(() => {
    fetch("/api/learning/workspaces")
      .then((r) => r.json())
      .then((json) => { if (json.success) setWorkspaces(json.data ?? []); })
      .catch(() => {});
  }, []);

  // Fetch tasks when workspace changes
  useEffect(() => {
    if (!selectedWorkspace) { setTasks([]); return; }
    fetch(`/api/learning/tasks?workspaceId=${selectedWorkspace}`)
      .then((r) => r.json())
      .then((json) => { if (json.success) setTasks(json.data ?? []); })
      .catch(() => {});
  }, [selectedWorkspace]);

  // Auto-populate from selected task
  useEffect(() => {
    if (!selectedTask) return;
    const task = tasks.find((t) => t.id === selectedTask);
    if (task) {
      setTaskTitle(task.title);
      setTaskDescription(task.description ?? "");
    }
  }, [selectedTask, tasks]);

  // Fetch drafts for workspace
  const fetchDrafts = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoadingDrafts(true);
    try {
      const res = await fetch(`/api/learning/drafts?workspaceId=${selectedWorkspace}`);
      const json = await res.json();
      if (json.success) setDrafts(json.data ?? []);
    } catch {} finally {
      setLoadingDrafts(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  // Fetch knowledge nodes
  const fetchNodes = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoadingNodes(true);
    try {
      const res = await fetch(`/api/learning/knowledge/nodes?workspaceId=${selectedWorkspace}&perPage=50`);
      const json = await res.json();
      if (json.success) setKnowledgeNodes(json.data ?? []);
    } catch {} finally {
      setLoadingNodes(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  const generateDraft = async () => {
    if (!taskTitle.trim() || !selectedWorkspace) {
      toast({ type: "warning", title: "Missing fields", description: "Select a workspace and enter a task title." });
      return;
    }
    let parsedReqs: Record<string, unknown> = {};
    try {
      parsedReqs = JSON.parse(requirements);
    } catch {
      toast({ type: "error", title: "Invalid JSON", description: "Requirements must be valid JSON." });
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/learning/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: selectedWorkspace,
          taskTitle: taskTitle.trim(),
          taskDescription: taskDescription.trim() || undefined,
          inputRequirements: parsedReqs,
          generatedContent: generatedContent.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: "Draft created", description: "New draft generated successfully." });
        setSelectedDraft(json.data);
        fetchDrafts();
      } else {
        toast({ type: "error", title: "Generation failed", description: json.error ?? "Unknown error" });
      }
    } catch {
      toast({ type: "error", title: "Generation failed", description: "Network error" });
    } finally {
      setGenerating(false);
    }
  };

  const updateDraftStatus = async (draftId: string, status: string) => {
    setUpdatingDraft(draftId);
    try {
      const res = await fetch(`/api/learning/drafts/${draftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus: status }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: `Draft ${status.toLowerCase()}` });
        fetchDrafts();
        if (selectedDraft?.id === draftId) {
          setSelectedDraft({ ...selectedDraft, approvalStatus: status });
        }
      } else {
        toast({ type: "error", title: "Update failed", description: json.error ?? "Unknown error" });
      }
    } catch {
      toast({ type: "error", title: "Update failed", description: "Network error" });
    } finally {
      setUpdatingDraft(null);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "APPROVED": case "APPROVED_WITH_CHANGES": return "success" as const;
      case "REJECTED": case "INCORRECT": return "error" as const;
      case "PENDING": return "warning" as const;
      default: return "outline" as const;
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Task Composer</h1>
          <p className="mt-1 text-sm text-neutral-400">Generate original submissions grounded in knowledge base evidence.</p>
        </div>

        {/* Workspace/Task selectors */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-neutral-500 mb-1 block">Workspace</label>
            <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
              <SelectTrigger>
                <SelectValue placeholder="Select workspace..." />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((ws) => (
                  <SelectItem key={ws.id} value={ws.id}>
                    {ws.name} ({ws._count.taskPackages} tasks)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-xs text-neutral-500 mb-1 block">Task (optional)</label>
            <Select value={selectedTask} onValueChange={setSelectedTask} disabled={!selectedWorkspace}>
              <SelectTrigger>
                <SelectValue placeholder="Select task to auto-fill..." />
              </SelectTrigger>
              <SelectContent>
                {tasks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Input panel */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileEdit size={18} />New Task Input</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Task Title *</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Enter task title..."
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2.5 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Description</label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Describe the task requirements, constraints, and expected outcomes..."
                  rows={4}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Input Requirements (JSON)</label>
                <textarea
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder='{"language": "python", "framework": "fastapi"}'
                  rows={4}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none resize-none font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-neutral-500 mb-1 block">Pre-written Content (optional)</label>
                <textarea
                  value={generatedContent}
                  onChange={(e) => setGeneratedContent(e.target.value)}
                  placeholder="Paste existing content or leave blank for auto-generation..."
                  rows={4}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none resize-none font-mono"
                />
              </div>
              <Button
                className="gap-2 w-full"
                disabled={!taskTitle.trim() || !selectedWorkspace || generating}
                onClick={generateDraft}
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                {generating ? "Generating..." : "Generate Draft"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {/* Selected draft viewer */}
            {selectedDraft && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2"><Eye size={18} />Draft Preview</CardTitle>
                    <Badge variant={statusColor(selectedDraft.approvalStatus)}>{selectedDraft.approvalStatus}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <span className="text-neutral-500">Title:</span>{" "}
                    <span className="text-neutral-200">{selectedDraft.taskTitle}</span>
                  </div>
                  {selectedDraft.taskDescription && (
                    <div className="text-sm">
                      <span className="text-neutral-500">Description:</span>{" "}
                      <span className="text-neutral-300">{selectedDraft.taskDescription}</span>
                    </div>
                  )}
                  <div className="rounded-lg border border-neutral-800 bg-neutral-950 p-4 max-h-64 overflow-y-auto">
                    <pre className="text-xs text-neutral-300 whitespace-pre-wrap font-mono">
                      {selectedDraft.generatedContent || "(No content generated)"}
                    </pre>
                  </div>
                  {selectedDraft.approvalStatus === "PENDING" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="gap-1 flex-1"
                        onClick={() => updateDraftStatus(selectedDraft.id, "APPROVED")}
                        disabled={updatingDraft === selectedDraft.id}
                      >
                        <ThumbsUp size={14} /> Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1 flex-1"
                        onClick={() => updateDraftStatus(selectedDraft.id, "REJECTED")}
                        disabled={updatingDraft === selectedDraft.id}
                      >
                        <ThumbsDown size={14} /> Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Knowledge retrieval panel */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Brain size={18} />Knowledge Nodes</CardTitle>
                  {selectedWorkspace && (
                    <Button variant="ghost" size="sm" onClick={fetchNodes} className="h-7 w-7 p-0">
                      <RefreshCw size={12} />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!selectedWorkspace ? (
                  <p className="text-sm text-neutral-500 text-center py-4">Select a workspace to view knowledge nodes.</p>
                ) : loadingNodes ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-neutral-500" /></div>
                ) : knowledgeNodes.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">No knowledge nodes in this workspace.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {knowledgeNodes.map((node) => (
                      <div key={node.id} className="flex items-center gap-2 rounded-md bg-neutral-900/50 px-3 py-2 text-xs">
                        <Badge variant="outline" className="text-[10px] shrink-0">{node.type}</Badge>
                        <span className="text-neutral-300 flex-1 truncate">{node.name}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <div className="w-12 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(node.confidence ?? 0.5) * 100}%` }} />
                          </div>
                          <span className="text-neutral-600 text-[10px]">{Math.round((node.confidence ?? 0.5) * 100)}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Previous drafts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Clock size={18} />Previous Drafts</CardTitle>
                  <Badge variant="outline">{drafts.length}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {!selectedWorkspace ? (
                  <p className="text-sm text-neutral-500 text-center py-4">Select a workspace to view drafts.</p>
                ) : loadingDrafts ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-neutral-500" /></div>
                ) : drafts.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">No drafts yet. Generate one above.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto">
                    {drafts.map((draft) => (
                      <div
                        key={draft.id}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 cursor-pointer transition-colors ${
                          selectedDraft?.id === draft.id ? "bg-blue-600/10 border border-blue-600/30" : "bg-neutral-900/50 hover:bg-neutral-800/50"
                        }`}
                        onClick={() => setSelectedDraft(draft)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-neutral-200 truncate">{draft.taskTitle}</p>
                          <p className="text-[10px] text-neutral-500">v{draft.version} · {new Date(draft.createdAt).toLocaleDateString()}</p>
                        </div>
                        <Badge variant={statusColor(draft.approvalStatus)} className="text-[10px] shrink-0">
                          {draft.approvalStatus}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
