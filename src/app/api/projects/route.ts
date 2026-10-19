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
