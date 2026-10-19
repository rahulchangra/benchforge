import { NextRequest } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import {
  apiSuccess,
  apiError,
  parseBody,
  withErrorHandling,
} from "@/lib/api-helpers";
import { LICENSE_POLICY_VERSION, ALLOWED_LICENSES } from "@/lib/license-policy";

/** GET /api/settings - Return current settings */
export const GET = withErrorHandling(async () => {
  const [latestPolicy, activeJobs] = await Promise.all([
    prisma.licensePolicy.findFirst({
      orderBy: { version: "desc" },
    }),
    prisma.benchmarkJob.count({
      where: { status: { in: ["QUEUED", "RUNNING"] } },
    }),
  ]);

  return apiSuccess({
    licensePolicy: latestPolicy
      ? {
          version: latestPolicy.version,
          allowedIdentifiers: (() => {
            try {
              return typeof latestPolicy.allowedIdentifiers === "string" && latestPolicy.allowedIdentifiers.startsWith("[")
                ? JSON.parse(latestPolicy.allowedIdentifiers)
                : String(latestPolicy.allowedIdentifiers).split(",").map((s) => s.trim()).filter(Boolean);
            } catch {
              return ALLOWED_LICENSES;
            }
          })(),
          ccByIdentifiers: (() => {
            try {
              return typeof latestPolicy.ccByIdentifiers === "string" && latestPolicy.ccByIdentifiers.startsWith("[")
                ? JSON.parse(latestPolicy.ccByIdentifiers)
                : String(latestPolicy.ccByIdentifiers || "").split(",").map((s) => s.trim()).filter(Boolean);
            } catch {
              return [];
            }
          })(),
          effectiveFrom: latestPolicy.effectiveFrom,
          notes: latestPolicy.notes,
        }
      : {
          version: LICENSE_POLICY_VERSION,
          allowedIdentifiers: ALLOWED_LICENSES,
          ccByIdentifiers: [],
          effectiveFrom: null,
          notes: "Using built-in default policy",
        },
    config: {
      licensePolicyVersion: LICENSE_POLICY_VERSION,
      builtInAllowedLicenses: ALLOWED_LICENSES.length,
    },
    system: {
      activeJobs,
    },
  });
});

const CreatePolicySchema = z.object({
  allowedIdentifiers: z.array(z.string()),
  ccByIdentifiers: z.array(z.string()).optional(),
  notes: z.string().optional(),
  createdById: z.string().min(1),
});

/** POST /api/settings - Create new LicensePolicy version */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const { data, error } = await parseBody(request, CreatePolicySchema);
  if (error) return error;

  // Get next version
  const latestPolicy = await prisma.licensePolicy.findFirst({
    orderBy: { version: "desc" },
  });
  const nextVersion = (latestPolicy?.version ?? 0) + 1;

  // Verify user exists
  const user = await prisma.user.findUnique({
    where: { id: data.createdById },
  });
  if (!user) return apiError("User not found", 404);

  const policy = await prisma.licensePolicy.create({
    data: {
      version: nextVersion,
      allowedIdentifiers: JSON.stringify(data.allowedIdentifiers),
      ccByIdentifiers: JSON.stringify(data.ccByIdentifiers ?? []),
      effectiveFrom: new Date(),
      createdById: data.createdById,
      notes: data.notes ?? null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: data.createdById,
      action: "license_policy_created",
      entityType: "LicensePolicy",
      entityId: policy.id,
      details: JSON.stringify({
        version: nextVersion,
        allowedCount: data.allowedIdentifiers.length,
      }),
    },
  });

  return apiSuccess({
    ...policy,
    allowedIdentifiers: JSON.parse(policy.allowedIdentifiers),
    ccByIdentifiers: JSON.parse(policy.ccByIdentifiers),
  });
});
