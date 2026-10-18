"use client";

import { AppShell } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FadeInSection } from "@/components/animations/motion-components";
import { FileEdit, Send, Brain, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export default function TaskComposerPage() {
  const [taskInput, setTaskInput] = useState("");
  const [generating, setGenerating] = useState(false);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Task Composer</h1>
          <p className="mt-1 text-sm text-neutral-400">Generate original submissions grounded in knowledge base evidence.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><FileEdit size={18} />New Task Input</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <textarea
                value={taskInput} onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Describe the task requirements, constraints, and expected outcomes..."
                rows={12}
                className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none resize-none font-mono"
              />
              <Button className="gap-2 w-full" disabled={!taskInput.trim() || generating}>
                <Send size={16} /> {generating ? "Generating..." : "Generate Submission"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Brain size={18} />Retrieved Knowledge</CardTitle></CardHeader>
              <CardContent>
                <FadeInSection className="py-8 text-center">
                  <p className="text-sm text-neutral-500">Enter a task to search for relevant knowledge nodes, patterns, and approved examples.</p>
                </FadeInSection>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><CheckCircle2 size={18} />Requirement Checks</CardTitle></CardHeader>
              <CardContent>
                <FadeInSection className="py-8 text-center">
                  <p className="text-sm text-neutral-500">Requirements will be extracted and validated against the generated submission.</p>
                </FadeInSection>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
