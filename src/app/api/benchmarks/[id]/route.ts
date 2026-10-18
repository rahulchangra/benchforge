import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";

/** GET /api/benchmarks/[id] - Single benchmark with all relations */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    const benchmark = await prisma.benchmark.findUnique({
      where: { id },
      include: {
        repository: { select: { id: true, fullName: true, owner: true, name: true } },
        snapshot: true,
        issueCandidate: {
          include: {
            issue: true,
            relatedPr: true,
          },
        },
        analysisEvidence: { orderBy: { createdAt: "desc" }, take: 20 },
      },
    });

    if (!benchmark) return apiError("Benchmark not found", 404);
    return apiSuccess(benchmark);
  }
);

const VALID_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["VALIDATING", "REJECTED"],
  VALIDATING: ["VALIDATED", "REJECTED"],
  VALIDATED: ["PUBLISHED", "REJECTED"],
  PUBLISHED: [],
  REJECTED: ["DRAFT"],
};

const UpdateBenchmarkSchema = z.object({
  status: z.enum(["DRAFT", "VALIDATING", "VALIDATED", "PUBLISHED", "REJECTED"]).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  problemDefinition: z.record(z.string(), z.unknown()).optional(),
  environment: z.record(z.string(), z.unknown()).optional(),
  validationEvidence: z.record(z.string(), z.unknown()).optional(),
  patchInfo: z.record(z.string(), z.unknown()).optional(),
  qualityScore: z.number().min(0).max(1).optional(),
});

/** PATCH /api/benchmarks/[id] - Update benchmark */
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    const { data, error } = await parseBody(request, UpdateBenchmarkSchema);
    if (error) return error;

    const existing = await prisma.benchmark.findUnique({ where: { id } });
    if (!existing) return apiError("Benchmark not found", 404);

    // Validate status transition
    if (data.status && data.status !== existing.status) {
      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(data.status)) {
        return apiError(
          `Invalid status transition: ${existing.status} → ${data.status}. Allowed: ${allowed.join(", ") || "none"}`,
          400
        );
      }
    }

    const updateData: Record<string, unknown> = {};
    if (data.status) {
      updateData.status = data.status;
      if (data.status === "PUBLISHED") updateData.publishedAt = new Date();
    }
    if (data.metadata) updateData.metadata = JSON.stringify(data.metadata);
    if (data.problemDefinition) updateData.problemDefinition = JSON.stringify(data.problemDefinition);
    if (data.environment) updateData.environment = JSON.stringify(data.environment);
    if (data.validationEvidence) updateData.validationEvidence = JSON.stringify(data.validationEvidence);
    if (data.patchInfo) updateData.patchInfo = JSON.stringify(data.patchInfo);
    if (data.qualityScore !== undefined) updateData.qualityScore = data.qualityScore;

    const benchmark = await prisma.benchmark.update({
      where: { id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: "benchmark_updated",
        entityType: "Benchmark",
        entityId: id,
        details: JSON.stringify({
          previousStatus: existing.status,
          ...data,
        }),
      },
    });

    return apiSuccess(benchmark);
  }
);

/** DELETE /api/benchmarks/[id] - Delete draft benchmarks only */
export const DELETE = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    const existing = await prisma.benchmark.findUnique({ where: { id } });
    if (!existing) return apiError("Benchmark not found", 404);

    if (existing.status !== "DRAFT") {
      return apiError("Only DRAFT benchmarks can be deleted", 400);
    }

    await prisma.benchmark.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: "benchmark_deleted",
        entityType: "Benchmark",
        entityId: id,
        details: JSON.stringify({ repositoryId: existing.repositoryId }),
      },
    });

    return apiSuccess({ deleted: true });
  }
);
