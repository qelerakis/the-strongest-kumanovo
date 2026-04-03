import { getPaymentsSummary } from "@/lib/queries/payments";
import { getAllMembers } from "@/lib/queries/members";
import { getCurrentMonth } from "@/lib/utils";
import PageTransition from "@/components/motion/page-transition";
import PaymentsOverview from "@/components/payments/payments-overview";

interface PaymentsPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function PaymentsPage({ searchParams }: PaymentsPageProps) {
  const params = await searchParams;
  const currentMonth = getCurrentMonth();
  const monthParam = params.month;
  const selectedMonth =
    monthParam && /^\d{4}-(0[1-9]|1[0-2])$/.test(monthParam)
      ? monthParam
      : currentMonth;

  const [summary, allMembers] = await Promise.all([
    getPaymentsSummary(selectedMonth),
    getAllMembers({ isActive: true }),
  ]);

  // Build member options for the payment form select
  const memberOptions = allMembers.map((m) => ({
    id: m.id,
    fullName: m.fullName,
    tierPrice: m.tierPrice,
  }));

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <PaymentsOverview
          summary={summary}
          members={memberOptions}
          currentMonth={currentMonth}
          selectedMonth={selectedMonth}
        />
      </div>
    </PageTransition>
  );
}
