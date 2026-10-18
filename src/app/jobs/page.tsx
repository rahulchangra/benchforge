"use client";

import { AppShell } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { FadeInSection } from "@/components/animations/motion-components";
import { Activity } from "lucide-react";

export default function JobsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Jobs</h1>
          <p className="mt-1 text-sm text-neutral-400">Monitor background jobs for repository analysis, benchmarks, and learning tasks.</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <FadeInSection className="py-16 text-center">
              <Activity size={48} className="mx-auto mb-4 text-neutral-700" />
              <p className="text-neutral-500">No active jobs.</p>
              <p className="mt-1 text-xs text-neutral-600">Jobs are created when you trigger discovery, analysis, or benchmark generation.</p>
            </FadeInSection>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
