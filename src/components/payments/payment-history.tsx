"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { formatMKD, formatDate } from "@/lib/utils";
import { deletePayment } from "@/lib/actions/payments";

interface Payment {
  id: string;
  memberId: string;
  memberName?: string;
  amountMkd: number;
  paymentDate: string;
  monthFor: string;
  notes: string | null;
}

interface PaymentHistoryProps {
  payments: Payment[];
  showMemberName: boolean;
  readOnly?: boolean;
}

export default function PaymentHistory({
  payments,
  showMemberName,
  readOnly = false,
}: PaymentHistoryProps) {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");

  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    if (confirmId === id) {
      startTransition(async () => {
        await deletePayment(id);
        setConfirmId(null);
      });
    } else {
      setConfirmId(id);
    }
  };

  if (payments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-text-muted">
        {t("noPayments")}
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("paymentDate")}</TableHead>
          {showMemberName && <TableHead>{t("member")}</TableHead>}
          <TableHead>{t("amount")}</TableHead>
          <TableHead>{t("monthFor")}</TableHead>
          <TableHead>{t("notes")}</TableHead>
          {!readOnly && <TableHead className="text-right">{tCommon("actions")}</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment) => (
          <TableRow key={payment.id}>
            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
            {showMemberName && (
              <TableCell className="font-medium">
                {payment.memberName ?? "—"}
              </TableCell>
            )}
            <TableCell>{formatMKD(payment.amountMkd)}</TableCell>
            <TableCell>{payment.monthFor}</TableCell>
            <TableCell className="text-text-secondary max-w-[200px] truncate">
              {payment.notes || "—"}
            </TableCell>
            {!readOnly && (
              <TableCell className="text-right">
                <Button
                  variant={confirmId === payment.id ? "destructive" : "ghost"}
                  size="sm"
                  onClick={() => handleDelete(payment.id)}
                  loading={isPending && confirmId === payment.id}
                  disabled={isPending && confirmId !== payment.id}
                >
                  {confirmId === payment.id
                    ? tCommon("confirm")
                    : tCommon("delete")}
                </Button>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
