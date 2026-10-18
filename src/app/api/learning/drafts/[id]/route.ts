import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";

/** GET /api/learning/drafts/[id] - Single draft with reviews */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    const draft = await prisma.generatedDraft.findUnique({
      where: { id },
      include: {
        workspace: { select: { id: true, name: true } },
        humanReviews: { orderBy: { createdAt: "desc" } },
        learningFeedback: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!draft) return apiError("Draft not found", 404);
    return apiSuccess(draft);
  }
);

const UpdateDraftSchema = z.object({
  approvalStatus: z
    .enum([
      "PENDING",
      "APPROVED",
      "APPROVED_WITH_CHANGES",
      "REJECTED",
      "NEEDS_EVIDENCE",
      "INCORRECT",
      "INCOMPLETE",
    ])
    .optional(),
  generatedContent: z.string().optional(),
  taskDescription: z.string().optional(),
  retrievedNodeIds: z.array(z.string()).optional(),
  retrievedPatternIds: z.array(z.string()).optional(),
  requirementChecks: z.array(z.unknown()).optional(),
  supportingEvidence: z.array(z.unknown()).optional(),
  assumptions: z.array(z.unknown()).optional(),
  unresolvedQuestions: z.array(z.unknown()).optional(),
});

/** PATCH /api/learning/drafts/[id] - Update draft */
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    const { data, error } = await parseBody(request, UpdateDraftSchema);
    if (error) return error;

    const existing = await prisma.generatedDraft.findUnique({ where: { id } });
    if (!existing) return apiError("Draft not found", 404);

    const updateData: Record<string, unknown> = {};
    if (data.approvalStatus) updateData.approvalStatus = data.approvalStatus;
    if (data.generatedContent !== undefined) {
      updateData.generatedContent = data.generatedContent;
      updateData.version = existing.version + 1;
    }
    if (data.taskDescription !== undefined) updateData.taskDescription = data.taskDescription;
    if (data.retrievedNodeIds) updateData.retrievedNodeIds = JSON.stringify(data.retrievedNodeIds);
    if (data.retrievedPatternIds) updateData.retrievedPatternIds = JSON.stringify(data.retrievedPatternIds);
    if (data.requirementChecks) updateData.requirementChecks = JSON.stringify(data.requirementChecks);
    if (data.supportingEvidence) updateData.supportingEvidence = JSON.stringify(data.supportingEvidence);
    if (data.assumptions) updateData.assumptions = JSON.stringify(data.assumptions);
    if (data.unresolvedQuestions) updateData.unresolvedQuestions = JSON.stringify(data.unresolvedQuestions);

    const draft = await prisma.generatedDraft.update({
      where: { id },
      data: updateData,
      include: {
        workspace: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "draft_updated",
        entityType: "GeneratedDraft",
        entityId: id,
        details: JSON.stringify({
          fields: Object.keys(updateData),
          newStatus: data.approvalStatus,
        }),
      },
    });

    return apiSuccess(draft);
  }
);
