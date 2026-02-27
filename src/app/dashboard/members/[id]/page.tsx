import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getMemberById, getMemberBalance } from "@/lib/queries/members";
import { getMembershipTiers, getAllSports } from "@/lib/queries/settings";
import { getMonthlyAttendanceCount } from "@/lib/queries/attendance";
import { getCurrentMonth, formatMKD, formatDate } from "@/lib/utils";
import PageTransition from "@/components/motion/page-transition";
import MemberForm from "@/components/members/member-form";
import MemberDetailHeader from "./member-detail-header";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MemberDetailPage({ params }: Props) {
  const { id } = await params;

  const [member, balance, tiers, sports, t, tPayments] = await Promise.all([
    getMemberById(id),
    getMemberBalance(id),
    getMembershipTiers(),
    getAllSports(),
    getTranslations("members"),
    getTranslations("payments"),
  ]);

  if (!member) {
    notFound();
  }

  const currentMonth = getCurrentMonth();
  const attendanceCount = await getMonthlyAttendanceCount(id, currentMonth);

  const memberSportIds = member.sports.map((s) => s.sportId);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        {/* Header with name, status toggle, credentials */}
        <MemberDetailHeader
          member={{
            id: member.id,
            fullName: member.fullName,
            isActive: member.isActive,
            beltRank: member.beltRank,
            user: member.user,
          }}
        />

        {/* Quick stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Balance */}
          <div className="rounded-xl border border-surface-border bg-surface-card p-4">
            <p className="text-sm text-text-muted">{tPayments("balance")}</p>
            <p
              className={`text-xl font-bold ${
                balance && balance.balance >= 0
                  ? "text-success"
                  : "text-error"
              }`}
            >
              {balance ? formatMKD(balance.balance) : "---"}
            </p>
            {balance && (
              <p className="text-xs text-text-muted mt-1">
                {tPayments("totalPaid")}: {formatMKD(balance.totalPaid)} /{" "}
                {tPayments("totalOwed")}: {formatMKD(balance.totalOwed)}
              </p>
            )}
          </div>

          {/* Attendance this month */}
          <div className="rounded-xl border border-surface-border bg-surface-card p-4">
            <p className="text-sm text-text-muted">
              {currentMonth}
            </p>
            <p className="text-xl font-bold text-text-primary">
              {attendanceCount}{" "}
              <span className="text-sm font-normal text-text-muted">
                sessions
              </span>
            </p>
          </div>

          {/* Join date */}
          <div className="rounded-xl border border-surface-border bg-surface-card p-4">
            <p className="text-sm text-text-muted">{t("joinDate")}</p>
            <p className="text-xl font-bold text-text-primary">
              {formatDate(member.joinDate)}
            </p>
          </div>
        </div>

        {/* Edit form */}
        <MemberForm
          tiers={tiers}
          sports={sports}
          member={{
            id: member.id,
            fullName: member.fullName,
            phone: member.phone,
            email: member.email,
            dateOfBirth: member.dateOfBirth,
            membershipTierId: member.membershipTierId,
            beltRank: member.beltRank,
            joinDate: member.joinDate,
            notes: member.notes,
          }}
          memberSportIds={memberSportIds}
        />
      </div>
    </PageTransition>
  );
}
