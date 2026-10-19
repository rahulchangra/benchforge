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
  workspaceId: z.string().min(1),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  domain: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  documents: z
    .array(
      z.object({
        filename: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        size: z.number(),
        extractedText: z.string().optional(),
      })
    )
    .optional(),
  requirements: z
    .array(
      z.object({
        content: z.string(),
        type: z.string(),
        priority: z.string().optional(),
        sourceReference: z.string().optional(),
      })
    )
    .optional(),
  knowledgeNodes: z
    .array(
      z.object({
        type: z.enum([
          "DOMAIN", "TOPIC", "SUBTOPIC", "CONCEPT", "REQUIREMENT_PATTERN",
          "SOLUTION_STRATEGY", "ARCHITECTURE_PATTERN", "ALGORITHM", "CODE_PATTERN",
          "TESTING_STRATEGY", "FAILURE_MODE", "EVALUATION_CRITERION",
          "APPROVED_EXAMPLE", "REUSABLE_INSIGHT", "EVIDENCE_SOURCE",
        ]),
        name: z.string(),
        definition: z.string().optional(),
        confidence: z.number().optional(),
      })
    )
    .optional(),
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

  // Save extracted documents if provided
  if (data.documents && data.documents.length > 0) {
    for (const doc of data.documents) {
      await prisma.uploadedDocument.create({
        data: {
          taskPackageId: task.id,
          filename: doc.filename,
          originalName: doc.originalName,
          mimeType: doc.mimeType,
          size: doc.size,
          storagePath: `/uploads/${task.id}/${doc.filename}`,
          extractedText: doc.extractedText ?? null,
        },
      });
    }
  }

  // Save extracted requirements if provided
  if (data.requirements && data.requirements.length > 0) {
    for (const req of data.requirements) {
      await prisma.extractedRequirement.create({
        data: {
          taskPackageId: task.id,
          content: req.content,
          type: req.type,
          priority: req.priority ?? "HIGH",
          sourceReference: req.sourceReference ?? null,
        },
      });
    }
  }

  // Synthesize knowledge nodes into workspace
  if (data.knowledgeNodes && data.knowledgeNodes.length > 0) {
    for (const kn of data.knowledgeNodes) {
      await prisma.knowledgeNode.create({
        data: {
          workspaceId: data.workspaceId,
          type: kn.type,
          name: kn.name,
          definition: kn.definition ?? null,
          confidence: kn.confidence ?? 0.9,
          reviewStatus: "approved",
          relatedTaskIds: JSON.stringify([task.id]),
        },
      });
    }
  }

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
        uploadedDocuments: { select: { id: true, originalName: true, mimeType: true, size: true, extractedText: true } },
        extractedRequirements: { select: { id: true, content: true, type: true, priority: true } },
        _count: { select: { uploadedDocuments: true, extractedRequirements: true } },
      },
    }),
    prisma.taskPackage.count({ where }),
  ]);

  return apiSuccess(tasks, paginationMeta(total, page, perPage));
});
