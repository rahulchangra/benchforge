import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";

async function getParams(context: unknown): Promise<{ id: string }> {
  const ctx = context as { params: Promise<{ id: string }> | { id: string } };
  const p = ctx.params;
  return p instanceof Promise ? await p : p;
}

/** GET /api/projects/[id]/agent - Get current agent status */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);

    const project = await prisma.olympusProject.findUnique({ where: { id } });
    if (!project) return apiError("Project not found", 404);

    // Get latest run of each type + any currently running
    const [latestRun, runningRuns] = await Promise.all([
      prisma.agentRun.findFirst({
        where: { olympusProjectId: id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.agentRun.findMany({
        where: { olympusProjectId: id, status: "RUNNING" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return apiSuccess({
      olympusProjectId: id,
      projectStatus: project.status,
      latestRun,
      runningRuns,
    });
  }
);

const StartAgentSchema = z.object({
  type: z.enum(["CRAWL", "ANALYZE", "GENERATE", "VALIDATE"]),
});

/** POST /api/projects/[id]/agent - Start an agent run */
export const POST = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);

    const project = await prisma.olympusProject.findUnique({ where: { id } });
    if (!project) return apiError("Project not found", 404);

    const { data, error } = await parseBody(request, StartAgentSchema);
    if (error) return error;

    // Check for already-running agent of same type
    const alreadyRunning = await prisma.agentRun.findFirst({
      where: { olympusProjectId: id, type: data.type, status: "RUNNING" },
    });
    if (alreadyRunning) {
      return apiError(
        `An agent run of type ${data.type} is already running`,
        409
      );
    }

    const run = await prisma.agentRun.create({
      data: {
        olympusProjectId: id,
        type: data.type,
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    return apiSuccess(run);
  }
);
