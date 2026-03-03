import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  getDashboardStats,
  getFlaggedMembers,
  getRecentPayments,
  getRecentClassSessionsBySport,
} from "@/lib/queries/dashboard";
import { getAllSports } from "@/lib/queries/settings";
import { getCurrentMonth } from "@/lib/utils";
import PageTransition from "@/components/motion/page-transition";
import FadeIn from "@/components/motion/fade-in";
import StatsCards from "@/components/dashboard/stats-cards";
import FlaggedMembers from "@/components/dashboard/flagged-members";
import RecentActivity from "@/components/dashboard/recent-activity";
import AttendanceBySport from "@/components/dashboard/attendance-by-sport";

export default async function DashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== "admin") redirect("/login");

  const t = await getTranslations("dashboard");
  const currentMonth = getCurrentMonth();

  const [stats, flaggedMembers, recentPayments, sports] = await Promise.all([
    getDashboardStats(),
    getFlaggedMembers(currentMonth),
    getRecentPayments(5),
    getAllSports(),
  ]);

  const sessionsBySportEntries = await Promise.all(
    sports.map(async (sport) => {
      const sessions = await getRecentClassSessionsBySport(sport.id, 10);
      return [sport.id, sessions] as const;
    })
  );
  const sessionsBySport = Object.fromEntries(sessionsBySportEntries);

  // Determine default sport based on admin username
  const defaultSportId = (() => {
    const username = session.user.username.toLowerCase();
    if (username === "filip") {
      return sports.find((s) => s.nameKey === "kickboxing")?.id ?? sports[0]?.id ?? "";
    }
    // Martin and other admins default to BJJ
    return sports.find((s) => s.nameKey === "bjj")?.id ?? sports[0]?.id ?? "";
  })();

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Page heading */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {t("title")}
          </h1>
          <p className="mt-1 text-text-secondary">
            {t("welcome", { name: session.user.username })}
          </p>
        </div>

        {/* Stats cards */}
        <FadeIn>
          <StatsCards stats={stats} />
        </FadeIn>

        {/* Flagged members + Recent activity grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <FadeIn delay={0.1}>
            <FlaggedMembers flaggedMembers={flaggedMembers} />
          </FadeIn>
          <FadeIn delay={0.2}>
            <RecentActivity recentPayments={recentPayments} />
          </FadeIn>
        </div>

        {/* Attendance by sport */}
        <FadeIn delay={0.3}>
          <AttendanceBySport
            sports={sports}
            sessionsBySport={sessionsBySport}
            defaultSportId={defaultSportId}
          />
        </FadeIn>
      </div>
    </PageTransition>
  );
}
