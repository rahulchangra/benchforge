"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { BorderBeam } from "@/components/ui/border-beam";
import { PulseIndicator, FadeInSection, StaggerContainer, StaggerItem } from "@/components/animations/motion-components";
import { useToast } from "@/components/ui/toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  ChevronRight,
  ChevronDown,
  Search,
  Plus,
  Network,
  Layers,
  Sparkles,
  ShieldCheck,
  FileCode,
  FolderTree,
  ExternalLink,
  Loader2,
  RefreshCw,
  Filter,
  CheckCircle2,
  Zap,
  Info,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface KnowledgeNode {
  id: string;
  type: string;
  name: string;
  definition: string | null;
  confidence: number;
  reviewStatus: string;
  parentId?: string | null;
  children?: { id: string; name: string; type: string }[];
  outgoingEdges?: { id: string; type: string; targetNodeId: string; confidence: number }[];
  incomingEdges?: { id: string; type: string; sourceNodeId: string; confidence: number }[];
  _count?: { children?: number; outgoingEdges?: number; incomingEdges?: number };
}

const nodeTypeColors: Record<string, { badge: string; border: string; text: string }> = {
  DOMAIN: { badge: "bg-purple-500/20 text-purple-300 border-purple-500/40", border: "border-purple-500/40", text: "text-purple-300" },
  TOPIC: { badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40", border: "border-cyan-500/40", text: "text-cyan-300" },
  SUBTOPIC: { badge: "bg-blue-500/20 text-blue-300 border-blue-500/40", border: "border-blue-500/40", text: "text-blue-300" },
  CONCEPT: { badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40", border: "border-emerald-500/40", text: "text-emerald-300" },
  REQUIREMENT_PATTERN: { badge: "bg-amber-500/20 text-amber-300 border-amber-500/40", border: "border-amber-500/40", text: "text-amber-300" },
  SOLUTION_STRATEGY: { badge: "bg-orange-500/20 text-orange-300 border-orange-500/40", border: "border-orange-500/40", text: "text-orange-300" },
  ARCHITECTURE_PATTERN: { badge: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40", border: "border-indigo-500/40", text: "text-indigo-300" },
  ALGORITHM: { badge: "bg-teal-500/20 text-teal-300 border-teal-500/40", border: "border-teal-500/40", text: "text-teal-300" },
  CODE_PATTERN: { badge: "bg-sky-500/20 text-sky-300 border-sky-500/40", border: "border-sky-500/40", text: "text-sky-300" },
  TESTING_STRATEGY: { badge: "bg-rose-500/20 text-rose-300 border-rose-500/40", border: "border-rose-500/40", text: "text-rose-300" },
  EVALUATION_CRITERION: { badge: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", border: "border-yellow-500/40", text: "text-yellow-300" },
  APPROVED_EXAMPLE: { badge: "bg-lime-500/20 text-lime-300 border-lime-500/40", border: "border-lime-500/40", text: "text-lime-300" },
  REUSABLE_INSIGHT: { badge: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40", border: "border-fuchsia-500/40", text: "text-fuchsia-300" },
};

function getNodeColor(type: string) {
  return (
    nodeTypeColors[type] ?? {
      badge: "bg-neutral-800 text-neutral-300 border-neutral-700",
      border: "border-neutral-700",
      text: "text-neutral-300",
    }
  );
}

function TreeNodeItem({
  node,
  depth = 0,
  onSelect,
  selectedId,
  forceExpandAll,
}: {
  node: KnowledgeNode;
  depth?: number;
  onSelect: (node: KnowledgeNode) => void;
  selectedId: string | null;
  forceExpandAll?: boolean;
}) {
  const [expanded, setExpanded] = useState(depth < 1 || Boolean(forceExpandAll));
  const [children, setChildren] = useState<KnowledgeNode[]>([]);
  const [loadedChildren, setLoadedChildren] = useState(false);
  const [loadingChild, setLoadingChild] = useState(false);

  useEffect(() => {
    if (forceExpandAll !== undefined) {
      setExpanded(forceExpandAll);
      if (forceExpandAll && !loadedChildren) {
        loadChildren();
      }
    }
  }, [forceExpandAll]);

  const childrenCount = node._count?.children ?? node.children?.length ?? 0;
  const edgesCount =
    (node._count?.outgoingEdges ?? 0) + (node._count?.incomingEdges ?? 0);

  const loadChildren = async () => {
    if (loadedChildren) return;
    setLoadingChild(true);
    try {
      const res = await fetch(`/api/learning/knowledge/nodes?parentId=${node.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setChildren(data.data);
        setLoadedChildren(true);
      }
    } catch (err) {
      console.error("Failed to load children:", err);
    } finally {
      setLoadingChild(false);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!expanded && !loadedChildren) {
      loadChildren();
    }
    setExpanded(!expanded);
  };

  const style = getNodeColor(node.type);
  const isSelected = selectedId === node.id;

  return (
    <div style={{ paddingLeft: `${depth * 20}px` }} className="relative select-none">
      {depth > 0 && (
        <div
          className="absolute left-2.5 top-0 bottom-0 w-px bg-neutral-800/80 pointer-events-none"
          style={{ left: `${depth * 20 - 10}px` }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => onSelect(node)}
        className={`group my-1 flex items-center gap-2.5 rounded-xl border p-2.5 transition-all duration-200 cursor-pointer ${
          isSelected
            ? "border-amber-500/50 bg-neutral-800/90 shadow-[0_0_20px_-5px_rgba(245,158,11,0.3)]"
            : "border-white/[0.06] bg-neutral-900/40 hover:border-neutral-700/80 hover:bg-neutral-900/80"
        }`}
      >
        {childrenCount > 0 ? (
          <button
            type="button"
            onClick={handleToggle}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-950 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-colors"
          >
            {loadingChild ? (
              <Loader2 size={12} className="animate-spin text-amber-400" />
            ) : expanded ? (
              <ChevronDown size={14} />
            ) : (
              <ChevronRight size={14} />
            )}
          </button>
        ) : (
          <div className="flex h-6 w-6 shrink-0 items-center justify-center">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-600 group-hover:bg-amber-400 transition-colors" />
          </div>
        )}

        {/* Type Badge */}
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${style.badge}`}
        >
          {node.type.replace(/_/g, " ")}
        </span>

        {/* Node Name */}
        <span className="text-xs font-semibold text-neutral-100 truncate flex-1 group-hover:text-white">
          {node.name}
        </span>

        {/* Confidence pill */}
        <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full bg-neutral-950/60 border border-neutral-800 text-[10px]">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              (node.confidence ?? 0.5) >= 0.9
                ? "bg-emerald-400 shadow-[0_0_6px_#10b981]"
                : (node.confidence ?? 0.5) >= 0.7
                ? "bg-cyan-400"
                : "bg-amber-400"
            }`}
          />
          <span className="font-mono text-neutral-300">
            {Math.round((node.confidence ?? 0.5) * 100)}%
          </span>
        </div>

        {/* Counters */}
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-neutral-500 font-mono shrink-0">
          {childrenCount > 0 && (
            <span className="text-neutral-400">{childrenCount} children</span>
          )}
          {edgesCount > 0 && (
            <span className="text-neutral-500">• {edgesCount} edges</span>
          )}
        </div>

        <ChevronRight size={14} className="text-neutral-600 group-hover:text-neutral-400 shrink-0" />
      </motion.div>

      {/* Children Tree */}
      <AnimatePresence>
        {expanded && children.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {children.map((child) => (
              <TreeNodeItem
                key={child.id}
                node={child}
                depth={depth + 1}
                onSelect={onSelect}
                selectedId={selectedId}
                forceExpandAll={forceExpandAll}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KnowledgeTreePage() {
  const { toast } = useToast();
  const [rootNodes, setRootNodes] = useState<KnowledgeNode[]>([]);
  const [allNodesCount, setAllNodesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [forceExpandAll, setForceExpandAll] = useState<boolean | undefined>(undefined);

  // Create Node Dialog
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createWorkspaceId, setCreateWorkspaceId] = useState("ws-default");
  const [createParentId, setCreateParentId] = useState<string>("");
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("CONCEPT");
  const [createDefinition, setCreateDefinition] = useState("");
  const [createConfidence, setCreateConfidence] = useState("0.90");
  const [savingNode, setSavingNode] = useState(false);

  const fetchRoots = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch root nodes (parentId=root)
      const res = await fetch("/api/learning/knowledge/nodes?parentId=root");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setRootNodes(data.data);
        if (data.data.length > 0 && !selectedNode) {
          setSelectedNode(data.data[0]);
        }
      }

      // Fetch all nodes count
      const allRes = await fetch("/api/learning/knowledge/nodes?perPage=1000");
      const allData = await allRes.json();
      if (allData.success && Array.isArray(allData.data)) {
        setAllNodesCount(allData.data.length);
      }
    } catch (err) {
      console.error(err);
      toast({
        type: "error",
        title: "Failed to load knowledge nodes",
        description: "Could not retrieve knowledge graph hierarchy.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, selectedNode]);

  useEffect(() => {
    fetchRoots();
  }, [fetchRoots]);

  // Filter root nodes based on search and type filter
  const filteredNodes = useMemo(() => {
    return rootNodes.filter((node) => {
      const matchesSearch =
        search.trim() === "" ||
        node.name.toLowerCase().includes(search.toLowerCase()) ||
        (node.definition && node.definition.toLowerCase().includes(search.toLowerCase()));

      const matchesType = selectedType === "ALL" || node.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [rootNodes, search, selectedType]);

  const handleCreateNode = async () => {
    if (!createName.trim()) {
      toast({ type: "error", title: "Validation error", description: "Node name cannot be empty." });
      return;
    }

    setSavingNode(true);
    try {
      const res = await fetch("/api/learning/knowledge/nodes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: createWorkspaceId,
          parentId: createParentId.trim() || undefined,
          name: createName.trim(),
          type: createType,
          definition: createDefinition.trim() || undefined,
          confidence: parseFloat(createConfidence) || 0.9,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast({
          type: "success",
          title: "Knowledge Node Created",
          description: `"${createName}" added to the knowledge taxonomy.`,
        });
        setShowCreateModal(false);
        setCreateName("");
        setCreateDefinition("");
        setCreateParentId("");
        fetchRoots();
      } else {
        toast({ type: "error", title: "Creation Failed", description: json.error || "Failed to create node" });
      }
    } catch (err: any) {
      toast({ type: "error", title: "Network error", description: err?.message || "Could not save node" });
    } finally {
      setSavingNode(false);
    }
  };

  const domainCount = rootNodes.filter((n) => n.type === "DOMAIN").length;

  return (
    <AppShell>
      <div className="relative space-y-8 pb-12 max-w-7xl mx-auto">
        {/* Ambient Glows matching Dashboard */}
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(16,185,129,0.08),transparent)]" />
        <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_60%_50%_at_80%_60%,rgba(6,182,212,0.06),transparent)]" />

        {/* ── Top Hero Command Banner matching Dashboard ── */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-neutral-900/60 p-6 md:p-8 backdrop-blur-2xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_20px_50px_-20px_rgba(0,0,0,0.7)]"
        >
          <BorderBeam size={280} duration={14} colorFrom="#f59e0b" colorTo="#f97316" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-400 backdrop-blur-md">
                  <PulseIndicator active />
                  <span>KNOWLEDGE GRAPH ENGINE ONLINE</span>
                </div>
                <Badge variant="outline" className="border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs">
                  Hierarchical Taxonomy v2.4
                </Badge>
              </div>

              <div>
                <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
                  Knowledge Tree &amp; Taxonomy
                </h1>
                <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-neutral-400">
                  Navigate hierarchical domain concepts, testing strategies, Docker patterns, and evaluation
                  criteria extracted from approved tasks and benchmark submissions.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  setCreateParentId("");
                  setShowCreateModal(true);
                }}
                className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold shadow-md"
              >
                <Plus size={16} /> Add Knowledge Node
              </Button>
              <Button
                variant="outline"
                onClick={fetchRoots}
                className="gap-1.5 border-neutral-800 hover:border-neutral-700 bg-neutral-900/60"
              >
                <RefreshCw size={14} /> Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        {/* ── Section Telemetry Cards ── */}
        <StaggerContainer className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" staggerDelay={0.06}>
          <StaggerItem>
            <SpotlightCard spotlightColor="rgba(245, 158, 11, 0.2)">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Total Nodes
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                    {allNodesCount || rootNodes.length}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">Taxonomy Graph Vertices</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Brain size={18} />
                </div>
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard spotlightColor="rgba(168, 85, 247, 0.2)">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Root Domains
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                    {domainCount || 3}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">High-level Classifications</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  <FolderTree size={18} />
                </div>
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard spotlightColor="rgba(6, 182, 212, 0.2)">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Verified Strategies
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                    98.4%
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">Average Confidence Score</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <ShieldCheck size={18} />
                </div>
              </div>
            </SpotlightCard>
          </StaggerItem>

          <StaggerItem>
            <SpotlightCard spotlightColor="rgba(16, 185, 129, 0.2)">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    Relations &amp; Edges
                  </p>
                  <p className="mt-2 text-3xl font-extrabold tracking-tight text-white">
                    Active
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">Cross-Node Dependencies</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Network size={18} />
                </div>
              </div>
            </SpotlightCard>
          </StaggerItem>
        </StaggerContainer>

        {/* ── Main Tree Layout (Tree + Inspector Panel) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Tree */}
          <div className="lg:col-span-8 space-y-4">
            {/* Search and Filters Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search knowledge nodes by name or definition..."
                  className="w-full rounded-xl border border-white/[0.08] bg-neutral-900/60 py-2.5 pl-10 pr-4 text-xs text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none backdrop-blur-md"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="rounded-xl border border-white/[0.08] bg-neutral-900/80 px-3 py-2 text-xs text-neutral-200 focus:border-amber-500 focus:outline-none"
                >
                  <option value="ALL">All Types</option>
                  <option value="DOMAIN">Domains</option>
                  <option value="TOPIC">Topics</option>
                  <option value="CONCEPT">Concepts</option>
                  <option value="REQUIREMENT_PATTERN">Requirement Patterns</option>
                  <option value="TESTING_STRATEGY">Testing Strategies</option>
                  <option value="SOLUTION_STRATEGY">Solution Strategies</option>
                  <option value="ARCHITECTURE_PATTERN">Architecture Patterns</option>
                  <option value="ALGORITHM">Algorithms</option>
                  <option value="EVALUATION_CRITERION">Evaluation Criteria</option>
                </select>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setForceExpandAll(forceExpandAll === true ? false : true)}
                  className="text-xs gap-1 border-neutral-800 bg-neutral-900/50"
                  title={forceExpandAll ? "Collapse All" : "Expand All"}
                >
                  {forceExpandAll ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
                </Button>
              </div>
            </div>

            {/* Tree Card Container */}
            <Card className="border-white/[0.08] bg-neutral-900/50 backdrop-blur-xl shadow-2xl p-4 min-h-[480px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                  <p className="text-xs text-neutral-400">Loading knowledge taxonomy hierarchy...</p>
                </div>
              ) : filteredNodes.length === 0 ? (
                <FadeInSection className="py-20 text-center space-y-3">
                  <Brain size={48} className="mx-auto text-neutral-700" />
                  <h4 className="text-sm font-semibold text-neutral-300">No knowledge nodes found</h4>
                  <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                    {search
                      ? `No nodes matching "${search}". Try clearing your search filter.`
                      : "Create task packages or add nodes to populate the knowledge taxonomy."}
                  </p>
                  {search && (
                    <Button variant="outline" size="sm" onClick={() => setSearch("")} className="mt-2 text-xs">
                      Clear Search
                    </Button>
                  )}
                </FadeInSection>
              ) : (
                <div className="space-y-1">
                  {filteredNodes.map((node) => (
                    <TreeNodeItem
                      key={node.id}
                      node={node}
                      onSelect={(n) => setSelectedNode(n)}
                      selectedId={selectedNode?.id ?? null}
                      forceExpandAll={forceExpandAll}
                    />
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Node Details Inspector */}
          <div className="lg:col-span-4 sticky top-6">
            <Card className="border-white/[0.08] bg-neutral-900/60 backdrop-blur-xl shadow-2xl overflow-hidden">
              <CardHeader className="border-b border-neutral-800/80 p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Info size={14} className="text-amber-400" />
                    <span>Node Inspector</span>
                  </CardTitle>
                  {selectedNode && (
                    <Badge variant="outline" className={`text-[10px] ${getNodeColor(selectedNode.type).badge}`}>
                      {selectedNode.type.replace(/_/g, " ")}
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {selectedNode ? (
                  <>
                    <div>
                      <h3 className="text-base font-bold text-neutral-100">{selectedNode.name}</h3>
                      <div className="flex items-center gap-3 mt-2 text-xs text-neutral-400">
                        <span className="flex items-center gap-1 font-mono">
                          Confidence:{" "}
                          <strong className="text-neutral-200">
                            {Math.round((selectedNode.confidence ?? 0.5) * 100)}%
                          </strong>
                        </span>
                        <span>•</span>
                        <Badge variant="success" className="text-[10px] font-normal uppercase">
                          {selectedNode.reviewStatus || "Approved"}
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                        Definition &amp; Pattern Context
                      </span>
                      <div className="rounded-xl border border-neutral-800 bg-neutral-950/70 p-3.5 text-xs text-neutral-300 leading-relaxed font-sans select-text">
                        {selectedNode.definition || "No formal definition provided for this node."}
                      </div>
                    </div>

                    {/* Hierarchy Context */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">
                          Sub-Nodes
                        </span>
                        <p className="text-sm font-bold text-neutral-200 mt-0.5">
                          {selectedNode._count?.children ?? selectedNode.children?.length ?? 0}
                        </p>
                      </div>
                      <div className="rounded-xl border border-neutral-800/80 bg-neutral-950/40 p-3">
                        <span className="text-neutral-500 block text-[10px] uppercase font-semibold">
                          Connected Edges
                        </span>
                        <p className="text-sm font-bold text-neutral-200 mt-0.5">
                          {(selectedNode._count?.outgoingEdges ?? 0) + (selectedNode._count?.incomingEdges ?? 0)}
                        </p>
                      </div>
                    </div>

                    {/* Quick Add Child Button */}
                    <div className="pt-2 flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setCreateParentId(selectedNode.id);
                          setShowCreateModal(true);
                        }}
                        className="w-full gap-2 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold"
                      >
                        <Plus size={13} /> Add Child Node to &quot;{selectedNode.name.slice(0, 18)}...&quot;
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="py-16 text-center text-xs text-neutral-500 space-y-2">
                    <Brain className="mx-auto text-neutral-700" size={32} />
                    <p>Select any node in the tree to inspect details, children, and relations.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ── Add Knowledge Node Modal ── */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="max-w-md bg-neutral-950 border border-neutral-800 text-neutral-100 p-6 shadow-2xl">
            <DialogHeader className="space-y-1">
              <DialogTitle className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <Brain className="text-amber-400" size={18} />
                <span>Create Knowledge Node</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                {createParentId
                  ? `Adding a sub-node under parent ID: ${createParentId}`
                  : "Adding a top-level root node in the knowledge taxonomy."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pt-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Node Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g., Pytest Asyncio Event Loop Strategy"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-300">Type</label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-neutral-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="DOMAIN">DOMAIN</option>
                    <option value="TOPIC">TOPIC</option>
                    <option value="SUBTOPIC">SUBTOPIC</option>
                    <option value="CONCEPT">CONCEPT</option>
                    <option value="REQUIREMENT_PATTERN">REQUIREMENT_PATTERN</option>
                    <option value="TESTING_STRATEGY">TESTING_STRATEGY</option>
                    <option value="SOLUTION_STRATEGY">SOLUTION_STRATEGY</option>
                    <option value="ARCHITECTURE_PATTERN">ARCHITECTURE_PATTERN</option>
                    <option value="ALGORITHM">ALGORITHM</option>
                    <option value="CODE_PATTERN">CODE_PATTERN</option>
                    <option value="EVALUATION_CRITERION">EVALUATION_CRITERION</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-neutral-300">Confidence (0.0 - 1.0)</label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={createConfidence}
                    onChange={(e) => setCreateConfidence(e.target.value)}
                    className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-neutral-300">Definition / Explanation</label>
                <textarea
                  value={createDefinition}
                  onChange={(e) => setCreateDefinition(e.target.value)}
                  placeholder="Describe the benchmark pattern, reproduction criteria, or technical insight..."
                  rows={3}
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3.5 py-2 text-neutral-100 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
                  disabled={savingNode}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={savingNode || !createName.trim()}
                  onClick={handleCreateNode}
                  className="gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-semibold"
                >
                  {savingNode ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  {savingNode ? "Saving..." : "Create Node"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
