import * as fs from 'fs';
import * as path from 'path';

// ─── Constants ───────────────────────────────────────────────────────────────

/** Repositories must have strictly more than this many code LOC to be eligible. */
export const LOC_ELIGIBILITY_THRESHOLD = 200;

/** Semantic version of this counting tool. */
export const LOC_TOOL_VERSION = '1.0.0';

/** Canonical description of the metric produced. */
export const LOC_METHODOLOGY =
  'physical-loc-excluding-blanks-and-comments' as const;

// ─── Supported Languages & Extensions ────────────────────────────────────────

export const SUPPORTED_LANGUAGES: Record<string, string[]> = {
  TypeScript:   ['.ts', '.tsx'],
  JavaScript:   ['.js', '.jsx', '.mjs', '.cjs'],
  Python:       ['.py'],
  Java:         ['.java'],
  C:            ['.c', '.h'],
  'C++':        ['.cpp', '.cxx', '.cc', '.hpp', '.hxx'],
  'C#':         ['.cs'],
  Go:           ['.go'],
  Rust:         ['.rs'],
  Ruby:         ['.rb'],
  PHP:          ['.php'],
  Swift:        ['.swift'],
  Kotlin:       ['.kt', '.kts'],
};

/** Inverted map: extension → language name (built once at module load). */
const EXT_TO_LANGUAGE: Record<string, string> = {};
for (const [lang, exts] of Object.entries(SUPPORTED_LANGUAGES)) {
  for (const ext of exts) {
    EXT_TO_LANGUAGE[ext] = lang;
  }
}

// ─── Default Exclusions ──────────────────────────────────────────────────────

/** Directories to skip during recursive walk. */
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'out',
  '.next',
  '__pycache__',
  'vendor',
  'third_party',
  '.tox',
  '.venv',
  'venv',
  'coverage',
  '.nyc_output',
  'generated',
]);

/** File‑name glob patterns expressed as match functions. */
const EXCLUDED_FILE_PATTERNS: string[] = [
  '*.min.js',
  '*.bundle.js',
  '*.generated.*',
  '*.pb.go',
  '*_generated.*',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
];

/** Flattened list exported for consumers. */
export const DEFAULT_EXCLUSIONS: string[] = [
  ...Array.from(EXCLUDED_DIRS),
  ...EXCLUDED_FILE_PATTERNS,
];

// ─── Comment Patterns ────────────────────────────────────────────────────────

export const COMMENT_PATTERNS: Record<
  string,
  { single: string[]; blockStart: string; blockEnd: string }
> = {
  TypeScript:   { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  JavaScript:   { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  Python:       { single: ['#'],           blockStart: '"""', blockEnd: '"""' },
  Java:         { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  C:            { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  'C++':        { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  'C#':         { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  Go:           { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  Rust:         { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  Ruby:         { single: ['#'],           blockStart: '=begin', blockEnd: '=end' },
  PHP:          { single: ['//', '#'],     blockStart: '/*',  blockEnd: '*/' },
  Swift:        { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
  Kotlin:       { single: ['//'],          blockStart: '/*',  blockEnd: '*/' },
};

// ─── Result Interface ────────────────────────────────────────────────────────

export interface LocResult {
  /** Total physical lines (including blanks and comments). */
  totalPhysicalLoc: number;
  /** Physical lines minus blank lines. */
  nonblankLoc: number;
  /** Physical lines minus blank lines minus comment‑only lines. */
  codeLoc: number;
  /** Per‑language breakdown. */
  languageBreakdown: Record<
    string,
    { files: number; physical: number; nonblank: number; code: number }
  >;
  /** Exclusion rules that were active. */
  exclusions: string[];
  /** Number of source files that contributed to the count. */
  filesCounted: number;
  /** Number of files/directories skipped by exclusion rules. */
  filesExcluded: number;
  /** Methodology descriptor. */
  methodology: string;
  /** Tool version that produced this result. */
  toolVersion: string;
  /** Whether the repository meets the eligibility threshold. */
  isEligible: boolean;
  /** The threshold value used for the eligibility check. */
  eligibilityThreshold: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Rudimentary binary‑file detection.
 * Scans up to the first 8 KiB for NUL bytes – if any are found the file is
 * assumed to be binary.
 */
function isBinaryContent(buf: Buffer): boolean {
  const limit = Math.min(buf.length, 8192);
  for (let i = 0; i < limit; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

/**
 * Match a filename against a simplified glob pattern.
 * Supports leading `*` (suffix match), trailing `*` (prefix match),
 * internal `*` (prefix + suffix), and exact match.
 */
function matchGlob(pattern: string, fileName: string): boolean {
  // Exact match (e.g. "package-lock.json")
  if (!pattern.includes('*')) {
    return fileName === pattern;
  }

  const parts = pattern.split('*');

  if (parts.length === 2) {
    const [prefix, suffix] = parts;
    // "*suffix" → endsWith
    if (prefix === '') return fileName.endsWith(suffix);
    // "prefix*" → startsWith
    if (suffix === '') return fileName.startsWith(prefix);
    // "prefix*suffix"
    return fileName.startsWith(prefix) && fileName.endsWith(suffix) && fileName.length >= prefix.length + suffix.length;
  }

  // Patterns with multiple wildcards, e.g. "*.generated.*"
  // Build a simple check: every literal segment must appear in order.
  let pos = 0;
  for (let i = 0; i < parts.length; i++) {
    const segment = parts[i];
    if (segment === '') continue;

    if (i === 0) {
      // First segment must be a prefix
      if (!fileName.startsWith(segment)) return false;
      pos = segment.length;
    } else if (i === parts.length - 1) {
      // Last segment must be a suffix
      if (!fileName.endsWith(segment)) return false;
      if (fileName.length - segment.length < pos) return false;
    } else {
      const idx = fileName.indexOf(segment, pos);
      if (idx === -1) return false;
      pos = idx + segment.length;
    }
  }
  return true;
}

// ─── Core Public Functions ───────────────────────────────────────────────────

/**
 * Count physical, non‑blank, and code lines in a string of source code.
 *
 * - **physical**: total line count (every `\n`‑delimited line).
 * - **nonblank**: physical minus lines that are empty / whitespace‑only.
 * - **code**: nonblank minus lines that are comment‑only.
 *
 * Block‑comment tracking is stateful across lines.  A line that *opens* a
 * block comment and contains code before the opener still counts as a code
 * line.  A line that *closes* a block comment and has trailing code also
 * counts as code.
 */
export function countFileLines(
  content: string,
  language: string,
): { physical: number; nonblank: number; code: number } {
  if (content.length === 0) {
    return { physical: 0, nonblank: 0, code: 0 };
  }

  const patterns = COMMENT_PATTERNS[language];
  // If we don't recognise the language, count everything as code.
  if (!patterns) {
    const lines = content.split('\n');
    // Trailing empty element from final newline is still a "line" per
    // physical‑LOC convention only if it is non‑empty.
    const physical = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
    let nonblank = 0;
    for (let i = 0; i < physical; i++) {
      if (lines[i].trim() !== '') nonblank++;
    }
    return { physical, nonblank, code: nonblank };
  }

  const { single, blockStart, blockEnd } = patterns;
  const lines = content.split('\n');
  // Trim trailing phantom line caused by a final newline.
  const lineCount =
    lines.length > 0 && lines[lines.length - 1] === ''
      ? lines.length - 1
      : lines.length;

  let physical = lineCount;
  let nonblank = 0;
  let code = 0;
  let inBlock = false;

  for (let i = 0; i < lineCount; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed === '') {
      // Blank line – counts toward physical only.
      continue;
    }

    nonblank++;

    // Determine whether this line contains any code (non‑comment) content.
    let hasCode = false;
    let remaining = trimmed;

    if (inBlock) {
      // We entered this line already inside a block comment.
      const endIdx = remaining.indexOf(blockEnd);
      if (endIdx === -1) {
        // Entire line is still inside the block comment – no code.
        continue;
      }
      // Block ends on this line.
      inBlock = false;
      remaining = remaining.slice(endIdx + blockEnd.length).trim();
      if (remaining === '') {
        continue; // Nothing after the block‑end marker.
      }
      // Fall through: analyse what remains after the block closure.
    }

    // Process the remaining text outside any active block comment.
    // We loop because there may be multiple open/close pairs on one line.
    while (remaining.length > 0) {
      // Check for single‑line comment starters first.
      let earliestSingle = -1;
      for (const s of single) {
        const idx = remaining.indexOf(s);
        if (idx !== -1 && (earliestSingle === -1 || idx < earliestSingle)) {
          earliestSingle = idx;
        }
      }

      // Check for block‑comment opener.
      const blockIdx = remaining.indexOf(blockStart);

      if (earliestSingle !== -1 && (blockIdx === -1 || earliestSingle <= blockIdx)) {
        // Single‑line comment is first (or ties with block).
        if (earliestSingle > 0) {
          hasCode = true;
        }
        // Rest of the line is comment.
        break;
      }

      if (blockIdx !== -1) {
        // Block comment opens.
        if (blockIdx > 0) {
          hasCode = true;
        }
        // Look for the matching close on the same line.
        const closeIdx = remaining.indexOf(blockEnd, blockIdx + blockStart.length);
        if (closeIdx !== -1) {
          // Block opens and closes on the same line.
          remaining = remaining.slice(closeIdx + blockEnd.length).trim();
          // Continue loop – there may be more code or comments.
          continue;
        } else {
          // Block opens and does NOT close on this line.
          inBlock = true;
          break;
        }
      }

      // No comment markers found – the rest is code.
      hasCode = true;
      break;
    }

    if (hasCode) {
      code++;
    }
  }

  return { physical, nonblank, code };
}

/**
 * Detect the language of a file from its extension.
 * Returns `null` for unsupported extensions.
 */
export function detectLanguage(filePath: string): string | null {
  const ext = path.extname(filePath).toLowerCase();
  return EXT_TO_LANGUAGE[ext] ?? null;
}

/**
 * Decide whether a file path should be excluded from counting.
 *
 * @param filePath  Relative or absolute path.
 * @param exclusions  Custom exclusion list (defaults to `DEFAULT_EXCLUSIONS`).
 */
export function shouldExclude(
  filePath: string,
  exclusions?: string[],
): boolean {
  const rules = exclusions ?? DEFAULT_EXCLUSIONS;
  const normalized = filePath.replace(/\\/g, '/');
  const segments = normalized.split('/');
  const fileName = segments[segments.length - 1];

  for (const rule of rules) {
    // If the rule contains a wildcard or a dot it is treated as a file pattern.
    if (rule.includes('*') || (rule.includes('.') && !rule.startsWith('.'))) {
      if (matchGlob(rule, fileName)) return true;
    } else {
      // Directory name match – any path segment.
      if (segments.includes(rule)) return true;
    }
  }
  return false;
}

/**
 * Eligibility check: strictly greater than the threshold.
 */
export function isEligible(codeLoc: number): boolean {
  return codeLoc > LOC_ELIGIBILITY_THRESHOLD;
}

// ─── Directory Walk & Aggregation ────────────────────────────────────────────

/**
 * Recursively walk `rootDir`, count source LOC for every supported file that
 * is not excluded, and return the aggregated {@link LocResult}.
 *
 * The walk is deterministic: directory entries are sorted lexicographically at
 * every level so that identical trees always produce identical results.
 */
export async function countRepositoryLoc(
  rootDir: string,
  options?: { exclusions?: string[]; languages?: string[] },
): Promise<LocResult> {
  const exclusions = options?.exclusions ?? DEFAULT_EXCLUSIONS;
  const allowedLanguages = options?.languages
    ? new Set(options.languages)
    : null;

  const breakdown: Record<
    string,
    { files: number; physical: number; nonblank: number; code: number }
  > = {};

  let totalPhysical = 0;
  let totalNonblank = 0;
  let totalCode = 0;
  let filesCounted = 0;
  let filesExcluded = 0;

  /**
   * Recursive async walker.  Sorts entries for determinism.
   */
  async function walk(dir: string): Promise<void> {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(dir, { withFileTypes: true });
    } catch {
      // Permission denied or similar – skip silently.
      return;
    }

    // Sort for determinism.
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(rootDir, fullPath);

      if (entry.isDirectory()) {
        if (shouldExclude(relativePath, exclusions)) {
          filesExcluded++;
          continue;
        }
        await walk(fullPath);
      } else if (entry.isFile()) {
        if (shouldExclude(relativePath, exclusions)) {
          filesExcluded++;
          continue;
        }

        const language = detectLanguage(fullPath);
        if (language === null) continue; // Unsupported extension – skip.
        if (allowedLanguages && !allowedLanguages.has(language)) continue;

        // Read file content.
        let buf: Buffer;
        try {
          buf = await fs.promises.readFile(fullPath);
        } catch {
          // Unreadable – skip.
          continue;
        }

        // Skip binary files.
        if (isBinaryContent(buf)) {
          filesExcluded++;
          continue;
        }

        const content = buf.toString('utf-8');
        const counts = countFileLines(content, language);

        totalPhysical += counts.physical;
        totalNonblank += counts.nonblank;
        totalCode += counts.code;
        filesCounted++;

        if (!breakdown[language]) {
          breakdown[language] = { files: 0, physical: 0, nonblank: 0, code: 0 };
        }
        breakdown[language].files += counts.physical === 0 && counts.code === 0 ? 1 : 1;
        breakdown[language].physical += counts.physical;
        breakdown[language].nonblank += counts.nonblank;
        breakdown[language].code += counts.code;
      }
    }
  }

  await walk(rootDir);

  return {
    totalPhysicalLoc: totalPhysical,
    nonblankLoc: totalNonblank,
    codeLoc: totalCode,
    languageBreakdown: breakdown,
    exclusions,
    filesCounted,
    filesExcluded,
    methodology: LOC_METHODOLOGY,
    toolVersion: LOC_TOOL_VERSION,
    isEligible: isEligible(totalCode),
    eligibilityThreshold: LOC_ELIGIBILITY_THRESHOLD,
  };
}
