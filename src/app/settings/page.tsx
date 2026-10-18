"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FadeInSection } from "@/components/animations/motion-components";
import { useToast } from "@/components/ui/toast";
import { Shield, Code2, Globe, Database, Plus, X, Save, Loader2 } from "lucide-react";

interface LicensePolicy {
  version: number;
  allowedIdentifiers: string[];
  ccByIdentifiers: string[];
  effectiveFrom: string | null;
  notes: string | null;
}

interface SettingsData {
  licensePolicy: LicensePolicy;
  config: { licensePolicyVersion: number; builtInAllowedLicenses: number };
  system: { activeJobs: number };
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [allowedIds, setAllowedIds] = useState<string[]>([]);
  const [ccByIds, setCcByIds] = useState<string[]>([]);
  const [newAllowed, setNewAllowed] = useState("");
  const [newCcBy, setNewCcBy] = useState("");
  const [policyNotes, setPolicyNotes] = useState("");
  const [dirty, setDirty] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/settings");
      const json = await res.json();
      if (json.success) {
        setSettings(json.data);
        setAllowedIds(json.data.licensePolicy.allowedIdentifiers);
        setCcByIds(json.data.licensePolicy.ccByIdentifiers);
        setDirty(false);
      } else {
        setError(json.error ?? "Failed to load settings");
      }
    } catch {
      setError("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const addAllowed = () => {
    const id = newAllowed.trim().toUpperCase();
    if (id && !allowedIds.includes(id)) {
      setAllowedIds((prev) => [...prev, id]);
      setNewAllowed("");
      setDirty(true);
    }
  };

  const removeAllowed = (id: string) => {
    setAllowedIds((prev) => prev.filter((x) => x !== id));
    setDirty(true);
  };

  const addCcBy = () => {
    const id = newCcBy.trim().toUpperCase();
    if (id && !ccByIds.includes(id)) {
      setCcByIds((prev) => [...prev, id]);
      setNewCcBy("");
      setDirty(true);
    }
  };

  const removeCcBy = (id: string) => {
    setCcByIds((prev) => prev.filter((x) => x !== id));
    setDirty(true);
  };

  const savePolicy = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allowedIdentifiers: allowedIds,
          ccByIdentifiers: ccByIds,
          notes: policyNotes || undefined,
          createdById: "system",
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast({ type: "success", title: "Policy saved", description: "New version created successfully." });
        setDirty(false);
        setPolicyNotes("");
        fetchSettings();
      } else {
        toast({ type: "error", title: "Save failed", description: json.error ?? "Unknown error" });
      }
    } catch {
      toast({ type: "error", title: "Save failed", description: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="py-16 text-center">
          <p className="text-red-400">{error}</p>
          <Button variant="outline" className="mt-4" onClick={fetchSettings}>Retry</Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-1 text-sm text-neutral-400">Configure license policy, LOC thresholds, and system settings.</p>
          </div>
          {dirty && (
            <Button onClick={savePolicy} disabled={saving} className="gap-2">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? "Saving..." : "Save Policy"}
            </Button>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <FadeInSection>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield size={18} />License Policy</CardTitle>
                <CardDescription>
                  Manage allowed license identifiers (v{settings?.licensePolicy.version ?? 1})
                  {settings?.licensePolicy.effectiveFrom && (
                    <span className="ml-2 text-xs text-neutral-500">
                      · Effective {new Date(settings.licensePolicy.effectiveFrom).toLocaleDateString()}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-300">Allowed Licenses</span>
                  <Badge>{allowedIds.length} identifiers</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                  {allowedIds.map((id) => (
                    <span key={id} className="inline-flex items-center gap-1 rounded-md bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300 font-mono">
                      {id}
                      <button onClick={() => removeAllowed(id)} className="text-neutral-500 hover:text-red-400 transition-colors">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {allowedIds.length === 0 && <span className="text-xs text-neutral-500">No identifiers</span>}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAllowed}
                    onChange={(e) => setNewAllowed(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addAllowed()}
                    placeholder="Add license (e.g. MIT)"
                    className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                  />
                  <Button variant="outline" size="sm" onClick={addAllowed} disabled={!newAllowed.trim()}>
                    <Plus size={14} />
                  </Button>
                </div>

                <div className="border-t border-neutral-800 pt-3">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-neutral-300">CC-BY Flagged</span>
                    <Badge variant="warning">{ccByIds.length} identifiers</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto rounded-lg border border-neutral-800 bg-neutral-900/50 p-3">
                    {ccByIds.map((id) => (
                      <span key={id} className="inline-flex items-center gap-1 rounded-md bg-yellow-900/30 border border-yellow-800/30 px-2 py-0.5 text-xs text-yellow-300 font-mono">
                        {id}
                        <button onClick={() => removeCcBy(id)} className="text-yellow-500 hover:text-red-400 transition-colors">
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {ccByIds.length === 0 && <span className="text-xs text-neutral-500">No CC-BY identifiers</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newCcBy}
                      onChange={(e) => setNewCcBy(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCcBy()}
                      placeholder="Add CC-BY identifier"
                      className="flex-1 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                    />
                    <Button variant="outline" size="sm" onClick={addCcBy} disabled={!newCcBy.trim()}>
                      <Plus size={14} />
                    </Button>
                  </div>
                </div>

                {dirty && (
                  <div className="border-t border-neutral-800 pt-3">
                    <input
                      type="text"
                      value={policyNotes}
                      onChange={(e) => setPolicyNotes(e.target.value)}
                      placeholder="Version notes (optional)"
                      className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                )}
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
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { window.location.href = "/api/auth/signin/github"; }}
                >
                  Connect GitHub Account
                </Button>
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
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-300">Active Jobs</span>
                  <span className="text-sm text-neutral-400">{settings?.system.activeJobs ?? 0}</span>
                </div>
              </CardContent>
            </Card>
          </FadeInSection>
        </div>
      </div>
    </AppShell>
  );
}
