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

const CreateTaskPackageSchema = z.object({
  workspaceId: z.string().cuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  domain: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/** POST /api/learning/tasks - Create a task package */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreateTaskPackageSchema);
  if (error) return error;

  // Verify workspace exists
  const workspace = await prisma.learningWorkspace.findUnique({
    where: { id: data.workspaceId },
  });
  if (!workspace) return apiError("Workspace not found", 404);

  const task = await prisma.taskPackage.create({
    data: {
      workspaceId: data.workspaceId,
      title: data.title,
      description: data.description,
      domain: data.domain,
      category: data.category,
      tags: JSON.stringify(data.tags ?? []),
    },
  });

  return apiSuccess(task);
});

/** GET /api/learning/tasks - List task packages */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, search } = parseQuery(request);
  const params = new URL(request.url).searchParams;
  const workspaceId = params.get("workspaceId");
  const status = params.get("status");

  const where: Record<string, unknown> = {};
  if (workspaceId) where.workspaceId = workspaceId;
  if (status) where.approvalStatus = status;
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ];
  }

  const [tasks, total] = await Promise.all([
    prisma.taskPackage.findMany({
      ...paginationArgs(page, perPage),
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        uploadedDocuments: { select: { id: true, originalName: true, mimeType: true, size: true } },
        extractedRequirements: { select: { id: true, content: true, type: true } },
        _count: { select: { uploadedDocuments: true, extractedRequirements: true } },
      },
    }),
    prisma.taskPackage.count({ where }),
  ]);

  return apiSuccess(tasks, paginationMeta(total, page, perPage));
});
