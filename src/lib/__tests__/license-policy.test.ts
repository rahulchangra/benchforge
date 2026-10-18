import { describe, it, expect } from 'vitest';
import {
  normalizeLicense,
  isAllowedLicense,
  isCcByLicense,
  verifyLicense,
  ALLOWED_LICENSES,
  LICENSE_POLICY_VERSION,
  CC_BY_IDENTIFIERS,
  LICENSE_NORMALIZATION_MAP,
} from '../license-policy';

describe('CURRENT_POLICY structure', () => {
  it('has a numeric policy version', () => {
    expect(typeof LICENSE_POLICY_VERSION).toBe('number');
    expect(LICENSE_POLICY_VERSION).toBeGreaterThan(0);
  });

  it('has a non-empty allowed licenses list', () => {
    expect(ALLOWED_LICENSES.length).toBeGreaterThan(0);
  });

  it('contains MIT and Apache-2.0', () => {
    expect(ALLOWED_LICENSES).toContain('MIT');
    expect(ALLOWED_LICENSES).toContain('Apache-2.0');
  });

  it('has CC-BY identifiers as a subset of allowed', () => {
    for (const id of CC_BY_IDENTIFIERS) {
      expect(ALLOWED_LICENSES).toContain(id);
    }
  });
});

describe('normalizeLicense', () => {
  it('returns canonical form for exact SPDX identifiers', () => {
    expect(normalizeLicense('MIT')).toBe('MIT');
    expect(normalizeLicense('Apache-2.0')).toBe('Apache-2.0');
    expect(normalizeLicense('BSD-3-Clause')).toBe('BSD-3-Clause');
  });

  it('is case-insensitive', () => {
    expect(normalizeLicense('mit')).toBe('MIT');
    expect(normalizeLicense('apache-2.0')).toBe('Apache-2.0');
  });

  it('normalizes common human-readable names', () => {
    expect(normalizeLicense('MIT License')).toBe('MIT');
    expect(normalizeLicense('Apache License 2.0')).toBe('Apache-2.0');
    expect(normalizeLicense('BSD License')).toBe('BSD-3-Clause');
  });

  it('returns null for unknown licenses', () => {
    expect(normalizeLicense('AGPL-3.0')).toBeNull();
    expect(normalizeLicense('some-random-license')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeLicense('')).toBeNull();
    expect(normalizeLicense('  ')).toBeNull();
  });

  it('returns null for NOASSERTION / NONE', () => {
    expect(normalizeLicense('NOASSERTION')).toBeNull();
    expect(normalizeLicense('NONE')).toBeNull();
  });
});

describe('isAllowedLicense', () => {
  it('returns true for allowed licenses', () => {
    expect(isAllowedLicense('MIT')).toBe(true);
    expect(isAllowedLicense('Apache-2.0')).toBe(true);
  });

  it('is case-insensitive', () => {
    expect(isAllowedLicense('mit')).toBe(true);
  });

  it('returns false for disallowed licenses', () => {
    expect(isAllowedLicense('GPL-3.0')).toBe(false);
  });
});

describe('isCcByLicense', () => {
  it('returns true for CC-BY licenses', () => {
    expect(isCcByLicense('CC-BY-4.0')).toBe(true);
  });

  it('returns false for non-CC-BY licenses', () => {
    expect(isCcByLicense('MIT')).toBe(false);
  });
});

describe('verifyLicense', () => {
  it('returns ALLOWED for known allowed license', () => {
    const result = verifyLicense('MIT', 'api');
    expect(result.isAllowed).toBe(true);
    expect(result.normalizedIdentifier).toBe('MIT');
    expect(result.isCcBy).toBe(false);
    expect(result.policyVersion).toBe(LICENSE_POLICY_VERSION);
    expect(result.source).toBe('api');
  });

  it('returns not-allowed for unknown license', () => {
    const result = verifyLicense('AGPL-3.0', 'file');
    expect(result.isAllowed).toBe(false);
    expect(result.normalizedIdentifier).toBeNull();
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it('flags CC-BY license with warning', () => {
    const result = verifyLicense('CC-BY-4.0', 'manual');
    expect(result.isAllowed).toBe(true);
    expect(result.isCcBy).toBe(true);
    expect(result.warnings.some(w => w.includes('Creative Commons'))).toBe(true);
  });

  it('handles null/undefined spdxId', () => {
    const result = verifyLicense(null, 'api');
    expect(result.isAllowed).toBe(false);
    expect(result.identifier).toBeNull();
    expect(result.warnings.some(w => w.includes('No license identifier'))).toBe(true);
  });

  it('preserves evidence', () => {
    const evidence = { source: 'github-api', url: 'https://example.com' };
    const result = verifyLicense('MIT', 'api', evidence);
    expect(result.evidence).toEqual(evidence);
  });
});
