import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMemberById, getMemberBalance } from "@/lib/queries/members";
import { getMemberAttendanceHistory, getMonthlyAttendanceCount } from "@/lib/queries/attendance";
import { getPaymentsForMember } from "@/lib/queries/payments";
import { getFullSchedule } from "@/lib/queries/schedule";
import { getCurrentMonth, formatMKD, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import BeltRankBadge from "@/components/members/belt-rank-badge";
import BalanceDisplay from "@/components/payments/balance-display";
import ScheduleDisplay from "@/components/landing/schedule-display";
import AttendanceCalendar from "@/components/attendance/attendance-calendar";
import PaymentHistory from "@/components/payments/payment-history";
import PageTransition from "@/components/motion/page-transition";
import type { BeltRank } from "@/types";

export default async function MemberPage() {
  const session = await auth();
  if (!session || !session.user.memberId) {
    redirect("/login");
  }

  const memberId = session.user.memberId;
  const currentMonth = getCurrentMonth();

  const [member, balance, attendanceHistory, payments, schedule, monthlyCount] =
    await Promise.all([
      getMemberById(memberId),
      getMemberBalance(memberId),
      getMemberAttendanceHistory(memberId),
      getPaymentsForMember(memberId),
      getFullSchedule(),
      getMonthlyAttendanceCount(memberId, currentMonth),
    ]);

  if (!member || !balance) {
    redirect("/login");
  }

  const t = await getTranslations("memberDashboard");
  const tBelts = await getTranslations("belts");

  const belt = (member.beltRank || "white") as BeltRank;

  // Map attendance history to the shape expected by AttendanceCalendar
  const attendanceData = attendanceHistory.map((entry) => ({
    date: entry.sessionDate,
    present: entry.present,
    sportName: entry.sportName,
    sportColor: entry.sportColor,
  }));

  return (
    <PageTransition>
      <div className="flex flex-col gap-8">
        {/* Welcome section */}
        <div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">
                {t("welcome", { name: member.fullName })}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <BeltRankBadge rank={belt} />
                  <span className="text-sm text-text-secondary">
                    {tBelts(belt)}
                  </span>
                </div>
                <Badge variant="outline">
                  {t("tier")}: {member.tierName}
                </Badge>
                {member.sports.map((sport) => (
                  <Badge key={sport.sportId} variant="default">
                    {sport.sportName}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Balance display */}
          <div className="sm:col-span-2">
            <BalanceDisplay balance={balance} />
          </div>

          {/* Attendance this month */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t("attendanceThisMonth")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-1">
                <p className="text-4xl font-bold text-brand-gold">
                  {monthlyCount}
                </p>
                <p className="text-sm text-text-secondary">
                  {t("sessionsCount", { count: monthlyCount })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Monthly fee */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("monthlyFee")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-1">
                <p className="text-4xl font-bold text-text-primary">
                  {formatMKD(member.tierPrice)}
                </p>
                <p className="text-sm text-text-secondary">
                  {t("memberSince")} {formatDate(member.joinDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule section - reuses the landing page ScheduleDisplay */}
        <section className="rounded-xl border border-surface-border bg-surface-card -mx-4 sm:mx-0">
          <ScheduleDisplay schedule={schedule} />
        </section>

        {/* Attendance section */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-text-primary">
            {t("myAttendance")}
          </h2>
          <div className="max-w-md">
            <AttendanceCalendar attendanceData={attendanceData} />
          </div>
        </section>

        {/* Payments section */}
        <section>
          <h2 className="mb-4 text-xl font-bold text-text-primary">
            {t("myPayments")}
          </h2>
          <Card>
            <CardContent className="pt-6">
              <PaymentHistory
                payments={payments}
                showMemberName={false}
                readOnly
              />
            </CardContent>
          </Card>
        </section>
      </div>
    </PageTransition>
  );
}
