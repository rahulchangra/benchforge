/**
 * Repository Eligibility Engine
 * 
 * Orchestrates license verification and LOC measurement to produce
 * an auditable, deterministic eligibility decision.
 * 
 * A repository is eligible only when:
 * 1. Its verified license matches the allowlist
 * 2. Its canonical source code LOC is strictly > 200
 * 
 * No score, AI recommendation, or user preference may override these gates.
 */

import { verifyLicense, type LicenseVerificationResult } from "./license-policy";
import { isEligible as locIsEligible, LOC_ELIGIBILITY_THRESHOLD, type LocResult } from "./loc-counter";

export type EligibilityStatus = "pending" | "eligible" | "ineligible" | "error";

export interface EligibilityDecision {
  repositoryFullName: string;
  commitSha: string;
  status: EligibilityStatus;
  licenseVerification: LicenseVerificationResult | null;
  locMeasurement: LocResult | null;
  licensePass: boolean;
  locPass: boolean;
  rejectionReasons: string[];
  warnings: string[];
  decidedAt: string;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  step: string;
  result: "pass" | "fail" | "warn" | "error" | "skip";
  detail: string;
  timestamp: string;
}

/**
 * Evaluate repository eligibility.
 * Performs checks in the mandated order: license first, then LOC.
 * Stops at the first hard failure to avoid expensive analysis on ineligible repos.
 */
export function evaluateEligibility(
  repositoryFullName: string,
  commitSha: string,
  licenseResult: LicenseVerificationResult | null,
  locResult: LocResult | null
): EligibilityDecision {
  const audit: AuditEntry[] = [];
  const rejectionReasons: string[] = [];
  const warnings: string[] = [];
  let licensePass = false;
  let locPass = false;

  const ts = () => new Date().toISOString();

  // Step 1: License verification
  if (!licenseResult) {
    audit.push({
      step: "license_verification",
      result: "error",
      detail: "License verification not performed or unavailable",
      timestamp: ts(),
    });
    rejectionReasons.push("License verification unavailable");
  } else if (!licenseResult.isAllowed) {
    audit.push({
      step: "license_verification",
      result: "fail",
      detail: `License '${licenseResult.identifier ?? "unknown"}' (normalized: '${licenseResult.normalizedIdentifier ?? "none"}') is not in the allowlist. Policy version: ${licenseResult.policyVersion}`,
      timestamp: ts(),
    });
    rejectionReasons.push(
      `License not allowed: ${licenseResult.identifier ?? "unknown"}`
    );
  } else {
    licensePass = true;
    audit.push({
      step: "license_verification",
      result: "pass",
      detail: `License '${licenseResult.normalizedIdentifier}' is allowed. Source: ${licenseResult.source}. Policy version: ${licenseResult.policyVersion}`,
      timestamp: ts(),
    });

    if (licenseResult.isCcBy) {
      warnings.push(
        `CC-BY license (${licenseResult.normalizedIdentifier}) may not be suitable for software code redistribution`
      );
      audit.push({
        step: "license_cc_by_check",
        result: "warn",
        detail: `CC-BY license flagged for software-license suitability review`,
        timestamp: ts(),
      });
    }

    if (licenseResult.warnings.length > 0) {
      warnings.push(...licenseResult.warnings);
    }
  }

  // Step 2: LOC measurement (only if license passed)
  if (!licensePass) {
    audit.push({
      step: "loc_measurement",
      result: "skip",
      detail: "Skipped: license check did not pass",
      timestamp: ts(),
    });
  } else if (!locResult) {
    audit.push({
      step: "loc_measurement",
      result: "error",
      detail: "LOC measurement not performed or unavailable",
      timestamp: ts(),
    });
    rejectionReasons.push("LOC measurement unavailable");
  } else if (!locResult.isEligible) {
    audit.push({
      step: "loc_measurement",
      result: "fail",
      detail: `Code LOC = ${locResult.codeLoc}, threshold is > ${LOC_ELIGIBILITY_THRESHOLD}. Methodology: ${locResult.methodology}. Tool: v${locResult.toolVersion}`,
      timestamp: ts(),
    });
    rejectionReasons.push(
      `Source code LOC (${locResult.codeLoc}) does not exceed ${LOC_ELIGIBILITY_THRESHOLD}`
    );
  } else {
    locPass = true;
    audit.push({
      step: "loc_measurement",
      result: "pass",
      detail: `Code LOC = ${locResult.codeLoc} (> ${LOC_ELIGIBILITY_THRESHOLD}). ${locResult.filesCounted} files counted across ${Object.keys(locResult.languageBreakdown).length} languages. Methodology: ${locResult.methodology}`,
      timestamp: ts(),
    });
  }

  // Final decision
  const status: EligibilityStatus =
    rejectionReasons.length > 0 || !licensePass || !locPass
      ? "ineligible"
      : "eligible";

  audit.push({
    step: "final_decision",
    result: status === "eligible" ? "pass" : "fail",
    detail: `Repository ${repositoryFullName}@${commitSha.slice(0, 7)}: ${status}. License: ${licensePass ? "pass" : "fail"}, LOC: ${locPass ? "pass" : locResult ? "fail" : "not checked"}`,
    timestamp: ts(),
  });

  return {
    repositoryFullName,
    commitSha,
    status,
    licenseVerification: licenseResult,
    locMeasurement: locResult,
    licensePass,
    locPass,
    rejectionReasons,
    warnings,
    decidedAt: ts(),
    auditTrail: audit,
  };
}

/**
 * Quick eligibility check from raw inputs.
 * Convenience wrapper for the full pipeline.
 */
export function quickEligibilityCheck(
  repositoryFullName: string,
  commitSha: string,
  spdxId: string | null | undefined,
  licenseSource: "api" | "file" | "manual",
  codeLoc: number | null
): EligibilityDecision {
  const licenseResult = verifyLicense(spdxId, licenseSource);

  let locResult: LocResult | null = null;
  if (codeLoc !== null) {
    locResult = {
      totalPhysicalLoc: codeLoc,
      nonblankLoc: codeLoc,
      codeLoc,
      languageBreakdown: {},
      exclusions: [],
      filesCounted: 0,
      filesExcluded: 0,
      methodology: "external",
      toolVersion: "external",
      isEligible: locIsEligible(codeLoc),
      eligibilityThreshold: LOC_ELIGIBILITY_THRESHOLD,
    };
  }

  return evaluateEligibility(repositoryFullName, commitSha, licenseResult, locResult);
}
