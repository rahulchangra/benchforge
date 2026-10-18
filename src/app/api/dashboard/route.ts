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

/** GET /api/dashboard - Dashboard metrics */
export const GET = withErrorHandling(async () => {
  const [
    totalRepos,
    licenseEligible,
    locEligible,
    totalIssues,
    totalBenchmarks,
    publishedBenchmarks,
    totalTaskPackages,
    totalKnowledgeNodes,
    totalKnowledgeEdges,
    totalDrafts,
    activeJobs,
    recentRejections,
  ] = await Promise.all([
    prisma.repository.count(),
    prisma.licenseVerification.count({ where: { status: "ALLOWED" } }),
    prisma.locMeasurement.count({
      where: { status: "MEASURED", codeLoc: { gt: 200 } },
    }),
    prisma.issue.count(),
    prisma.benchmark.count(),
    prisma.benchmark.count({ where: { status: "PUBLISHED" } }),
    prisma.taskPackage.count(),
    prisma.knowledgeNode.count(),
    prisma.knowledgeEdge.count(),
    prisma.generatedDraft.count(),
    prisma.benchmarkJob.count({
      where: { status: { in: ["QUEUED", "RUNNING"] } },
    }),
    prisma.auditLog.findMany({
      where: {
        action: "eligibility_check",
        createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Validation success rate
  const validatedBenchmarks = await prisma.benchmark.count({
    where: { status: { in: ["VALIDATED", "PUBLISHED"] } },
  });
  const failedBenchmarks = await prisma.benchmark.count({
    where: { status: "REJECTED" },
  });
  const validationRate =
    validatedBenchmarks + failedBenchmarks > 0
      ? validatedBenchmarks / (validatedBenchmarks + failedBenchmarks)
      : 0;

  return apiSuccess({
    repositories: {
      discovered: totalRepos,
      licenseEligible,
      locEligible,
    },
    issues: {
      discovered: totalIssues,
    },
    benchmarks: {
      generated: totalBenchmarks,
      published: publishedBenchmarks,
      validationRate: Math.round(validationRate * 100),
    },
    learningStudio: {
      taskPackages: totalTaskPackages,
      knowledgeNodes: totalKnowledgeNodes,
      knowledgeEdges: totalKnowledgeEdges,
      generatedDrafts: totalDrafts,
    },
    jobs: {
      active: activeJobs,
    },
    recentActivity: recentRejections.map((log) => ({
      action: log.action,
      entityType: log.entityType,
      details: log.details,
      createdAt: log.createdAt,
    })),
  });
});
