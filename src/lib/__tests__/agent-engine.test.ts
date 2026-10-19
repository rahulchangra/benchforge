import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock prisma and octokit
vi.mock("@/lib/db", () => {
  const mockPrisma = {
    agentRun: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    olympusProject: {
      findUnique: vi.fn(),
    },
    learningWorkspace: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    knowledgeNode: {
      create: vi.fn(),
    },
    approvedTaskExample: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    challengeSubmission: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  };
  return { default: mockPrisma };
});

vi.mock("@/lib/github", () => ({
  createGitHubClient: vi.fn(() => ({
    rest: {
      search: {
        repos: vi.fn().mockResolvedValue({ data: { items: [] } }),
        issuesAndPullRequests: vi.fn().mockResolvedValue({ data: { items: [] } }),
      },
      pulls: {
        get: vi.fn().mockResolvedValue({ data: { merged: true, merge_commit_sha: "abc" } }),
        listFiles: vi.fn().mockResolvedValue({
          data: [
            { filename: "tests/test_demo.py", status: "added", patch: "@@ -0,0 +1,5 @@\n+def test(): pass" },
            { filename: "src/app.py", status: "modified", patch: "@@ -1,1 +1,2 @@\n+fix" },
          ],
        }),
      },
    },
  })),
}));

import prisma from "@/lib/db";
import { startFullPipeline, learnFromApprovedExample } from "@/lib/agent-engine";

describe("Agent Engine Pipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("startFullPipeline", () => {
    it("queues all 4 sequential steps (CRAWL, ANALYZE, GENERATE, VALIDATE)", async () => {
      let createdCount = 0;
      (prisma.agentRun.create as any).mockImplementation(({ data }: any) => {
        createdCount++;
        return Promise.resolve({
          id: `run-${createdCount}`,
          olympusProjectId: data.olympusProjectId,
          type: data.type,
          status: "QUEUED",
        });
      });

      (prisma.agentRun.update as any).mockResolvedValue({});
      (prisma.agentRun.findUnique as any).mockResolvedValue({
        id: "run-1",
        olympusProjectId: "proj-123",
        type: "CRAWL",
        status: "RUNNING",
        olympusProject: {
          id: "proj-123",
          name: "Test Project",
          targetLanguages: ["Python"],
          targetCategories: ["BUGFIX"],
          minStars: 500,
          requirementsDoc: "Test doc",
        },
      });

      const runIds = await startFullPipeline("proj-123");

      expect(runIds).toHaveLength(4);
      expect(prisma.agentRun.create).toHaveBeenCalledTimes(4);
      expect(prisma.agentRun.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ data: expect.objectContaining({ type: "CRAWL", status: "QUEUED" }) })
      );
      expect(prisma.agentRun.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ data: expect.objectContaining({ type: "ANALYZE", status: "QUEUED" }) })
      );
      expect(prisma.agentRun.create).toHaveBeenNthCalledWith(
        3,
        expect.objectContaining({ data: expect.objectContaining({ type: "GENERATE", status: "QUEUED" }) })
      );
      expect(prisma.agentRun.create).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({ data: expect.objectContaining({ type: "VALIDATE", status: "QUEUED" }) })
      );
    });
  });

  describe("learnFromApprovedExample", () => {
    it("extracts and synthesizes knowledge patterns from approved tasks", async () => {
      (prisma.approvedTaskExample.findUnique as any).mockResolvedValue({
        id: "ex-1",
        olympusProjectId: "proj-1",
        language: "Python",
        category: "BUGFIX",
        repoUrl: "https://github.com/pallets/flask",
        taskPrompt: "When blueprint has url_prefix, reproducing with index route raises 404 instead of 200.",
        testSh: "#!/usr/bin/env bash\npytest tests/\n",
        testPatch: "diff --git a/tests/test_bp.py\n+def test_blueprint(): pass",
        solutionPatch: "diff --git a/flask/blueprints.py\n+fix",
        dockerfile: "FROM python:3.11-slim\nWORKDIR /app",
      });

      (prisma.olympusProject.findUnique as any).mockResolvedValue({
        id: "proj-1",
        name: "Flask Olympus",
        userId: "user-1",
      });

      (prisma.learningWorkspace.findFirst as any).mockResolvedValue({
        id: "ws-1",
        userId: "user-1",
      });

      (prisma.knowledgeNode.create as any).mockResolvedValue({ id: "node-1" });

      await learnFromApprovedExample("ex-1");

      expect(prisma.knowledgeNode.create).toHaveBeenCalled();
      const calls = (prisma.knowledgeNode.create as any).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(3);

      // Verify prompt pattern was learned
      const patternCall = calls.find((c: any) => c[0].data.type === "REQUIREMENT_PATTERN");
      expect(patternCall).toBeDefined();
      expect(patternCall[0].data.name).toContain("Prompt Structure");

      // Verify testing strategy was learned
      const testCall = calls.find((c: any) => c[0].data.type === "TESTING_STRATEGY");
      expect(testCall).toBeDefined();
      expect(testCall[0].data.definition).toContain("pytest");

      // Verify container recipe was learned
      const containerCall = calls.find((c: any) => c[0].data.type === "ARCHITECTURE_PATTERN");
      expect(containerCall).toBeDefined();
      expect(containerCall[0].data.name).toContain("Container Recipe");
    });
  });

  describe("Heuristics and Quality Checks", () => {
    it("verifies unified diff format and test directory isolation", () => {
      const testPatch = `diff --git a/tests/test_router.py b/tests/test_router.py
--- a/tests/test_router.py
+++ b/tests/test_router.py
@@ -10,2 +10,4 @@
+def test_isolated():
+    assert True`;

      const hasDiffHeader = /^diff --git/m.test(testPatch);
      const isTestIsolated = !/^diff --git a\/(?!tests?\/|spec\/|__tests?\/)/m.test(testPatch);

      expect(hasDiffHeader).toBe(true);
      expect(isTestIsolated).toBe(true);
    });

    it("verifies non-AI prompt depth and natural style", () => {
      const naturalPrompt = `Issue: Blueprint route prefix trailing slash creates routing mismatch.
When registering subroutes on Blueprint with url_prefix='/api/', root index route generates 404.
Reproduction snippet:
\`\`\`python
bp = Blueprint('api', __name__, url_prefix='/api/')
@bp.route('')
def index(): return 'ok'
\`\`\`
Expected 200 OK with response content.`;

      const words = naturalPrompt.trim().split(/\s+/).length;
      const containsBoilerplate = /as an ai|certainly|here is the|i hope this helps/i.test(naturalPrompt);
      const hasReproOrExpected = /reproduction|expected|snippet/i.test(naturalPrompt);

      expect(words).toBeGreaterThan(30);
      expect(containsBoilerplate).toBe(false);
      expect(hasReproOrExpected).toBe(true);
    });
  });
});
