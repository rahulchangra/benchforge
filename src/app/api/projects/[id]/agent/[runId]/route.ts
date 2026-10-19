import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";

async function getParams(
  context: unknown
): Promise<{ id: string; runId: string }> {
  const ctx = context as {
    params:
      | Promise<{ id: string; runId: string }>
      | { id: string; runId: string };
  };
  const p = ctx.params;
  return p instanceof Promise ? await p : p;
}

/** GET /api/projects/[id]/agent/[runId] - Agent run details with logs */
export const GET = withErrorHandling(
  async (_request: NextRequest, context: unknown) => {
    const { id, runId } = await getParams(context);

    const run = await prisma.agentRun.findFirst({
      where: { id: runId, olympusProjectId: id },
    });

    if (!run) return apiError("Agent run not found", 404);
    return apiSuccess(run);
  }
);

const CancelRunSchema = z.object({
  status: z.literal("CANCELLED"),
});

/** PATCH /api/projects/[id]/agent/[runId] - Cancel an agent run */
export const PATCH = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id, runId } = await getParams(context);

    const run = await prisma.agentRun.findFirst({
      where: { id: runId, olympusProjectId: id },
    });
    if (!run) return apiError("Agent run not found", 404);

    if (run.status !== "RUNNING") {
      return apiError("Can only cancel a running agent", 409);
    }

    const { data, error } = await parseBody(request, CancelRunSchema);
    if (error) return error;

    const updated = await prisma.agentRun.update({
      where: { id: runId },
      data: {
        status: data.status,
        completedAt: new Date(),
      },
    });

    return apiSuccess(updated);
  }
);
