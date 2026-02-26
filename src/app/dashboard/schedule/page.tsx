import { getFullSchedule } from "@/lib/queries/schedule";
import { getAllSports } from "@/lib/queries/settings";
import { getTranslations } from "next-intl/server";
import PageTransition from "@/components/motion/page-transition";
import WeeklyGrid from "@/components/schedule/weekly-grid";

export default async function SchedulePage() {
  const [schedule, sports, t] = await Promise.all([
    getFullSchedule(),
    getAllSports(),
    getTranslations("schedule"),
  ]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("title")}
        </h1>
        <WeeklyGrid schedule={schedule} sports={sports} />
      </div>
    </PageTransition>
  );
}
