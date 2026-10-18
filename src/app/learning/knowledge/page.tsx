"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/animations/motion-components";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ChevronRight, ChevronDown, Search, Layers } from "lucide-react";

interface KnowledgeNode {
  id: string;
  type: string;
  name: string;
  definition: string | null;
  confidence: number;
  reviewStatus: string;
  children: { id: string; name: string; type: string }[];
  _count: { children: number; outgoingEdges: number; incomingEdges: number };
}

const nodeTypeColors: Record<string, string> = {
  DOMAIN: "bg-purple-500/20 text-purple-400",
  TOPIC: "bg-blue-500/20 text-blue-400",
  SUBTOPIC: "bg-cyan-500/20 text-cyan-400",
  CONCEPT: "bg-green-500/20 text-green-400",
  CODE_PATTERN: "bg-amber-500/20 text-amber-400",
  ALGORITHM: "bg-red-500/20 text-red-400",
  SOLUTION_STRATEGY: "bg-emerald-500/20 text-emerald-400",
  APPROVED_EXAMPLE: "bg-indigo-500/20 text-indigo-400",
};

function TreeNode({ node, depth = 0 }: { node: KnowledgeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const [children, setChildren] = useState<KnowledgeNode[]>([]);
  const [loadedChildren, setLoadedChildren] = useState(false);

  const loadChildren = async () => {
    if (loadedChildren) return;
    try {
      const res = await fetch(`/api/learning/knowledge/nodes?parentId=${node.id}`);
      const data = await res.json();
      if (data.success) {
        setChildren(data.data);
        setLoadedChildren(true);
      }
    } catch (err) { console.error(err); }
  };

  const handleToggle = () => {
    if (!expanded && !loadedChildren) loadChildren();
    setExpanded(!expanded);
  };

  const colorClass = nodeTypeColors[node.type] ?? "bg-neutral-500/20 text-neutral-400";

  return (
    <div style={{ paddingLeft: depth * 24 }}>
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="group flex items-center gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-neutral-800 hover:bg-neutral-900/50"
      >
        {node._count.children > 0 ? (
          <button onClick={handleToggle} className="p-0.5 text-neutral-500 hover:text-neutral-300">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="w-5" />
        )}
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${colorClass}`}>
          {node.type.replace(/_/g, " ")}
        </span>
        <span className="text-sm font-medium text-neutral-200">{node.name}</span>
        <span className="ml-auto text-[10px] text-neutral-600">
          {node._count.children > 0 && `${node._count.children} children`}
          {node._count.outgoingEdges > 0 && ` · ${node._count.outgoingEdges} edges`}
        </span>
        <span className="text-[10px] text-neutral-600">{Math.round(node.confidence * 100)}%</span>
      </motion.div>
      <AnimatePresence>
        {expanded && children.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            {children.map((child) => (
              <TreeNode key={child.id} node={child as KnowledgeNode} depth={depth + 1} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KnowledgeTreePage() {
  const [rootNodes, setRootNodes] = useState<KnowledgeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchRoots();
  }, []);

  const fetchRoots = async () => {
    try {
      const res = await fetch("/api/learning/knowledge/nodes?parentId=root");
      const data = await res.json();
      if (data.success) setRootNodes(data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Tree</h1>
          <p className="mt-1 text-sm text-neutral-400">Navigate the hierarchical knowledge extracted from approved tasks.</p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search knowledge nodes..."
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        <Card>
          <CardContent className="p-4">
            {loading ? (
              <div className="py-12 text-center text-neutral-500">Loading knowledge tree...</div>
            ) : rootNodes.length === 0 ? (
              <FadeInSection className="py-12 text-center">
                <Brain size={48} className="mx-auto mb-4 text-neutral-700" />
                <p className="text-neutral-500">No knowledge nodes yet.</p>
                <p className="mt-1 text-xs text-neutral-600">Upload and process task packages to build the knowledge tree.</p>
              </FadeInSection>
            ) : (
              <div className="space-y-1">
                {rootNodes.map((node) => (
                  <TreeNode key={node.id} node={node} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
