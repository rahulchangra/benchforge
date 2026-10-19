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

/** GET /api/projects/[id]/submissions - List submissions for a project */
export const GET = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);
    const { page, perPage, search, sort, order } = parseQuery(request);
    const params = new URL(request.url).searchParams;

    const where: Record<string, unknown> = { olympusProjectId: id };

    const status = params.get("status");
    if (status) where.status = status;

    const language = params.get("language");
    if (language) where.language = language;

    const category = params.get("category");
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { taskTitle: { contains: search } },
        { repoUrl: { contains: search } },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.challengeSubmission.findMany({
        ...paginationArgs(page, perPage),
        where,
        orderBy: { [sort ?? "createdAt"]: order },
      }),
      prisma.challengeSubmission.count({ where }),
    ]);

    return apiSuccess(submissions, paginationMeta(total, page, perPage));
  }
);

const CreateSubmissionSchema = z.object({
  repoUrl: z.string().url(),
  commitHash: z.string().min(7).max(40),
  language: z.string().min(1),
  category: z.enum(["FEATURE_REQUEST", "BUGFIX", "REFACTOR"]),
  taskTitle: z.string().min(1).max(500),
  taskPrompt: z.string().min(1),
});

/** POST /api/projects/[id]/submissions - Create a new submission */
export const POST = withErrorHandling(
  async (request: NextRequest, context: unknown) => {
    const { id } = await getParams(context);

    const project = await prisma.olympusProject.findUnique({ where: { id } });
    if (!project) return apiError("Project not found", 404);

    const { data, error } = await parseBody(request, CreateSubmissionSchema);
    if (error) return error;

    const submission = await prisma.challengeSubmission.create({
      data: {
        olympusProjectId: id,
        repoUrl: data.repoUrl,
        commitHash: data.commitHash,
        language: data.language,
        category: data.category,
        taskTitle: data.taskTitle,
        taskPrompt: data.taskPrompt,
        status: "DRAFT",
      },
    });

    return apiSuccess(submission);
  }
);
