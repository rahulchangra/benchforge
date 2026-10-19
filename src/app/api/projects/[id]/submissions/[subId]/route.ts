import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";

async function getParams(
  context: unknown
): Promise<{ id: string; subId: string }> {
  const ctx = context as {
    params: Promise<{ id: string; subId: string }> | { id: string; subId: string };
  };
  const p = ctx.params;
  return p instanceof Promise ? await p : p;
}

/** GET /api/projects/[id]/submissions/[subId] - Single submission */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id, subId } = await getParams(context);

    const submission = await prisma.challengeSubmission.findFirst({
      where: { id: subId, olympusProjectId: id },
    });

    if (!submission) return apiError("Submission not found", 404);
    return apiSuccess(submission);
  }
);

const UpdateSubmissionSchema = z.object({
  taskPrompt: z.string().optional(),
  testSh: z.string().optional(),
  testPatch: z.string().optional(),
  solutionPatch: z.string().optional(),
  dockerfile: z.string().optional(),
  status: z
    .enum(["DRAFT", "GENERATING", "REVIEW", "READY", "EXPORTED", "FAILED"])
    .optional(),
});

/** PATCH /api/projects/[id]/submissions/[subId] - Update submission */
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id, subId } = await getParams(context);

    const existing = await prisma.challengeSubmission.findFirst({
      where: { id: subId, olympusProjectId: id },
    });
    if (!existing) return apiError("Submission not found", 404);

    const { data, error } = await parseBody(request, UpdateSubmissionSchema);
    if (error) return error;

    const submission = await prisma.challengeSubmission.update({
      where: { id: subId },
      data,
    });

    return apiSuccess(submission);
  }
);

/** DELETE /api/projects/[id]/submissions/[subId] - Delete draft submission */
export const DELETE = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id, subId } = await getParams(context);

    const existing = await prisma.challengeSubmission.findFirst({
      where: { id: subId, olympusProjectId: id },
    });
    if (!existing) return apiError("Submission not found", 404);

    if (existing.status !== "DRAFT") {
      return apiError("Can only delete submissions in DRAFT status", 409);
    }

    await prisma.challengeSubmission.delete({ where: { id: subId } });
    return apiSuccess({ deleted: true });
  }
);
