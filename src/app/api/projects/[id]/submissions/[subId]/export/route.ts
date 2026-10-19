import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import prisma from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api-helpers";

async function getParams(
  context: unknown
): Promise<{ id: string; subId: string }> {
  const ctx = context as {
    params:
      | Promise<{ id: string; subId: string }>
      | { id: string; subId: string };
  };
  const p = ctx.params;
  return p instanceof Promise ? await p : p;
}

/** GET /api/projects/[id]/submissions/[subId]/export - Export submission as zip */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id, subId } = await getParams(context);

    const submission = await prisma.challengeSubmission.findFirst({
      where: { id: subId, olympusProjectId: id },
    });
    if (!submission) return apiError("Submission not found", 404);

    const zip = new JSZip();

    // task.md
    const taskMd = [
      `# ${submission.taskTitle}`,
      "",
      `**Repository:** ${submission.repoUrl}`,
      `**Commit:** ${submission.commitHash}`,
      `**Language:** ${submission.language}`,
      `**Category:** ${submission.category}`,
      "",
      "## Task Prompt",
      "",
      submission.taskPrompt ?? "_No prompt provided_",
    ].join("\n");
    zip.file("task.md", taskMd);

    // Submission files
    if (submission.testSh) {
      zip.file("test.sh", submission.testSh);
    }
    if (submission.testPatch) {
      zip.file("test.patch", submission.testPatch);
    }
    if (submission.solutionPatch) {
      zip.file("solution.patch", submission.solutionPatch);
    }
    if (submission.dockerfile) {
      zip.file("Dockerfile", submission.dockerfile);
    }

    const zipBuffer = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    const slug = (submission.taskTitle || "task")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 60);

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="submission-${slug}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  }
);

