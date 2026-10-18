"use client";

import { AppShell } from "@/components/layout/sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { FadeInSection } from "@/components/animations/motion-components";
import { Network } from "lucide-react";

export default function ConceptGraphPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Concept Graph</h1>
          <p className="mt-1 text-sm text-neutral-400">Explore cross-concept relationships with typed edges and evidence.</p>
        </div>
        <Card>
          <CardContent className="p-8">
            <FadeInSection className="text-center py-16">
              <Network size={64} className="mx-auto mb-4 text-neutral-700" />
              <p className="text-neutral-400 text-lg font-medium">Interactive Graph Visualization</p>
              <p className="mt-2 text-sm text-neutral-500 max-w-md mx-auto">
                The concept graph renders relationships between knowledge nodes.
                Add knowledge nodes and edges via the API or Learning Studio to populate the graph.
              </p>
              <p className="mt-4 text-xs text-neutral-600">
                Supports: PARENT_OF, DEPENDS_ON, IMPLEMENTS, EXTENDS, SIMILAR_TO, CONTRASTS_WITH,
                SOLVES, TESTED_BY, EVALUATED_BY, DERIVED_FROM, REUSES, CONFLICTS_WITH, SUPERSEDES
              </p>
            </FadeInSection>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
