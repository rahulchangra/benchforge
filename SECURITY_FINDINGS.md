# 🔒 SECURITY FINDINGS REPORT — BenchForge

**Date:** October 28, 2026  
**Auditor:** Antigravity (Security Engineer & QA Lead)  
**Target:** BenchForge SaaS (`benchforge-master`)  
**Assessment Phase:** Stage 3 — Source, Dependency, and Configuration Review  
**Branch:** `security-audit`  

---

## Executive Summary of Findings

| ID | Title | Severity | Status | Affected Component |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01** | Unauthenticated Administrative Control & Global Auth Bypass (Demo Mode) | **Critical** | Confirmed | `src/middleware.ts` |
| **SEC-02** | Missing Server-Side Authorization & IDOR Across Core API Handlers | **High** | Confirmed | `src/app/api/projects/`, `src/app/api/settings/`, `src/app/api/learning/workspaces/` |
| **SEC-03** | Arbitrary Server Path Traversal & Recursive Disk Access | **High** | Confirmed | `src/app/api/repositories/eligibility/route.ts` (`localPath`) |
| **SEC-04** | Unbounded In-Memory ZIP Archive Decompression & Denial-of-Service Risk | **Medium** | Confirmed | `src/app/api/learning/tasks/upload-zip/route.ts` |
| **SEC-05** | Unenforced Rate Limiting Across All API Endpoints | **Medium** | Confirmed | `src/lib/rate-limit.ts`, `src/app/api/` |
| **SEC-06** | Internal Exception & Error Message Disclosure in API Handler Wrapper | **Medium** | Confirmed | `src/lib/api-helpers.ts` (`withErrorHandling`) |
| **SEC-07** | Missing Content Security Policy (CSP) & Permissive Security Headers | **Low** | Confirmed | `src/middleware.ts` (`withSecurityHeaders`) |
| **SEC-08** | Plaintext GitHub OAuth Access Token Storage | **Low** | Confirmed | `src/lib/auth.ts`, `prisma/schema.prisma` |

---

## Detailed Vulnerability Findings

### SEC-01: Unauthenticated Administrative Control & Global Auth Bypass (Demo Mode)
* **Severity:** **Critical**
* **Rationale:** Allows complete unauthenticated access to the entire application dashboard, project management, and data operations when deployed without OAuth environment variables configured.
* **Affected Component / Route:** [`src/middleware.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/middleware.ts#L26-L50)
* **Prerequisites:** `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` unset or empty (default development/staging setting).
* **Reproduction Steps:**
  1. Clear all browser cookies.
  2. Send an HTTP GET request to `http://localhost:3000/dashboard` or `http://localhost:3000/settings`.
  3. Observe that the middleware returns `200 OK` rather than redirecting to `/login`.
* **Sanitized Evidence:**
  ```typescript
  // src/middleware.ts
  const authEnabled = !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET;
  ...
  // Demo mode - skip auth when OAuth is not configured
  if (!authEnabled) {
    return withSecurityHeaders(NextResponse.next());
  }
  ```
  *Automated verification in Playwright test `2. Unauthenticated access to /dashboard (Demo Mode check)` passed (`200 OK`).*
* **Root Cause:** A developer convenience fallback was added to permit deployment without configuring an OAuth application, disabling edge route protection entirely.
* **Recommended Fix:**
  - Enforce explicit environment validation: never default to bypass mode in production (`NODE_ENV === "production"`).
  - Even in development/demo mode, isolate demo state or require a local developer authentication mock rather than exposing full unauthenticated mutation endpoints.

---

### SEC-02: Missing Server-Side Authorization & IDOR Across Core API Handlers
* **Severity:** **High**
* **Rationale:** Route handlers do not authenticate requests or verify that a resource belongs to the requesting user. Any caller can view, modify, or delete resources belonging to any tenant/user.
* **Affected Component / Route:**
  - `POST /api/projects`, `PATCH /api/projects/[id]`, `DELETE /api/projects/[id]`
  - `POST /api/settings` (license policies)
  - `POST /api/learning/workspaces`
  - `POST /api/learning/tasks/upload-zip`
* **Prerequisites:** Network access to the API endpoints.
* **Reproduction Steps:**
  1. Send an anonymous `POST` to `/api/projects` with a project payload.
  2. The server creates the project with `userId: "system"` and returns `200 OK`.
  3. Send an anonymous `DELETE` to `/api/projects/<id>`.
  4. The server deletes the project and returns `200 OK`.
* **Sanitized Evidence:**
  ```typescript
  // src/app/api/projects/route.ts
  export const POST = withErrorHandling(async (request: NextRequest) => {
    const { data, error } = await parseBody(request, CreateProjectSchema);
    if (error) return error;

    // TODO: get userId from auth session; for now use a placeholder
    const project = await prisma.olympusProject.create({
      data: {
        ...
        userId: "system", // placeholder until auth wired
      },
    });
    return apiSuccess(project);
  });
  ```
  *Verified via Playwright test `4. IDOR / Unauthenticated Project Creation and Deletion`.*
* **Root Cause:** Placeholder `// TODO: get userId from auth session` comments were left in place of invoking `requireAuth()` or session verification.
* **Recommended Fix:**
  - Wire `requireAuth()` from [`src/lib/auth-helpers.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/lib/auth-helpers.ts) into all mutating handlers.
  - Verify resource ownership (`where: { id, userId: user.id }`) before update or delete operations.

---

### SEC-03: Arbitrary Server Path Traversal & Recursive Disk Access
* **Severity:** **High**
* **Rationale:** An API parameter allows an unauthenticated caller to supply an arbitrary file system path which is then traversed and read recursively by the server process.
* **Affected Component / Route:** [`src/app/api/repositories/eligibility/route.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/app/api/repositories/eligibility/route.ts#L25) and [`src/lib/loc-counter.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/lib/loc-counter.ts#L382-L445)
* **Prerequisites:** Network access to `/api/repositories/eligibility`.
* **Reproduction Steps:**
  1. Submit a JSON payload to `POST /api/repositories/eligibility` with `owner`, `repo`, and `localPath: "C:\\Users\\Rahul"`.
  2. If the repository license is allowed, the server invokes `countRepositoryLoc(data.localPath)`.
  3. `walk(dir)` uses `fs.promises.readdir` and `fs.promises.readFile` on the arbitrary server path.
* **Sanitized Evidence:**
  ```typescript
  // src/app/api/repositories/eligibility/route.ts
  const EligibilityCheckSchema = z.object({
    owner: z.string().min(1),
    repo: z.string().min(1),
    token: z.string().optional(),
    commitSha: z.string().optional(),
    localPath: z.string().optional(), // For LOC counting on cloned repos
  });
  ...
  if (licenseResult.isAllowed && data.localPath) {
    locResult = await countRepositoryLoc(data.localPath);
  }
  ```
* **Root Cause:** Lack of path validation, normalization, and sandbox path restriction (e.g., verifying `path.resolve(localPath)` resides within an authorized temporary scratch directory).
* **Recommended Fix:**
  - Reject absolute paths or paths outside a designated secure scratch directory.
  - Enforce `path.resolve` containment checks:
    ```typescript
    const resolved = path.resolve(data.localPath);
    if (!resolved.startsWith(ALLOWED_SCRATCH_DIR)) {
      return apiError("Invalid local repository path", 400);
    }
    ```

---

### SEC-04: Unbounded In-Memory ZIP Archive Decompression & Denial-of-Service Risk
* **Severity:** **Medium**
* **Rationale:** An unauthenticated caller can send arbitrarily large Base64 ZIP payloads, causing memory exhaustion (Node.js heap limit) or decompression bomb issues.
* **Affected Component / Route:** [`src/app/api/learning/tasks/upload-zip/route.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/app/api/learning/tasks/upload-zip/route.ts#L7-L11)
* **Prerequisites:** Network access to `/api/learning/tasks/upload-zip`.
* **Reproduction Steps:**
  1. Send a `POST` request with an uncompressed payload or large Base64 string with no size limit in schema (`zipFileBase64: z.string().min(1)`).
  2. Server attempts `Buffer.from(data.zipFileBase64, "base64")` and decompressing all nested entries into memory simultaneously.
* **Root Cause:** Absence of max payload length on `zipFileBase64` and missing uncompressed byte limits during JSZip extraction.
* **Recommended Fix:**
  - Constrain `zipFileBase64` max length in Zod schema (e.g. max 50MB corresponding to `MAX_UPLOAD_SIZE_MB`).
  - Add a decompression size guard that aborts if total uncompressed bytes exceed safe thresholds.

---

### SEC-05: Unenforced Rate Limiting Across All API Endpoints
* **Severity:** **Medium**
* **Rationale:** Allows unbounded automated requests, risking downstream GitHub API rate-limit exhaustion and compute denial of service.
* **Affected Component / Route:** [`src/lib/rate-limit.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/lib/rate-limit.ts)
* **Prerequisites:** Network access.
* **Root Cause:** The `applyRateLimit` utility function was created but never imported into route handlers or middleware.
* **Recommended Fix:**
  - Connect `applyRateLimit` into `withErrorHandling` wrapper or sensitive endpoints (`/api/repositories/discover`, `/api/repositories/eligibility`, `/api/projects/[id]/agent`).

---

### SEC-06: Internal Exception & Error Message Disclosure in API Handler Wrapper
* **Severity:** **Medium**
* **Rationale:** Stack traces, internal Prisma exception messages, and database connection strings/schema details can be leaked to clients in HTTP 500 responses.
* **Affected Component / Route:** [`src/lib/api-helpers.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/lib/api-helpers.ts#L70-L84)
* **Sanitized Evidence:**
  ```typescript
  // src/lib/api-helpers.ts
  export function withErrorHandling(handler: ...) {
    return async (request: NextRequest, context?: unknown) => {
      try {
        await ensureSchema();
        return await handler(request, context);
      } catch (error) {
        console.error("API Error:", error);
        const message = error instanceof Error ? error.message : "Internal server error";
        return apiError(message, 500); // Exposes internal message
      }
    };
  }
  ```
* **Root Cause:** Directly returning `error.message` unconditionally without checking `process.env.NODE_ENV`.
* **Recommended Fix:**
  - Sanitize 500 responses in non-development environments:
    ```typescript
    const message = process.env.NODE_ENV === "development" && error instanceof Error
      ? error.message
      : "Internal server error";
    ```

---

### SEC-07: Missing Content Security Policy (CSP) & Permissive Security Headers
* **Severity:** **Low**
* **Rationale:** Missing defense-in-depth protection against cross-site scripting (XSS), clickjacking, and unauthorized browser resource embedding.
* **Affected Component / Route:** [`src/middleware.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/middleware.ts#L14-L20)
* **Root Cause:** Only 4 legacy headers are set (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `X-XSS-Protection`).
* **Recommended Fix:**
  - Add `Content-Security-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` to `withSecurityHeaders`.

---

### SEC-08: Plaintext GitHub OAuth Access Token Storage
* **Severity:** **Low**
* **Rationale:** GitHub access tokens with `repo` scope are stored in plaintext in the `User` database table (`githubToken String?`).
* **Affected Component / Route:** [`src/lib/auth.ts`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/src/lib/auth.ts#L44), [`prisma/schema.prisma`](file:///c:/Users/Rahul/OneDrive/Documents/Desktop/Benchforge/benchforge-master/prisma/schema.prisma#L109)
* **Root Cause:** Direct storage of `account.access_token` in the user model without encryption at rest.
* **Recommended Fix:**
  - Encrypt sensitive provider tokens with AES-256-GCM using `NEXTAUTH_SECRET` before persisting to database.

