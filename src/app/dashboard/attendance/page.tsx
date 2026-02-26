import { getClassSessionsForDate } from "@/lib/queries/attendance";
import { getTranslations } from "next-intl/server";
import PageTransition from "@/components/motion/page-transition";
import AttendancePageClient from "@/components/attendance/attendance-page-client";

export default async function AttendancePage() {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [sessions, t] = await Promise.all([
    getClassSessionsForDate(todayStr),
    getTranslations("attendance"),
  ]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <AttendancePageClient
          initialSessions={sessions}
          initialDate={todayStr}
        />
      </div>
    </PageTransition>
  );
}
