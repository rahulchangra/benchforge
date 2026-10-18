"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MetricCard, FadeInSection, StaggerContainer, StaggerItem } from "@/components/animations/motion-components";
import { motion, AnimatePresence } from "framer-motion";
import { Search, GitBranch, Shield, Code2, ExternalLink, Filter, ChevronDown } from "lucide-react";

interface RepoResult {
  githubId: number;
  owner: string;
  name: string;
  fullName: string;
  description: string;
  url: string;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  license: string | null;
  topics: string[];
}

export default function RepositoriesPage() {
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [results, setResults] = useState<RepoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, language: language || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setResults(data.data.repositories ?? []);
        setTotalCount(data.data.totalCount ?? 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEligibilityCheck = async (owner: string, repo: string) => {
    try {
      const res = await fetch("/api/repositories/eligibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Eligibility: ${data.data.eligibility.status}\nLicense: ${data.data.eligibility.licensePass ? "PASS" : "FAIL"}\nLOC: ${data.data.eligibility.locPass ? "PASS" : "NOT MEASURED (needs local clone)"}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      alert("Check failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Repository Explorer</h1>
          <p className="mt-1 text-sm text-neutral-400">Search GitHub repositories and check eligibility for benchmarking.</p>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search repositories (e.g., 'react state management')"
                  className="w-full rounded-lg border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-neutral-100 placeholder:text-neutral-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2.5 text-sm text-neutral-300 focus:border-blue-500 focus:outline-none"
              >
                <option value="">All Languages</option>
                {["TypeScript", "JavaScript", "Python", "Java", "Go", "Rust", "C++", "C#", "Ruby", "PHP", "Swift", "Kotlin"].map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              <Button onClick={handleSearch} disabled={loading}>
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {totalCount > 0 && (
          <p className="text-sm text-neutral-400">{totalCount.toLocaleString()} repositories found</p>
        )}

        <StaggerContainer className="space-y-3">
          <AnimatePresence>
            {results.map((repo) => (
              <StaggerItem key={repo.githubId}>
                <motion.div
                  layout
                  className="group rounded-xl border border-neutral-800 bg-neutral-900/30 p-5 transition-colors hover:border-neutral-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <GitBranch size={16} className="text-neutral-500" />
                        <a href={repo.url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-400 hover:underline">
                          {repo.fullName}
                        </a>
                        <ExternalLink size={12} className="text-neutral-600" />
                      </div>
                      <p className="mt-1.5 text-sm text-neutral-400 line-clamp-2">{repo.description || "No description"}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {repo.primaryLanguage && <Badge>{repo.primaryLanguage}</Badge>}
                        <Badge variant={repo.license ? "success" : "error"}>
                          <Shield size={10} className="mr-1" />
                          {repo.license ?? "No license"}
                        </Badge>
                        <span className="text-xs text-neutral-500">★ {repo.stars.toLocaleString()}</span>
                        <span className="text-xs text-neutral-500">⑂ {repo.forks.toLocaleString()}</span>
                      </div>
                      {repo.topics.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {repo.topics.slice(0, 5).map((t) => (
                            <span key={t} className="rounded bg-neutral-800 px-1.5 py-0.5 text-[10px] text-neutral-400">{t}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEligibilityCheck(repo.owner, repo.name)}
                      className="shrink-0"
                    >
                      Check Eligibility
                    </Button>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </AnimatePresence>
        </StaggerContainer>

        {results.length === 0 && !loading && (
          <FadeInSection className="py-16 text-center">
            <GitBranch size={48} className="mx-auto mb-4 text-neutral-700" />
            <p className="text-neutral-500">Search for GitHub repositories to get started.</p>
            <p className="mt-1 text-xs text-neutral-600">Eligibility requires an allowed license and &gt; 200 source code LOC.</p>
          </FadeInSection>
        )}
      </div>
    </AppShell>
  );
}
