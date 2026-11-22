export interface DashboardStats {
  totalAnalyses: number;
  averageScore: number;
  resumesAnalyzed: number;
  savedRoles: number;
  /** Percent change vs last month; undefined means no history yet. */
  changes: { totalAnalyses?: number; averageScore?: number; resumesAnalyzed?: number; savedRoles?: number };
}

export interface AiUsage {
  used: number;
  limit: number;
}

export interface RecentAnalysis {
  id: string;
  fileName: string;
  targetRole: string;
  score: number;
  analyzedAt: string; // ISO date
}

export interface SkillGap {
  skill: string;
  /** How much of the expected level is still missing, 0-100. */
  gapPercent: number;
}

export interface RoadmapSummary {
  title: string;
  currentWeek: number;
  totalWeeks: number;
  completedTasks: number;
  totalTasks: number;
}

export interface RecommendedRole {
  title: string;
  matchPercent: number;
}

export interface ActivityDay {
  day: string;
  count: number;
}

export interface ActivityItem {
  id: string;
  text: string;
  when: string;
}

export interface DashboardData {
  stats: DashboardStats;
  usage: AiUsage;
  recentAnalyses: RecentAnalysis[];
  skillGaps: SkillGap[];
  roadmap: RoadmapSummary | null;
  recommendedRoles: RecommendedRole[];
  weeklyActivity: ActivityDay[];
  recentActivity: ActivityItem[];
}
