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

async function getParams(context: unknown): Promise<{ id: string }> {
  const ctx = context as { params: Promise<{ id: string }> | { id: string } };
  const p = ctx.params;
  return p instanceof Promise ? await p : p;
}

/** GET /api/projects/[id]/examples - List approved task examples */
export const GET = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);
    const { page, perPage, search, sort, order } = parseQuery(request);
    const params = new URL(request.url).searchParams;

    const where: Record<string, unknown> = { olympusProjectId: id };

    const language = params.get("language");
    if (language) where.language = language;

    const category = params.get("category");
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { taskPrompt: { contains: search } },
        { repoUrl: { contains: search } },
      ];
    }

    const [examples, total] = await Promise.all([
      prisma.approvedTaskExample.findMany({
        ...paginationArgs(page, perPage),
        where,
        orderBy: { [sort ?? "createdAt"]: order },
      }),
      prisma.approvedTaskExample.count({ where }),
    ]);

    return apiSuccess(examples, paginationMeta(total, page, perPage));
  }
);

const CreateExampleSchema = z.object({
  repoUrl: z.string().url(),
  commitHash: z.string().min(7).max(40),
  language: z.string().min(1),
  category: z.string().min(1),
  taskPrompt: z.string().min(1),
  testPatch: z.string().min(1),
  solutionPatch: z.string().min(1),
  dockerfile: z.string().optional(),
  testSh: z.string().optional(),
});

/** POST /api/projects/[id]/examples - Upload an approved task example */
export const POST = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);

    const project = await prisma.olympusProject.findUnique({ where: { id } });
    if (!project) return apiError("Project not found", 404);

    const { data, error } = await parseBody(request, CreateExampleSchema);
    if (error) return error;

    const example = await prisma.approvedTaskExample.create({
      data: {
        olympusProjectId: id,
        repoUrl: data.repoUrl,
        commitHash: data.commitHash,
        language: data.language,
        category: data.category,
        taskPrompt: data.taskPrompt,
        testPatch: data.testPatch,
        solutionPatch: data.solutionPatch,
        dockerfile: data.dockerfile ?? "",
        testSh: data.testSh ?? "",
      },
    });

    return apiSuccess(example);
  }
);
