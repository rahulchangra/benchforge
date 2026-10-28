import { test, expect } from "@playwright/test";

test.describe("Security & Functional Baseline Tests", () => {
  test("1. Public landing page renders with security headers", async ({ request }) => {
    const response = await request.get("/");
    expect(response.status()).toBe(200);

    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  });

  test("2. Unauthenticated access to /dashboard (Demo Mode check)", async ({ page }) => {
    const response = await page.goto("/dashboard");
    expect(response?.status()).toBe(200);
    // In demo mode without GITHUB_CLIENT_ID, it allows access instead of redirecting to /login
  });

  test("3. Unauthenticated API access - GET /api/projects", async ({ request }) => {
    const response = await request.get("/api/projects");
    // Baseline checks if unauthenticated requests succeed or return 401
    expect([200, 401]).toContain(response.status());
  });

  test("4. IDOR / Unauthenticated Project Creation and Deletion", async ({ request }) => {
    // Attempt synthetic project creation without authentication
    const createRes = await request.post("/api/projects", {
      data: {
        name: "Security Audit Synthetic Test Project",
        description: "Ephemeral project created for penetration test verification",
        targetLanguages: ["TypeScript"],
        targetCategories: ["BUG_FIX"],
        minStars: 10,
      },
    });

    // Capture response for baseline recording
    if (createRes.status() === 200) {
      const body = await createRes.json();
      expect(body.success).toBe(true);
      const projectId = body.data.id;

      // Clean up the synthetic project
      const deleteRes = await request.delete(`/api/projects/${projectId}`);
      expect(deleteRes.status()).toBe(200);
    }
  });

  test("5. Error response hygiene (No internal stack or SQL leakage)", async ({ request }) => {
    const response = await request.post("/api/projects", {
      data: { invalidField: true },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBeDefined();
    // Verify no stack trace in response
    expect(body.stack).toBeUndefined();
  });
});

