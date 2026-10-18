import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";

/** GET /api/jobs/[id] - Single job with logs */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    // Try BenchmarkJob first
    const benchmarkJob = await prisma.benchmarkJob.findUnique({
      where: { id },
      include: {
        issueCandidate: {
          include: {
            issue: true,
            repository: { select: { id: true, fullName: true } },
          },
        },
      },
    });

    if (benchmarkJob) {
      return apiSuccess({ ...benchmarkJob, jobType: "benchmark" });
    }

    // Try LearningJob
    const learningJob = await prisma.learningJob.findUnique({
      where: { id },
      include: {
        taskPackage: {
          select: { id: true, title: true, workspaceId: true },
        },
      },
    });

    if (learningJob) {
      return apiSuccess({ ...learningJob, jobType: "learning" });
    }

    return apiError("Job not found", 404);
  }
);

const PatchJobSchema = z.object({
  action: z.enum(["cancel", "retry"]),
});

/** PATCH /api/jobs/[id] - Cancel or retry a job */
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = (context as { params: Promise<{ id: string }> }).params
      ? await (context as { params: Promise<{ id: string }> }).params
      : (context as { params: { id: string } }).params;

    const { data, error } = await parseBody(request, PatchJobSchema);
    if (error) return error;

    // Try BenchmarkJob first
    const benchmarkJob = await prisma.benchmarkJob.findUnique({ where: { id } });
    if (benchmarkJob) {
      if (data.action === "cancel") {
        if (!["QUEUED", "RUNNING"].includes(benchmarkJob.status)) {
          return apiError("Only QUEUED or RUNNING jobs can be cancelled", 400);
        }
        const updated = await prisma.benchmarkJob.update({
          where: { id },
          data: { status: "CANCELLED", completedAt: new Date() },
        });
        await prisma.auditLog.create({
          data: {
            action: "job_cancelled",
            entityType: "BenchmarkJob",
            entityId: id,
          },
        });
        return apiSuccess({ ...updated, jobType: "benchmark" });
      }

      if (data.action === "retry") {
        if (benchmarkJob.status !== "FAILED") {
          return apiError("Only FAILED jobs can be retried", 400);
        }
        const updated = await prisma.benchmarkJob.update({
          where: { id },
          data: {
            status: "QUEUED",
            progress: 0,
            currentStep: null,
            error: null,
            startedAt: null,
            completedAt: null,
            retryCount: benchmarkJob.retryCount + 1,
          },
        });
        await prisma.auditLog.create({
          data: {
            action: "job_retried",
            entityType: "BenchmarkJob",
            entityId: id,
            details: JSON.stringify({ retryCount: updated.retryCount }),
          },
        });
        return apiSuccess({ ...updated, jobType: "benchmark" });
      }
    }

    // Try LearningJob
    const learningJob = await prisma.learningJob.findUnique({ where: { id } });
    if (learningJob) {
      if (data.action === "cancel") {
        if (!["QUEUED", "RUNNING"].includes(learningJob.status)) {
          return apiError("Only QUEUED or RUNNING jobs can be cancelled", 400);
        }
        const updated = await prisma.learningJob.update({
          where: { id },
          data: { status: "CANCELLED", completedAt: new Date() },
        });
        await prisma.auditLog.create({
          data: {
            action: "job_cancelled",
            entityType: "LearningJob",
            entityId: id,
          },
        });
        return apiSuccess({ ...updated, jobType: "learning" });
      }

      if (data.action === "retry") {
        if (learningJob.status !== "FAILED") {
          return apiError("Only FAILED jobs can be retried", 400);
        }
        const updated = await prisma.learningJob.update({
          where: { id },
          data: {
            status: "QUEUED",
            progress: 0,
            currentStep: null,
            error: null,
            startedAt: null,
            completedAt: null,
          },
        });
        await prisma.auditLog.create({
          data: {
            action: "job_retried",
            entityType: "LearningJob",
            entityId: id,
          },
        });
        return apiSuccess({ ...updated, jobType: "learning" });
      }
    }

    return apiError("Job not found", 404);
  }
);
