"use client";

import { AppShell } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/animations/motion-components";
import { Settings as SettingsIcon, Shield, Code2, Globe, Database } from "lucide-react";

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="mt-1 text-sm text-neutral-400">Configure license policy, LOC thresholds, and system settings.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <FadeInSection>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield size={18} />License Policy</CardTitle>
                <CardDescription>Manage the allowed license identifiers (v1)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Policy Version</span>
                  <Badge>v1</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Allowed Licenses</span>
                  <span className="text-sm text-neutral-400">45 identifiers</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">CC-BY Flagged</span>
                  <span className="text-sm text-neutral-400">5 identifiers</span>
                </div>
                <div className="rounded-lg border border-neutral-800 bg-neutral-900/50 p-3 text-xs text-neutral-500 font-mono max-h-48 overflow-y-auto">
                  MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, BSL-1.0, CC-BY-4.0, ...
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          <FadeInSection delay={0.1}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Code2 size={18} />LOC Configuration</CardTitle>
                <CardDescription>Source lines of code eligibility settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Eligibility Threshold</span>
                  <Badge variant="warning">&gt; 200 LOC</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Canonical Metric</span>
                  <span className="text-sm text-neutral-400">Code LOC (excl. blanks + comments)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Supported Languages</span>
                  <span className="text-sm text-neutral-400">14 languages</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Tool Version</span>
                  <span className="text-sm text-neutral-400">v1.0.0</span>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>

          <FadeInSection delay={0.2}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe size={18} />GitHub Connection</CardTitle>
                <CardDescription>GitHub API access configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Status</span>
                  <Badge variant="outline">Not Connected</Badge>
                </div>
                <Button variant="outline" className="w-full">Connect GitHub Account</Button>
              </CardContent>
            </Card>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database size={18} />Database</CardTitle>
                <CardDescription>Storage and data management</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Provider</span>
                  <span className="text-sm text-neutral-400">SQLite (dev)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Schema</span>
                  <Badge variant="success">Synced</Badge>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
      </div>
    </AppShell>
  );
}
