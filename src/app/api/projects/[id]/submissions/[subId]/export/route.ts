import { NextRequest, NextResponse } from "next/server";
import * as archiver from "archiver";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createArchive = (archiver as any).default ?? archiver;
import { PassThrough } from "node:stream";
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

    // Build the zip in memory
    const archive = createArchive("zip", { zlib: { level: 9 } });
    const passthrough = new PassThrough();
    archive.pipe(passthrough);

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
    archive.append(taskMd, { name: "task.md" });

    // Optional files
    if (submission.testSh) {
      archive.append(submission.testSh, { name: "test.sh" });
    }
    if (submission.testPatch) {
      archive.append(submission.testPatch, { name: "test.patch" });
    }
    if (submission.solutionPatch) {
      archive.append(submission.solutionPatch, { name: "solution.patch" });
    }
    if (submission.dockerfile) {
      archive.append(submission.dockerfile, { name: "Dockerfile" });
    }

    await archive.finalize();

    // Collect all chunks into a buffer
    const chunks: Buffer[] = [];
    for await (const chunk of passthrough) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const zipBuffer = Buffer.concat(chunks);

    const slug = submission.taskTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 60);

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="submission-${slug}.zip"`,
        "Content-Length": String(zipBuffer.length),
      },
    });
  }
);
