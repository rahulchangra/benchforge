import { test, expect } from "@playwright/test";

test.describe("Stage 4 & 5: Functional Baseline and Security Scans", () => {
  // --------------------------------------------------------------------------
  // 1. Critical User Journeys & Route Availability
  // --------------------------------------------------------------------------
  const criticalRoutes = [
    { path: "/", title: "BenchForge" },
    { path: "/login", title: "Login" },
    { path: "/dashboard", title: "Dashboard" },
    { path: "/projects", title: "Projects" },
    { path: "/benchmarks", title: "Benchmarks" },
    { path: "/repositories", title: "Repositories" },
    { path: "/settings", title: "Settings" },
    { path: "/jobs", title: "Jobs" },
  ];

  for (const route of criticalRoutes) {
    test(`Navigation: ${route.path} loads successfully`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("body")).toBeVisible();
    });
  }

  // --------------------------------------------------------------------------
  // 2. Input Validation Boundaries
  // --------------------------------------------------------------------------
  test("Form Validation: POST /api/projects rejects invalid schema", async ({ request }) => {
    const response = await request.post("/api/projects", {
      data: {
        // Missing required 'name', 'targetLanguages', 'targetCategories'
        description: "Incomplete project payload",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Validation failed");
    expect(Array.isArray(body.errors)).toBe(true);
  });

  test("Form Validation: POST /api/learning/workspaces rejects empty name", async ({ request }) => {
    const response = await request.post("/api/learning/workspaces", {
      data: {
        name: "", // Invalid: min(1) required
        userId: "test-user-id",
      },
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 3. Multi-Tenant / Synthetic Account Boundary Check (IDOR Proof)
  // --------------------------------------------------------------------------
  test("Security Check: Two Synthetic Accounts - Tenant Boundary Verification", async ({ request }) => {
    const userA = "synthetic-tenant-user-alpha";
    const userB = "synthetic-tenant-user-beta";

    // Step 1: User A creates a workspace
    const createRes = await request.post("/api/learning/workspaces", {
      data: {
        name: "Confidential Research Workspace Alpha",
        description: "Created by synthetic user A",
        userId: userA,
      },
    });

    expect(createRes.status()).toBe(200);
    const workspace = (await createRes.json()).data;
    expect(workspace.id).toBeDefined();

    // Step 2: Query workspaces with userB parameter
    const queryResB = await request.get(`/api/learning/workspaces?userId=${userB}`);
    expect(queryResB.status()).toBe(200);
    const listB = (await queryResB.json()).data;
    const leakedToB = listB.some((w: { id: string }) => w.id === workspace.id);
    expect(leakedToB).toBe(false); // Filter works when explicit

    // Step 3: Check unparameterized access - does an anonymous/unfiltered request leak all tenants?
    const queryResAll = await request.get("/api/learning/workspaces");
    expect(queryResAll.status()).toBe(200);
    const listAll = (await queryResAll.json()).data;
    const presentInAll = listAll.some((w: { id: string }) => w.id === workspace.id);

    // Records that unauthenticated callers can list all workspaces without tenant scoping
    expect(presentInAll).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 4. File Path Traversal Boundary Test (SEC-03 Fix Verification)
  // --------------------------------------------------------------------------
  test("Security Check: Arbitrary localPath traversal is rejected with 400", async ({ request }) => {
    const response = await request.post("/api/repositories/eligibility", {
      data: {
        owner: "octocat",
        repo: "Hello-World",
        localPath: "../../../../../Windows", // Out of bounds path traversal
      },
    });

    // Path confinement ensures traversal attempts are rejected
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toContain("Invalid or unauthorized local repository path");
  });

  // --------------------------------------------------------------------------
  // 5. Modern Security Headers & CSP (SEC-07 Fix Verification)
  // --------------------------------------------------------------------------
  test("Security Check: Modern security headers including CSP and Permissions-Policy", async ({ request }) => {
    const response = await request.get("/api/health");
    const headers = response.headers();

    // Standard baseline headers
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

    // Modern defense-in-depth headers
    expect(headers["content-security-policy"]).toBeDefined();
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["permissions-policy"]).toBeDefined();
  });
});

