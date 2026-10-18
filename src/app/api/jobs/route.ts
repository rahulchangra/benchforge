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

/** GET /api/jobs - List jobs (BenchmarkJob + LearningJob union) */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, order } = parseQuery(request);
  const params = new URL(request.url).searchParams;

  const status = params.get("status");
  const type = params.get("type"); // "benchmark" | "learning" | null (both)

  const statusFilter = status ? { status } : {};

  const results: Array<Record<string, unknown>> = [];
  let total = 0;

  if (!type || type === "benchmark") {
    const [benchmarkJobs, benchmarkCount] = await Promise.all([
      prisma.benchmarkJob.findMany({
        ...paginationArgs(page, perPage),
        where: statusFilter,
        orderBy: { createdAt: order },
        include: {
          issueCandidate: {
            include: {
              issue: { select: { id: true, number: true, title: true } },
              repository: { select: { id: true, fullName: true } },
            },
          },
        },
      }),
      prisma.benchmarkJob.count({ where: statusFilter }),
    ]);

    results.push(
      ...benchmarkJobs.map((j) => ({ ...j, jobType: "benchmark" as const }))
    );
    total += benchmarkCount;
  }

  if (!type || type === "learning") {
    const [learningJobs, learningCount] = await Promise.all([
      prisma.learningJob.findMany({
        ...paginationArgs(page, perPage),
        where: statusFilter,
        orderBy: { createdAt: order },
        include: {
          taskPackage: {
            select: { id: true, title: true, workspaceId: true },
          },
        },
      }),
      prisma.learningJob.count({ where: statusFilter }),
    ]);

    results.push(
      ...learningJobs.map((j) => ({ ...j, jobType: "learning" as const }))
    );
    total += learningCount;
  }

  // Sort combined results by createdAt
  results.sort((a, b) => {
    const dateA = (a.createdAt as Date).getTime();
    const dateB = (b.createdAt as Date).getTime();
    return order === "desc" ? dateB - dateA : dateA - dateB;
  });

  return apiSuccess(results, paginationMeta(total, page, perPage));
});

const CreateJobSchema = z.object({
  issueCandidateId: z.string().min(1),
  idempotencyKey: z.string().optional(),
});

/** POST /api/jobs - Create/trigger a benchmark job */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreateJobSchema);
  if (error) return error;

  const candidate = await prisma.issueCandidate.findUnique({
    where: { id: data.issueCandidateId },
  });
  if (!candidate) return apiError("Issue candidate not found", 404);

  // Idempotency check
  if (data.idempotencyKey) {
    const existing = await prisma.benchmarkJob.findUnique({
      where: { idempotencyKey: data.idempotencyKey },
    });
    if (existing) return apiSuccess(existing);
  }

  // Check for already running jobs
  const activeJob = await prisma.benchmarkJob.findFirst({
    where: {
      issueCandidateId: data.issueCandidateId,
      status: { in: ["QUEUED", "RUNNING"] },
    },
  });
  if (activeJob) {
    return apiError("A job is already running for this candidate", 409);
  }

  const job = await prisma.benchmarkJob.create({
    data: {
      issueCandidateId: data.issueCandidateId,
      status: "QUEUED",
      idempotencyKey: data.idempotencyKey ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "job_created",
      entityType: "BenchmarkJob",
      entityId: job.id,
      details: JSON.stringify({
        issueCandidateId: data.issueCandidateId,
      }),
    },
  });

  return apiSuccess(job);
});
