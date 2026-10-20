import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import prisma from "@/lib/db";
import { apiError, withErrorHandling } from "@/lib/api-helpers";

async function getParams(context: unknown): Promise<{ id: string }> {
  const ctx = context as {
    params: Promise<{ id: string }> | { id: string };
  };
  const p = ctx.params;
  return p instanceof Promise ? await p : p;
}

/** POST /api/projects/[id]/submissions/batch-export - Export multiple submissions as zip */
export const POST = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);
    const body = await request.json();
    const { submissionIds } = body as { submissionIds: string[] };

    if (!Array.isArray(submissionIds) || submissionIds.length === 0) {
      return apiError("No submissions selected", 400);
    }

    const submissions = await prisma.challengeSubmission.findMany({
      where: {
        id: { in: submissionIds },
        olympusProjectId: id,
      },
    });

    if (submissions.length === 0) {
      return apiError("No submissions found", 404);
    }

    const mainZip = new JSZip();

    // Create a folder for each submission
    for (const submission of submissions) {
      const folderName = `${submission.taskTitle || "task"}-${submission.id.slice(0, 8)}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-");

      const folder = mainZip.folder(folderName);
      if (!folder) continue;

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
      folder.file("task.md", taskMd);

      // Other files
      if (submission.testSh) {
        folder.file("test.sh", submission.testSh);
      }
      if (submission.testPatch) {
        folder.file("test.patch", submission.testPatch);
      }
      if (submission.solutionPatch) {
        folder.file("solution.patch", submission.solutionPatch);
      }
      if (submission.dockerfile) {
        folder.file("Dockerfile", submission.dockerfile);
      }
    }

    const zipBuffer = await mainZip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="batch-export-${submissions.length}-submissions.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  }
);
