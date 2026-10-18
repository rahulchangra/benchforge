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

/** GET /api/learning/drafts - List drafts with filters */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, search, sort, order } = parseQuery(request);
  const params = new URL(request.url).searchParams;

  const where: Record<string, unknown> = {};

  const workspaceId = params.get("workspaceId");
  if (workspaceId) where.workspaceId = workspaceId;

  const approvalStatus = params.get("approvalStatus");
  if (approvalStatus) where.approvalStatus = approvalStatus;

  if (search) {
    where.OR = [
      { taskTitle: { contains: search } },
      { taskDescription: { contains: search } },
    ];
  }

  const [drafts, total] = await Promise.all([
    prisma.generatedDraft.findMany({
      ...paginationArgs(page, perPage),
      where,
      orderBy: { [sort ?? "createdAt"]: order },
      include: {
        workspace: { select: { id: true, name: true } },
        humanReviews: { orderBy: { createdAt: "desc" }, take: 1 },
        _count: { select: { humanReviews: true, learningFeedback: true } },
      },
    }),
    prisma.generatedDraft.count({ where }),
  ]);

  return apiSuccess(drafts, paginationMeta(total, page, perPage));
});

const CreateDraftSchema = z.object({
  workspaceId: z.string().min(1),
  taskTitle: z.string().min(1).max(500),
  taskDescription: z.string().optional(),
  inputRequirements: z.record(z.string(), z.unknown()),
  generatedContent: z.string().optional(),
});

/** POST /api/learning/drafts - Generate a new draft */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreateDraftSchema);
  if (error) return error;

  const workspace = await prisma.learningWorkspace.findUnique({
    where: { id: data.workspaceId },
  });
  if (!workspace) return apiError("Workspace not found", 404);

  const draft = await prisma.generatedDraft.create({
    data: {
      workspaceId: data.workspaceId,
      taskTitle: data.taskTitle,
      taskDescription: data.taskDescription ?? null,
      inputRequirements: JSON.stringify(data.inputRequirements),
      generatedContent: data.generatedContent ?? "",
      approvalStatus: "PENDING",
    },
    include: {
      workspace: { select: { id: true, name: true } },
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "draft_created",
      entityType: "GeneratedDraft",
      entityId: draft.id,
      details: JSON.stringify({
        workspaceId: data.workspaceId,
        taskTitle: data.taskTitle,
      }),
    },
  });

  return apiSuccess(draft);
});
