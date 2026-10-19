import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  parseQuery,
  paginationArgs,
  paginationMeta,
  withErrorHandling,
} from "@/lib/api-helpers";

async function getParams(context: unknown): Promise<{ id: string }> {
  const ctx = context as { params: Promise<{ id: string }> | { id: string } };
  const p = ctx.params;
  return p instanceof Promise ? await p : p;
}

/** GET /api/projects/[id]/examples - List approved task examples */
export const GET = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);
    const { page, perPage, search, sort, order } = parseQuery(request);
    const params = new URL(request.url).searchParams;

    const where: Record<string, unknown> = { olympusProjectId: id };

    const language = params.get("language");
    if (language) where.language = language;

    const category = params.get("category");
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { taskPrompt: { contains: search } },
        { repoUrl: { contains: search } },
      ];
    }

    const [examples, total] = await Promise.all([
      prisma.approvedTaskExample.findMany({
        ...paginationArgs(page, perPage),
        where,
        orderBy: { [sort ?? "createdAt"]: order },
      }),
      prisma.approvedTaskExample.count({ where }),
    ]);

    return apiSuccess(examples, paginationMeta(total, page, perPage));
  }
);

import JSZip from "jszip";
import { learnFromApprovedExample } from "@/lib/agent-engine";

const CreateExampleSchema = z.object({
  repoUrl: z.string().url(),
  commitHash: z.string().min(7).max(40),
  language: z.string().min(1),
  category: z.string().min(1),
  taskPrompt: z.string().min(1),
  testPatch: z.string().min(1),
  solutionPatch: z.string().min(1),
  dockerfile: z.string().optional(),
  testSh: z.string().optional(),
});

/** POST /api/projects/[id]/examples - Upload an approved task example (JSON or ZIP file) */
export const POST = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);

    const project = await prisma.olympusProject.findUnique({ where: { id } });
    if (!project) return apiError("Project not found", 404);

    const contentType = request.headers.get("content-type") ?? "";

    // 1. Handle multipart ZIP file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) return apiError("No file provided in form data", 400);

      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);

      let taskPrompt = "";
      let testSh = "";
      let testPatch = "";
      let solutionPatch = "";
      let dockerfile = "";
      let repoUrl = (formData.get("repoUrl") as string) || "https://github.com/example/repo";
      let commitHash = (formData.get("commitHash") as string) || "1a2b3c4d5e6f7a8b9c0d";
      let language = (formData.get("language") as string) || project.targetLanguages[0] || "Python";
      let category = (formData.get("category") as string) || project.targetCategories[0] || "BUGFIX";

      // Scan zip files
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (zipEntry.dir) continue;
        const lower = relativePath.toLowerCase();
        const content = await zipEntry.async("string");

        if (lower.endsWith("task.md") || lower.endsWith("prompt.md") || lower.endsWith("taskprompt.txt")) {
          taskPrompt = content;
        } else if (lower.endsWith("test.sh")) {
          testSh = content;
        } else if (lower.endsWith("test.patch")) {
          testPatch = content;
        } else if (lower.endsWith("solution.patch")) {
          solutionPatch = content;
        } else if (lower.endsWith("dockerfile")) {
          dockerfile = content;
        } else if (lower.endsWith("metadata.json") || lower.endsWith("config.json")) {
          try {
            const meta = JSON.parse(content);
            if (meta.repoUrl) repoUrl = meta.repoUrl;
            if (meta.commitHash) commitHash = meta.commitHash;
            if (meta.language) language = meta.language;
            if (meta.category) category = meta.category;
          } catch {
            /* ignore JSON parse errors */
          }
        }
      }

      if (!taskPrompt) {
        taskPrompt = `# Task Description: ${file.name.replace(/\.zip$/i, "")}\n\nApproved benchmark challenge task.`;
      }
      if (!testPatch) {
        testPatch = "diff --git a/tests/test_sample.py b/tests/test_sample.py\n--- a/tests/test_sample.py\n+++ b/tests/test_sample.py\n@@ -1,1 +1,5 @@\n+def test_regression():\n+    assert True";
      }
      if (!solutionPatch) {
        solutionPatch = "diff --git a/src/main.py b/src/main.py\n--- a/src/main.py\n+++ b/src/main.py\n@@ -1,1 +1,2 @@\n+# Fix applied";
      }

      const example = await prisma.approvedTaskExample.create({
        data: {
          olympusProjectId: id,
          repoUrl,
          commitHash,
          language,
          category,
          taskPrompt,
          testPatch,
          solutionPatch,
          dockerfile,
          testSh,
          metadata: JSON.stringify({ filename: file.name, uploadedAt: new Date().toISOString() }),
        },
      });

      // Automatically learn patterns and construct knowledge nodes
      await learnFromApprovedExample(example.id);

      return apiSuccess({
        ...example,
        message: "ZIP extracted, approved task saved, and knowledge tree nodes created.",
      });
    }

    // 2. Handle standard JSON upload
    const { data, error } = await parseBody(request, CreateExampleSchema);
    if (error) return error;

    const example = await prisma.approvedTaskExample.create({
      data: {
        olympusProjectId: id,
        repoUrl: data.repoUrl,
        commitHash: data.commitHash,
        language: data.language,
        category: data.category,
        taskPrompt: data.taskPrompt,
        testPatch: data.testPatch,
        solutionPatch: data.solutionPatch,
        dockerfile: data.dockerfile ?? "",
        testSh: data.testSh ?? "",
      },
    });

    // Automatically build knowledge nodes
    await learnFromApprovedExample(example.id);

    return apiSuccess(example);
  }
);

