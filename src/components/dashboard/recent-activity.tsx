"use client";

import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMKD } from "@/lib/utils";

interface RecentPayment {
  id: string;
  amountMkd: number;
  monthFor: string;
  paymentDate: string;
  createdAt: Date | null;
  memberName: string;
  memberId: string;
}

interface RecentActivityProps {
  recentPayments: RecentPayment[];
}

function ActivityIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-text-muted"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function PaymentDot() {
  return (
    <div className="relative mt-1.5 flex-shrink-0">
      <div className="h-2.5 w-2.5 rounded-full bg-brand-red" />
    </div>
  );
}

function formatRelativeDate(date: Date | string | null): string {
  if (!date) return "";

  const now = new Date();
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function formatMonthLabel(monthFor: string): string {
  const [year, month] = monthFor.split("-");
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function RecentActivity({
  recentPayments,
}: RecentActivityProps) {
  const t = useTranslations("dashboard");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <ActivityIcon />
          <CardTitle>{t("recentActivity")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {recentPayments.length === 0 ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-border py-8">
            <p className="text-sm text-text-muted">
              {t("noRecentActivity")}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentPayments.map((payment) => (
              <div key={payment.id} className="flex gap-3">
                <PaymentDot />
                <div className="flex flex-1 flex-col gap-0.5">
                  <p className="text-sm text-text-primary">
                    <span className="font-medium">
                      {payment.memberName}
                    </span>{" "}
                    paid{" "}
                    <span className="font-semibold text-success">
                      {formatMKD(payment.amountMkd)}
                    </span>{" "}
                    for{" "}
                    <span className="text-text-secondary">
                      {formatMonthLabel(payment.monthFor)}
                    </span>
                  </p>
                  <span className="text-xs text-text-muted">
                    {formatRelativeDate(payment.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
