# 🛡️ SECURITY ASSESSMENT PLAN — BenchForge

**Document Version:** 1.0.0  
**Date:** October 28, 2026  
**Target Application:** BenchForge (GitHub Benchmark & Learning Studio SaaS)  
**Baseline Git Branch:** `security-audit`  

---

## 1. Application Architecture Map

### 1.1 Core Stack
* **Framework:** Next.js 16.4.2 (App Router, Turbopack, React 19)
* **Database & ORM:** PostgreSQL (Neon Serverless) via Prisma ORM v6.9.0
* **Authentication:** NextAuth v5 (`next-auth@5.0.0-beta.32`) with GitHub OAuth Provider (`read:user`, `user:email`, `repo` scopes) & JWT session strategy
* **External APIs:** GitHub REST API v3 via `@octokit/rest`
* **File Processing:** `jszip` (in-memory ZIP archive decompression and multi-task parsing)
* **Testing:** Vitest 5.0.5 (`jsdom`), 6 test files, 86 unit tests currently passing

### 1.2 Route Architecture & Endpoints
| Component | Route / Prefix | Authentication / Access Check |
| :--- | :--- | :--- |
| **Public Landing & Login** | `/`, `/login` | Public |
| **Frontend App Pages** | `/dashboard`, `/projects`, `/projects/[id]`, `/benchmarks`, `/repositories`, `/issues`, `/jobs`, `/learning`, `/learning/graph`, `/settings` | Guarded by `middleware.ts` **only if** `GITHUB_CLIENT_ID` is set. When unset, runs in unauthenticated **Demo Mode** |
| **Auth Endpoints** | `/api/auth/[...nextauth]` | Public NextAuth handler |
| **Health Check** | `/api/health` | Public |
| **Repositories API** | `POST /api/repositories`, `POST /api/repositories/eligibility` | No session or user verification |
| **Issues API** | `POST /api/issues`, `GET /api/issues`, `PATCH /api/issues/[id]` | No session or user verification |
| **Benchmarks API** | `GET /api/benchmarks`, `POST /api/benchmarks`, `GET /api/benchmarks/[id]`, `PATCH /api/benchmarks/[id]` | No session or user verification |
| **Projects API** | `GET /api/projects`, `POST /api/projects`, `GET /api/projects/[id]`, `PATCH /api/projects/[id]`, `DELETE /api/projects/[id]` | No session verification; hardcodes `userId: "system"` on creation; permits unauthenticated delete/patch |
| **Autonomous Agent API** | `GET /api/projects/[id]/agent`, `POST /api/projects/[id]/agent`, `GET /api/projects/[id]/agent/[runId]` | No session or user verification; triggers background crawler/generator tasks |
| **ZIP Upload API** | `POST /api/learning/tasks/upload-zip` | No session or user verification; processes Base64-encoded zip archives |
| **Settings API** | `GET /api/settings`, `POST /api/settings` | No session or user verification; creates/overwrites system license policies |

---

## 2. Attack Surface Analysis & Key Static Findings

From our Stage 1 source code inspection, the following critical attack surfaces and vulnerabilities were identified:

1. **Authentication Bypass / Permissive Demo Mode (`middleware.ts`):**
   * If `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are not configured (e.g. default dev/staging or misconfigured production), `authEnabled` evaluates to `false`, allowing anyone to access protected pages and administrative areas without authentication.
2. **Missing Server-Side Authorization & IDOR across all API Routes:**
   * None of the route handlers in `src/app/api/` enforce `requireAuth()` or verify that the calling user owns the project, repository, workspace, or license policy being accessed, updated, or deleted.
3. **In-Memory Rate Limiter Not Enforced:**
   * While `src/lib/rate-limit.ts` is implemented, it is **not imported or attached to any API routes**, leaving endpoints open to brute-force or resource exhaustion.
4. **Information Disclosure in Error Handling (`src/lib/api-helpers.ts`):**
   * `withErrorHandling` returns `error.message` directly in 500 responses (`apiError(error.message, 500)`), potentially exposing database schemas, SQL error messages, or internal file paths to attackers.
5. **Security Headers Hardening:**
   * `middleware.ts` sets `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `X-XSS-Protection`. However, modern security headers such as `Content-Security-Policy` (CSP), `Permissions-Policy`, and `Strict-Transport-Security` (HSTS) are absent.
6. **File Upload & Archive Parsing Risks (`src/app/api/learning/tasks/upload-zip`):**
   * Although files are parsed in memory with JSZip and stored in Postgres rather than directly on disk, archive size validation and zip-bomb decompression limits require validation.

---

## 3. Toolchain & Testing Strategy

* **Dependency Audit:** Clean (`0` known vulnerabilities via `npm audit`).
* **Unit & Regression Suite:** Vitest (`86/86` tests currently passing).
* **Target Environment:** Local dev server running at `http://localhost:3000`.
* **Playwright Baseline:** To be added for automated authentication, session, and role boundary regression tests.
* **Controlled Scans:** Passive and active scans strictly restricted to `http://localhost:3000` with rate limiting and external GitHub API mocking/exclusion.

---

## 4. Hard Safety Boundaries & Rules of Engagement

1. **Scope:** Active testing will be confined strictly to `http://localhost:3000`. No external endpoints (including `api.github.com` or third-party OAuth domains) will be subjected to automated security scans.
2. **Data Integrity:** No production data alterations or destructive database wipes.
3. **Redaction:** All tokens, cookies, database credentials, and secrets will remain redacted in all logs and reports.
4. **Branch Isolation:** All code changes and regression tests will be developed on the `security-audit` branch.

---

## 5. Scope Confirmation Checklist (Pending User Confirmation)

Before proceeding from Stage 1 (Passive Reconnaissance) to Stage 4/5 (Functional Baselines & Active Testing):
- [ ] Confirm authorized target URL (Recommended: `http://localhost:3000`)
- [ ] Confirm environment classification: Local Development
- [ ] Confirm whether active scanning / fuzzing of local endpoints is approved
- [ ] Confirm mock strategy for external GitHub API calls

