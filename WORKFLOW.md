# 🤖 BenchForge Autonomous Agent Workflow

## 📋 Complete End-to-End Process

### Phase 1: Knowledge Acquisition (Learning from Approved Tasks)

#### 1.1 Upload Multi-Task ZIP
```
User → Upload ZIP (3 approved tasks)
  ├── task-1/
  │   ├── problem.md
  │   ├── test.patch
  │   ├── solution.patch
  │   ├── Dockerfile
  │   └── test.sh
  ├── task-2/
  │   ├── problem.md
  │   ├── test.patch
  │   ├── solution.patch
  │   ├── Dockerfile
  │   └── test.sh
  └── task-3/
      ├── problem.md
      ├── test.patch
      ├── solution.patch
      ├── Dockerfile
      └── test.sh
```

#### 1.2 Server-Side Extraction
```javascript
POST /api/learning/tasks/upload-zip
{
  "workspaceId": "workspace-id",
  "zipFileBase64": "...",
  "filename": "approved-tasks.zip"
}

↓

Multi-Task Parser (zip-multi-task-parser.ts)
  → Detects 3 task folders
  → Extracts each task separately
  → Creates 3 TaskPackage records

For EACH task:
  1. Create TaskPackage (title, domain, category, tags)
  2. Store ALL files as UploadedDocument records:
     - problem.md → text/markdown
     - test.patch → text/x-diff
     - solution.patch → text/x-diff
     - Dockerfile → text/x-dockerfile
     - test.sh → application/x-sh
  3. Extract & store requirements from task
  4. Synthesize knowledge nodes
```

#### 1.3 Knowledge Graph Building
```sql
-- For each synthesized knowledge node from all 3 tasks:

IF similar node exists:
  → Increase confidence score (+0.05, max 1.0)
  → Add this task ID to relatedTaskIds array
  → Pattern reinforcement

ELSE:
  → Create new KnowledgeNode
  → Set initial confidence (0.85-0.95)
  → Link to source task

Knowledge Node Types:
- DOMAIN: "Python Backend & Systems"
- TESTING_STRATEGY: "pytest Assertion Pattern"
- SOLUTION_STRATEGY: "Targeted Patch (stream_pipeline.py)"
- ARCHITECTURE_PATTERN: "Dockerized Container Recipe"
- EVALUATION_CRITERION: "Zero Regression & Hermetic Verification"
```

**Result**: AI now has learned patterns from 3 approved tasks stored in knowledge graph.

---

### Phase 2: Autonomous Generation (Agent Workflow)

#### 2.1 Repository Crawling
```javascript
Trigger: User clicks "Start Autonomous Agent" on Olympus Project

Agent Engine (agent-engine.ts) starts:
  1. Search GitHub repos matching:
     - Primary language (Python/JavaScript/TypeScript/Go/Rust)
     - Min stars (e.g., 100+)
     - Has test suite
     - Active (pushed within last year)
     - Open source license
  
  2. For each eligible repo:
     - Check license (MIT, Apache, BSD allowed)
     - Measure LOC (must be > 200 lines)
     - Store Repository record
```

#### 2.2 Issue Discovery (OPEN ONLY!)
```javascript
For each eligible repository:
  
  fetchIssues(octokit, owner, repo, {
    state: "open", // 🔥 CRITICAL: Only open issues
    maxPages: 1
  })

  Filter criteria:
    ✅ Issue state = "open"
    ✅ Not a pull request
    ✅ Has description/body
    ✅ Created/updated recently
    ❌ Skip closed issues
    ❌ Skip stale (>2 years old)

  Store Issue record:
    - repositoryId
    - number
    - title
    - body
    - state: "open"
    - url
    - createdAt
    - updatedAt
```

#### 2.3 Solution Generation
```javascript
For each OPEN issue:

  1. Query Knowledge Graph:
     - Find relevant patterns from learned tasks
     - Match by domain, language, test framework
     - Get confidence-weighted strategies

  2. Generate Submission:
     a. problem.md:
        - Issue title + body
        - Reproduction steps
        - Expected behavior

     b. test.patch:
        - Query learned testing strategies
        - Generate isolated test case
        - Use framework from knowledge graph
        - Apply pytest/vitest/jest patterns

     c. solution.patch:
        - Query learned solution strategies
        - Generate minimal fix
        - Follow pattern confidence scores
        - Keep changes surgical

     d. Dockerfile:
        - Query learned architecture patterns
        - Use base image from similar tasks
        - Install dependencies
        - Set up environment

     e. test.sh:
        - Copy runner pattern from learned tasks
        - Adapt to test framework
        - Include verification steps

  3. Quality Scoring:
     quality = (
       hasAllFiles * 0.25 +
       testCoverage * 0.20 +
       solutionMinimal * 0.15 +
       dockerComplete * 0.15 +
       patternMatch * 0.15 +
       confidence * 0.10
     )

  4. Create ChallengeSubmission:
     - projectId
     - taskTitle (from issue)
     - taskPrompt (problem.md)
     - testSh, testPatch, solutionPatch, dockerfile
     - language, category
     - repoUrl, commitHash
     - qualityScore
     - status: "DRAFT" → "READY" (if quality >= 0.70)
```

#### 2.4 Completion Notification
```javascript
When submission reaches status = "READY":
  
  Notification:
    "✅ 1 task building completed!"
    
  Details:
    - Task: "Fix async stream pipeline memory leak"
    - Repository: pallets/flask
    - Issue: #4892
    - Quality: 92%
    - Status: READY
    - Files: problem.md, test.patch, solution.patch, Dockerfile, test.sh
```

---

### Phase 3: Export & Manual Submission

#### 3.1 User Review
```
User navigates to: Projects → [Project Name] → Submissions

Sees:
  ✅ Ready to Export (12)
  🔧 In Progress (3)
  📝 Draft (5)

Clicks on submission:
  → View all files
  → Check quality score
  → Preview patches
  → Verify Dockerfile
```

#### 3.2 Export Olympus-Compliant ZIP
```javascript
User clicks: "Preview & Export"

ExportPreviewModal validation:
  ✅ problem.md exists & non-empty
  ✅ test.patch exists & valid diff
  ✅ solution.patch exists & valid diff
  ✅ Dockerfile exists & has FROM
  ✅ test.sh exists & executable
  ✅ Quality score >= 70%

If valid:
  → Generate ZIP:
      olympus-submission-[id]-[timestamp].zip
        ├── task.md (renamed from problem.md)
        ├── test.patch
        ├── solution.patch
        ├── Dockerfile
        └── test.sh

  → Download to user's local device
```

#### 3.3 Batch Export (Multiple Submissions)
```javascript
User selects 5 submissions:
  ✅ task-1
  ✅ task-2
  ✅ task-3
  ✅ task-4
  ✅ task-5

Clicks: "Batch Export"

Generates:
  olympus-batch-export-[projectId]-[timestamp].zip
    ├── task-async-stream-leak-sub123/
    │   ├── task.md
    │   ├── test.patch
    │   ├── solution.patch
    │   ├── Dockerfile
    │   └── test.sh
    ├── task-http-chunked-gzip-sub124/
    │   ├── task.md
    │   ├── test.patch
    │   ├── solution.patch
    │   ├── Dockerfile
    │   └── test.sh
    └── ... (3 more)

→ Download batch ZIP to local device
```

#### 3.4 Manual Submission to Shipd.ai
```
User:
  1. Extracts downloaded ZIP(s)
  2. Reviews generated solutions
  3. Opens Shipd.ai/Olympus platform
  4. Uploads task ZIP manually
  5. Submits for bounty
  6. Waits for approval
  7. Gets paid! 💰
```

---

## 🔄 Continuous Learning Loop

```
1. Manual Submission → Approved by Shipd.ai
2. User downloads approved task ZIP
3. Upload back to BenchForge (Knowledge Studio)
4. Knowledge graph updated with new patterns
5. Confidence scores increase
6. Future generations use improved patterns
7. Quality scores improve over time

→ Self-improving AI agent!
```

---

## 📊 Key Metrics Tracked

### Dashboard Metrics (Real-Time)
- Total Submissions
- Ready to Export (quality >= 70%)
- Average Quality Score
- Completion Rate
- Submissions This Week vs Last Week
- Top Category (SWE, ML, DS, DevOps)
- Top Language (Python, JS, Go, Rust)

### Knowledge Graph Metrics
- Total Knowledge Nodes
- Total Knowledge Edges
- Total Task Packages (approved examples)
- Uploaded Documents
- Extracted Requirements
- Pattern Confidence Distribution

### Repository Metrics
- Repositories Crawled
- License Eligible
- LOC Eligible
- Issues Discovered (OPEN only)
- Active Jobs

---

## 🛡️ Quality Gates

### Before Export (70% Minimum)
```javascript
if (qualityScore < 0.70) {
  → Status = "DRAFT"
  → Export button DISABLED
  → Show warning: "Improve quality before export"
}

if (qualityScore >= 0.70) {
  → Status = "READY"
  → Export button ENABLED
  → Green badge: "Ready to submit"
}
```

### File Validation
```javascript
Required files:
  ✅ problem.md OR task.md
  ✅ test.patch (valid unified diff)
  ✅ solution.patch (valid unified diff)
  ✅ Dockerfile (has FROM statement)
  ✅ test.sh (bash script)

Optional files:
  ○ metadata.json
  ○ requirements.txt
  ○ Additional patches
```

---

## 🎯 Summary

**Input**: 3 approved task ZIPs → Upload to Knowledge Studio  
**Learning**: AI extracts patterns, builds knowledge graph  
**Crawling**: Agent finds OPEN GitHub issues from eligible repos  
**Generation**: Creates Olympus-compliant submissions using learned patterns  
**Notification**: "1 task building completed!" when ready  
**Export**: Download ZIP(s) to local device  
**Submission**: Manual upload to Shipd.ai for bounties  

**Result**: Automated Olympus task creation at scale! 🚀
