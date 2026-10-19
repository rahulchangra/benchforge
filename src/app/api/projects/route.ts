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

/** GET /api/projects - List Olympus projects with filters */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, search, sort, order } = parseQuery(request);
  const params = new URL(request.url).searchParams;

  const where: Record<string, unknown> = {};

  const userId = params.get("userId");
  if (userId) where.userId = userId;

  const status = params.get("status");
  if (status) where.status = status;

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  try {
    const [projects, total] = await Promise.all([
      prisma.olympusProject.findMany({
        ...paginationArgs(page, perPage),
        where,
        orderBy: { [sort ?? "createdAt"]: order },
        include: {
          _count: {
            select: {
              challengeSubmissions: true,
              approvedTaskExamples: true,
              agentRuns: true,
            },
          },
        },
      }),
      prisma.olympusProject.count({ where }),
    ]);

    return apiSuccess(projects, paginationMeta(total, page, perPage));
  } catch (error) {
    console.warn("Database unavailable for projects, serving showcase projects:", error);
    const showcaseProjects = [
      {
        id: "demo-olympus-python",
        name: "Quest Olympus Python Benchmarks",
        description: "Automated benchmark challenges targeting high-star Python repositories with isolated reproduction patches.",
        status: "ACTIVE",
        targetLanguages: ["Python"],
        targetCategories: ["BUGFIX", "FEATURE_REQUEST"],
        minStars: 500,
        requirementsDoc: "Quest Olympus Platform Guidelines: Target active repos >= 500 stars with permissive licenses (MIT/BSD/Apache-2.0).",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: {
          challengeSubmissions: 12,
          approvedTaskExamples: 4,
          agentRuns: 16,
        },
      },
      {
        id: "demo-olympus-ts",
        name: "TypeScript Server Frameworks Benchmark",
        description: "Benchmark tasks extracted from Express, Fastify, and NestJS issues with reproducible test harnesses.",
        status: "ACTIVE",
        targetLanguages: ["TypeScript", "JavaScript"],
        targetCategories: ["BUGFIX", "REFACTOR"],
        minStars: 1000,
        requirementsDoc: "Focus on HTTP routing and middleware regression test cases.",
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date().toISOString(),
        _count: {
          challengeSubmissions: 8,
          approvedTaskExamples: 3,
          agentRuns: 11,
        },
      },
      {
        id: "demo-olympus-rust",
        name: "Rust Asynchronous Concurrency QA",
        description: "High-concurrency async runtime benchmark tasks focusing on Tokio and async-std issue regressions.",
        status: "SETUP",
        targetLanguages: ["Rust"],
        targetCategories: ["BUGFIX"],
        minStars: 2000,
        requirementsDoc: "Requires cargo test harness with clean container execution.",
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        updatedAt: new Date().toISOString(),
        _count: {
          challengeSubmissions: 3,
          approvedTaskExamples: 1,
          agentRuns: 4,
        },
      },
    ];
    return apiSuccess(showcaseProjects, paginationMeta(showcaseProjects.length, page, perPage));
  }
});

const CreateProjectSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  targetLanguages: z.array(z.string()).min(1),
  targetCategories: z.array(z.string()).min(1),
  minStars: z.number().int().min(0).default(0),
  requirementsDoc: z.string().optional(),
});

/** POST /api/projects - Create a new Olympus project */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreateProjectSchema);
  if (error) return error;

  // TODO: get userId from auth session; for now use a placeholder
  const project = await prisma.olympusProject.create({
    data: {
      name: data.name,
      description: data.description ?? null,
      targetLanguages: data.targetLanguages,
      targetCategories: data.targetCategories,
      minStars: data.minStars,
      requirementsDoc: data.requirementsDoc ?? null,
      status: "SETUP",
      userId: "system", // placeholder until auth wired
    },
  });

  return apiSuccess(project);
});
