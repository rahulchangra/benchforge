import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";

/** Helper to extract route params (Next.js 15+: params is a Promise) */
async function getParams(context: unknown): Promise<{ id: string }> {
  const ctx = context as { params: Promise<{ id: string }> | { id: string } };
  const p = ctx.params;
  return p instanceof Promise ? await p : p;
}

/** GET /api/projects/[id] - Single project with aggregated counts */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);

    const project = await prisma.olympusProject.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            challengeSubmissions: true,
            approvedTaskExamples: true,
            agentRuns: true,
          },
        },
      },
    });

    if (!project) return apiError("Project not found", 404);
    return apiSuccess(project);
  }
);

const UpdateProjectSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  status: z.enum(["SETUP", "ACTIVE", "PAUSED", "COMPLETED"]).optional(),
  requirementsDoc: z.string().optional(),
  targetLanguages: z.array(z.string()).optional(),
  targetCategories: z.array(z.string()).optional(),
});

/** PATCH /api/projects/[id] - Update project */
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);

    const { data, error } = await parseBody(request, UpdateProjectSchema);
    if (error) return error;

    const existing = await prisma.olympusProject.findUnique({ where: { id } });
    if (!existing) return apiError("Project not found", 404);

    const project = await prisma.olympusProject.update({
      where: { id },
      data,
    });

    return apiSuccess(project);
  }
);

/** DELETE /api/projects/[id] - Delete project (only SETUP or PAUSED) */
export const DELETE = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);

    const existing = await prisma.olympusProject.findUnique({ where: { id } });
    if (!existing) return apiError("Project not found", 404);

    if (!["SETUP", "PAUSED"].includes(existing.status)) {
      return apiError(
        "Can only delete projects in SETUP or PAUSED status",
        409
      );
    }

    await prisma.olympusProject.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  }
);
