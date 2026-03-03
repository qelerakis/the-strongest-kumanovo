"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
import { formatMKD } from "@/lib/utils";
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
}

export default function PaymentsOverview({
  summary,
  members,
  currentMonth,
}: PaymentsOverviewProps) {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [defaultMemberId, setDefaultMemberId] = useState<string | undefined>();

  const handleLogPayment = (memberId?: string) => {
    setDefaultMemberId(memberId);
    setIsFormOpen(true);
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">
            {t("title")}
          </h1>
          <p className="text-sm text-text-secondary mt-1">{currentMonth}</p>
        </div>
        <Button onClick={() => handleLogPayment()}>
          {t("logPayment")}
        </Button>
      </div>

      {/* Summary table */}
      {summary.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-text-muted">
          {tCommon("noResults")}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("member")}</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Tier Price</TableHead>
              <TableHead>{t("totalPaid")}</TableHead>
              <TableHead>{t("balance")}</TableHead>
              <TableHead className="text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {summary.map((row) => {
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
