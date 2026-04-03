"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { formatMKD, incrementMonth } from "@/lib/utils";
import PaymentForm from "@/components/payments/payment-form";

interface MemberSummary {
  memberId: string;
  fullName: string;
  tierName: string;
  tierPrice: number;
  totalPaid: number;
  balance: number;
}

interface MemberOption {
  id: string;
  fullName: string;
  tierPrice: number;
}

interface PaymentsOverviewProps {
  summary: MemberSummary[];
  members: MemberOption[];
  currentMonth: string;
  selectedMonth: string;
}

function formatMonthLabel(yearMonth: string, locale: string): string {
  const [y, m] = yearMonth.split("-").map(Number);
  const date = new Date(y, m - 1, 1);
  const localeMap: Record<string, string> = { en: "en-US", mk: "mk-MK" };
  return date.toLocaleDateString(localeMap[locale] ?? "en-US", { month: "long", year: "numeric" });
}

export default function PaymentsOverview({
  summary,
  members,
  currentMonth,
  selectedMonth,
}: PaymentsOverviewProps) {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const locale = useLocale();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [defaultMemberId, setDefaultMemberId] = useState<string | undefined>();
  const [memberSearch, setMemberSearch] = useState("");

  const handleLogPayment = (memberId?: string) => {
    setDefaultMemberId(memberId);
    setIsFormOpen(true);
  };

  const navigateMonth = (offset: number) => {
    const newMonth = incrementMonth(selectedMonth, offset);
    router.push(`/dashboard/payments?month=${newMonth}`);
  };

  const isCurrentMonth = selectedMonth === currentMonth;

  // Filter summary by member name
  const filteredSummary = memberSearch
    ? summary.filter((row) =>
        row.fullName.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : summary;

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("title")}
          </h1>
          {/* Month navigation */}
          <div className="flex items-center gap-2 mt-1">
            <button
              onClick={() => navigateMonth(-1)}
              className="text-text-muted hover:text-text-primary transition-colors text-sm px-1"
              aria-label={t("previousMonth")}
            >
              &larr;
            </button>
            <span className="text-sm text-text-secondary font-medium min-w-[140px] text-center">
              {formatMonthLabel(selectedMonth, locale)}
            </span>
            <button
              onClick={() => navigateMonth(1)}
              className="text-text-muted hover:text-text-primary transition-colors text-sm px-1"
              aria-label={t("nextMonth")}
            >
              &rarr;
            </button>
            {!isCurrentMonth && (
              <button
                onClick={() => router.push("/dashboard/payments")}
                className="text-xs text-brand-red hover:underline ml-2"
              >
                {t("today")}
              </button>
            )}
          </div>
        </div>
        <Button onClick={() => handleLogPayment()}>
          {t("logPayment")}
        </Button>
      </div>

      {/* Member search filter */}
      <div className="max-w-sm">
        <input
          type="text"
          placeholder={tCommon("search")}
          value={memberSearch}
          onChange={(e) => setMemberSearch(e.target.value)}
          className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 focus:ring-offset-surface"
        />
      </div>

      {/* Summary table */}
      {filteredSummary.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-text-muted">
          {tCommon("noResults")}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("member")}</TableHead>
              <TableHead>{t("tier")}</TableHead>
              <TableHead>{t("monthlyOwed")}</TableHead>
              <TableHead>{t("totalPaid")}</TableHead>
              <TableHead>{t("cumulativeBalance")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSummary.map((row) => {
              const isSettled = row.balance === 0;
              const isCredit = row.balance > 0;
              const isDebt = row.balance < 0;

              return (
                <TableRow key={row.memberId}>
                  <TableCell className="font-medium">
                    {row.fullName}
                  </TableCell>
                  <TableCell>{row.tierName}</TableCell>
                  <TableCell>{formatMKD(row.tierPrice)}</TableCell>
                  <TableCell>{formatMKD(row.totalPaid)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        isSettled ? "green" : isCredit ? "green" : "red"
                      }
                    >
                      {isDebt ? "-" : ""}
                      {formatMKD(Math.abs(row.balance))}
                      {isSettled
                        ? ` (${t("settled")})`
                        : isCredit
                        ? ` (${t("credit")})`
                        : ` (${t("debt")})`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLogPayment(row.memberId)}
                    >
                      {t("logPayment")}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}

      <PaymentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        members={members}
        defaultMemberId={defaultMemberId}
      />
    </>
  );
}
