import { useTranslations } from "next-intl";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { formatMKD } from "@/lib/utils";

interface BalanceData {
  totalPaid: number;
  totalOwed: number;
  balance: number;
  isCredit: boolean;
}

interface BalanceDisplayProps {
  balance: BalanceData;
}

export default function BalanceDisplay({ balance }: BalanceDisplayProps) {
  const t = useTranslations("payments");

  const isZero = balance.balance === 0;
  const balanceColor = isZero
    ? "text-text-muted"
    : balance.isCredit
    ? "text-success"
    : "text-error";

  const balanceLabel = isZero
    ? t("settled")
    : balance.isCredit
    ? t("credit")
    : t("debt");

  const displayAmount = balance.isCredit
    ? balance.balance
    : Math.abs(balance.balance);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("balance")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Large balance display */}
          <div className="text-center">
            <p className={`text-4xl font-bold ${balanceColor}`}>
              {balance.isCredit || isZero ? "" : "-"}
              {formatMKD(displayAmount)}
            </p>
            <p className={`text-sm font-medium mt-1 ${balanceColor}`}>
              {balanceLabel}
            </p>
          </div>

          {/* Breakdown */}
          <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-surface-border">
            <div className="text-center">
              <p className="text-sm text-text-secondary">{t("totalPaid")}</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatMKD(balance.totalPaid)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-text-secondary">{t("totalOwed")}</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatMKD(balance.totalOwed)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
