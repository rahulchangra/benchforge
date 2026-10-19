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

const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  userId: z.string().min(1),
});

/** POST /api/learning/workspaces - Create a learning workspace */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreateWorkspaceSchema);
  if (error) return error;

  const workspace = await prisma.learningWorkspace.create({
    data: {
      name: data.name,
      description: data.description,
      userId: data.userId,
    },
  });

  return apiSuccess(workspace);
});

/** GET /api/learning/workspaces - List workspaces */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, search } = parseQuery(request);
  const params = new URL(request.url).searchParams;
  const userId = params.get("userId");

  const where: Record<string, unknown> = {};
  if (userId) where.userId = userId;
  if (search) where.name = { contains: search };

  const [workspaces, total] = await Promise.all([
    prisma.learningWorkspace.findMany({
      ...paginationArgs(page, perPage),
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            taskPackages: true,
            knowledgeNodes: true,
            knowledgeEdges: true,
            generatedDrafts: true,
          },
        },
      },
    }),
    prisma.learningWorkspace.count({ where }),
  ]);

  return apiSuccess(workspaces, paginationMeta(total, page, perPage));
});
