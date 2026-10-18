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

/** GET /api/learning/knowledge/nodes - List knowledge nodes */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, search } = parseQuery(request);
  const params = new URL(request.url).searchParams;
  const workspaceId = params.get("workspaceId");
  const type = params.get("type");
  const parentId = params.get("parentId");

  const where: Record<string, unknown> = {};
  if (workspaceId) where.workspaceId = workspaceId;
  if (type) where.type = type;
  if (parentId === "root") {
    where.parentId = null;
  } else if (parentId) {
    where.parentId = parentId;
  }
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { definition: { contains: search } },
    ];
  }

  const [nodes, total] = await Promise.all([
    prisma.knowledgeNode.findMany({
      ...paginationArgs(page, perPage),
      where,
      orderBy: { updatedAt: "desc" },
      include: {
        children: {
          select: { id: true, name: true, type: true },
          take: 20,
        },
        outgoingEdges: {
          select: { id: true, type: true, targetNodeId: true, confidence: true },
          take: 10,
        },
        incomingEdges: {
          select: { id: true, type: true, sourceNodeId: true, confidence: true },
          take: 10,
        },
        _count: {
          select: { children: true, outgoingEdges: true, incomingEdges: true },
        },
      },
    }),
    prisma.knowledgeNode.count({ where }),
  ]);

  return apiSuccess(nodes, paginationMeta(total, page, perPage));
});

const CreateNodeSchema = z.object({
  workspaceId: z.string().cuid(),
  type: z.enum([
    "DOMAIN", "TOPIC", "SUBTOPIC", "CONCEPT", "REQUIREMENT_PATTERN",
    "SOLUTION_STRATEGY", "ARCHITECTURE_PATTERN", "ALGORITHM", "CODE_PATTERN",
    "TESTING_STRATEGY", "FAILURE_MODE", "EVALUATION_CRITERION",
    "APPROVED_EXAMPLE", "REUSABLE_INSIGHT", "EVIDENCE_SOURCE",
  ]),
  name: z.string().min(1).max(500),
  definition: z.string().optional(),
  parentId: z.string().cuid().optional(),
  confidence: z.number().min(0).max(1).optional(),
  applicability: z.string().optional(),
  limitations: z.string().optional(),
});

/** POST /api/learning/knowledge/nodes - Create a knowledge node */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreateNodeSchema);
  if (error) return error;

  const workspace = await prisma.learningWorkspace.findUnique({
    where: { id: data.workspaceId },
  });
  if (!workspace) return apiError("Workspace not found", 404);

  if (data.parentId) {
    const parent = await prisma.knowledgeNode.findUnique({
      where: { id: data.parentId },
    });
    if (!parent) return apiError("Parent node not found", 404);
    if (parent.workspaceId !== data.workspaceId) {
      return apiError("Parent node belongs to a different workspace", 400);
    }
  }

  const node = await prisma.knowledgeNode.create({
    data: {
      workspaceId: data.workspaceId,
      type: data.type,
      name: data.name,
      definition: data.definition,
      parentId: data.parentId,
      confidence: data.confidence ?? 0.5,
      applicability: data.applicability,
      limitations: data.limitations,
    },
    include: {
      parent: { select: { id: true, name: true, type: true } },
    },
  });

  return apiSuccess(node);
});
