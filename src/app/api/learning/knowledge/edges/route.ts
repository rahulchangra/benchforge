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

const CreateEdgeSchema = z.object({
  workspaceId: z.string().cuid(),
  sourceNodeId: z.string().cuid(),
  targetNodeId: z.string().cuid(),
  type: z.enum([
    "PARENT_OF", "DEPENDS_ON", "IMPLEMENTS", "EXTENDS",
    "SIMILAR_TO", "CONTRASTS_WITH", "SOLVES", "TESTED_BY",
    "EVALUATED_BY", "DERIVED_FROM", "REUSES", "CONFLICTS_WITH", "SUPERSEDES",
  ]),
  evidence: z.string().optional(),
  explanation: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

/** POST /api/learning/knowledge/edges - Create a knowledge edge */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreateEdgeSchema);
  if (error) return error;

  // Validate both nodes exist in same workspace
  const [source, target] = await Promise.all([
    prisma.knowledgeNode.findUnique({ where: { id: data.sourceNodeId } }),
    prisma.knowledgeNode.findUnique({ where: { id: data.targetNodeId } }),
  ]);

  if (!source) return apiError("Source node not found", 404);
  if (!target) return apiError("Target node not found", 404);
  if (source.workspaceId !== data.workspaceId || target.workspaceId !== data.workspaceId) {
    return apiError("Both nodes must belong to the specified workspace", 400);
  }
  if (data.sourceNodeId === data.targetNodeId) {
    return apiError("Self-referencing edges are not allowed", 400);
  }

  const edge = await prisma.knowledgeEdge.create({
    data: {
      workspaceId: data.workspaceId,
      sourceNodeId: data.sourceNodeId,
      targetNodeId: data.targetNodeId,
      type: data.type,
      evidence: data.evidence,
      explanation: data.explanation,
      confidence: data.confidence ?? 0.5,
    },
    include: {
      sourceNode: { select: { id: true, name: true, type: true } },
      targetNode: { select: { id: true, name: true, type: true } },
    },
  });

  return apiSuccess(edge);
});

/** GET /api/learning/knowledge/edges - List knowledge edges */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage } = parseQuery(request);
  const params = new URL(request.url).searchParams;
  const workspaceId = params.get("workspaceId");
  const nodeId = params.get("nodeId");
  const type = params.get("type");

  const where: Record<string, unknown> = {};
  if (workspaceId) where.workspaceId = workspaceId;
  if (type) where.type = type;
  if (nodeId) {
    where.OR = [{ sourceNodeId: nodeId }, { targetNodeId: nodeId }];
  }

  const [edges, total] = await Promise.all([
    prisma.knowledgeEdge.findMany({
      ...paginationArgs(page, perPage),
      where,
      orderBy: { createdAt: "desc" },
      include: {
        sourceNode: { select: { id: true, name: true, type: true } },
        targetNode: { select: { id: true, name: true, type: true } },
      },
    }),
    prisma.knowledgeEdge.count({ where }),
  ]);

  return apiSuccess(edges, paginationMeta(total, page, perPage));
});
