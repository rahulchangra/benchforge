"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/animations/motion-components";
import { useToast } from "@/components/ui/toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { Network, ChevronRight, ChevronDown, Plus, Loader2, Circle, RefreshCw } from "lucide-react";

const NODE_TYPES = [
  "DOMAIN", "TOPIC", "SUBTOPIC", "CONCEPT", "REQUIREMENT_PATTERN",
  "SOLUTION_STRATEGY", "ARCHITECTURE_PATTERN", "ALGORITHM", "CODE_PATTERN",
  "TESTING_STRATEGY", "FAILURE_MODE", "EVALUATION_CRITERION",
  "APPROVED_EXAMPLE", "REUSABLE_INSIGHT", "EVIDENCE_SOURCE",
] as const;

const TYPE_COLORS: Record<string, string> = {
  DOMAIN: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  TOPIC: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  SUBTOPIC: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  CONCEPT: "bg-green-500/20 text-green-300 border-green-500/30",
  REQUIREMENT_PATTERN: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  SOLUTION_STRATEGY: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  ARCHITECTURE_PATTERN: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  ALGORITHM: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  CODE_PATTERN: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
  TESTING_STRATEGY: "bg-teal-500/20 text-teal-300 border-teal-500/30",
  FAILURE_MODE: "bg-red-500/20 text-red-300 border-red-500/30",
  EVALUATION_CRITERION: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  APPROVED_EXAMPLE: "bg-lime-500/20 text-lime-300 border-lime-500/30",
  REUSABLE_INSIGHT: "bg-sky-500/20 text-sky-300 border-sky-500/30",
  EVIDENCE_SOURCE: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

interface KnowledgeNode {
  id: string;
  name: string;
  type: string;
  definition: string | null;
  confidence: number;
  parentId: string | null;
  children: { id: string; name: string; type: string }[];
  outgoingEdges: { id: string; type: string; targetNodeId: string; confidence: number }[];
  incomingEdges: { id: string; type: string; sourceNodeId: string; confidence: number }[];
  _count: { children: number; outgoingEdges: number; incomingEdges: number };
}

interface Workspace {
  id: string;
  name: string;
  _count: { knowledgeNodes: number };
}

function TreeNode({ node, allNodes, expanded, toggleExpand, level, onAddChild }: {
  node: KnowledgeNode;
  allNodes: KnowledgeNode[];
  expanded: Set<string>;
  toggleExpand: (id: string) => void;
  level: number;
  onAddChild: (parentId: string) => void;
}) {
  const isExpanded = expanded.has(node.id);
  const childrenCount = node._count?.children ?? node.children?.length ?? 0;
  const hasChildren = (node.children?.length ?? 0) > 0 || childrenCount > 0;
  const childNodes = allNodes.filter((n) => (node.children ?? []).some((c) => c.id === n.id));
  const typeColor = TYPE_COLORS[node.type] ?? "bg-neutral-500/20 text-neutral-300 border-neutral-500/30";
  const outgoingCount = node._count?.outgoingEdges ?? node.outgoingEdges?.length ?? 0;
  const incomingCount = node._count?.incomingEdges ?? node.incomingEdges?.length ?? 0;
  const totalEdges = outgoingCount + incomingCount;

  return (
    <div style={{ paddingLeft: `${level * 24}px` }}>
      <div className="group flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-neutral-800/50 transition-colors">
        <button
          onClick={() => hasChildren && toggleExpand(node.id)}
          className={`shrink-0 w-5 h-5 flex items-center justify-center rounded ${hasChildren ? "text-neutral-400 hover:text-neutral-200" : "text-transparent"}`}
        >
          {hasChildren ? (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : <Circle size={6} />}
        </button>
        <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-medium ${typeColor}`}>
          {node.type.replace(/_/g, " ")}
        </span>
        <span className="text-sm text-neutral-200 flex-1 truncate">{node.name}</span>
        <div className="flex items-center gap-2 shrink-0">
          {/* Confidence bar */}
          <div className="w-16 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(node.confidence ?? 0.5) * 100}%`,
                backgroundColor: node.confidence >= 0.7 ? "#22c55e" : node.confidence >= 0.4 ? "#eab308" : "#ef4444",
              }}
            />
          </div>
          <span className="text-[10px] text-neutral-500 w-8">{Math.round((node.confidence ?? 0.5) * 100)}%</span>
          {totalEdges > 0 && (
            <span className="text-[10px] text-neutral-600">{totalEdges} edges</span>
          )}
          <button
            onClick={() => onAddChild(node.id)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-700 text-neutral-500 hover:text-neutral-300 transition-all"
            title="Add child node"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
      {isExpanded && childNodes.length > 0 && (
        <div className="border-l border-neutral-800 ml-5">
          {childNodes.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              allNodes={allNodes}
              expanded={expanded}
              toggleExpand={toggleExpand}
              level={level + 1}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
      {isExpanded && childrenCount > childNodes.length && (
        <div style={{ paddingLeft: `${(level + 1) * 24}px` }}>
          <p className="text-xs text-neutral-600 px-3 py-1">
            +{childrenCount - childNodes.length} more children (not loaded)
          </p>
        </div>
      )}
    </div>
  );
}

export default function ConceptGraphPage() {
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState("");
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Create node form
  const [showCreate, setShowCreate] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>(undefined);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<string>("CONCEPT");
  const [newDefinition, setNewDefinition] = useState("");
  const [newConfidence, setNewConfidence] = useState("0.5");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/learning/workspaces")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data) {
          setWorkspaces(json.data);
          if (json.data.length > 0) {
            setSelectedWorkspace(json.data[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const fetchNodes = useCallback(async () => {
    if (!selectedWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/learning/knowledge/nodes?workspaceId=${selectedWorkspace}&perPage=200`);
      const json = await res.json();
      if (json.success) setNodes(json.data ?? []);
    } catch {
      toast({ type: "error", title: "Failed to load nodes" });
    } finally {
      setLoading(false);
    }
  }, [selectedWorkspace, toast]);

  useEffect(() => { fetchNodes(); }, [fetchNodes]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpanded(new Set(nodes.map((n) => n.id)));
  const collapseAll = () => setExpanded(new Set());

  const rootNodes = nodes.filter((n) => !n.parentId);

  const openCreateDialog = (parentId?: string) => {
    setCreateParentId(parentId);
    setNewName("");
    setNewType("CONCEPT");
    setNewDefinition("");
    setNewConfidence("0.5");
    setShowCreate(true);
  };

  const createNode = async () => {
    if (!newName.trim() || !selectedWorkspace) return;
    setCreating(true);
    try {
      const body: Record<string, unknown> = {
        workspaceId: selectedWorkspace,
        type: newType,
        name: newName.trim(),
        definition: newDefinition.trim() || undefined,
        confidence: parseFloat(newConfidence) || 0.5,
      };
      if (createParentId) body.parentId = createParentId;

      const res = await fetch("/api/learning/knowledge/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: "Node created", description: `"${newName}" added.` });
        setShowCreate(false);
        fetchNodes();
        if (createParentId) setExpanded((prev) => new Set([...prev, createParentId]));
      } else {
        toast({ type: "error", title: "Create failed", description: json.error ?? "Unknown error" });
      }
    } catch {
      toast({ type: "error", title: "Create failed", description: "Network error" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Concept Graph</h1>
            <p className="mt-1 text-sm text-neutral-400">Explore cross-concept relationships with typed edges and evidence.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedWorkspace && (
              <>
                <Button variant="ghost" size="sm" onClick={expandAll}>Expand All</Button>
                <Button variant="ghost" size="sm" onClick={collapseAll}>Collapse All</Button>
                <Button variant="ghost" size="sm" onClick={fetchNodes} className="gap-1">
                  <RefreshCw size={14} /> Refresh
                </Button>
              </>
            )}
            <Button onClick={() => openCreateDialog()} disabled={!selectedWorkspace} className="gap-2">
              <Plus size={16} /> Add Node
            </Button>
          </div>
        </div>

        {/* Workspace selector */}
        <div className="max-w-sm">
          <Select value={selectedWorkspace} onValueChange={setSelectedWorkspace}>
            <SelectTrigger>
              <SelectValue placeholder="Select workspace..." />
            </SelectTrigger>
            <SelectContent>
              {workspaces.map((ws) => (
                <SelectItem key={ws.id} value={ws.id}>
                  {ws.name} ({ws._count?.knowledgeNodes ?? 0} nodes)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tree visualization */}
        <Card>
          <CardContent className="p-4">
            {!selectedWorkspace ? (
              <FadeInSection className="text-center py-16">
                <Network size={64} className="mx-auto mb-4 text-neutral-700" />
                <p className="text-neutral-400 text-lg font-medium">Select a Workspace</p>
                <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
                  Choose a workspace to explore its knowledge graph.
                </p>
              </FadeInSection>
            ) : loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
              </div>
            ) : nodes.length === 0 ? (
              <FadeInSection className="text-center py-16">
                <Network size={64} className="mx-auto mb-4 text-neutral-700" />
                <p className="text-neutral-400 text-lg font-medium">No Knowledge Nodes</p>
                <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
                  Create your first knowledge node to start building the concept graph.
                </p>
                <Button className="mt-4 gap-2" onClick={() => openCreateDialog()}>
                  <Plus size={16} /> Create First Node
                </Button>
              </FadeInSection>
            ) : (
              <div className="space-y-0.5">
                {/* Legend */}
                <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-neutral-800">
                  {Object.entries(TYPE_COLORS).slice(0, 8).map(([type, color]) => (
                    <span key={type} className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[9px] font-medium ${color}`}>
                      {type.replace(/_/g, " ")}
                    </span>
                  ))}
                  <span className="text-[9px] text-neutral-600">+{Object.keys(TYPE_COLORS).length - 8} more</span>
                </div>
                <div className="text-xs text-neutral-500 mb-2">
                  {nodes.length} nodes · {rootNodes.length} root nodes
                </div>
                {rootNodes.map((node) => (
                  <TreeNode
                    key={node.id}
                    node={node}
                    allNodes={nodes}
                    expanded={expanded}
                    toggleExpand={toggleExpand}
                    level={0}
                    onAddChild={(parentId) => openCreateDialog(parentId)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edge types reference */}
        {selectedWorkspace && nodes.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Edge Types Reference</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {["PARENT_OF", "DEPENDS_ON", "IMPLEMENTS", "EXTENDS", "SIMILAR_TO", "CONTRASTS_WITH",
                  "SOLVES", "TESTED_BY", "EVALUATED_BY", "DERIVED_FROM", "REUSES", "CONFLICTS_WITH", "SUPERSEDES"
                ].map((edge) => (
                  <Badge key={edge} variant="outline" className="text-[10px]">{edge}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Node Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Knowledge Node</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-4">
            {createParentId && (
              <div className="text-xs text-neutral-500">
                Parent: <span className="text-neutral-300">{nodes.find((n) => n.id === createParentId)?.name ?? createParentId}</span>
              </div>
            )}
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Name *</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Node name..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Type</label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NODE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t.replace(/_/g, " ")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Definition</label>
              <textarea
                value={newDefinition}
                onChange={(e) => setNewDefinition(e.target.value)}
                placeholder="What does this node represent?"
                rows={3}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Confidence ({Math.round(parseFloat(newConfidence || "0.5") * 100)}%)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={newConfidence}
                onChange={(e) => setNewConfidence(e.target.value)}
                className="w-full"
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={createNode} disabled={!newName.trim() || creating} className="gap-2">
              {creating && <Loader2 size={14} className="animate-spin" />}
              {creating ? "Creating..." : "Create Node"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
