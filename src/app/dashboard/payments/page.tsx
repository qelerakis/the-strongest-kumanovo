import { getPaymentsSummary } from "@/lib/queries/payments";
import { getAllMembers } from "@/lib/queries/members";
import { getCurrentMonth } from "@/lib/utils";
import { getTranslations } from "next-intl/server";
import PageTransition from "@/components/motion/page-transition";
import PaymentsOverview from "@/components/payments/payments-overview";

export default async function PaymentsPage() {
  const currentMonth = getCurrentMonth();

  const [summary, allMembers, t] = await Promise.all([
    getPaymentsSummary(currentMonth),
    getAllMembers({ isActive: true }),
    getTranslations("payments"),
  ]);

  // Build member options for the payment form select
  const memberOptions = allMembers.map((m) => ({
    id: m.id,
    fullName: m.fullName,
  }));

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <PaymentsOverview
          summary={summary}
          members={memberOptions}
          currentMonth={currentMonth}
        />
      </div>
    </PageTransition>
  );
}
