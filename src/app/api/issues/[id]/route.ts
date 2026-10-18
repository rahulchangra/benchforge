import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";

/** GET /api/issues/[id] - Single issue with full candidate info */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        issueCandidate: {
          include: {
            benchmark: true,
            benchmarkJobs: { orderBy: { createdAt: "desc" }, take: 5 },
            relatedPr: true,
          },
        },
        repository: {
          select: { id: true, fullName: true, owner: true, name: true },
        },
      },
    });

    if (!issue) return apiError("Issue not found", 404);
    return apiSuccess(issue);
  }
);

const UpdateCandidateSchema = z.object({
  technicalScore: z.number().min(0).max(1).optional(),
  reproductionFeasibility: z.number().min(0).max(1).optional(),
  complexityScore: z.number().min(0).max(1).optional(),
  benchmarkSuitability: z.number().min(0).max(1).optional(),
  assessmentNotes: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  rejectionReason: z.string().optional(),
  relatedPrId: z.string().optional(),
  fixCommitSha: z.string().optional(),
});

/** PATCH /api/issues/[id] - Update issue candidate assessment */
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    const { data, error } = await parseBody(request, UpdateCandidateSchema);
    if (error) return error;

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { issueCandidate: true },
    });
    if (!issue) return apiError("Issue not found", 404);

    const candidate = await prisma.issueCandidate.upsert({
      where: { issueId: id },
      create: {
        issueId: id,
        repositoryId: issue.repositoryId,
        ...data,
        assessedAt: new Date(),
      },
      update: {
        ...data,
        assessedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "candidate_assessed",
        entityType: "IssueCandidate",
        entityId: candidate.id,
        details: JSON.stringify(data),
      },
    });

    return apiSuccess(candidate);
  }
);
