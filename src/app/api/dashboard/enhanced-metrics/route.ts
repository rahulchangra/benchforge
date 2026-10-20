import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { apiSuccess, withErrorHandling } from "@/lib/api-helpers";

/** GET /api/dashboard/enhanced-metrics - Enhanced dashboard metrics */
export const GET = withErrorHandling(async () => {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const [
    totalSubmissions,
    readySubmissions,
    submissionsThisWeek,
    submissionsLastWeek,
    allSubmissions,
  ] = await Promise.all([
    prisma.challengeSubmission.count(),
    prisma.challengeSubmission.count({
      where: { status: "READY" },
    }),
    prisma.challengeSubmission.count({
      where: { createdAt: { gte: oneWeekAgo } },
    }),
    prisma.challengeSubmission.count({
      where: {
        createdAt: { gte: twoWeeksAgo, lt: oneWeekAgo },
      },
    }),
    prisma.challengeSubmission.findMany({
      select: {
        qualityScore: true,
        category: true,
        language: true,
        status: true,
      },
    }),
  ]);

  // Calculate average quality score
  const validScores = allSubmissions
    .map((s) => s.qualityScore)
    .filter((score): score is number => score !== null);
  const avgQualityScore =
    validScores.length > 0
      ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
      : 0;

  // Calculate completion rate (READY or EXPORTED submissions)
  const completedSubmissions = allSubmissions.filter((s) =>
    ["READY", "EXPORTED"].includes(s.status)
  ).length;
  const completionRate =
    totalSubmissions > 0 ? (completedSubmissions / totalSubmissions) * 100 : 0;

  // Find top category
  const categoryCount: Record<string, number> = {};
  allSubmissions.forEach((s) => {
    if (s.category) {
      categoryCount[s.category] = (categoryCount[s.category] || 0) + 1;
    }
  });
  const topCategory =
    Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  // Find top language
  const languageCount: Record<string, number> = {};
  allSubmissions.forEach((s) => {
    if (s.language) {
      languageCount[s.language] = (languageCount[s.language] || 0) + 1;
    }
  });
  const topLanguage =
    Object.entries(languageCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

  return apiSuccess({
    totalSubmissions,
    readySubmissions,
    avgQualityScore,
    completionRate,
    submissionsThisWeek,
    lastWeekSubmissions: submissionsLastWeek,
    topCategory,
    topLanguage,
    categoryBreakdown: categoryCount,
    languageBreakdown: languageCount,
  });
});
