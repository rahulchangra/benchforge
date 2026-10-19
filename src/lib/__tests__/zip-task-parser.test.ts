import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import {
  parseDiffStats,
  detectTestFramework,
  parseDockerfile,
  inferDomain,
  parseZipTaskArchive,
  createSampleBenchmarkZip,
} from "../zip-task-parser";

describe("zip-task-parser", () => {
  describe("parseDiffStats", () => {
    it("parses unified diff stats correctly", () => {
      const diff = `diff --git a/src/app.py b/src/app.py
--- a/src/app.py
+++ b/src/app.py
@@ -10,4 +10,6 @@ def run():
-    old_code()
+    new_code_1()
+    new_code_2()
`;
      const stats = parseDiffStats(diff);
      expect(stats.isUnifiedDiff).toBe(true);
      expect(stats.filesChanged).toBe(1);
      expect(stats.modifiedFiles).toEqual(["src/app.py"]);
      expect(stats.insertions).toBe(2);
      expect(stats.deletions).toBe(1);
    });

    it("handles multiple modified files in diff", () => {
      const diff = `diff --git a/a.ts b/a.ts
--- a/a.ts
+++ b/a.ts
@@ -1,2 +1,3 @@
+line
diff --git a/b.ts b/b.ts
--- a/b.ts
+++ b/b.ts
@@ -1,1 +1,2 @@
+line
`;
      const stats = parseDiffStats(diff);
      expect(stats.filesChanged).toBe(2);
      expect(stats.modifiedFiles).toEqual(["a.ts", "b.ts"]);
      expect(stats.insertions).toBe(2);
    });
  });

  describe("detectTestFramework", () => {
    it("detects pytest framework", () => {
      const framework = detectTestFramework(
        "import pytest\ndef test_feature():\n    assert True",
        "",
        ["test_app.py"]
      );
      expect(framework).toContain("pytest");
    });

    it("detects vitest / jest framework", () => {
      const framework = detectTestFramework(
        "describe('suite', () => { it('runs', () => { expect(1).toBe(1); }); });",
        "",
        ["suite.test.ts"]
      );
      expect(framework).toMatch(/Jest|Vitest/);
    });

    it("detects cargo test for Rust", () => {
      const framework = detectTestFramework(
        "#[test]\nfn test_something() { assert_eq!(1, 1); }",
        "",
        ["tests.rs"]
      );
      expect(framework).toContain("cargo test");
    });
  });

  describe("parseDockerfile", () => {
    it("extracts base image, workdir, envs, commands", () => {
      const dockerfile = `FROM python:3.11-slim
WORKDIR /app
ENV PORT=8080
ENV APP_ENV=production
RUN apt-get update && apt-get install -y curl
RUN pip install fastapi uvicorn
CMD ["uvicorn", "main:app"]
`;
      const parsed = parseDockerfile(dockerfile);
      expect(parsed.baseImage).toBe("python:3.11-slim");
      expect(parsed.workdir).toBe("/app");
      expect(parsed.envVars).toEqual({ PORT: "8080", APP_ENV: "production" });
      expect(parsed.commands.length).toBe(2);
      expect(parsed.dependencies).toContain("fastapi");
      expect(parsed.dependencies).toContain("uvicorn");
    });
  });

  describe("inferDomain", () => {
    it("detects Python Backend", () => {
      expect(inferDomain("Building FastAPI web services with pytest", [])).toBe(
        "Python Backend & Systems"
      );
    });

    it("detects Web Development", () => {
      expect(inferDomain("Fix React tailwind navigation styling", ["app.tsx"])).toBe(
        "Web Development (Frontend)"
      );
    });
  });

  describe("parseZipTaskArchive with in-memory zip", () => {
    it("parses sample zip with all key artifacts", async () => {
      const { blob } = await createSampleBenchmarkZip();
      const arrayBuffer = await blob.arrayBuffer();

      const result = await parseZipTaskArchive(arrayBuffer, "sample.zip");

      expect(result.title).toContain("Async Stream Pipeline Memory Leak");
      expect(result.problemMd).toBeDefined();
      expect(result.problemMd?.filename).toBe("problem.md");
      expect(result.testPatch).toBeDefined();
      expect(result.testPatch?.framework).toContain("pytest");
      expect(result.solutionPatch).toBeDefined();
      expect(result.solutionPatch?.stats.insertions).toBeGreaterThan(0);
      expect(result.dockerfile).toBeDefined();
      expect(result.dockerfile?.parsed.baseImage).toBe("python:3.11-slim");
      expect(result.testScript).toBeDefined();
      expect(result.metadataJson).toBeDefined();
      expect(result.synthesizedRequirements.length).toBeGreaterThan(0);
      expect(result.synthesizedKnowledgeNodes.length).toBeGreaterThan(0);
    });
  });
});
