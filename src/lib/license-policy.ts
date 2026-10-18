/**
 * Centralized, versioned license allowlist for GitHub Bench SaaS.
 *
 * Every dependency used by the platform must carry a license present in
 * {@link ALLOWED_LICENSES}.  The policy version is bumped whenever the
 * allowlist or normalization map changes so downstream caches can
 * invalidate.
 *
 * @module license-policy
 */

// ---------------------------------------------------------------------------
// 1. Policy version
// ---------------------------------------------------------------------------

/** Bump when ALLOWED_LICENSES or LICENSE_NORMALIZATION_MAP change. */
export const LICENSE_POLICY_VERSION = 1 as const;

// ---------------------------------------------------------------------------
// 2. Allowed licenses (SPDX identifiers, alphabetical within families)
// ---------------------------------------------------------------------------

/**
 * Canonical SPDX identifiers that the project considers acceptable.
 * Every entry appears exactly once.
 */
export const ALLOWED_LICENSES: readonly string[] = [
  // Apache family
  'Apache-2.0',
  'Apache-2.0-Modified',
  'Apache-with-LLVM-Exception',
  'Apache-with-Runtime-Exception',

  // BLAS
  'BLAS',

  // BSD family
  'BSD-1-Clause',
  'BSD-2-Clause',
  'BSD-2-Clause-Flex',
  'BSD-2-Clause-FreeBSD',
  'BSD-2-Clause-Modification',
  'BSD-2-Clause-Patent',
  'BSD-2-Clause-Views',
  'BSD-3-Clause',
  'BSD-3-Clause-Attribution',
  'BSD-3-Clause-EricHeitz',
  'BSD-3-Clause-HealthLevelSeven',
  'BSD-3-Clause-LBNL',
  'BSD-3-Clause-Modification',
  'BSD-3-Clause-OpenMPI',
  'BSD-3-Clause-plus-CMU-Attribution',
  'BSD-3-Clause-plus-Paul-Mackerras-Attribution',
  'BSD-3-Clause-plus-Tommi-Komulainen-Attribution',
  'BSD-4-Clause',
  'BSD-4-Clause-Argonne',
  'BSD-4-Clause-Atmel',
  'BSD-4-Clause-Giffin',
  'BSD-4-Clause-PC-SC-Lite',
  'BSD-4-Clause-Plus-Modification-Notice',
  'BSD-4-Clause-UC',
  'BSD-4-Clause-Visigoth',
  'BSD-4-Clause-Vocal',
  'BSD-4-Clause-Wasabi',
  'BSD-4.3TAHOE',
  'BSD-5-Clause',
  'BSD-FatFs',
  'BSD-Mixed-2-Clause-And-3-Clause',
  'BSD-Protection',
  'BSD-Source-Code',

  // Boost
  'BSL-1.0',

  // Creative Commons Attribution family
  'CC-BY-1.0',
  'CC-BY-2.0',
  'CC-BY-2.5',
  'CC-BY-3.0',
  'CC-BY-4.0',

  // GNU permissive
  'GNU-All-permissive-Copying-License',

  // MIT
  'MIT',
] as const;

// ---------------------------------------------------------------------------
// 3. CC-BY identifiers (for software-license suitability flagging)
// ---------------------------------------------------------------------------

/**
 * Subset of {@link ALLOWED_LICENSES} that are Creative Commons Attribution
 * licenses.  These are allowed but may warrant a warning when applied to
 * software (CC-BY is designed for creative works, not code).
 */
export const CC_BY_IDENTIFIERS: readonly string[] = [
  'CC-BY-1.0',
  'CC-BY-2.0',
  'CC-BY-2.5',
  'CC-BY-3.0',
  'CC-BY-4.0',
] as const;

// ---------------------------------------------------------------------------
// 4. Normalization map
// ---------------------------------------------------------------------------

/**
 * Maps common human-readable license names and GitHub API `spdx_id`
 * variations to canonical SPDX identifiers in {@link ALLOWED_LICENSES}.
 *
 * Keys are stored in their original casing; lookups are case-insensitive
 * (see {@link normalizeLicense}).
 */
export const LICENSE_NORMALIZATION_MAP: Record<string, string> = {
  // --- MIT ---
  'MIT License': 'MIT',
  'The MIT License': 'MIT',
  'The MIT License (MIT)': 'MIT',
  mit: 'MIT',

  // --- Apache ---
  'Apache License 2.0': 'Apache-2.0',
  'Apache License, Version 2.0': 'Apache-2.0',
  'Apache-2.0 WITH LLVM-exception': 'Apache-with-LLVM-Exception',
  'Apache 2.0': 'Apache-2.0',
  'Apache 2': 'Apache-2.0',
  apache2: 'Apache-2.0',

  // --- BSD ---
  'BSD 3-Clause "New" or "Revised" License': 'BSD-3-Clause',
  'BSD 3-Clause License': 'BSD-3-Clause',
  'BSD-3': 'BSD-3-Clause',
  'BSD 2-Clause "Simplified" License': 'BSD-2-Clause',
  'BSD 2-Clause License': 'BSD-2-Clause',
  'BSD-2': 'BSD-2-Clause',
  'BSD 4-Clause "Original" or "Old" License': 'BSD-4-Clause',
  'BSD License': 'BSD-3-Clause',
  BSD: 'BSD-3-Clause',

  // --- Boost ---
  'Boost Software License 1.0': 'BSL-1.0',
  'Boost Software License': 'BSL-1.0',
  Boost: 'BSL-1.0',

  // --- CC-BY ---
  'Creative Commons Attribution 1.0': 'CC-BY-1.0',
  'Creative Commons Attribution 2.0': 'CC-BY-2.0',
  'Creative Commons Attribution 2.5': 'CC-BY-2.5',
  'Creative Commons Attribution 3.0': 'CC-BY-3.0',
  'Creative Commons Attribution 4.0': 'CC-BY-4.0',
  'Creative Commons Attribution 4.0 International': 'CC-BY-4.0',
  'CC BY 4.0': 'CC-BY-4.0',
  'CC BY 3.0': 'CC-BY-3.0',

  // --- GitHub API spdx_id quirks ---
  NOASSERTION: '',
  NONE: '',
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Pre-built lowercase → canonical lookup for O(1) membership tests. */
const _allowedLower = new Set<string>(
  ALLOWED_LICENSES.map((l) => l.toLowerCase()),
);

/** Pre-built lowercase → canonical lookup for CC-BY membership tests. */
const _ccByLower = new Set<string>(
  CC_BY_IDENTIFIERS.map((l) => l.toLowerCase()),
);

/** Pre-built lowercase normalization map. */
const _normMapLower = new Map<string, string>(
  Object.entries(LICENSE_NORMALIZATION_MAP).map(([k, v]) => [
    k.toLowerCase(),
    v,
  ]),
);

// ---------------------------------------------------------------------------
// 5. normalizeLicense
// ---------------------------------------------------------------------------

/**
 * Attempt to normalize a raw license string to a canonical SPDX identifier.
 *
 * Resolution order:
 * 1. If `raw` is already a known SPDX identifier (case-insensitive) → return
 *    the canonical form.
 * 2. If `raw` matches a key in {@link LICENSE_NORMALIZATION_MAP}
 *    (case-insensitive) → return the mapped value (empty string maps to
 *    `null`).
 * 3. Otherwise → `null`.
 *
 * @param raw - The raw license string (e.g. from `package.json` or GitHub API).
 * @returns The canonical SPDX identifier, or `null` if unrecognised.
 */
export function normalizeLicense(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;

  const lower = trimmed.toLowerCase();

  // Direct match against the allowlist (canonical casing preserved).
  const idx = ALLOWED_LICENSES.findIndex((l) => l.toLowerCase() === lower);
  if (idx !== -1) return ALLOWED_LICENSES[idx];

  // Normalization map lookup.
  const mapped = _normMapLower.get(lower);
  if (mapped !== undefined) {
    return mapped.length === 0 ? null : mapped;
  }

  return null;
}

// ---------------------------------------------------------------------------
// 6. isAllowedLicense
// ---------------------------------------------------------------------------

/**
 * Check whether `identifier` is present in the allowlist
 * (case-insensitive).
 */
export function isAllowedLicense(identifier: string): boolean {
  return _allowedLower.has(identifier.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// 7. isCcByLicense
// ---------------------------------------------------------------------------

/**
 * Check whether `identifier` is a Creative Commons Attribution license.
 * Useful for flagging dependencies whose license is allowed but
 * not designed for software.
 */
export function isCcByLicense(identifier: string): boolean {
  return _ccByLower.has(identifier.trim().toLowerCase());
}

// ---------------------------------------------------------------------------
// 8. LicenseVerificationResult
// ---------------------------------------------------------------------------

/** Result of a single license verification check. */
export interface LicenseVerificationResult {
  /** The raw SPDX identifier that was supplied (may be `null`). */
  identifier: string | null;
  /** The normalised canonical identifier, or `null` if unknown. */
  normalizedIdentifier: string | null;
  /** Whether the (normalised) identifier is on the allowlist. */
  isAllowed: boolean;
  /** Whether the license is a CC-BY variant (software-suitability flag). */
  isCcBy: boolean;
  /** How the license information was obtained. */
  source: 'api' | 'file' | 'manual';
  /** Arbitrary evidence payload (e.g. API response snippets). */
  evidence: Record<string, unknown>;
  /** Policy version used for this verification. */
  policyVersion: number;
  /** Human-readable warnings (e.g. CC-BY used for software). */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// 9. verifyLicense
// ---------------------------------------------------------------------------

/**
 * Run a full license verification and return a structured result.
 *
 * @param spdxId   - The SPDX identifier (or `null`/`undefined` when unknown).
 * @param source   - How the identifier was obtained.
 * @param evidence - Optional bag of supporting data for audit trails.
 * @returns A {@link LicenseVerificationResult} describing the outcome.
 */
export function verifyLicense(
  spdxId: string | null | undefined,
  source: 'api' | 'file' | 'manual',
  evidence: Record<string, unknown> = {},
): LicenseVerificationResult {
  const warnings: string[] = [];

  // Normalise the input.
  const raw = spdxId?.trim() ?? null;
  const normalizedIdentifier =
    raw !== null && raw.length > 0 ? normalizeLicense(raw) : null;

  // Determine allowlist membership.
  const isAllowed =
    normalizedIdentifier !== null && isAllowedLicense(normalizedIdentifier);

  // Flag CC-BY usage.
  const isCcBy =
    normalizedIdentifier !== null && isCcByLicense(normalizedIdentifier);

  // Populate warnings.
  if (raw === null || raw.length === 0) {
    warnings.push('No license identifier provided.');
  } else if (normalizedIdentifier === null) {
    warnings.push(
      `License identifier "${raw}" could not be normalised to a known SPDX identifier.`,
    );
  }

  if (!isAllowed && normalizedIdentifier !== null) {
    warnings.push(
      `License "${normalizedIdentifier}" is not on the approved allowlist (policy v${LICENSE_POLICY_VERSION}).`,
    );
  }

  if (isCcBy) {
    warnings.push(
      `License "${normalizedIdentifier}" is a Creative Commons Attribution license, which is intended for creative works rather than software.`,
    );
  }

  return {
    identifier: raw,
    normalizedIdentifier,
    isAllowed,
    isCcBy,
    source,
    evidence,
    policyVersion: LICENSE_POLICY_VERSION,
    warnings,
  };
}
