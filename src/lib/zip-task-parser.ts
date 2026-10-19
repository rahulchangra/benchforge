import JSZip from "jszip";

export interface ExtractedDiffStats {
  filesChanged: number;
  insertions: number;
  deletions: number;
  modifiedFiles: string[];
  isUnifiedDiff: boolean;
}

export interface ExtractedDockerfileInfo {
  baseImage: string | null;
  workdir: string | null;
  commands: string[];
  envVars: Record<string, string>;
  dependencies: string[];
}

export interface SynthesizedRequirement {
  content: string;
  type: "FUNCTIONAL" | "TESTING" | "ENVIRONMENT" | "SOLUTION_SCOPE" | "SECURITY";
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  sourceReference: string;
}

export interface SynthesizedKnowledgeNode {
  type:
    | "DOMAIN"
    | "TOPIC"
    | "SUBTOPIC"
    | "CONCEPT"
    | "REQUIREMENT_PATTERN"
    | "SOLUTION_STRATEGY"
    | "ARCHITECTURE_PATTERN"
    | "ALGORITHM"
    | "CODE_PATTERN"
    | "TESTING_STRATEGY"
    | "FAILURE_MODE"
    | "EVALUATION_CRITERION"
    | "APPROVED_EXAMPLE"
    | "REUSABLE_INSIGHT"
    | "EVIDENCE_SOURCE";
  name: string;
  definition: string;
  confidence: number;
}

export interface ExtractedZipTask {
  // Primary metadata
  title: string;
  description: string;
  domain: string;
  category: string;
  tags: string[];

  // Key extracted benchmark artifacts
  problemMd?: { filename: string; content: string };
  testPatch?: { filename: string; content: string; stats: ExtractedDiffStats; framework: string };
  solutionPatch?: { filename: string; content: string; stats: ExtractedDiffStats };
  dockerfile?: { filename: string; content: string; parsed: ExtractedDockerfileInfo };
  testScript?: { filename: string; content: string };
  metadataJson?: { filename: string; content: string; parsed: Record<string, any> };

  // All files in archive
  allFiles: {
    filename: string;
    size: number;
    mimeType: string;
    content?: string;
  }[];

  // Requirements synthesized
  synthesizedRequirements: SynthesizedRequirement[];

  // Knowledge nodes synthesized
  synthesizedKnowledgeNodes: SynthesizedKnowledgeNode[];
}

/**
 * Analyze a unified diff string to extract changed files, insertions, deletions.
 */
export function parseDiffStats(diffText: string): ExtractedDiffStats {
  if (!diffText || typeof diffText !== "string") {
    return {
      filesChanged: 0,
      insertions: 0,
      deletions: 0,
      modifiedFiles: [],
      isUnifiedDiff: false,
    };
  }

  const lines = diffText.split(/\r?\n/);
  const modifiedFilesSet = new Set<string>();
  let insertions = 0;
  let deletions = 0;
  let hasGitHeader = false;
  let hasHunkHeader = false;

  for (const line of lines) {
    if (line.startsWith("diff --git ") || line.startsWith("--- a/") || line.startsWith("+++ b/")) {
      hasGitHeader = true;
    }
    if (line.startsWith("@@ -") && line.includes("@@")) {
      hasHunkHeader = true;
    }
    if (line.startsWith("+++ b/") || line.startsWith("+++ ")) {
      const path = line.replace(/^\+\+\+\s+(b\/)?/, "").trim();
      if (path && path !== "/dev/null") {
        modifiedFilesSet.add(path);
      }
    } else if (line.startsWith("+") && !line.startsWith("+++")) {
      insertions++;
    } else if (line.startsWith("-") && !line.startsWith("---")) {
      deletions++;
    }
  }

  const isUnifiedDiff = hasGitHeader || hasHunkHeader;
  const modifiedFiles = Array.from(modifiedFilesSet);

  return {
    filesChanged: modifiedFiles.length > 0 ? modifiedFiles.length : (isUnifiedDiff ? 1 : 0),
    insertions,
    deletions,
    modifiedFiles,
    isUnifiedDiff,
  };
}

/**
 * Detect the test framework from test patch, test files, or scripts.
 */
export function detectTestFramework(testContent: string, testPatch: string, allFilenames: string[]): string {
  const combined = `${testContent}\n${testPatch}\n${allFilenames.join("\n")}`.toLowerCase();

  if (combined.includes("pytest") || combined.includes("test_") && combined.includes("assert ") && (combined.includes(".py") || combined.includes("import pytest"))) {
    return "pytest (Python)";
  }
  if (combined.includes("unittest") || combined.includes("testcase") || combined.includes("assertequal")) {
    return "unittest (Python)";
  }
  if (combined.includes("vitest") || combined.includes("describe(") && combined.includes("vi.")) {
    return "Vitest (TypeScript/JavaScript)";
  }
  if (combined.includes("jest") || combined.includes("describe(") && (combined.includes(".spec.") || combined.includes(".test."))) {
    return "Jest (TypeScript/JavaScript)";
  }
  if (combined.includes("#[test]") || combined.includes("assert_eq!") || combined.includes("cargo test")) {
    return "cargo test (Rust)";
  }
  if (combined.includes("func test") && (combined.includes("testing.t") || combined.includes("go test"))) {
    return "go test (Golang)";
  }
  if (combined.includes("@test") && (combined.includes("assertthat") || combined.includes("assertequals"))) {
    return "JUnit (Java)";
  }
  if (combined.includes("rspec") || combined.includes("describe ") && combined.includes(".rb")) {
    return "RSpec (Ruby)";
  }

  return "Unified Test Suite";
}

/**
 * Parse Dockerfile contents to extract image, workdir, envs, commands, dependencies.
 */
export function parseDockerfile(content: string): ExtractedDockerfileInfo {
  if (!content) {
    return {
      baseImage: null,
      workdir: null,
      commands: [],
      envVars: {},
      dependencies: [],
    };
  }

  let baseImage: string | null = null;
  let workdir: string | null = null;
  const commands: string[] = [];
  const envVars: Record<string, string> = {};
  const dependencies: string[] = [];

  const lines = content.split(/\r?\n/);
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    if (line.toUpperCase().startsWith("FROM ")) {
      const parts = line.split(/\s+/);
      if (parts[1]) baseImage = parts[1];
    } else if (line.toUpperCase().startsWith("WORKDIR ")) {
      const parts = line.split(/\s+/);
      if (parts[1]) workdir = parts[1];
    } else if (line.toUpperCase().startsWith("ENV ")) {
      const match = line.match(/^ENV\s+([A-Za-z0-9_]+)[=\s](.+)$/);
      if (match) {
        envVars[match[1]] = match[2].trim();
      }
    } else if (line.toUpperCase().startsWith("RUN ")) {
      const cmd = line.substring(4).trim();
      commands.push(cmd);

      // Detect dependencies from package install commands
      if (cmd.includes("pip install")) {
        const pkgs = cmd.split("pip install")[1]?.split("&&")[0]?.trim();
        if (pkgs) dependencies.push(...pkgs.split(/\s+/).filter(p => !p.startsWith("-")));
      }
      if (cmd.includes("npm install") || cmd.includes("yarn add") || cmd.includes("pnpm add")) {
        const pkgs = cmd.split(/(npm install|yarn add|pnpm add)/)[2]?.split("&&")[0]?.trim();
        if (pkgs) dependencies.push(...pkgs.split(/\s+/).filter(p => !p.startsWith("-")));
      }
      if (cmd.includes("apt-get install")) {
        const pkgs = cmd.split("apt-get install")[1]?.split("&&")[0]?.trim();
        if (pkgs) dependencies.push(...pkgs.split(/\s+/).filter(p => !p.startsWith("-")));
      }
    }
  }

  return {
    baseImage,
    workdir,
    commands,
    envVars,
    dependencies: Array.from(new Set(dependencies)).slice(0, 15),
  };
}

/**
 * Infer technology domain from text & metadata.
 */
export function inferDomain(text: string, filenames: string[]): string {
  const combined = `${text} ${filenames.join(" ")}`.toLowerCase();

  if (combined.includes("react") || combined.includes("next.js") || combined.includes("vue") || combined.includes("tailwind") || combined.includes("frontend")) {
    return "Web Development (Frontend)";
  }
  if (combined.includes("fastapi") || combined.includes("django") || combined.includes("flask") || combined.includes("python") || combined.includes("pytest")) {
    return "Python Backend & Systems";
  }
  if (combined.includes("rust") || combined.includes("cargo") || combined.includes("tokio")) {
    return "Systems Programming (Rust)";
  }
  if (combined.includes("golang") || combined.includes("goroutine") || combined.includes("go.mod")) {
    return "Distributed Systems (Golang)";
  }
  if (combined.includes("docker") || combined.includes("kubernetes") || combined.includes("ci/cd") || combined.includes("devops")) {
    return "DevOps & Infrastructure";
  }
  if (combined.includes("postgres") || combined.includes("sql") || combined.includes("database") || combined.includes("prisma")) {
    return "Database & Storage Systems";
  }
  if (combined.includes("machine learning") || combined.includes("pytorch") || combined.includes("tensorflow") || combined.includes("model")) {
    return "Machine Learning & AI";
  }

  return "Software Engineering";
}

/**
 * Helper to determine MIME type from filename.
 */
function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".md")) return "text/markdown";
  if (lower.endsWith(".patch") || lower.endsWith(".diff")) return "text/x-diff";
  if (lower.endsWith(".json")) return "application/json";
  if (lower.endsWith(".sh") || lower.endsWith(".bash")) return "application/x-sh";
  if (lower.endsWith("dockerfile") || lower.includes("dockerfile")) return "text/x-dockerfile";
  if (lower.endsWith(".ts") || lower.endsWith(".tsx")) return "text/typescript";
  if (lower.endsWith(".js") || lower.endsWith(".jsx")) return "text/javascript";
  if (lower.endsWith(".py")) return "text/x-python";
  if (lower.endsWith(".rs")) return "text/x-rust";
  if (lower.endsWith(".go")) return "text/x-go";
  if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "text/yaml";
  if (lower.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

/**
 * Main ZIP Task Extractor
 * Reads a zip archive and extracts all benchmark task components.
 */
export async function parseZipTaskArchive(
  data: ArrayBuffer | Blob | Uint8Array,
  archiveFilename = "benchmark-task.zip"
): Promise<ExtractedZipTask> {
  const zip = await JSZip.loadAsync(data);
  const fileEntries: { path: string; name: string; entry: JSZip.JSZipObject }[] = [];

  // Filter out system files like __MACOSX and .DS_Store
  zip.forEach((relativePath, entry) => {
    if (entry.dir) return;
    const cleanPath = relativePath.replace(/\\/g, "/");
    if (cleanPath.includes("__MACOSX") || cleanPath.includes(".DS_Store")) return;
    const parts = cleanPath.split("/");
    const name = parts[parts.length - 1];
    fileEntries.push({ path: cleanPath, name, entry });
  });

  // Extract all text files
  const allFiles: { filename: string; size: number; mimeType: string; content?: string }[] = [];
  const contentsByLowerName = new Map<string, { filename: string; content: string; size: number }>();

  for (const { path, name, entry } of fileEntries) {
    const mimeType = getMimeType(name);
    let content: string | undefined = undefined;

    // Read textual files
    const isText =
      mimeType.startsWith("text/") ||
      mimeType.includes("json") ||
      mimeType.includes("sh") ||
      name.endsWith(".txt") ||
      name.toLowerCase() === "dockerfile";

    if (isText) {
      try {
        content = await entry.async("string");
      } catch {
        // Fallback if binary
      }
    }

    const uint8 = await entry.async("uint8array");
    const size = uint8.byteLength;

    allFiles.push({
      filename: path,
      size,
      mimeType,
      content,
    });

    const lowerName = name.toLowerCase();
    contentsByLowerName.set(lowerName, { filename: path, content: content ?? "", size });
  }

  // 1. Identify Problem description file
  let problemMd: { filename: string; content: string } | undefined;
  for (const candidate of ["problem.md", "task.md", "prompt.txt", "readme.md", "description.md", "task_description.md", "issue.md"]) {
    if (contentsByLowerName.has(candidate)) {
      const match = contentsByLowerName.get(candidate)!;
      problemMd = { filename: match.filename, content: match.content };
      break;
    }
  }

  // 2. Identify Test Patch
  let testPatch: { filename: string; content: string; stats: ExtractedDiffStats; framework: string } | undefined;
  for (const [lowerName, file] of Array.from(contentsByLowerName.entries())) {
    if (
      lowerName === "test.patch" ||
      lowerName === "tests.patch" ||
      lowerName.endsWith(".test.patch") ||
      lowerName === "test.diff" ||
      lowerName === "test_patch.diff"
    ) {
      const stats = parseDiffStats(file.content);
      const framework = detectTestFramework(file.content, file.content, allFiles.map(f => f.filename));
      testPatch = {
        filename: file.filename,
        content: file.content,
        stats,
        framework,
      };
      break;
    }
  }

  // 3. Identify Solution Patch
  let solutionPatch: { filename: string; content: string; stats: ExtractedDiffStats } | undefined;
  for (const [lowerName, file] of Array.from(contentsByLowerName.entries())) {
    if (
      lowerName === "solution.patch" ||
      lowerName === "fix.patch" ||
      lowerName.endsWith(".solution.patch") ||
      lowerName === "solution.diff" ||
      lowerName === "fix.diff"
    ) {
      const stats = parseDiffStats(file.content);
      solutionPatch = {
        filename: file.filename,
        content: file.content,
        stats,
      };
      break;
    }
  }

  // 4. Identify Dockerfile
  let dockerfile: { filename: string; content: string; parsed: ExtractedDockerfileInfo } | undefined;
  for (const [lowerName, file] of Array.from(contentsByLowerName.entries())) {
    if (lowerName === "dockerfile" || lowerName.startsWith("dockerfile.") || lowerName === "containerfile") {
      const parsed = parseDockerfile(file.content);
      dockerfile = {
        filename: file.filename,
        content: file.content,
        parsed,
      };
      break;
    }
  }

  // 5. Identify Test Runner Script
  let testScript: { filename: string; content: string } | undefined;
  for (const candidate of ["test.sh", "run_tests.sh", "run.sh", "eval.sh", "entrypoint.sh", "test_runner.sh"]) {
    if (contentsByLowerName.has(candidate)) {
      const match = contentsByLowerName.get(candidate)!;
      testScript = { filename: match.filename, content: match.content };
      break;
    }
  }

  // 6. Identify Metadata Manifest
  let metadataJson: { filename: string; content: string; parsed: Record<string, any> } | undefined;
  for (const candidate of ["metadata.json", "task.json", "manifest.json", "benchforge.json", "meta.json"]) {
    if (contentsByLowerName.has(candidate)) {
      const match = contentsByLowerName.get(candidate)!;
      try {
        const parsed = JSON.parse(match.content);
        metadataJson = { filename: match.filename, content: match.content, parsed };
        break;
      } catch {
        // invalid json, ignore
      }
    }
  }

  // Derive Task Title
  let title = metadataJson?.parsed?.title || "";
  if (!title && problemMd) {
    const firstHeader = problemMd.content.split(/\r?\n/).find(l => l.trim().startsWith("# "));
    if (firstHeader) {
      title = firstHeader.replace(/^#\s+/, "").trim();
    } else {
      const firstLine = problemMd.content.split(/\r?\n/).find(l => l.trim().length > 0);
      if (firstLine) title = firstLine.trim().slice(0, 80);
    }
  }
  if (!title) {
    title = archiveFilename.replace(/\.zip$/i, "").replace(/[-_]/g, " ");
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Derive Description
  let description = metadataJson?.parsed?.description || "";
  if (!description && problemMd) {
    const paragraphs = problemMd.content
      .split(/\r?\n\r?\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0 && !p.startsWith("#"));
    if (paragraphs.length > 0) {
      description = paragraphs[0].slice(0, 300);
    }
  }

  // Derive Domain
  const allNames = allFiles.map(f => f.filename);
  const domain = metadataJson?.parsed?.domain || inferDomain(`${title} ${description} ${problemMd?.content ?? ""}`, allNames);
  const category = metadataJson?.parsed?.category || (solutionPatch ? "Bug Fix & Verification" : "Benchmark Challenge");

  // Derive Tags
  const tagsSet = new Set<string>();
  if (metadataJson?.parsed?.tags && Array.isArray(metadataJson.parsed.tags)) {
    metadataJson.parsed.tags.forEach((t: string) => tagsSet.add(String(t).toLowerCase()));
  }
  if (testPatch?.framework) {
    tagsSet.add(testPatch.framework.split(" ")[0].toLowerCase());
  }
  if (dockerfile?.parsed.baseImage) {
    const baseImg = dockerfile.parsed.baseImage.split(":")[0];
    tagsSet.add(baseImg.replace(/[^a-z0-9]/gi, "-"));
  }
  tagsSet.add("benchmark-task");
  tagsSet.add("reproduction-patch");

  // Synthesize Requirements
  const synthesizedRequirements: SynthesizedRequirement[] = [];

  if (problemMd) {
    synthesizedRequirements.push({
      content: `Address primary issue: ${description || title}. Must eliminate the reported failure condition completely.`,
      type: "FUNCTIONAL",
      priority: "CRITICAL",
      sourceReference: problemMd.filename,
    });
  }

  if (testPatch) {
    synthesizedRequirements.push({
      content: `Verify pass on test patch: Must pass all ${testPatch.stats.filesChanged} test file(s) (${testPatch.stats.modifiedFiles.join(", ") || "test suite"}) using ${testPatch.framework}.`,
      type: "TESTING",
      priority: "HIGH",
      sourceReference: testPatch.filename,
    });
  }

  if (solutionPatch) {
    synthesizedRequirements.push({
      content: `Restricted modification scope: Only touch authorized solution files (${solutionPatch.stats.modifiedFiles.slice(0, 5).join(", ")}). No extraneous diffs.`,
      type: "SOLUTION_SCOPE",
      priority: "HIGH",
      sourceReference: solutionPatch.filename,
    });
  }

  if (dockerfile) {
    synthesizedRequirements.push({
      content: `Containerized reproduction: Image ${dockerfile.parsed.baseImage || "standard environment"} with workdir ${dockerfile.parsed.workdir || "/workspace"}.`,
      type: "ENVIRONMENT",
      priority: "MEDIUM",
      sourceReference: dockerfile.filename,
    });
  }

  if (testScript) {
    synthesizedRequirements.push({
      content: `Automated test evaluation: Runner script ${testScript.filename} must exit with status 0 upon completion.`,
      type: "TESTING",
      priority: "HIGH",
      sourceReference: testScript.filename,
    });
  }

  // Synthesize Knowledge Nodes
  const synthesizedKnowledgeNodes: SynthesizedKnowledgeNode[] = [];

  synthesizedKnowledgeNodes.push({
    type: "DOMAIN",
    name: domain,
    definition: `Benchmark domain classification encompassing ${domain} challenges, runtime environments, and ecosystem standards.`,
    confidence: 0.95,
  });

  if (testPatch) {
    synthesizedKnowledgeNodes.push({
      type: "TESTING_STRATEGY",
      name: `${testPatch.framework} Assertion Pattern`,
      definition: `Automated testing strategy utilizing ${testPatch.framework} to isolate regression tests and verify candidate fixes against target issue.`,
      confidence: 0.92,
    });
  }

  if (solutionPatch && solutionPatch.stats.modifiedFiles.length > 0) {
    synthesizedKnowledgeNodes.push({
      type: "SOLUTION_STRATEGY",
      name: `Targeted Patch (${solutionPatch.stats.modifiedFiles[0]})`,
      definition: `Precise modification of ${solutionPatch.stats.modifiedFiles.slice(0, 3).join(", ")} with ${solutionPatch.stats.insertions} additions and ${solutionPatch.stats.deletions} deletions to resolve root defect.`,
      confidence: 0.9,
    });
  }

  if (dockerfile?.parsed.baseImage) {
    synthesizedKnowledgeNodes.push({
      type: "ARCHITECTURE_PATTERN",
      name: `Dockerized Container Recipe (${dockerfile.parsed.baseImage})`,
      definition: `Hermetic execution environment constructed on ${dockerfile.parsed.baseImage} with isolated workspace and pinned dependencies.`,
      confidence: 0.88,
    });
  }

  synthesizedKnowledgeNodes.push({
    type: "EVALUATION_CRITERION",
    name: "Zero Regression & Hermetic Verification",
    definition: "Pass criterion requiring all existing baseline tests and new test.patch suites to succeed with exit code 0.",
    confidence: 0.94,
  });

  return {
    title,
    description,
    domain,
    category,
    tags: Array.from(tagsSet),
    problemMd,
    testPatch,
    solutionPatch,
    dockerfile,
    testScript,
    metadataJson,
    allFiles,
    synthesizedRequirements,
    synthesizedKnowledgeNodes,
  };
}

/**
 * Creates a high-fidelity benchmark ZIP in memory for testing and 1-click demonstration.
 */
export async function createSampleBenchmarkZip(): Promise<{ blob: Blob; filename: string }> {
  const zip = new JSZip();

  const problemMdContent = `# Async Stream Pipeline Memory Leak & Rejection Guard

## Problem Statement
In high-concurrency streaming pipelines, the worker pool fails to release completed chunk buffers on client disconnects. When an upstream consumer abruptly aborts, pending promises are not drained properly, triggering unhandled promise rejections and causing unbounded memory accumulation over time.

## Reproduction Steps
1. Initialize \`StreamingWorkerPool\` with concurrency = 4.
2. Dispatch a burst of 100 streaming tasks.
3. Signal abort midway through processing.
4. Inspect buffer allocation: buffers remain referenced in memory.

## Expected Behavior
- Aborting jobs must drain inflight microtasks immediately.
- Prevent unhandled rejections during worker teardown.
- Memory buffer pool must be cleared upon task cancellation.
`;

  const testPatchContent = `diff --git a/tests/test_stream_pipeline.py b/tests/test_stream_pipeline.py
new file mode 100644
--- /dev/null
+++ b/tests/test_stream_pipeline.py
@@ -0,0 +1,32 @@
+import pytest
+import asyncio
+from stream_pipeline import StreamingWorkerPool, AbortSignal, PipelineError
+
+@pytest.mark.asyncio
+async def test_worker_pool_graceful_shutdown():
+    pool = StreamingWorkerPool(concurrency=4)
+    signal = AbortSignal()
+    
+    async def mock_stream_job():
+        await asyncio.sleep(0.4)
+        return b"chunk-data"
+
+    task = pool.dispatch(mock_stream_job, signal=signal)
+    signal.abort(reason="Client disconnected")
+    
+    result = await pool.drain(timeout=1.0)
+    assert result.is_drained is True
+    assert pool.active_workers == 0
+    assert pool.has_leaked_buffers() is False
+
+@pytest.mark.asyncio
+async def test_aborted_task_rejection_handled():
+    pool = StreamingWorkerPool(concurrency=2)
+    signal = AbortSignal()
+    signal.abort(reason="Immediate abort")
+    
+    with pytest.raises(PipelineError) as exc_info:
+        await pool.dispatch(lambda: asyncio.sleep(0.1), signal=signal)
+    assert "aborted" in str(exc_info.value).lower()
`;

  const solutionPatchContent = `diff --git a/src/stream_pipeline.py b/src/stream_pipeline.py
--- a/src/stream_pipeline.py
+++ b/src/stream_pipeline.py
@@ -42,12 +42,21 @@ class StreamingWorkerPool:
         if signal and signal.is_aborted:
-            return None
+            self._cleanup_buffer(task_id)
+            raise PipelineError("Task aborted prior to execution")
 
+        self._inflight.add(task)
+        try:
+            return await task
+        finally:
+            self._cleanup_buffer(task_id)
+            self._inflight.discard(task)
 
     async def drain(self, timeout: float = 5.0) -> DrainResult:
-        await asyncio.sleep(timeout)
+        async with asyncio.timeout(timeout):
+            if self._inflight:
+                await asyncio.gather(*self._inflight, return_exceptions=True)
+            self._active_workers = 0
+            self._buffers.clear()
+            return DrainResult(is_drained=True)
`;

  const dockerfileContent = `FROM python:3.11-slim

WORKDIR /workspace

ENV PYTHONUNBUFFERED=1 \\
    PYTHONDONTWRITEBYTECODE=1

RUN apt-get update && apt-get install -y --no-install-recommends \\
    git curl bash build-essential \\
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir pytest pytest-asyncio

COPY . .

CMD ["pytest", "-v", "tests/"]
`;

  const testShContent = `#!/usr/bin/env bash
set -eo pipefail

echo "=================================================="
echo "[BenchForge Runner] Running Isolated Benchmark Suite"
echo "=================================================="

pytest tests/test_stream_pipeline.py -v --tb=short

echo "=================================================="
echo "[BenchForge Runner] All verification tests passed!"
echo "=================================================="
exit 0
`;

  const metadataJsonContent = JSON.stringify(
    {
      title: "Async Stream Pipeline Memory Leak & Rejection Guard",
      description:
        "Hermetic benchmark task testing worker pool buffer release and unhandled promise rejection prevention under simulated abort signals.",
      domain: "Python Backend & Systems",
      category: "Concurrency & Memory Management",
      tags: ["python", "asyncio", "pytest", "docker", "benchmark-task", "stream-pipeline"],
      difficulty: "HARD",
      repository: "benchforge/stream-pipeline-core",
      base_commit: "9f82bc4e1a0b",
      author: "BenchForge Learning Studio",
    },
    null,
    2
  );

  zip.file("problem.md", problemMdContent);
  zip.file("test.patch", testPatchContent);
  zip.file("solution.patch", solutionPatchContent);
  zip.file("Dockerfile", dockerfileContent);
  zip.file("test.sh", testShContent);
  zip.file("metadata.json", metadataJsonContent);

  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, filename: "sample-stream-pipeline-benchmark.zip" };
}
