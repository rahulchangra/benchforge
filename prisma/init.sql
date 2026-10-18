-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "githubId" TEXT,
    "githubToken" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LicensePolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "version" INTEGER NOT NULL,
    "allowedIdentifiers" TEXT NOT NULL,
    "ccByIdentifiers" TEXT NOT NULL,
    "effectiveFrom" DATETIME NOT NULL,
    "createdById" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LicensePolicy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "githubId" INTEGER NOT NULL,
    "owner" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "description" TEXT,
    "url" TEXT NOT NULL,
    "defaultBranch" TEXT NOT NULL,
    "primaryLanguage" TEXT,
    "languages" TEXT,
    "topics" TEXT,
    "stars" INTEGER NOT NULL DEFAULT 0,
    "forks" INTEGER NOT NULL DEFAULT 0,
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RepositorySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "commitSha" TEXT NOT NULL,
    "snapshotAt" DATETIME NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RepositorySnapshot_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LicenseVerification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "detectedIdentifier" TEXT,
    "normalizedIdentifier" TEXT,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "verifiedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LicenseVerification_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LicenseVerification_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RepositorySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LocMeasurement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "totalLoc" INTEGER,
    "nonblankLoc" INTEGER,
    "codeLoc" INTEGER,
    "languageBreakdown" TEXT,
    "exclusions" TEXT NOT NULL,
    "methodology" TEXT NOT NULL,
    "toolVersion" TEXT NOT NULL,
    "measuredAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LocMeasurement_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LocMeasurement_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RepositorySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "labels" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "authorLogin" TEXT,
    "createdAtGh" DATETIME NOT NULL,
    "updatedAtGh" DATETIME NOT NULL,
    "closedAtGh" DATETIME,
    "discoveredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Issue_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PullRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repositoryId" TEXT NOT NULL,
    "githubId" INTEGER NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "mergedAt" DATETIME,
    "mergeCommitSha" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PullRequest_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "IssueCandidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "technicalScore" REAL,
    "reproductionFeasibility" REAL,
    "complexityScore" REAL,
    "benchmarkSuitability" REAL,
    "assessmentNotes" TEXT,
    "relatedPrId" TEXT,
    "fixCommitSha" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" TEXT,
    "assessedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IssueCandidate_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IssueCandidate_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IssueCandidate_relatedPrId_fkey" FOREIGN KEY ("relatedPrId") REFERENCES "PullRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BenchmarkJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueCandidateId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "logs" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BenchmarkJob_issueCandidateId_fkey" FOREIGN KEY ("issueCandidateId") REFERENCES "IssueCandidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Benchmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issueCandidateId" TEXT NOT NULL,
    "repositoryId" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "metadata" TEXT NOT NULL,
    "problemDefinition" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "validationEvidence" TEXT,
    "patchInfo" TEXT,
    "qualityScore" REAL,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Benchmark_issueCandidateId_fkey" FOREIGN KEY ("issueCandidateId") REFERENCES "IssueCandidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Benchmark_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Benchmark_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RepositorySnapshot" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AnalysisEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "benchmarkId" TEXT,
    "repositoryId" TEXT NOT NULL,
    "snapshotId" TEXT,
    "type" TEXT NOT NULL,
    "tool" TEXT NOT NULL,
    "toolVersion" TEXT,
    "input" TEXT,
    "output" TEXT NOT NULL,
    "filePath" TEXT,
    "lineRange" TEXT,
    "commitSha" TEXT,
    "fileHash" TEXT,
    "confidence" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AnalysisEvidence_benchmarkId_fkey" FOREIGN KEY ("benchmarkId") REFERENCES "Benchmark" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AnalysisEvidence_repositoryId_fkey" FOREIGN KEY ("repositoryId") REFERENCES "Repository" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AnalysisEvidence_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "RepositorySnapshot" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningWorkspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningWorkspace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TaskPackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "domain" TEXT,
    "category" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "approvalEvidence" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TaskPackage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "LearningWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UploadedDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskPackageId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "extractedText" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UploadedDocument_taskPackageId_fkey" FOREIGN KEY ("taskPackageId") REFERENCES "TaskPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExtractedRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskPackageId" TEXT NOT NULL,
    "documentId" TEXT,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT,
    "sourceReference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtractedRequirement_taskPackageId_fkey" FOREIGN KEY ("taskPackageId") REFERENCES "TaskPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ExtractedRequirement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "UploadedDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeNode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "definition" TEXT,
    "sourceReferences" TEXT NOT NULL DEFAULT '[]',
    "relatedTaskIds" TEXT NOT NULL DEFAULT '[]',
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "applicability" TEXT,
    "limitations" TEXT,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeNode_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "LearningWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeNode_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "KnowledgeNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "KnowledgeEdge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "sourceNodeId" TEXT NOT NULL,
    "targetNodeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "evidence" TEXT,
    "explanation" TEXT,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "KnowledgeEdge_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "LearningWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeEdge_sourceNodeId_fkey" FOREIGN KEY ("sourceNodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "KnowledgeEdge_targetNodeId_fkey" FOREIGN KEY ("targetNodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SourceEvidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "nodeId" TEXT,
    "documentId" TEXT,
    "taskPackageId" TEXT,
    "content" TEXT NOT NULL,
    "extractionMethod" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SourceEvidence_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "LearningWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SourceEvidence_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SourceEvidence_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "UploadedDocument" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "SourceEvidence_taskPackageId_fkey" FOREIGN KEY ("taskPackageId") REFERENCES "TaskPackage" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReusablePattern" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "principle" TEXT NOT NULL,
    "preconditions" TEXT,
    "applicableContexts" TEXT NOT NULL DEFAULT '[]',
    "implementationGuidance" TEXT,
    "limitations" TEXT,
    "counterexamples" TEXT NOT NULL DEFAULT '[]',
    "validationApproach" TEXT,
    "supportingTaskRefs" TEXT NOT NULL DEFAULT '[]',
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "reviewStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ReusablePattern_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "LearningWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskPackageId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentStep" TEXT,
    "logs" TEXT NOT NULL DEFAULT '[]',
    "startedAt" DATETIME,
    "completedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LearningJob_taskPackageId_fkey" FOREIGN KEY ("taskPackageId") REFERENCES "TaskPackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "taskTitle" TEXT NOT NULL,
    "taskDescription" TEXT,
    "inputRequirements" TEXT NOT NULL,
    "retrievedNodeIds" TEXT NOT NULL DEFAULT '[]',
    "retrievedPatternIds" TEXT NOT NULL DEFAULT '[]',
    "generatedContent" TEXT NOT NULL,
    "requirementChecks" TEXT NOT NULL DEFAULT '[]',
    "supportingEvidence" TEXT NOT NULL DEFAULT '[]',
    "assumptions" TEXT NOT NULL DEFAULT '[]',
    "unresolvedQuestions" TEXT NOT NULL DEFAULT '[]',
    "approvalStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "LearningWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HumanReview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "draftId" TEXT NOT NULL,
    "reviewerNotes" TEXT,
    "corrections" TEXT,
    "revisedContent" TEXT,
    "status" TEXT NOT NULL,
    "evaluatorFeedback" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "HumanReview_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "GeneratedDraft" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LearningFeedback" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "draftId" TEXT,
    "nodeId" TEXT,
    "feedbackType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "impact" TEXT,
    "appliedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningFeedback_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "LearningWorkspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "LearningFeedback_draftId_fkey" FOREIGN KEY ("draftId") REFERENCES "GeneratedDraft" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "LearningFeedback_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "KnowledgeNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_githubId_idx" ON "User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "LicensePolicy_version_key" ON "LicensePolicy"("version");

-- CreateIndex
CREATE INDEX "LicensePolicy_version_idx" ON "LicensePolicy"("version");

-- CreateIndex
CREATE INDEX "LicensePolicy_createdById_idx" ON "LicensePolicy"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_githubId_key" ON "Repository"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "Repository_fullName_key" ON "Repository"("fullName");

-- CreateIndex
CREATE INDEX "Repository_owner_name_idx" ON "Repository"("owner", "name");

-- CreateIndex
CREATE INDEX "Repository_fullName_idx" ON "Repository"("fullName");

-- CreateIndex
CREATE INDEX "Repository_primaryLanguage_idx" ON "Repository"("primaryLanguage");

-- CreateIndex
CREATE INDEX "Repository_stars_idx" ON "Repository"("stars");

-- CreateIndex
CREATE INDEX "Repository_githubId_idx" ON "Repository"("githubId");

-- CreateIndex
CREATE INDEX "RepositorySnapshot_repositoryId_idx" ON "RepositorySnapshot"("repositoryId");

-- CreateIndex
CREATE INDEX "RepositorySnapshot_commitSha_idx" ON "RepositorySnapshot"("commitSha");

-- CreateIndex
CREATE UNIQUE INDEX "RepositorySnapshot_repositoryId_commitSha_key" ON "RepositorySnapshot"("repositoryId", "commitSha");

-- CreateIndex
CREATE INDEX "LicenseVerification_repositoryId_idx" ON "LicenseVerification"("repositoryId");

-- CreateIndex
CREATE INDEX "LicenseVerification_snapshotId_idx" ON "LicenseVerification"("snapshotId");

-- CreateIndex
CREATE INDEX "LicenseVerification_status_idx" ON "LicenseVerification"("status");

-- CreateIndex
CREATE INDEX "LicenseVerification_policyVersion_idx" ON "LicenseVerification"("policyVersion");

-- CreateIndex
CREATE INDEX "LocMeasurement_repositoryId_idx" ON "LocMeasurement"("repositoryId");

-- CreateIndex
CREATE INDEX "LocMeasurement_snapshotId_idx" ON "LocMeasurement"("snapshotId");

-- CreateIndex
CREATE INDEX "LocMeasurement_status_idx" ON "LocMeasurement"("status");

-- CreateIndex
CREATE INDEX "Issue_repositoryId_idx" ON "Issue"("repositoryId");

-- CreateIndex
CREATE INDEX "Issue_state_idx" ON "Issue"("state");

-- CreateIndex
CREATE INDEX "Issue_authorLogin_idx" ON "Issue"("authorLogin");

-- CreateIndex
CREATE INDEX "Issue_createdAtGh_idx" ON "Issue"("createdAtGh");

-- CreateIndex
CREATE UNIQUE INDEX "Issue_repositoryId_number_key" ON "Issue"("repositoryId", "number");

-- CreateIndex
CREATE INDEX "PullRequest_repositoryId_idx" ON "PullRequest"("repositoryId");

-- CreateIndex
CREATE INDEX "PullRequest_state_idx" ON "PullRequest"("state");

-- CreateIndex
CREATE INDEX "PullRequest_mergedAt_idx" ON "PullRequest"("mergedAt");

-- CreateIndex
CREATE UNIQUE INDEX "IssueCandidate_issueId_key" ON "IssueCandidate"("issueId");

-- CreateIndex
CREATE INDEX "IssueCandidate_repositoryId_idx" ON "IssueCandidate"("repositoryId");

-- CreateIndex
CREATE INDEX "IssueCandidate_status_idx" ON "IssueCandidate"("status");

-- CreateIndex
CREATE INDEX "IssueCandidate_benchmarkSuitability_idx" ON "IssueCandidate"("benchmarkSuitability");

-- CreateIndex
CREATE INDEX "IssueCandidate_relatedPrId_idx" ON "IssueCandidate"("relatedPrId");

-- CreateIndex
CREATE UNIQUE INDEX "BenchmarkJob_idempotencyKey_key" ON "BenchmarkJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BenchmarkJob_issueCandidateId_idx" ON "BenchmarkJob"("issueCandidateId");

-- CreateIndex
CREATE INDEX "BenchmarkJob_status_idx" ON "BenchmarkJob"("status");

-- CreateIndex
CREATE INDEX "BenchmarkJob_idempotencyKey_idx" ON "BenchmarkJob"("idempotencyKey");

-- CreateIndex
CREATE INDEX "BenchmarkJob_createdAt_idx" ON "BenchmarkJob"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Benchmark_issueCandidateId_key" ON "Benchmark"("issueCandidateId");

-- CreateIndex
CREATE INDEX "Benchmark_repositoryId_idx" ON "Benchmark"("repositoryId");

-- CreateIndex
CREATE INDEX "Benchmark_snapshotId_idx" ON "Benchmark"("snapshotId");

-- CreateIndex
CREATE INDEX "Benchmark_status_idx" ON "Benchmark"("status");

-- CreateIndex
CREATE INDEX "Benchmark_qualityScore_idx" ON "Benchmark"("qualityScore");

-- CreateIndex
CREATE INDEX "Benchmark_publishedAt_idx" ON "Benchmark"("publishedAt");

-- CreateIndex
CREATE INDEX "AnalysisEvidence_benchmarkId_idx" ON "AnalysisEvidence"("benchmarkId");

-- CreateIndex
CREATE INDEX "AnalysisEvidence_repositoryId_idx" ON "AnalysisEvidence"("repositoryId");

-- CreateIndex
CREATE INDEX "AnalysisEvidence_snapshotId_idx" ON "AnalysisEvidence"("snapshotId");

-- CreateIndex
CREATE INDEX "AnalysisEvidence_type_idx" ON "AnalysisEvidence"("type");

-- CreateIndex
CREATE INDEX "AnalysisEvidence_tool_idx" ON "AnalysisEvidence"("tool");

-- CreateIndex
CREATE INDEX "LearningWorkspace_userId_idx" ON "LearningWorkspace"("userId");

-- CreateIndex
CREATE INDEX "LearningWorkspace_name_idx" ON "LearningWorkspace"("name");

-- CreateIndex
CREATE INDEX "TaskPackage_workspaceId_idx" ON "TaskPackage"("workspaceId");

-- CreateIndex
CREATE INDEX "TaskPackage_approvalStatus_idx" ON "TaskPackage"("approvalStatus");

-- CreateIndex
CREATE INDEX "TaskPackage_domain_idx" ON "TaskPackage"("domain");

-- CreateIndex
CREATE INDEX "TaskPackage_category_idx" ON "TaskPackage"("category");

-- CreateIndex
CREATE INDEX "UploadedDocument_taskPackageId_idx" ON "UploadedDocument"("taskPackageId");

-- CreateIndex
CREATE INDEX "UploadedDocument_mimeType_idx" ON "UploadedDocument"("mimeType");

-- CreateIndex
CREATE INDEX "ExtractedRequirement_taskPackageId_idx" ON "ExtractedRequirement"("taskPackageId");

-- CreateIndex
CREATE INDEX "ExtractedRequirement_documentId_idx" ON "ExtractedRequirement"("documentId");

-- CreateIndex
CREATE INDEX "ExtractedRequirement_type_idx" ON "ExtractedRequirement"("type");

-- CreateIndex
CREATE INDEX "KnowledgeNode_workspaceId_idx" ON "KnowledgeNode"("workspaceId");

-- CreateIndex
CREATE INDEX "KnowledgeNode_type_idx" ON "KnowledgeNode"("type");

-- CreateIndex
CREATE INDEX "KnowledgeNode_parentId_idx" ON "KnowledgeNode"("parentId");

-- CreateIndex
CREATE INDEX "KnowledgeNode_reviewStatus_idx" ON "KnowledgeNode"("reviewStatus");

-- CreateIndex
CREATE INDEX "KnowledgeNode_confidence_idx" ON "KnowledgeNode"("confidence");

-- CreateIndex
CREATE INDEX "KnowledgeNode_name_idx" ON "KnowledgeNode"("name");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_workspaceId_idx" ON "KnowledgeEdge"("workspaceId");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_sourceNodeId_idx" ON "KnowledgeEdge"("sourceNodeId");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_targetNodeId_idx" ON "KnowledgeEdge"("targetNodeId");

-- CreateIndex
CREATE INDEX "KnowledgeEdge_type_idx" ON "KnowledgeEdge"("type");

-- CreateIndex
CREATE INDEX "SourceEvidence_workspaceId_idx" ON "SourceEvidence"("workspaceId");

-- CreateIndex
CREATE INDEX "SourceEvidence_nodeId_idx" ON "SourceEvidence"("nodeId");

-- CreateIndex
CREATE INDEX "SourceEvidence_documentId_idx" ON "SourceEvidence"("documentId");

-- CreateIndex
CREATE INDEX "SourceEvidence_taskPackageId_idx" ON "SourceEvidence"("taskPackageId");

-- CreateIndex
CREATE INDEX "ReusablePattern_workspaceId_idx" ON "ReusablePattern"("workspaceId");

-- CreateIndex
CREATE INDEX "ReusablePattern_reviewStatus_idx" ON "ReusablePattern"("reviewStatus");

-- CreateIndex
CREATE INDEX "ReusablePattern_confidence_idx" ON "ReusablePattern"("confidence");

-- CreateIndex
CREATE INDEX "ReusablePattern_name_idx" ON "ReusablePattern"("name");

-- CreateIndex
CREATE INDEX "LearningJob_taskPackageId_idx" ON "LearningJob"("taskPackageId");

-- CreateIndex
CREATE INDEX "LearningJob_status_idx" ON "LearningJob"("status");

-- CreateIndex
CREATE INDEX "LearningJob_createdAt_idx" ON "LearningJob"("createdAt");

-- CreateIndex
CREATE INDEX "GeneratedDraft_workspaceId_idx" ON "GeneratedDraft"("workspaceId");

-- CreateIndex
CREATE INDEX "GeneratedDraft_approvalStatus_idx" ON "GeneratedDraft"("approvalStatus");

-- CreateIndex
CREATE INDEX "GeneratedDraft_createdAt_idx" ON "GeneratedDraft"("createdAt");

-- CreateIndex
CREATE INDEX "HumanReview_draftId_idx" ON "HumanReview"("draftId");

-- CreateIndex
CREATE INDEX "HumanReview_status_idx" ON "HumanReview"("status");

-- CreateIndex
CREATE INDEX "LearningFeedback_workspaceId_idx" ON "LearningFeedback"("workspaceId");

-- CreateIndex
CREATE INDEX "LearningFeedback_draftId_idx" ON "LearningFeedback"("draftId");

-- CreateIndex
CREATE INDEX "LearningFeedback_nodeId_idx" ON "LearningFeedback"("nodeId");

-- CreateIndex
CREATE INDEX "LearningFeedback_feedbackType_idx" ON "LearningFeedback"("feedbackType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

