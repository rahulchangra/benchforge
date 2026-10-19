/**
 * Fallback Database Engine & In-Memory Store
 *
 * Provides a fully functional, zero-configuration database fallback when
 * PostgreSQL / Docker is unavailable or when deployed in serverless environments.
 * Supports full CRUD, relation counting, nested queries, and filtering.
 */

export interface FallbackStore {
  isDbUnavailable: () => boolean;
  markDbUnavailable: () => void;
  markDbAvailable: () => void;
  [modelName: string]: any;
}

export type StoreData = Record<string, any[]>;

declare global {
  // eslint-disable-next-line no-var
  var __benchforgeFallbackData: StoreData | undefined;
  // eslint-disable-next-line no-var
  var __benchforgeFallbackStore: FallbackStore | undefined;
  // eslint-disable-next-line no-var
  var __benchforgeDbUnavailable: boolean | undefined;
  // eslint-disable-next-line no-var
  var __benchforgeInitialized: boolean | undefined;
}

const data: StoreData =
  globalThis.__benchforgeFallbackData ??
  (globalThis.__benchforgeFallbackData = {
    olympusProject: [],
    challengeSubmission: [],
    approvedTaskExample: [],
    agentRun: [],
    repository: [],
    repositorySnapshot: [],
    licenseVerification: [],
    locMeasurement: [],
    issue: [],
    pullRequest: [],
    issueCandidate: [],
    benchmarkJob: [],
    benchmark: [],
    analysisEvidence: [],
    learningWorkspace: [],
    taskPackage: [],
    uploadedDocument: [],
    extractedRequirement: [],
    knowledgeNode: [],
    knowledgeEdge: [],
    sourceEvidence: [],
    reusablePattern: [],
    learningJob: [],
    generatedDraft: [],
    humanReview: [],
    learningFeedback: [],
    auditLog: [],
    user: [],
    licensePolicy: [],
  });

function seedInitialData() {
  if (globalThis.__benchforgeInitialized || (data.olympusProject && data.olympusProject.length > 0)) {
    return;
  }
  globalThis.__benchforgeInitialized = true;

  // 1. User
  const defaultUser = {
    id: "user-admin",
    email: "admin@benchforge.dev",
    name: "System Engineer",
    avatarUrl: null,
    githubId: "123456",
    githubToken: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.user.push(defaultUser);

  // 2. License Policy
  data.licensePolicy.push({
    id: "policy-v1",
    version: 1,
    allowedIdentifiers: JSON.stringify(["MIT", "Apache-2.0", "BSD-3-Clause", "BSD-2-Clause", "ISC", "0BSD", "Unlicense", "CC0-1.0"]),
    ccByIdentifiers: JSON.stringify(["CC-BY-4.0", "CC-BY-SA-4.0"]),
    effectiveFrom: new Date().toISOString(),
    createdById: defaultUser.id,
    notes: "Default permissive open source policy for Quest Olympus benchmarks",
    createdAt: new Date().toISOString(),
  });

  // 3. Olympus Projects
  const pyProject = {
    id: "demo-olympus-python",
    name: "Quest Olympus Python Benchmarks",
    description: "Automated benchmark challenges targeting high-star Python repositories with isolated reproduction patches, tests, and human developer prompts.",
    status: "ACTIVE",
    targetLanguages: ["Python"],
    targetCategories: ["BUGFIX", "FEATURE_REQUEST"],
    minStars: 500,
    requirementsDoc: `# Quest Olympus Python Platform Guidelines

01. High Quality Problem Definitions
Every challenge must state the reproduction steps, expected behavior, and actual behavior in clean developer language without AI boilerplate.

02. Strict Test Isolation
All test changes must be isolated strictly to test files (e.g. tests/, test_*.py) with valid unified diff syntax.

03. Deterministic Containerization
Every submission must provide an executable test.sh and a standalone Dockerfile based on official python:3.11-slim container images.

04. Be smart about spending tokens.
Clear your checks first, then start with a smaller batch to get a vibe before committing to a full run.

05. Expect to iterate.
Refining until you've ruled out obvious issues is the path to clean approval with zero revision cycles.`,
    userId: defaultUser.id,
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const tsProject = {
    id: "demo-olympus-ts",
    name: "TypeScript Server Frameworks Benchmark",
    description: "Benchmark tasks extracted from Express, Fastify, and NestJS issues with reproducible test harnesses.",
    status: "ACTIVE",
    targetLanguages: ["TypeScript", "JavaScript"],
    targetCategories: ["BUGFIX", "REFACTOR"],
    minStars: 1000,
    requirementsDoc: "# TypeScript Platform Guidelines\nFocus on HTTP routing and middleware regression test cases.",
    userId: defaultUser.id,
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const rustProject = {
    id: "demo-olympus-rust",
    name: "Rust Asynchronous Concurrency QA",
    description: "High-concurrency async runtime benchmark tasks focusing on Tokio and async-std issue regressions.",
    status: "SETUP",
    targetLanguages: ["Rust"],
    targetCategories: ["BUGFIX"],
    minStars: 2000,
    requirementsDoc: "# Rust Guidelines\nRequires cargo test harness with clean container execution.",
    userId: defaultUser.id,
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.olympusProject.push(pyProject, tsProject, rustProject);

  // 4. Approved Task Examples for Python project
  data.approvedTaskExample.push(
    {
      id: "ex-py-01",
      olympusProjectId: pyProject.id,
      repoUrl: "https://github.com/pallets/flask",
      commitHash: "7a1b3c5e89d2f01476839a2b4c5e6f7a8b9c0d1e",
      language: "Python",
      category: "BUGFIX",
      taskPrompt: "When mounting a Blueprint with a trailing slash in its url_prefix (e.g. url_prefix='/api/'), nested route handlers registered with an empty path raise 404 instead of dispatching to index.\n\n## Reproduction Steps\n```python\nfrom flask import Flask, Blueprint\napp = Flask(__name__)\nbp = Blueprint('api', __name__, url_prefix='/api/')\n@bp.route('')\ndef index(): return 'ok'\napp.register_blueprint(bp)\n# GET /api/ returns 404 instead of expected 200 OK\n```\n\n## Expected Behavior\nEmpty route string on blueprint with trailing slash url_prefix should resolve cleanly to root index.",
      testPatch: "diff --git a/tests/test_blueprints.py b/tests/test_blueprints.py\n--- a/tests/test_blueprints.py\n+++ b/tests/test_blueprints.py\n@@ -24,3 +24,14 @@\n+def test_blueprint_empty_route_trailing_slash():\n+    app = flask.Flask(__name__)\n+    bp = flask.Blueprint('api', __name__, url_prefix='/api/')\n+    @bp.route('')\n+    def index(): return 'ok'\n+    app.register_blueprint(bp)\n+    c = app.test_client()\n+    rv = c.get('/api/')\n+    assert rv.status_code == 200\n+    assert rv.data == b'ok'\n",
      solutionPatch: "diff --git a/src/flask/blueprints.py b/src/flask/blueprints.py\n--- a/src/flask/blueprints.py\n+++ b/src/flask/blueprints.py\n@@ -180,2 +180,4 @@\n-    rule = rule.lstrip('/')\n+    if rule == '':\n+        rule = '/'\n",
      testSh: "#!/bin/bash\npytest tests/test_blueprints.py",
      dockerfile: "FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -e .\nCMD [\"bash\"]",
      metadata: JSON.stringify({ framework: "pytest", stars: 67000 }),
      createdAt: new Date().toISOString(),
    },
    {
      id: "ex-py-02",
      olympusProjectId: pyProject.id,
      repoUrl: "https://github.com/tiangolo/fastapi",
      commitHash: "9f8e7d6c5b4a3928170e1d2c3b4a5f6e7d8c9b0a",
      language: "Python",
      category: "BUGFIX",
      taskPrompt: "FastAPI query parameter enum coercion returns 422 Unprocessable Entity when casing differs from definition.",
      testPatch: "diff --git a/tests/test_enums.py b/tests/test_enums.py\n--- a/tests/test_enums.py\n+++ b/tests/test_enums.py\n@@ -10,3 +10,10 @@\n+def test_enum_case_insensitivity():\n+    pass\n",
      solutionPatch: "diff --git a/fastapi/routing.py b/fastapi/routing.py\n--- a/fastapi/routing.py\n+++ b/fastapi/routing.py\n@@ -15,1 +15,2 @@\n",
      testSh: "#!/bin/bash\npytest tests/test_enums.py",
      dockerfile: "FROM python:3.10-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -e .",
      createdAt: new Date().toISOString(),
    }
  );

  // 5. Challenge Submissions
  data.challengeSubmission.push(
    {
      id: "sub-py-01",
      olympusProjectId: pyProject.id,
      repoUrl: "https://github.com/pallets/flask",
      commitHash: "7a1b3c5e89d2f01476839a2b4c5e6f7a8b9c0d1e",
      language: "Python",
      category: "BUGFIX",
      status: "READY",
      taskTitle: "Flask Blueprint trailing slash routing mismatch",
      taskPrompt: "When mounting a Blueprint with a trailing slash in its url_prefix (e.g. url_prefix='/api/'), nested route handlers registered with an empty path raise 404 instead of dispatching to index.\n\n## Reproduction Steps\n```python\nfrom flask import Flask, Blueprint\napp = Flask(__name__)\nbp = Blueprint('api', __name__, url_prefix='/api/')\n@bp.route('')\ndef index(): return 'ok'\napp.register_blueprint(bp)\n# GET /api/ returns 404 instead of expected 200 OK\n```\n\n## Expected Behavior\nEmpty route string on blueprint with trailing slash url_prefix should resolve cleanly to root index.",
      testSh: "#!/bin/bash\npytest tests/test_blueprints.py",
      testPatch: "diff --git a/tests/test_blueprints.py b/tests/test_blueprints.py\n--- a/tests/test_blueprints.py\n+++ b/tests/test_blueprints.py\n@@ -24,3 +24,14 @@\n+def test_blueprint_empty_route_trailing_slash():\n+    app = flask.Flask(__name__)\n+    bp = flask.Blueprint('api', __name__, url_prefix='/api/')\n+    @bp.route('')\n+    def index(): return 'ok'\n+    app.register_blueprint(bp)\n+    c = app.test_client()\n+    rv = c.get('/api/')\n+    assert rv.status_code == 200\n+    assert rv.data == b'ok'\n",
      solutionPatch: "diff --git a/src/flask/blueprints.py b/src/flask/blueprints.py\n--- a/src/flask/blueprints.py\n+++ b/src/flask/blueprints.py\n@@ -180,2 +180,4 @@\n-    rule = rule.lstrip('/')\n+    if rule == '':\n+        rule = '/'\n",
      dockerfile: "FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -e .\nCMD [\"bash\"]",
      qualityScore: 1.0,
      checks: JSON.stringify([
        { name: "Problem Description Authenticity & Length", passed: true, message: "Valid authentic prompt" },
        { name: "Test Patch Unified Diff Format & Test Isolation", passed: true, message: "Clean isolated diff" },
        { name: "Solution Patch Syntax Verification", passed: true, message: "Valid solution patch" },
        { name: "Execution Script (test.sh) Integrity", passed: true, message: "Valid pytest execution runner" },
        { name: "Container Recipe (Dockerfile) Standard", passed: true, message: "Standard container definition" },
      ]),
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sub-py-02",
      olympusProjectId: pyProject.id,
      repoUrl: "https://github.com/tiangolo/fastapi",
      commitHash: "9f8e7d6c5b4a3928170e1d2c3b4a5f6e7d8c9b0a",
      language: "Python",
      category: "BUGFIX",
      status: "READY",
      taskTitle: "FastAPI query parameter enum coercion failure",
      taskPrompt: "FastAPI query parameter enum coercion returns 422 Unprocessable Entity when casing differs from definition.",
      testSh: "#!/bin/bash\npytest tests/test_enums.py",
      testPatch: "diff --git a/tests/test_enums.py b/tests/test_enums.py\n--- a/tests/test_enums.py\n+++ b/tests/test_enums.py\n@@ -10,3 +10,10 @@\n+def test_enum_case(): pass\n",
      solutionPatch: "diff --git a/fastapi/routing.py b/fastapi/routing.py\n--- a/fastapi/routing.py\n+++ b/fastapi/routing.py\n@@ -15,1 +15,2 @@\n",
      dockerfile: "FROM python:3.10-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -e .",
      qualityScore: 0.95,
      createdAt: new Date(Date.now() - 43200000).toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "sub-py-03",
      olympusProjectId: pyProject.id,
      repoUrl: "https://github.com/psf/requests",
      commitHash: "3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e",
      language: "Python",
      category: "FEATURE_REQUEST",
      status: "REVIEW",
      taskTitle: "Requests connection pool timeout retry count mismatch",
      taskPrompt: "When setting max_retries on HTTPAdapter, exponential backoff jitter can cause premature pool exhaustion under high concurrency.",
      testSh: "#!/bin/bash\npytest tests/test_adapters.py",
      testPatch: "diff --git a/tests/test_adapters.py b/tests/test_adapters.py\n--- a/tests/test_adapters.py\n+++ b/tests/test_adapters.py\n@@ -5,2 +5,8 @@\n+def test_retries(): pass\n",
      solutionPatch: "diff --git a/requests/adapters.py b/requests/adapters.py\n--- a/requests/adapters.py\n+++ b/requests/adapters.py\n@@ -10,1 +10,3 @@\n",
      dockerfile: "FROM python:3.11-slim\nWORKDIR /app\nCOPY . .\nRUN pip install -e .",
      qualityScore: 0.85,
      createdAt: new Date(Date.now() - 20000000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  // 6. Agent Runs
  data.agentRun.push(
    {
      id: "run-py-01",
      olympusProjectId: pyProject.id,
      type: "VALIDATE",
      status: "COMPLETED",
      progress: 100,
      currentStep: "Submission ready for Quest Olympus export",
      logs: JSON.stringify([
        `[${new Date().toISOString().slice(11, 19)}] Validating submission...`,
        `[${new Date().toISOString().slice(11, 19)}]   [CHECK 1] Prompt Authenticity: PASS`,
        `[${new Date().toISOString().slice(11, 19)}]   [CHECK 2] Test Patch Isolation: PASS`,
        `[${new Date().toISOString().slice(11, 19)}]   [CHECK 3] Solution Patch Headers: PASS`,
        `[${new Date().toISOString().slice(11, 19)}]   [CHECK 4] test.sh Script Integrity: PASS`,
        `[${new Date().toISOString().slice(11, 19)}]   [CHECK 5] Dockerfile Recipe Standard: PASS`,
        `[${new Date().toISOString().slice(11, 19)}] All 5 automated checks passed (100%). Status: READY.`,
      ]),
      startedAt: new Date(Date.now() - 100000).toISOString(),
      completedAt: new Date().toISOString(),
      createdAt: new Date(Date.now() - 100000).toISOString(),
    },
    {
      id: "run-py-02",
      olympusProjectId: pyProject.id,
      type: "GENERATE",
      status: "COMPLETED",
      progress: 100,
      currentStep: "Patches synthesized without AI boilerplate",
      logs: JSON.stringify([
        `[${new Date().toISOString().slice(11, 19)}] Generating task description and patches...`,
        `[${new Date().toISOString().slice(11, 19)}] Synthesizing test.patch with strict isolation...`,
        `[${new Date().toISOString().slice(11, 19)}] Generating test.sh runner and Dockerfile container recipe...`,
      ]),
      startedAt: new Date(Date.now() - 200000).toISOString(),
      completedAt: new Date(Date.now() - 150000).toISOString(),
      createdAt: new Date(Date.now() - 200000).toISOString(),
    },
    {
      id: "run-py-03",
      olympusProjectId: pyProject.id,
      type: "ANALYZE",
      status: "COMPLETED",
      progress: 100,
      currentStep: "Assessment complete",
      logs: JSON.stringify([
        `[${new Date().toISOString().slice(11, 19)}] Evaluating candidate issues for benchmark suitability...`,
        `[${new Date().toISOString().slice(11, 19)}] Scored technical feasibility: 9.4/10`,
      ]),
      startedAt: new Date(Date.now() - 300000).toISOString(),
      completedAt: new Date(Date.now() - 250000).toISOString(),
      createdAt: new Date(Date.now() - 300000).toISOString(),
    },
    {
      id: "run-py-04",
      olympusProjectId: pyProject.id,
      type: "CRAWL",
      status: "COMPLETED",
      progress: 100,
      currentStep: "Candidate repos indexed",
      logs: JSON.stringify([
        `[${new Date().toISOString().slice(11, 19)}] Scanning active repositories with >= 500 stars...`,
        `[${new Date().toISOString().slice(11, 19)}] Indexed pallets/flask, tiangolo/fastapi, psf/requests.`,
      ]),
      startedAt: new Date(Date.now() - 400000).toISOString(),
      completedAt: new Date(Date.now() - 350000).toISOString(),
      createdAt: new Date(Date.now() - 400000).toISOString(),
    }
  );

  // 7. Repositories
  const repoFlask = {
    id: "repo-flask",
    githubId: 1001,
    owner: "pallets",
    name: "flask",
    fullName: "pallets/flask",
    description: "The Python micro framework for building web applications.",
    url: "https://github.com/pallets/flask",
    defaultBranch: "main",
    primaryLanguage: "Python",
    languages: JSON.stringify({ Python: 98, HTML: 2 }),
    topics: JSON.stringify(["python", "flask", "web-framework", "wsgi"]),
    stars: 67200,
    forks: 16100,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
  };

  const repoFastAPI = {
    id: "repo-fastapi",
    githubId: 1002,
    owner: "tiangolo",
    name: "fastapi",
    fullName: "tiangolo/fastapi",
    description: "FastAPI framework, high performance, easy to learn, fast to code, ready for production",
    url: "https://github.com/tiangolo/fastapi",
    defaultBranch: "master",
    primaryLanguage: "Python",
    languages: JSON.stringify({ Python: 100 }),
    topics: JSON.stringify(["fastapi", "python", "asyncio", "rest"]),
    stars: 76500,
    forks: 6400,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
  };

  const repoExpress = {
    id: "repo-express",
    githubId: 1003,
    owner: "expressjs",
    name: "express",
    fullName: "expressjs/express",
    description: "Fast, unopinionated, minimalist web framework for node.",
    url: "https://github.com/expressjs/express",
    defaultBranch: "master",
    primaryLanguage: "JavaScript",
    languages: JSON.stringify({ JavaScript: 100 }),
    topics: JSON.stringify(["express", "nodejs", "http"]),
    stars: 64100,
    forks: 15300,
    isPrivate: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    discoveredAt: new Date().toISOString(),
  };

  data.repository.push(repoFlask, repoFastAPI, repoExpress);

  // 8. License Verifications & LOC Measurements
  data.licenseVerification.push(
    {
      id: "lic-01",
      repositoryId: repoFlask.id,
      snapshotId: "snap-01",
      detectedIdentifier: "BSD-3-Clause",
      normalizedIdentifier: "BSD-3-Clause",
      status: "ALLOWED",
      source: "LICENSE.txt",
      evidence: "BSD 3-Clause License copyright Pallets",
      policyVersion: 1,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "lic-02",
      repositoryId: repoFastAPI.id,
      snapshotId: "snap-02",
      detectedIdentifier: "MIT",
      normalizedIdentifier: "MIT",
      status: "ALLOWED",
      source: "LICENSE",
      evidence: "MIT License copyright Sebastián Ramírez",
      policyVersion: 1,
      verifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
  );

  data.locMeasurement.push(
    {
      id: "loc-01",
      repositoryId: repoFlask.id,
      snapshotId: "snap-01",
      status: "MEASURED",
      totalLoc: 14800,
      nonblankLoc: 12200,
      codeLoc: 11400,
      languageBreakdown: JSON.stringify({ Python: 11400 }),
      exclusions: "[]",
      methodology: "ast-loc-v1",
      toolVersion: "1.0.0",
      measuredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    },
    {
      id: "loc-02",
      repositoryId: repoFastAPI.id,
      snapshotId: "snap-02",
      status: "MEASURED",
      totalLoc: 28400,
      nonblankLoc: 24100,
      codeLoc: 22800,
      languageBreakdown: JSON.stringify({ Python: 22800 }),
      exclusions: "[]",
      methodology: "ast-loc-v1",
      toolVersion: "1.0.0",
      measuredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
  );

  // 9. Issues & Candidates
  const issueFlask = {
    id: "issue-flask-01",
    repositoryId: repoFlask.id,
    githubId: 5001,
    number: 4892,
    title: "Blueprint empty route raises 404 when url_prefix ends with slash",
    body: "Mounting Blueprint with url_prefix='/api/' causes 404 for empty route handler.",
    labels: JSON.stringify(["bug", "routing"]),
    state: "closed",
    url: "https://github.com/pallets/flask/issues/4892",
    authorLogin: "app-developer",
    createdAtGh: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAtGh: new Date(Date.now() - 25 * 86400000).toISOString(),
    closedAtGh: new Date(Date.now() - 25 * 86400000).toISOString(),
    discoveredAt: new Date().toISOString(),
  };
  data.issue.push(issueFlask);

  const candidateFlask = {
    id: "cand-flask-01",
    issueId: issueFlask.id,
    repositoryId: repoFlask.id,
    technicalScore: 9.2,
    reproductionFeasibility: 9.5,
    complexityScore: 7.8,
    benchmarkSuitability: 9.4,
    assessmentNotes: "Clean reproduction in tests/test_blueprints.py. Clear minimal patch.",
    status: "approved",
    assessedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  data.issueCandidate.push(candidateFlask);

  // 10. Benchmarks
  data.benchmark.push({
    id: "bm-flask-01",
    issueCandidateId: candidateFlask.id,
    repositoryId: repoFlask.id,
    snapshotId: "snap-01",
    status: "PUBLISHED",
    version: 1,
    metadata: JSON.stringify({ language: "Python", framework: "Flask" }),
    problemDefinition: issueFlask.body,
    environment: JSON.stringify({ python: "3.11", runner: "pytest" }),
    qualityScore: 0.98,
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // 11. Learning Workspace & Knowledge Graph
  // 11. Learning Workspace & Knowledge Graph
  const workspace = {
    id: "ws-default",
    name: "Quest Olympus Platform Knowledge Base",
    description: "Synthesized task patterns, validation recipes, and container strategies for Quest Olympus.",
    userId: defaultUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.learningWorkspace.push(workspace);

  // Hierarchical Knowledge Nodes (Domains -> Topics -> Concepts / Patterns)
  // --- DOMAIN 1: Quest Olympus Benchmark Engineering ---
  const nodeDomainOlympus = {
    id: "kn-domain-olympus",
    workspaceId: workspace.id,
    parentId: null,
    type: "DOMAIN",
    name: "Quest Olympus Benchmark Engineering",
    definition: "Core principles and automated pipelines for synthesizing, verifying, and publishing high-star GitHub issue benchmarks.",
    confidence: 0.99,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeTopicPrompts = {
    id: "kn-topic-prompts",
    workspaceId: workspace.id,
    parentId: "kn-domain-olympus",
    type: "TOPIC",
    name: "Synthetic Problem Prompts",
    definition: "Framework for crafting realistic, non-AI human developer problem statements with authentic reproduction steps.",
    confidence: 0.96,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodePromptFormula = {
    id: "kn-01",
    workspaceId: workspace.id,
    parentId: "kn-topic-prompts",
    type: "REQUIREMENT_PATTERN",
    name: "Authentic Problem Definition Formula",
    definition: "Human developer voice: Reproduction code block, expected vs actual behavior, and zero AI conversational markers.",
    confidence: 0.96,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeReproTracing = {
    id: "kn-req-iso",
    workspaceId: workspace.id,
    parentId: "kn-topic-prompts",
    type: "REQUIREMENT_PATTERN",
    name: "Reproduction Scope & Error Tracing",
    definition: "Step-by-step minimal reproduction script highlighting the specific traceback and failure conditions.",
    confidence: 0.94,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeTopicTests = {
    id: "kn-topic-tests",
    workspaceId: workspace.id,
    parentId: "kn-domain-olympus",
    type: "TOPIC",
    name: "Isolated Patch Harnessing",
    definition: "Mechanisms to strictly isolate test assertions and ensure deterministic evaluation of agent fixes.",
    confidence: 0.97,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeTestHarness = {
    id: "kn-02",
    workspaceId: workspace.id,
    parentId: "kn-topic-tests",
    type: "TESTING_STRATEGY",
    name: "Isolated Regression Harness",
    definition: "test.patch strictly confined to tests/ directory. Passes when solution is applied; fails before fix.",
    confidence: 0.98,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodePassVerification = {
    id: "kn-eval-crit",
    workspaceId: workspace.id,
    parentId: "kn-topic-tests",
    type: "EVALUATION_CRITERION",
    name: "Pre-Fix vs Post-Fix Pass Verification",
    definition: "Automated verification confirming test fails on base commit and passes 100% on solution.patch.",
    confidence: 0.99,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // --- DOMAIN 2: Hermetic Execution & Containers ---
  const nodeDomainContainers = {
    id: "kn-domain-containers",
    workspaceId: workspace.id,
    parentId: null,
    type: "DOMAIN",
    name: "Hermetic Execution & Containers",
    definition: "Containerization strategies for safe, reproducible, and isolated benchmark challenge evaluation.",
    confidence: 0.98,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeTopicDocker = {
    id: "kn-topic-docker",
    workspaceId: workspace.id,
    parentId: "kn-domain-containers",
    type: "TOPIC",
    name: "Deterministic Dockerfile Recipes",
    definition: "Multi-stage Docker build recipes providing pinned system dependencies and reproducible execution environments.",
    confidence: 0.95,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeDockerRecipe = {
    id: "kn-03",
    workspaceId: workspace.id,
    parentId: "kn-topic-docker",
    type: "ARCHITECTURE_PATTERN",
    name: "Deterministic Base Container",
    definition: "Official slim base image, copy source, install editable package, non-root execution.",
    confidence: 0.95,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeRootlessSecurity = {
    id: "kn-code-pat",
    workspaceId: workspace.id,
    parentId: "kn-topic-docker",
    type: "CODE_PATTERN",
    name: "Rootless Execution & Secret Redaction",
    definition: "Sanitizing environment variables, blocking outbound internet where applicable, and running under non-root uid.",
    confidence: 0.93,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // --- DOMAIN 3: Systems Concurrency & Async Pipelines ---
  const nodeDomainConcurrency = {
    id: "kn-domain-concurrency",
    workspaceId: workspace.id,
    parentId: null,
    type: "DOMAIN",
    name: "Systems Concurrency & Async Pipelines",
    definition: "High-throughput asynchronous worker pools, event loop integrity, and leak prevention algorithms.",
    confidence: 0.96,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeTopicAsync = {
    id: "kn-topic-async",
    workspaceId: workspace.id,
    parentId: "kn-domain-concurrency",
    type: "TOPIC",
    name: "Async Streaming Worker Pools",
    definition: "Pattern for managing inflight worker coroutines with timeout and graceful shutdown.",
    confidence: 0.94,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const nodeGracefulShutdown = {
    id: "kn-sol-strat",
    workspaceId: workspace.id,
    parentId: "kn-topic-async",
    type: "SOLUTION_STRATEGY",
    name: "Graceful Task Drain & Teardown",
    definition: "Timeout-bounded task gather with exception catching, buffer draining, and clean worker pool termination.",
    confidence: 0.96,
    reviewStatus: "approved",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  data.knowledgeNode.push(
    nodeDomainOlympus,
    nodeTopicPrompts,
    nodePromptFormula,
    nodeReproTracing,
    nodeTopicTests,
    nodeTestHarness,
    nodePassVerification,
    nodeDomainContainers,
    nodeTopicDocker,
    nodeDockerRecipe,
    nodeRootlessSecurity,
    nodeDomainConcurrency,
    nodeTopicAsync,
    nodeGracefulShutdown
  );

  // Knowledge Edges
  data.knowledgeEdge.push(
    {
      id: "ke-01",
      workspaceId: workspace.id,
      sourceNodeId: nodePromptFormula.id,
      targetNodeId: nodeTestHarness.id,
      type: "DEPENDS_ON",
      confidence: 0.95,
      createdAt: new Date().toISOString(),
    },
    {
      id: "ke-02",
      workspaceId: workspace.id,
      sourceNodeId: nodeTestHarness.id,
      targetNodeId: nodeDockerRecipe.id,
      type: "TESTED_BY",
      confidence: 0.98,
      createdAt: new Date().toISOString(),
    },
    {
      id: "ke-03",
      workspaceId: workspace.id,
      sourceNodeId: nodePassVerification.id,
      targetNodeId: nodeTestHarness.id,
      type: "EVALUATES",
      confidence: 0.99,
      createdAt: new Date().toISOString(),
    },
    {
      id: "ke-04",
      workspaceId: workspace.id,
      sourceNodeId: nodeGracefulShutdown.id,
      targetNodeId: nodeTopicAsync.id,
      type: "IMPLEMENTS",
      confidence: 0.95,
      createdAt: new Date().toISOString(),
    }
  );

  // 12. Seed Default Task Package
  const demoTaskPkg = {
    id: "task-pkg-01",
    workspaceId: workspace.id,
    title: "Async Stream Pipeline Memory Leak & Rejection Guard",
    description: "Benchmark testing worker pool buffer release and unhandled promise rejection prevention under simulated abort signals.",
    domain: "Python Backend & Systems",
    category: "Concurrency & Memory Management",
    approvalStatus: "APPROVED",
    tags: JSON.stringify(["python", "asyncio", "pytest", "docker", "benchmark-task"]),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  data.taskPackage.push(demoTaskPkg);

  data.uploadedDocument.push(
    {
      id: "doc-01",
      taskPackageId: demoTaskPkg.id,
      filename: "problem.md",
      originalName: "problem.md",
      mimeType: "text/markdown",
      size: 1420,
      storagePath: `/uploads/${demoTaskPkg.id}/problem.md`,
      extractedText: `# Async Stream Pipeline Memory Leak & Rejection Guard\n\n## Problem Statement\nIn high-concurrency streaming pipelines, the worker pool fails to release completed chunk buffers on client disconnects.\n\n## Reproduction Steps\n1. Initialize StreamingWorkerPool with concurrency = 4.\n2. Dispatch burst of 100 streaming tasks.\n3. Signal abort midway through processing.\n4. Check buffer memory allocation: buffers remain leaked in memory.`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "doc-02",
      taskPackageId: demoTaskPkg.id,
      filename: "test.patch",
      originalName: "test.patch",
      mimeType: "text/x-diff",
      size: 1840,
      storagePath: `/uploads/${demoTaskPkg.id}/test.patch`,
      extractedText: `diff --git a/tests/test_stream_pipeline.py b/tests/test_stream_pipeline.py\nnew file mode 100644\n--- /dev/null\n+++ b/tests/test_stream_pipeline.py\n@@ -0,0 +1,28 @@\n+import pytest\n+import asyncio\n+from stream_pipeline import StreamingWorkerPool, AbortSignal\n+\n+@pytest.mark.asyncio\n+async def test_worker_pool_graceful_shutdown():\n+    pool = StreamingWorkerPool(concurrency=4)\n+    signal = AbortSignal()\n+    task = pool.dispatch(lambda: asyncio.sleep(0.4), signal=signal)\n+    signal.abort(reason="Client disconnected")\n+    result = await pool.drain(timeout=1.0)\n+    assert result.is_drained is True\n+    assert pool.active_workers == 0\n+    assert pool.has_leaked_buffers() is False\n`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "doc-03",
      taskPackageId: demoTaskPkg.id,
      filename: "solution.patch",
      originalName: "solution.patch",
      mimeType: "text/x-diff",
      size: 1530,
      storagePath: `/uploads/${demoTaskPkg.id}/solution.patch`,
      extractedText: `diff --git a/src/stream_pipeline.py b/src/stream_pipeline.py\n--- a/src/stream_pipeline.py\n+++ b/src/stream_pipeline.py\n@@ -42,8 +42,15 @@ class StreamingWorkerPool:\n         if signal and signal.is_aborted:\n-            return None\n+            self._cleanup_buffer(task_id)\n+            raise PipelineError("Task aborted prior to execution")\n`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "doc-04",
      taskPackageId: demoTaskPkg.id,
      filename: "Dockerfile",
      originalName: "Dockerfile",
      mimeType: "text/x-dockerfile",
      size: 420,
      storagePath: `/uploads/${demoTaskPkg.id}/Dockerfile`,
      extractedText: `FROM python:3.11-slim\nWORKDIR /workspace\nCOPY requirements.txt .\nRUN pip install --no-cache-dir pytest pytest-asyncio\nCOPY . .\nCMD ["pytest", "-v", "tests/"]\n`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "doc-05",
      taskPackageId: demoTaskPkg.id,
      filename: "test.sh",
      originalName: "test.sh",
      mimeType: "application/x-sh",
      size: 260,
      storagePath: `/uploads/${demoTaskPkg.id}/test.sh`,
      extractedText: `#!/usr/bin/env bash\nset -eo pipefail\npytest tests/test_stream_pipeline.py -v --tb=short\nexit 0\n`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );

  data.extractedRequirement.push(
    {
      id: "req-01",
      taskPackageId: demoTaskPkg.id,
      content: "Ensure aborted jobs drain inflight microtasks immediately and release buffer memory.",
      type: "FUNCTIONAL",
      priority: "CRITICAL",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "req-02",
      taskPackageId: demoTaskPkg.id,
      content: "Must pass tests/test_stream_pipeline.py with pytest under Python 3.11.",
      type: "TESTING",
      priority: "HIGH",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  );
}

// Filter helper
function matchesFilter(item: any, where?: Record<string, any>): boolean {
  if (!where || Object.keys(where).length === 0) return true;

  for (const [key, val] of Object.entries(where)) {
    if (key === "OR" && Array.isArray(val)) {
      const orMatched = val.some((subWhere) => matchesFilter(item, subWhere));
      if (!orMatched) return false;
      continue;
    }

    if (key === "AND" && Array.isArray(val)) {
      const andMatched = val.every((subWhere) => matchesFilter(item, subWhere));
      if (!andMatched) return false;
      continue;
    }

    const itemVal = item[key];

    if (val === null) {
      if (itemVal !== null && itemVal !== undefined) return false;
      continue;
    }

    if (typeof val === "object" && val !== null) {
      if ("equals" in val && itemVal !== val.equals) return false;
      if ("in" in val && Array.isArray(val.in) && !val.in.includes(itemVal)) return false;
      if ("notIn" in val && Array.isArray(val.notIn) && val.notIn.includes(itemVal)) return false;
      if ("contains" in val) {
        const itemStr = String(itemVal ?? "").toLowerCase();
        const searchStr = String(val.contains ?? "").toLowerCase();
        if (!itemStr.includes(searchStr)) return false;
      }
      if ("gt" in val && !(itemVal > val.gt)) return false;
      if ("gte" in val && !(itemVal >= val.gte)) return false;
      if ("lt" in val && !(itemVal < val.lt)) return false;
      if ("lte" in val && !(itemVal <= val.lte)) return false;
      continue;
    }

    if (itemVal !== val) return false;
  }

  return true;
}

// Model repository factory
function createModelOps(modelKey: string) {
  return {
    async findUnique({ where, include }: { where: Record<string, any>; include?: Record<string, any> }) {
      seedInitialData();
      const list = data[modelKey] || [];
      const item = list.find((it: any) => matchesFilter(it, where));
      if (!item) return null;
      return populateItem(modelKey, { ...item }, include);
    },

    async findFirst({ where, orderBy, include }: { where?: Record<string, any>; orderBy?: any; include?: Record<string, any> }) {
      seedInitialData();
      const list = data[modelKey] || [];
      let filtered = list.filter((it: any) => matchesFilter(it, where));
      if (orderBy) sortList(filtered, orderBy);
      if (filtered.length === 0) return null;
      return populateItem(modelKey, { ...filtered[0] }, include);
    },

    async findMany({ where, orderBy, take, skip, include }: { where?: Record<string, any>; orderBy?: any; take?: number; skip?: number; include?: Record<string, any> }) {
      seedInitialData();
      const list = data[modelKey] || [];
      let filtered = list.filter((it: any) => matchesFilter(it, where));
      if (orderBy) sortList(filtered, orderBy);
      const start = skip ?? 0;
      const end = take !== undefined ? start + take : undefined;
      const sliced = filtered.slice(start, end);
      return sliced.map((it: any) => populateItem(modelKey, { ...it }, include));
    },

    async count({ where }: { where?: Record<string, any> } = {}) {
      seedInitialData();
      const list = data[modelKey] || [];
      return list.filter((it: any) => matchesFilter(it, where)).length;
    },

    async create({ data: newItem, include }: { data: any; include?: Record<string, any> }) {
      seedInitialData();
      const list = data[modelKey] || [];
      const record = {
        id: newItem.id || `gen-${String(modelKey)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...newItem,
      };
      list.unshift(record);
      return populateItem(modelKey, { ...record }, include);
    },

    async update({ where, data: patch, include }: { where: Record<string, any>; data: any; include?: Record<string, any> }) {
      seedInitialData();
      const list = data[modelKey] || [];
      const idx = list.findIndex((it: any) => matchesFilter(it, where));
      if (idx === -1) {
        throw new Error(`Record to update not found in ${String(modelKey)}`);
      }
      list[idx] = {
        ...list[idx],
        ...patch,
        updatedAt: new Date().toISOString(),
      };
      return populateItem(modelKey, { ...list[idx] }, include);
    },

    async upsert({ where, create, update, include }: { where: Record<string, any>; create: any; update: any; include?: Record<string, any> }) {
      seedInitialData();
      const list = data[modelKey] || [];
      const idx = list.findIndex((it: any) => matchesFilter(it, where));
      if (idx >= 0) {
        list[idx] = {
          ...list[idx],
          ...update,
          updatedAt: new Date().toISOString(),
        };
        return populateItem(modelKey, { ...list[idx] }, include);
      } else {
        const record = {
          id: create.id || `gen-${String(modelKey)}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...create,
        };
        list.unshift(record);
        return populateItem(modelKey, { ...record }, include);
      }
    },

    async delete({ where }: { where: Record<string, any> }) {
      seedInitialData();
      const list = data[modelKey] || [];
      const idx = list.findIndex((it: any) => matchesFilter(it, where));
      if (idx >= 0) {
        const removed = list.splice(idx, 1)[0];
        return removed;
      }
      throw new Error(`Record to delete not found in ${String(modelKey)}`);
    },

    async deleteMany({ where }: { where?: Record<string, any> } = {}) {
      seedInitialData();
      const list = data[modelKey] || [];
      const initialCount = list.length;
      data[modelKey] = list.filter((it: any) => !matchesFilter(it, where));
      return { count: initialCount - data[modelKey].length };
    },
  };
}

function sortList(list: any[], orderBy: any) {
  if (!orderBy) return;
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy];
  list.sort((a, b) => {
    for (const entry of entries) {
      for (const [k, dir] of Object.entries(entry)) {
        const valA = a[k];
        const valB = b[k];
        if (valA === valB) continue;
        const multiplier = dir === "desc" ? -1 : 1;
        return (valA > valB ? 1 : -1) * multiplier;
      }
    }
    return 0;
  });
}

function populateItem(modelKey: string, item: any, include?: Record<string, any>) {
  if (!include || !item) return item;

  // Handle _count
  if (include._count && modelKey === "olympusProject") {
    item._count = {
      challengeSubmissions: data.challengeSubmission.filter((s: any) => s.olympusProjectId === item.id).length,
      approvedTaskExamples: data.approvedTaskExample.filter((e: any) => e.olympusProjectId === item.id).length,
      agentRuns: data.agentRun.filter((r: any) => r.olympusProjectId === item.id).length,
    };
  }

  // Relations for olympusProject
  if (modelKey === "olympusProject") {
    if (include.challengeSubmissions) {
      item.challengeSubmissions = data.challengeSubmission.filter((s: any) => s.olympusProjectId === item.id);
    }
    if (include.approvedTaskExamples) {
      item.approvedTaskExamples = data.approvedTaskExample.filter((e: any) => e.olympusProjectId === item.id);
    }
    if (include.agentRuns) {
      item.agentRuns = data.agentRun.filter((r: any) => r.olympusProjectId === item.id);
    }
  }

  // Relations for repository
  if (modelKey === "repository") {
    if (include.licenseVerifications) {
      item.licenseVerifications = data.licenseVerification.filter((l: any) => l.repositoryId === item.id);
    }
    if (include.locMeasurements) {
      item.locMeasurements = data.locMeasurement.filter((m: any) => m.repositoryId === item.id);
    }
  }

  // Relations for benchmark
  if (modelKey === "benchmark") {
    if (include.repository) {
      item.repository = data.repository.find((r: any) => r.id === item.repositoryId) || null;
    }
    if (include.issueCandidate) {
      const cand = data.issueCandidate.find((c: any) => c.id === item.issueCandidateId);
      if (cand) {
        const candCopy = { ...cand };
        if (include.issueCandidate?.include?.issue) {
          candCopy.issue = data.issue.find((i: any) => i.id === cand.issueId) || null;
        }
        item.issueCandidate = candCopy;
      }
    }
  }

  // Relations for issueCandidate
  if (modelKey === "issueCandidate") {
    if (include.issue) {
      item.issue = data.issue.find((i: any) => i.id === item.issueId) || null;
    }
    if (include.repository) {
      item.repository = data.repository.find((r: any) => r.id === item.repositoryId) || null;
    }
  }

  // Relations for agentRun
  if (modelKey === "agentRun") {
    if (include.olympusProject) {
      item.olympusProject = data.olympusProject.find((p: any) => p.id === item.olympusProjectId) || null;
    }
    if (include.submission) {
      item.submission = data.challengeSubmission.find((s: any) => s.id === item.submissionId) || null;
    }
  }

  // Relations for challengeSubmission
  if (modelKey === "challengeSubmission") {
    if (include.olympusProject) {
      item.olympusProject = data.olympusProject.find((p: any) => p.id === item.olympusProjectId) || null;
    }
    if (include.repository) {
      item.repository = data.repository.find((r: any) => r.id === item.repositoryId) || null;
    }
    if (include.agentRuns) {
      item.agentRuns = data.agentRun.filter((r: any) => r.submissionId === item.id);
    }
  }

  // Relations for taskPackage
  if (modelKey === "taskPackage") {
    if (include._count) {
      item._count = {
        uploadedDocuments: data.uploadedDocument.filter((d: any) => d.taskPackageId === item.id).length,
        extractedRequirements: data.extractedRequirement.filter((r: any) => r.taskPackageId === item.id).length,
      };
    }
    if (include.uploadedDocuments) {
      item.uploadedDocuments = data.uploadedDocument.filter((d: any) => d.taskPackageId === item.id);
    }
    if (include.extractedRequirements) {
      item.extractedRequirements = data.extractedRequirement.filter((r: any) => r.taskPackageId === item.id);
    }
  }

  // Relations for knowledgeNode
  if (modelKey === "knowledgeNode") {
    const childrenList = (data.knowledgeNode || []).filter((n: any) => n.parentId === item.id);
    const outgoingList = (data.knowledgeEdge || []).filter((e: any) => e.sourceNodeId === item.id);
    const incomingList = (data.knowledgeEdge || []).filter((e: any) => e.targetNodeId === item.id);

    if (include._count) {
      item._count = {
        children: childrenList.length,
        outgoingEdges: outgoingList.length,
        incomingEdges: incomingList.length,
      };
    }
    if (include.children) {
      item.children = childrenList.map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        confidence: c.confidence ?? 0.8,
        definition: c.definition,
      }));
    }
    if (include.outgoingEdges) {
      item.outgoingEdges = outgoingList;
    }
    if (include.incomingEdges) {
      item.incomingEdges = incomingList;
    }
    if (include.parent && item.parentId) {
      const parentNode = (data.knowledgeNode || []).find((n: any) => n.id === item.parentId);
      item.parent = parentNode ? { id: parentNode.id, name: parentNode.name, type: parentNode.type } : null;
    }
  }

  // Relations for learningWorkspace
  if (modelKey === "learningWorkspace") {
    if (include._count) {
      item._count = {
        taskPackages: (data.taskPackage || []).filter((t: any) => t.workspaceId === item.id).length,
        knowledgeNodes: (data.knowledgeNode || []).filter((n: any) => n.workspaceId === item.id).length,
        knowledgeEdges: (data.knowledgeEdge || []).filter((e: any) => e.workspaceId === item.id).length,
        generatedDrafts: (data.generatedDraft || []).filter((d: any) => d.workspaceId === item.id).length,
      };
    }
    if (include.knowledgeNodes) {
      item.knowledgeNodes = (data.knowledgeNode || []).filter((n: any) => n.workspaceId === item.id);
    }
    if (include.taskPackages) {
      item.taskPackages = (data.taskPackage || []).filter((t: any) => t.workspaceId === item.id);
    }
  }

  // Relations for generatedDraft
  if (modelKey === "generatedDraft") {
    if (include._count) {
      item._count = {
        humanReviews: (data.humanReview || []).filter((r: any) => r.generatedDraftId === item.id).length,
        learningFeedback: (data.learningFeedback || []).filter((f: any) => f.generatedDraftId === item.id).length,
      };
    }
    if (include.workspace) {
      item.workspace = (data.learningWorkspace || []).find((w: any) => w.id === item.workspaceId) || { id: item.workspaceId, name: "Workspace" };
    }
  }

  return item;
}

export function getFallbackStore(): FallbackStore {
  if (!globalThis.__benchforgeFallbackStore) {
    seedInitialData();

    const store: any = {
      isDbUnavailable: () => Boolean(globalThis.__benchforgeDbUnavailable),
      markDbUnavailable: () => {
        if (!globalThis.__benchforgeDbUnavailable) {
          console.warn("[BenchForge DB Layer] Database connection offline. Switching to high-performance fallback store.");
          globalThis.__benchforgeDbUnavailable = true;
        }
      },
      markDbAvailable: () => {
        globalThis.__benchforgeDbUnavailable = false;
      },
    };

    const modelNames: string[] = [
      "olympusProject",
      "challengeSubmission",
      "approvedTaskExample",
      "agentRun",
      "repository",
      "repositorySnapshot",
      "licenseVerification",
      "locMeasurement",
      "issue",
      "pullRequest",
      "issueCandidate",
      "benchmarkJob",
      "benchmark",
      "analysisEvidence",
      "learningWorkspace",
      "taskPackage",
      "uploadedDocument",
      "extractedRequirement",
      "knowledgeNode",
      "knowledgeEdge",
      "sourceEvidence",
      "reusablePattern",
      "learningJob",
      "generatedDraft",
      "humanReview",
      "learningFeedback",
      "auditLog",
      "user",
      "licensePolicy",
    ];

    for (const model of modelNames) {
      store[model] = createModelOps(model);
    }

    globalThis.__benchforgeFallbackStore = store;
  }

  return globalThis.__benchforgeFallbackStore!;
}

