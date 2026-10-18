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
  searchRepositories,
  fetchRepository,
  fetchLicense,
  fetchLanguages,
  getLatestCommitSha,
} from "@/lib/github-client";
import { verifyLicense } from "@/lib/license-policy";

const DiscoverSchema = z.object({
  query: z.string().min(1).max(500),
  language: z.string().optional(),
  sort: z.enum(["stars", "forks", "help-wanted-issues", "updated"]).optional(),
  perPage: z.number().int().min(1).max(100).optional(),
  page: z.number().int().min(1).optional(),
  token: z.string().optional(),
});

/** POST /api/repositories/discover - Search GitHub for candidate repositories */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, DiscoverSchema);
  if (error) return error;

  const octokit = createGitHubClient({ token: data.token });

  // Build search query
  let q = data.query;
  if (data.language) q += ` language:${data.language}`;

  const searchResult = await searchRepositories(octokit, q, {
    sort: data.sort ?? "stars",
    perPage: data.perPage ?? 30,
    page: data.page ?? 1,
  });

  const repos = searchResult.data.items.map((item) => ({
    githubId: item.id,
    owner: item.owner?.login ?? "",
    name: item.name,
    fullName: item.full_name,
    description: item.description ?? "",
    url: item.html_url,
    defaultBranch: item.default_branch,
    primaryLanguage: item.language ?? null,
    stars: item.stargazers_count,
    forks: item.forks_count,
    isPrivate: item.private,
    license: item.license?.spdx_id ?? null,
    topics: item.topics ?? [],
  }));

  return apiSuccess({
    totalCount: searchResult.data.total_count,
    repositories: repos,
  });
});

/** GET /api/repositories - List stored repositories with filters */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const { page, perPage, search, sort, order } = parseQuery(request);
  const params = new URL(request.url).searchParams;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { description: { contains: search } },
    ];
  }
  const language = params.get("language");
  if (language) where.primaryLanguage = language;

  const [repos, total] = await Promise.all([
    prisma.repository.findMany({
      ...paginationArgs(page, perPage),
      where,
      orderBy: { [sort ?? "discoveredAt"]: order },
      include: {
        licenseVerifications: { orderBy: { createdAt: "desc" }, take: 1 },
        locMeasurements: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.repository.count({ where }),
  ]);

  return apiSuccess(repos, paginationMeta(total, page, perPage));
});
