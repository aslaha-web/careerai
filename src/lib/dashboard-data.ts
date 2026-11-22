import type { DashboardData } from "@/types/dashboard";

/**
 * SAMPLE DATA ONLY. Step 1 has no database, so the dashboard reads from this
 * function. In Step 6 it is replaced by real queries scoped to the signed-in
 * user. Keeping it behind one async function means the dashboard components
 * will not change when that happens.
 */
export async function getDashboardData(): Promise<DashboardData> {
  return {
    stats: {
      totalAnalyses: 12,
      averageScore: 74,
      resumesAnalyzed: 5,
      savedRoles: 8,
      changes: { totalAnalyses: 20, averageScore: 5, resumesAnalyzed: 0, savedRoles: 33 },
    },
    usage: { used: 7, limit: 20 },
    recentAnalyses: [
      { id: "a1", fileName: "resume-v4.pdf", targetRole: "Frontend Developer", score: 82, analyzedAt: "2026-11-19" },
      { id: "a2", fileName: "resume-v3.pdf", targetRole: "Frontend Developer", score: 74, analyzedAt: "2026-11-12" },
      { id: "a3", fileName: "resume-fullstack.docx", targetRole: "Full Stack Developer", score: 68, analyzedAt: "2026-11-05" },
      { id: "a4", fileName: "resume-v1.pdf", targetRole: "Software Engineer", score: 52, analyzedAt: "2026-10-28" },
    ],
    skillGaps: [
      { skill: "Testing (Jest, Playwright)", gapPercent: 70 },
      { skill: "System design basics", gapPercent: 55 },
      { skill: "Docker and CI/CD", gapPercent: 45 },
      { skill: "TypeScript generics", gapPercent: 30 },
    ],
    roadmap: {
      title: "Frontend Developer",
      currentWeek: 3,
      totalWeeks: 12,
      completedTasks: 8,
      totalTasks: 36,
    },
    recommendedRoles: [
      { title: "Frontend Developer", matchPercent: 86 },
      { title: "Full Stack Developer", matchPercent: 71 },
      { title: "UI Engineer", matchPercent: 64 },
    ],
    weeklyActivity: [
      { day: "Mon", count: 2 },
      { day: "Tue", count: 0 },
      { day: "Wed", count: 3 },
      { day: "Thu", count: 1 },
      { day: "Fri", count: 4 },
      { day: "Sat", count: 2 },
      { day: "Sun", count: 0 },
    ],
    recentActivity: [
      { id: "e1", text: "Analyzed resume-v4.pdf", when: "2 days ago" },
      { id: "e2", text: "Completed 3 roadmap tasks in week 3", when: "3 days ago" },
      { id: "e3", text: "Practiced 5 Frontend Developer questions", when: "5 days ago" },
    ],
  };
}
