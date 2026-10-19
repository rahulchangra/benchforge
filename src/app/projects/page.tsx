"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import {
  StaggerContainer,
  StaggerItem,
  FadeInSection,
} from "@/components/animations/motion-components";
import { AppShell } from "@/components/layout/sidebar";
import {
  Plus,
  FolderOpen,
  Calendar,
  FileText,
  Star,
  Code2,
  Tag,
  Upload,
  Sparkles,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  targetLanguages: string[];
  targetCategories: string[];
  minStars: number;
  createdAt: string;
  _count?: {
    challengeSubmissions: number;
    approvedTaskExamples: number;
    agentRuns: number;
  };
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const LANGUAGES = [
  "TypeScript",
  "JavaScript",
  "Python",
  "Rust",
  "Go",
  "Java",
  "C++",
  "C",
  "Ruby",
  "PHP",
  "Swift",
  "Kotlin",
];

const CATEGORIES = ["FEATURE_REQUEST", "BUGFIX", "REFACTOR"];

const statusVariant: Record<string, "default" | "success" | "warning" | "error" | "outline"> = {
  SETUP: "outline",
  ACTIVE: "success",
  PAUSED: "warning",
  COMPLETED: "default",
};

/* ------------------------------------------------------------------ */
/* Multi-Select Chip Component                                         */
/* ------------------------------------------------------------------ */

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(
      selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
    );
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-neutral-300">
        {label}
      </label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-emerald-500/50 bg-emerald-500/20 text-emerald-400"
                  : "border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-600"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Project Card                                                        */
/* ------------------------------------------------------------------ */

function ProjectCard({
  project,
  onClick,
}: {
  project: Project;
  onClick: () => void;
}) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -4, scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      className="group relative w-full text-left rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-sm transition-all duration-300 hover:border-emerald-500/30 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.15)]"
    >
      {/* Animated gradient border on hover */}
      <div className="pointer-events-none absolute -inset-px rounded-xl bg-gradient-to-br from-emerald-500/20 via-transparent to-cyan-500/20 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

      {/* Glassmorphism overlay on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-2 transition-all duration-300 group-hover:from-emerald-500/30 group-hover:to-cyan-500/30 group-hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.3)]">
              <FolderOpen size={16} className="text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-neutral-100 transition-colors group-hover:text-white">
              {project.name}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {project.status === "ACTIVE" && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
            )}
            <Badge variant={statusVariant[project.status] ?? "outline"}>
              {project.status}
            </Badge>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <p className="mt-3 line-clamp-2 text-sm text-neutral-400">
            {project.description}
          </p>
        )}

        {/* Language badges */}
        {project.targetLanguages.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {project.targetLanguages.slice(0, 4).map((lang) => (
              <span
                key={lang}
                className="inline-flex items-center gap-1 rounded-md bg-neutral-800/80 px-2 py-0.5 text-xs text-neutral-300 border border-neutral-700/50"
              >
                <Code2 size={10} />
                {lang}
              </span>
            ))}
            {project.targetLanguages.length > 4 && (
              <span className="text-xs text-neutral-500">
                +{project.targetLanguages.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Footer stats */}
        <div className="mt-4 flex items-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <FileText size={12} />
            {project._count?.challengeSubmissions ?? 0} submissions
          </span>
          <span className="flex items-center gap-1">
            <Star size={12} />
            ≥{project.minStars} stars
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={12} />
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ------------------------------------------------------------------ */
/* Loading Skeletons                                                   */
/* ------------------------------------------------------------------ */

function ProjectSkeletons() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="mt-3 h-4 w-full" />
          <Skeleton className="mt-1 h-4 w-3/4" />
          <div className="mt-3 flex gap-1.5">
            <Skeleton className="h-5 w-20 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
          <div className="mt-4 flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page Component                                                      */
/* ------------------------------------------------------------------ */

export default function ProjectsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [minStars, setMinStars] = useState("500");
  const [requirementsDoc, setRequirementsDoc] = useState("");

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      if (!res.ok) throw new Error("Failed to load projects");
      const json = await res.json();
      setProjects(json.data ?? json);
    } catch {
      toast({ type: "error", title: "Failed to load projects" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ type: "warning", title: "Project name is required" });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          targetLanguages: languages,
          targetCategories: categories,
          minStars: parseInt(minStars) || 500,
          requirementsDoc: requirementsDoc.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to create project");
      const project = await res.json();
      toast({ type: "success", title: `Project "${project.name}" created` });
      setDialogOpen(false);
      setName("");
      setDescription("");
      setLanguages([]);
      setCategories([]);
      setMinStars("500");
      setRequirementsDoc("");
      fetchProjects();
    } catch {
      toast({ type: "error", title: "Failed to create project" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <AppShell>
      <div className="min-h-screen bg-neutral-950">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <FadeInSection>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-2.5">
                    <Sparkles size={20} className="text-emerald-400" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-neutral-100">
                      Your Projects
                    </h1>
                    <p className="mt-0.5 text-sm text-neutral-400">
                      Manage Olympus challenge automation projects
                    </p>
                  </div>
                </div>
              </div>

              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 shadow-lg shadow-emerald-500/10">
                    <Plus size={16} />
                    New Project
                  </Button>
                </DialogTrigger>

                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                      Set up a new Olympus challenge automation project.
                    </DialogDescription>
                  </DialogHeader>

                  <DialogBody className="space-y-4">
                    <Input
                      label="Project Name"
                      placeholder="e.g. TypeScript Feature Challenges"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-300">
                        Description
                      </label>
                      <textarea
                        className="flex w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-neutral-600"
                        rows={3}
                        placeholder="Describe this project goals..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>
                    <MultiSelect
                      label="Target Languages"
                      options={LANGUAGES}
                      selected={languages}
                      onChange={setLanguages}
                    />
                    <MultiSelect
                      label="Target Categories"
                      options={CATEGORIES}
                      selected={categories}
                      onChange={setCategories}
                    />
                    <Input
                      label="Minimum Stars"
                      type="number"
                      placeholder="500"
                      value={minStars}
                      onChange={(e) => setMinStars(e.target.value)}
                      helperText="Minimum GitHub stars for target repositories"
                    />

                    {/* Requirements Document */}
                    <div>
                      <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-neutral-300">
                        <FileText size={14} className="text-emerald-400" />
                        Requirements Document
                      </label>
                      <p className="mb-2 text-xs text-neutral-500">
                        Paste the Olympus requirements document to guide the agent pipeline.
                      </p>
                      <textarea
                        className="w-full rounded-lg border border-neutral-700 bg-neutral-950 px-3 py-2.5 font-mono text-xs text-neutral-100 placeholder:text-neutral-600 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 hover:border-neutral-600"
                        rows={8}
                        placeholder="Paste the full Olympus requirements document here..."
                        value={requirementsDoc}
                        onChange={(e) => setRequirementsDoc(e.target.value)}
                      />
                    </div>
                  </DialogBody>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={creating}
                      className="bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500"
                    >
                      {creating ? "Creating..." : "Create Project"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </FadeInSection>

          {/* Content */}
          <div className="mt-8">
            {loading ? (
              <ProjectSkeletons />
            ) : projects.length === 0 ? (
              <FadeInSection>
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-neutral-700 bg-neutral-900/30 py-16 backdrop-blur-sm">
                  <div className="rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 p-4 shadow-lg">
                    <FolderOpen size={32} className="text-neutral-500" />
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-neutral-300">
                    No projects yet
                  </h3>
                  <p className="mt-1 text-sm text-neutral-500">
                    Create your first Olympus challenge project to get started.
                  </p>
                  <Button
                    className="mt-4 bg-gradient-to-r from-emerald-600 to-cyan-600 shadow-lg shadow-emerald-500/10"
                    onClick={() => setDialogOpen(true)}
                  >
                    <Plus size={16} />
                    Create Project
                  </Button>
                </div>
              </FadeInSection>
            ) : (
              <StaggerContainer className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <AnimatePresence>
                  {projects.map((project) => (
                    <StaggerItem key={project.id}>
                      <ProjectCard
                        project={project}
                        onClick={() => router.push(`/projects/${project.id}`)}
                      />
                    </StaggerItem>
                  ))}
                </AnimatePresence>
              </StaggerContainer>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
