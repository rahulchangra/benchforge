"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { MetricCard, AnimatedProgress, StaggerContainer, StaggerItem } from "@/components/animations/motion-components";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GitBranch, Shield, Code2, Bug, FlaskConical, BookOpen,
  Brain, Network, FileEdit, Activity,
} from "lucide-react";

interface DashboardData {
  repositories: { discovered: number; licenseEligible: number; locEligible: number };
  issues: { discovered: number };
  benchmarks: { generated: number; published: number; validationRate: number };
  learningStudio: { taskPackages: number; knowledgeNodes: number; knowledgeEdges: number; generatedDrafts: number };
  jobs: { active: number };
  recentActivity: Array<{ action: string; entityType: string; details: Record<string, unknown>; createdAt: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fallback data for initial state
  const d = data ?? {
    repositories: { discovered: 0, licenseEligible: 0, locEligible: 0 },
    issues: { discovered: 0 },
    benchmarks: { generated: 0, published: 0, validationRate: 0 },
    learningStudio: { taskPackages: 0, knowledgeNodes: 0, knowledgeEdges: 0, generatedDrafts: 0 },
    jobs: { active: 0 },
    recentActivity: [],
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-400">Overview of benchmark generation and learning studio activity.</p>
        </div>

        {/* Engine A: Benchmark Intelligence */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Benchmark Intelligence</h2>
          <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StaggerItem>
              <MetricCard title="Repositories" value={d.repositories.discovered} icon={<GitBranch size={20} />} subtitle="Discovered" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard title="License Eligible" value={d.repositories.licenseEligible} icon={<Shield size={20} />} subtitle="Passed verification" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard title="LOC Eligible" value={d.repositories.locEligible} icon={<Code2 size={20} />} subtitle="> 200 code LOC" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard title="Issues Found" value={d.issues.discovered} icon={<Bug size={20} />} subtitle="Technical issues" />
            </StaggerItem>
          </StaggerContainer>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <MetricCard title="Benchmarks" value={d.benchmarks.generated} icon={<FlaskConical size={20} />} subtitle={`${d.benchmarks.published} published`} />
          <Card>
            <CardHeader><CardTitle className="text-sm">Validation Rate</CardTitle></CardHeader>
            <CardContent>
              <AnimatedProgress value={d.benchmarks.validationRate} label="Benchmarks validated" />
            </CardContent>
          </Card>
          <MetricCard title="Active Jobs" value={d.jobs.active} icon={<Activity size={20} />} subtitle="Currently running" />
        </div>

        {/* Engine B: Learning Studio */}
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-neutral-500">Learning Studio</h2>
          <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" staggerDelay={0.08}>
            <StaggerItem>
              <MetricCard title="Task Packages" value={d.learningStudio.taskPackages} icon={<BookOpen size={20} />} subtitle="Uploaded" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard title="Knowledge Nodes" value={d.learningStudio.knowledgeNodes} icon={<Brain size={20} />} subtitle="In tree" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard title="Relationships" value={d.learningStudio.knowledgeEdges} icon={<Network size={20} />} subtitle="Concept edges" />
            </StaggerItem>
            <StaggerItem>
              <MetricCard title="Drafts Generated" value={d.learningStudio.generatedDrafts} icon={<FileEdit size={20} />} subtitle="Submissions" />
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
          <CardContent>
            {d.recentActivity.length === 0 ? (
              <p className="text-sm text-neutral-500">No recent activity. Start by discovering repositories or uploading task packages.</p>
            ) : (
              <div className="space-y-3">
                {d.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/30 px-4 py-3">
                    <Badge variant={activity.action === "eligibility_check" ? "default" : "outline"}>{activity.action}</Badge>
                    <span className="text-sm text-neutral-300">{activity.entityType}</span>
                    <span className="ml-auto text-xs text-neutral-500">{new Date(activity.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
