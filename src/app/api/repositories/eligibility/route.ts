import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";
import {
  createGitHubClient,
  fetchRepository,
  fetchLicense,
  getLatestCommitSha,
} from "@/lib/github-client";
import { verifyLicense, LICENSE_POLICY_VERSION } from "@/lib/license-policy";
import { countRepositoryLoc, LOC_TOOL_VERSION, LOC_METHODOLOGY } from "@/lib/loc-counter";
import { evaluateEligibility } from "@/lib/eligibility-engine";

const EligibilityCheckSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1),
  token: z.string().optional(),
  commitSha: z.string().optional(),
  localPath: z.string().optional(), // For LOC counting on cloned repos
});

/** POST /api/repositories/eligibility - Full eligibility check pipeline */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, EligibilityCheckSchema);
  if (error) return error;

  const octokit = createGitHubClient({ token: data.token });
  const fullName = `${data.owner}/${data.repo}`;

  // Step 1: Fetch repository metadata
  let repoData;
  try {
    const response = await fetchRepository(octokit, data.owner, data.repo);
    repoData = response.data;
  } catch (err) {
    return apiError(`Repository not found: ${fullName}`, 404);
  }

  // Step 2: Pin commit SHA
  let commitSha = data.commitSha;
  if (!commitSha) {
    try {
      commitSha = await getLatestCommitSha(
        octokit,
        data.owner,
        data.repo,
        repoData.default_branch
      );
    } catch {
      return apiError("Could not resolve commit SHA for default branch", 500);
    }
  }

  // Step 3: Upsert repository record
  const repo = await prisma.repository.upsert({
    where: { githubId: repoData.id },
    update: {
      description: repoData.description ?? "",
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      primaryLanguage: repoData.language ?? null,
      updatedAt: new Date(),
    },
    create: {
      githubId: repoData.id,
      owner: data.owner,
      name: data.repo,
      fullName,
      description: repoData.description ?? "",
      url: repoData.html_url,
      defaultBranch: repoData.default_branch,
      primaryLanguage: repoData.language ?? null,
      languages: JSON.stringify({}),
      topics: JSON.stringify(repoData.topics ?? []),
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      isPrivate: repoData.private,
      discoveredAt: new Date(),
    },
  });

  // Step 4: Create snapshot
  const snapshot = await prisma.repositorySnapshot.upsert({
    where: {
      repositoryId_commitSha: {
        repositoryId: repo.id,
        commitSha,
      },
    },
    update: {},
    create: {
      repositoryId: repo.id,
      commitSha,
      snapshotAt: new Date(),
      pinned: true,
    },
  });

  // Step 5: License verification
  let licenseData;
  try {
    licenseData = await fetchLicense(octokit, data.owner, data.repo);
  } catch {
    // License fetch failed, continue with null
  }

  const spdxId = licenseData?.license?.spdx_id ?? repoData.license?.spdx_id ?? null;
  const licenseResult = verifyLicense(spdxId, "api", {
    githubSpdxId: spdxId,
    licenseName: licenseData?.license?.name,
    licenseUrl: licenseData?.html_url,
    repoLicenseKey: repoData.license?.key,
  });

  // Store license verification
  const licenseStatusMap = {
    true: "ALLOWED" as const,
    false: licenseResult.normalizedIdentifier ? "REJECTED" as const : "UNKNOWN" as const,
  };
  await prisma.licenseVerification.create({
    data: {
      repositoryId: repo.id,
      snapshotId: snapshot.id,
      detectedIdentifier: licenseResult.identifier,
      normalizedIdentifier: licenseResult.normalizedIdentifier,
      status: licenseResult.isAllowed ? "ALLOWED" : (licenseResult.normalizedIdentifier ? "REJECTED" : "UNKNOWN"),
      source: licenseResult.source,
      evidence: JSON.stringify(licenseResult.evidence as Record<string, unknown>),
      policyVersion: licenseResult.policyVersion,
      verifiedAt: new Date(),
    },
  });

  // Step 6: LOC measurement (only if license passed)
  let locResult = null;
  if (licenseResult.isAllowed && data.localPath) {
    try {
      locResult = await countRepositoryLoc(data.localPath);
      await prisma.locMeasurement.create({
        data: {
          repositoryId: repo.id,
          snapshotId: snapshot.id,
          status: "MEASURED",
          totalLoc: locResult.totalPhysicalLoc,
          nonblankLoc: locResult.nonblankLoc,
          codeLoc: locResult.codeLoc,
          languageBreakdown: JSON.stringify(locResult.languageBreakdown as Record<string, unknown>),
          exclusions: JSON.stringify(locResult.exclusions),
          methodology: locResult.methodology,
          toolVersion: locResult.toolVersion,
          measuredAt: new Date(),
        },
      });
    } catch (err) {
      await prisma.locMeasurement.create({
        data: {
          repositoryId: repo.id,
          snapshotId: snapshot.id,
          status: "FAILED",
          exclusions: JSON.stringify([]),
          methodology: LOC_METHODOLOGY,
          toolVersion: LOC_TOOL_VERSION,
          error: err instanceof Error ? err.message : "Unknown error",
        },
      });
    }
  } else if (licenseResult.isAllowed && !data.localPath) {
    // LOC cannot be measured without a local clone
    locResult = null;
  }

  // Step 7: Evaluate eligibility
  const decision = evaluateEligibility(
    fullName,
    commitSha,
    licenseResult,
    locResult
  );

  // Store audit log
  await prisma.auditLog.create({
    data: {
      action: "eligibility_check",
      entityType: "repository",
      entityId: repo.id,
      details: JSON.stringify({
        decision: decision.status,
        licensePass: decision.licensePass,
        locPass: decision.locPass,
        rejectionReasons: decision.rejectionReasons,
        warnings: decision.warnings,
      }),
    },
  });

  return apiSuccess({
    repository: {
      id: repo.id,
      fullName,
      commitSha,
      stars: repoData.stargazers_count,
      language: repoData.language,
    },
    eligibility: decision,
  });
});
