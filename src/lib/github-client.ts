import { Octokit } from "octokit";
import { sleep } from "./utils";

/**
 * Rate-limit-aware GitHub API client.
 * Wraps Octokit with retry, backoff, and pagination support.
 */

const GITHUB_API_BASE = "https://api.github.com";
const MAX_RETRIES = 3;
const RETRY_BASE_DELAY_MS = 1000;

export interface GitHubClientOptions {
  token?: string;
  baseUrl?: string;
}

export function createGitHubClient(options?: GitHubClientOptions): Octokit {
  return new Octokit({
    auth: options?.token,
    baseUrl: options?.baseUrl ?? GITHUB_API_BASE,
  });
}

/** Handle rate limiting with automatic retry and backoff */
export async function withRateLimit<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;
      const retryAfter = (error as { response?: { headers?: Record<string, string> } })
        ?.response?.headers?.["retry-after"];

      if (status === 403 || status === 429) {
        if (attempt === retries) throw error;
        const waitMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(
          `GitHub rate limit hit. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${retries})`
        );
        await sleep(waitMs);
        continue;
      }

      if (status && status >= 500 && attempt < retries) {
        await sleep(RETRY_BASE_DELAY_MS * Math.pow(2, attempt));
        continue;
      }

      throw error;
    }
  }
  throw new Error("Unreachable");
}

/** Fetch all pages from a paginated GitHub API endpoint */
export async function fetchAllPages<T>(
  octokit: Octokit,
  endpoint: string,
  params: Record<string, unknown> = {},
  maxPages = 10
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;

  while (page <= maxPages) {
    const response = await withRateLimit(() =>
      octokit.request(endpoint, { ...params, per_page: 100, page })
    );

    const data = response.data as T[] | { items?: T[] };
    const items = Array.isArray(data) ? data : (data.items ?? []);
    results.push(...items);

    const linkHeader = (response.headers as Record<string, string>)?.link ?? "";
    if (!linkHeader.includes('rel="next"') || items.length === 0) break;
    page++;
  }

  return results;
}

/** Fetch repository metadata */
export async function fetchRepository(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  return withRateLimit(() =>
    octokit.rest.repos.get({ owner, repo })
  );
}

/** Fetch repository license from API */
export async function fetchLicense(
  octokit: Octokit,
  owner: string,
  repo: string
) {
  try {
    const response = await withRateLimit(() =>
      octokit.rest.licenses.getForRepo({ owner, repo })
    );
    return response.data;
  } catch (error: unknown) {
    if ((error as { status?: number })?.status === 404) return null;
    throw error;
  }
}

/** Fetch repository languages */
export async function fetchLanguages(
  octokit: Octokit,
  owner: string,
  repo: string
): Promise<Record<string, number>> {
  const response = await withRateLimit(() =>
    octokit.rest.repos.listLanguages({ owner, repo })
  );
  return response.data;
}

/** Fetch issues with filters */
export async function fetchIssues(
  octokit: Octokit,
  owner: string,
  repo: string,
  options: {
    state?: "open" | "closed" | "all";
    labels?: string;
    sort?: "created" | "updated" | "comments";
    direction?: "asc" | "desc";
    since?: string;
    maxPages?: number;
  } = {}
) {
  return fetchAllPages(
    octokit,
    "GET /repos/{owner}/{repo}/issues",
    {
      owner,
      repo,
      state: options.state ?? "open", // 🔥 DEFAULT TO OPEN ISSUES ONLY
      labels: options.labels,
      sort: options.sort ?? "updated",
      direction: options.direction ?? "desc",
      since: options.since,
    },
    options.maxPages ?? 5
  );
}

/** Fetch pull requests */
export async function fetchPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  options: { state?: "open" | "closed" | "all"; maxPages?: number } = {}
) {
  return fetchAllPages(
    octokit,
    "GET /repos/{owner}/{repo}/pulls",
    {
      owner,
      repo,
      state: options.state ?? "closed",
      sort: "updated",
      direction: "desc",
    },
    options.maxPages ?? 5
  );
}

/** Fetch a specific commit */
export async function fetchCommit(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string
) {
  return withRateLimit(() =>
    octokit.rest.repos.getCommit({ owner, repo, ref })
  );
}

/** Search repositories with query */
export async function searchRepositories(
  octokit: Octokit,
  query: string,
  options: {
    sort?: "stars" | "forks" | "help-wanted-issues" | "updated";
    order?: "asc" | "desc";
    perPage?: number;
    page?: number;
  } = {}
) {
  return withRateLimit(() =>
    octokit.rest.search.repos({
      q: query,
      sort: options.sort ?? "stars",
      order: options.order ?? "desc",
      per_page: options.perPage ?? 30,
      page: options.page ?? 1,
    })
  );
}

/** Download repository tarball/zipball for a specific ref */
export async function getDownloadUrl(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  format: "tarball" | "zipball" = "tarball"
): Promise<string> {
  const response = await withRateLimit(() =>
    octokit.rest.repos.downloadTarballArchive({
      owner,
      repo,
      ref,
      request: { redirect: "manual" },
    })
  );
  return (response as unknown as { url: string }).url;
}

/** Get the latest commit SHA for a branch */
export async function getLatestCommitSha(
  octokit: Octokit,
  owner: string,
  repo: string,
  branch?: string
): Promise<string> {
  const response = await withRateLimit(() =>
    octokit.rest.repos.getBranch({
      owner,
      repo,
      branch: branch ?? "main",
    })
  );
  return response.data.commit.sha;
}
