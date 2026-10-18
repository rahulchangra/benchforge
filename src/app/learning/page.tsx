"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FadeInSection, StaggerContainer, StaggerItem } from "@/components/animations/motion-components";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Upload, Plus, Brain, ChevronRight, FileText, Tag } from "lucide-react";

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
}

export default function LearningPage() {
  const [tasks, setTasks] = useState<TaskPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newDomain, setNewDomain] = useState("");

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/learning/tasks");
      const data = await res.json();
      if (data.success) setTasks(data.data ?? []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "APPROVED": return "success";
      case "REJECTED": case "INCORRECT": return "error";
      case "PENDING": return "warning";
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
                    <Button disabled={!newTitle.trim()}>Create Package</Button>
                    <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Task list */}
        {loading ? (
          <div className="py-16 text-center text-neutral-500">Loading tasks...</div>
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
                  <CardContent className="flex items-center gap-4 p-5">
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
                    <ChevronRight size={16} className="text-neutral-600" />
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
