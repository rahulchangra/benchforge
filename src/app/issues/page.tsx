"use client";

import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { FadeInSection } from "@/components/animations/motion-components";
import { Bug } from "lucide-react";

export default function IssuesPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Issue Explorer</h1>
          <p className="mt-1 text-sm text-neutral-400">Browse discovered issues and their benchmark suitability assessments.</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <FadeInSection className="py-16 text-center">
              <Bug size={48} className="mx-auto mb-4 text-neutral-700" />
              <p className="text-neutral-500">No issues discovered yet.</p>
              <p className="mt-1 text-xs text-neutral-600">Issues are discovered during repository analysis after eligibility checks pass.</p>
            </FadeInSection>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
