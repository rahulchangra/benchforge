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

/** GET /api/benchmarks - List benchmarks with filters */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, search, sort, order } = parseQuery(request);
  const params = new URL(request.url).searchParams;

  const where: Record<string, unknown> = {};

  const repositoryId = params.get("repositoryId");
  if (repositoryId) where.repositoryId = repositoryId;

  const status = params.get("status");
  if (status) where.status = status;

  if (search) {
    where.issueCandidate = {
      issue: {
        OR: [
          { title: { contains: search } },
          { body: { contains: search } },
        ],
      },
    };
  }

  const [benchmarks, total] = await Promise.all([
    prisma.benchmark.findMany({
      ...paginationArgs(page, perPage),
      where,
      orderBy: { [sort ?? "createdAt"]: order },
      include: {
        repository: { select: { id: true, fullName: true, owner: true, name: true } },
        issueCandidate: {
          include: {
            issue: { select: { id: true, number: true, title: true, state: true, url: true } },
          },
        },
      },
    }),
    prisma.benchmark.count({ where }),
  ]);

  return apiSuccess(benchmarks, paginationMeta(total, page, perPage));
});

const CreateBenchmarkSchema = z.object({
  issueCandidateId: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  problemDefinition: z.record(z.string(), z.unknown()).optional(),
  environment: z.record(z.string(), z.unknown()).optional(),
});

/** POST /api/benchmarks - Create benchmark from issue candidate */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreateBenchmarkSchema);
  if (error) return error;

  const candidate = await prisma.issueCandidate.findUnique({
    where: { id: data.issueCandidateId },
    include: { issue: true, benchmark: true },
  });

  if (!candidate) return apiError("Issue candidate not found", 404);
  if (candidate.benchmark) return apiError("Benchmark already exists for this candidate", 409);

  // Find latest snapshot for the repository
  const snapshot = await prisma.repositorySnapshot.findFirst({
    where: { repositoryId: candidate.repositoryId },
    orderBy: { snapshotAt: "desc" },
  });
  if (!snapshot) return apiError("No repository snapshot found. Create a snapshot first.", 400);

  const benchmark = await prisma.benchmark.create({
    data: {
      issueCandidateId: data.issueCandidateId,
      repositoryId: candidate.repositoryId,
      snapshotId: snapshot.id,
      status: "DRAFT",
      metadata: JSON.stringify(data.metadata ?? {}),
      problemDefinition: JSON.stringify(data.problemDefinition ?? {}),
      environment: JSON.stringify(data.environment ?? {}),
    },
    include: {
      issueCandidate: { include: { issue: true } },
      repository: { select: { id: true, fullName: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "benchmark_created",
      entityType: "Benchmark",
      entityId: benchmark.id,
      details: JSON.stringify({
        issueCandidateId: data.issueCandidateId,
        repositoryId: candidate.repositoryId,
      }),
    },
  });

  return apiSuccess(benchmark);
});
