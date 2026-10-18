"use client";

import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { FadeInSection } from "@/components/animations/motion-components";
import { FlaskConical } from "lucide-react";

export default function BenchmarksPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Benchmarks</h1>
          <p className="mt-1 text-sm text-neutral-400">View generated benchmarks with validation evidence and export options.</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <FadeInSection className="py-16 text-center">
              <FlaskConical size={48} className="mx-auto mb-4 text-neutral-700" />
              <p className="text-neutral-500">No benchmarks generated yet.</p>
              <p className="mt-1 text-xs text-neutral-600">Benchmarks are generated from eligible repositories with suitable issues.</p>
            </FadeInSection>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
