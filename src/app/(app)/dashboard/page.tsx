import type { Metadata } from "next";
import { Info, ScanText, Star, Briefcase, FileText } from "lucide-react";
import { ActivityChart } from "@/components/dashboard/activity-chart";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { RecentAnalyses } from "@/components/dashboard/recent-analyses";
import { RecommendedRoles } from "@/components/dashboard/recommended-roles";
import { RoadmapProgress } from "@/components/dashboard/roadmap-progress";
import { SkillGaps } from "@/components/dashboard/skill-gaps";
import { UsageStrip } from "@/components/dashboard/usage-strip";
import { WelcomeBanner } from "@/components/dashboard/welcome-banner";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboardData } from "@/lib/dashboard-data";
import { requireUser } from "@/server/auth/dal";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboardData();
  const { stats } = data;

  return (
    <div className="space-y-6">
      <WelcomeBanner firstName={user.name.split(" ")[0]} />

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="size-3.5 shrink-0" />
        You are viewing sample data. Real numbers appear once the database and resume analysis are connected.
      </p>

      <section aria-label="Statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total analyses" value={String(stats.totalAnalyses)} change={stats.changes.totalAnalyses} icon={<ScanText />} />
        <StatCard
          label="Average resume score"
          value={`${stats.averageScore}%`}
          change={stats.changes.averageScore}
          icon={<Star />}
          iconClassName="bg-success/12 text-success"
        />
        <StatCard
          label="Resumes analyzed"
          value={String(stats.resumesAnalyzed)}
          change={stats.changes.resumesAnalyzed}
          icon={<FileText />}
          iconClassName="bg-accent/12 text-accent"
        />
        <StatCard
          label="Saved roles"
          value={String(stats.savedRoles)}
          change={stats.changes.savedRoles}
          icon={<Briefcase />}
          iconClassName="bg-warning/15 text-warning"
        />
      </section>

      <UsageStrip usage={data.usage} />

      <QuickActions />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <RecentAnalyses items={data.recentAnalyses} />
        </div>
        <SkillGaps gaps={data.skillGaps} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <RoadmapProgress roadmap={data.roadmap} />
        <RecommendedRoles roles={data.recommendedRoles} />
        <div className="space-y-6 lg:col-span-2 xl:col-span-1">
          <ActivityChart days={data.weeklyActivity} />
        </div>
      </div>

      <RecentActivity items={data.recentActivity} />
    </div>
  );
}
