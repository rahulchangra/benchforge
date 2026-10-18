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
import {
  createGitHubClient,
  fetchIssues,
} from "@/lib/github-client";

/** GET /api/issues - List issues with filters */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, search, sort, order } = parseQuery(request);
  const params = new URL(request.url).searchParams;

  const where: Record<string, unknown> = {};

  const repositoryId = params.get("repositoryId");
  if (repositoryId) where.repositoryId = repositoryId;

  const state = params.get("state");
  if (state) where.state = state;

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { body: { contains: search } },
    ];
  }

  const hasCandidate = params.get("has_candidate");
  if (hasCandidate === "true") {
    where.issueCandidate = { isNot: null };
  } else if (hasCandidate === "false") {
    where.issueCandidate = null;
  }

  const [issues, total] = await Promise.all([
    prisma.issue.findMany({
      ...paginationArgs(page, perPage),
      where,
      orderBy: { [sort ?? "createdAtGh"]: order },
      include: {
        issueCandidate: true,
        repository: { select: { id: true, fullName: true, owner: true, name: true } },
      },
    }),
    prisma.issue.count({ where }),
  ]);

  return apiSuccess(issues, paginationMeta(total, page, perPage));
});

const DiscoverIssuesSchema = z.object({
  repositoryId: z.string().min(1),
  state: z.enum(["open", "closed", "all"]).optional(),
  labels: z.string().optional(),
  since: z.string().optional(),
  maxPages: z.number().int().min(1).max(20).optional(),
  token: z.string().optional(),
});

/** POST /api/issues - Discover issues from GitHub for a repository */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, DiscoverIssuesSchema);
  if (error) return error;

  const repo = await prisma.repository.findUnique({
    where: { id: data.repositoryId },
  });
  if (!repo) return apiError("Repository not found", 404);

  const octokit = createGitHubClient({ token: data.token });
  const ghIssues = await fetchIssues(octokit, repo.owner, repo.name, {
    state: data.state ?? "closed",
    labels: data.labels,
    since: data.since,
    maxPages: data.maxPages ?? 5,
  });

  // Filter out pull requests (GitHub API includes PRs in issues endpoint)
  const realIssues = (ghIssues as Record<string, unknown>[]).filter(
    (i) => !(i as { pull_request?: unknown }).pull_request
  );

  let upserted = 0;
  for (const issue of realIssues) {
    const iss = issue as {
      id: number;
      number: number;
      title: string;
      body?: string | null;
      labels: Array<{ name?: string } | string>;
      state: string;
      html_url: string;
      user?: { login?: string } | null;
      created_at: string;
      updated_at: string;
      closed_at?: string | null;
    };
    await prisma.issue.upsert({
      where: {
        repositoryId_number: {
          repositoryId: data.repositoryId,
          number: iss.number,
        },
      },
      create: {
        repositoryId: data.repositoryId,
        githubId: iss.id,
        number: iss.number,
        title: iss.title,
        body: iss.body ?? null,
        labels: JSON.stringify(
          iss.labels.map((l) => (typeof l === "string" ? l : l.name ?? ""))
        ),
        state: iss.state,
        url: iss.html_url,
        authorLogin: iss.user?.login ?? null,
        createdAtGh: new Date(iss.created_at),
        updatedAtGh: new Date(iss.updated_at),
        closedAtGh: iss.closed_at ? new Date(iss.closed_at) : null,
      },
      update: {
        title: iss.title,
        body: iss.body ?? null,
        labels: JSON.stringify(
          iss.labels.map((l) => (typeof l === "string" ? l : l.name ?? ""))
        ),
        state: iss.state,
        updatedAtGh: new Date(iss.updated_at),
        closedAtGh: iss.closed_at ? new Date(iss.closed_at) : null,
      },
    });
    upserted++;
  }

  await prisma.auditLog.create({
    data: {
      action: "issues_discovered",
      entityType: "Repository",
      entityId: data.repositoryId,
      details: JSON.stringify({ upserted, totalFetched: ghIssues.length }),
    },
  });

  return apiSuccess({ upserted, totalFetched: ghIssues.length });
});
