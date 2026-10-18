import { describe, it, expect } from 'vitest';
import { evaluateEligibility, quickEligibilityCheck } from '../eligibility-engine';
import type { LicenseVerificationResult } from '../license-policy';
import type { LocResult } from '../loc-counter';

function makeLicenseResult(overrides: Partial<LicenseVerificationResult> = {}): LicenseVerificationResult {
  return {
    identifier: 'MIT',
    normalizedIdentifier: 'MIT',
    isAllowed: true,
    isCcBy: false,
    source: 'api',
    evidence: {},
    policyVersion: 1,
    warnings: [],
    ...overrides,
  };
}

function makeLocResult(overrides: Partial<LocResult> = {}): LocResult {
  return {
    totalPhysicalLoc: 500,
    nonblankLoc: 400,
    codeLoc: 350,
    languageBreakdown: { TypeScript: { files: 10, physical: 500, nonblank: 400, code: 350 } },
    exclusions: [],
    filesCounted: 10,
    filesExcluded: 2,
    methodology: 'physical-loc-excluding-blanks-and-comments',
    toolVersion: '1.0.0',
    isEligible: true,
    eligibilityThreshold: 200,
    ...overrides,
  };
}

describe('evaluateEligibility', () => {
  it('returns eligible when both gates pass', () => {
    const result = evaluateEligibility('owner/repo', 'abc1234', makeLicenseResult(), makeLocResult());
    expect(result.status).toBe('eligible');
    expect(result.licensePass).toBe(true);
    expect(result.locPass).toBe(true);
    expect(result.rejectionReasons).toHaveLength(0);
  });

  it('returns ineligible when license is rejected', () => {
    const license = makeLicenseResult({ isAllowed: false, normalizedIdentifier: null, identifier: 'GPL-3.0' });
    const result = evaluateEligibility('owner/repo', 'abc1234', license, makeLocResult());
    expect(result.status).toBe('ineligible');
    expect(result.licensePass).toBe(false);
    // LOC should be skipped when license fails
    expect(result.locPass).toBe(false);
    expect(result.rejectionReasons.length).toBeGreaterThan(0);
  });

  it('returns ineligible when LOC is too low', () => {
    const loc = makeLocResult({ codeLoc: 100, isEligible: false });
    const result = evaluateEligibility('owner/repo', 'abc1234', makeLicenseResult(), loc);
    expect(result.status).toBe('ineligible');
    expect(result.licensePass).toBe(true);
    expect(result.locPass).toBe(false);
    expect(result.rejectionReasons.some(r => r.includes('LOC'))).toBe(true);
  });

  it('returns ineligible when both fail', () => {
    const license = makeLicenseResult({ isAllowed: false });
    const loc = makeLocResult({ codeLoc: 50, isEligible: false });
    const result = evaluateEligibility('owner/repo', 'abc1234', license, loc);
    expect(result.status).toBe('ineligible');
    expect(result.licensePass).toBe(false);
    expect(result.locPass).toBe(false);
  });

  it('handles null license result', () => {
    const result = evaluateEligibility('owner/repo', 'abc1234', null, makeLocResult());
    expect(result.status).toBe('ineligible');
    expect(result.rejectionReasons.some(r => r.includes('unavailable'))).toBe(true);
  });

  it('handles null loc result when license passes', () => {
    const result = evaluateEligibility('owner/repo', 'abc1234', makeLicenseResult(), null);
    expect(result.status).toBe('ineligible');
    expect(result.rejectionReasons.some(r => r.includes('LOC'))).toBe(true);
  });

  it('adds CC-BY warning', () => {
    const license = makeLicenseResult({ isCcBy: true, normalizedIdentifier: 'CC-BY-4.0' });
    const result = evaluateEligibility('owner/repo', 'abc1234', license, makeLocResult());
    expect(result.status).toBe('eligible');
    expect(result.warnings.some(w => w.includes('CC-BY'))).toBe(true);
  });

  it('populates audit trail', () => {
    const result = evaluateEligibility('owner/repo', 'abc1234', makeLicenseResult(), makeLocResult());
    expect(result.auditTrail.length).toBeGreaterThanOrEqual(3);
    expect(result.auditTrail.some(e => e.step === 'license_verification')).toBe(true);
    expect(result.auditTrail.some(e => e.step === 'loc_measurement')).toBe(true);
    expect(result.auditTrail.some(e => e.step === 'final_decision')).toBe(true);
  });

  it('includes repositoryFullName and commitSha', () => {
    const result = evaluateEligibility('owner/repo', 'abc1234567', makeLicenseResult(), makeLocResult());
    expect(result.repositoryFullName).toBe('owner/repo');
    expect(result.commitSha).toBe('abc1234567');
  });
});

describe('quickEligibilityCheck', () => {
  it('returns eligible for allowed license + sufficient LOC', () => {
    const result = quickEligibilityCheck('owner/repo', 'abc1234', 'MIT', 'api', 500);
    expect(result.status).toBe('eligible');
    expect(result.licensePass).toBe(true);
    expect(result.locPass).toBe(true);
  });

  it('returns ineligible for unknown license', () => {
    const result = quickEligibilityCheck('owner/repo', 'abc1234', 'AGPL-3.0', 'api', 500);
    expect(result.status).toBe('ineligible');
    expect(result.licensePass).toBe(false);
  });

  it('returns ineligible for LOC at threshold (needs strictly >)', () => {
    const result = quickEligibilityCheck('owner/repo', 'abc1234', 'MIT', 'api', 200);
    expect(result.status).toBe('ineligible');
    expect(result.locPass).toBe(false);
  });

  it('returns eligible for LOC just above threshold', () => {
    const result = quickEligibilityCheck('owner/repo', 'abc1234', 'MIT', 'api', 201);
    expect(result.status).toBe('eligible');
  });

  it('handles null codeLoc', () => {
    const result = quickEligibilityCheck('owner/repo', 'abc1234', 'MIT', 'api', null);
    expect(result.status).toBe('ineligible');
  });

  it('handles null spdxId', () => {
    const result = quickEligibilityCheck('owner/repo', 'abc1234', null, 'api', 500);
    expect(result.status).toBe('ineligible');
  });
});
