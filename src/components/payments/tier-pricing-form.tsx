"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { formatMKD } from "@/lib/utils";
import { updateTierPricing } from "@/lib/actions/settings";

interface Tier {
  id: string;
  name: string;
  nameKey: string;
  sportsAllowed: number;
  monthlyPriceMkd: number;
  isActive: boolean;
}

interface TierPricingFormProps {
  tiers: Tier[];
}

export default function TierPricingForm({ tiers }: TierPricingFormProps) {
  const t = useTranslations("settings");
  const tTiers = useTranslations("tiers");
  const tCommon = useTranslations("common");

  const [prices, setPrices] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const tier of tiers) {
      initial[tier.id] = String(tier.monthlyPriceMkd);
    }
    return initial;
  });

  const [savedId, setSavedId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleSave = (tierId: string) => {
    const newPrice = Number(prices[tierId]);
    if (isNaN(newPrice) || newPrice <= 0) {
      setErrorId(tierId);
      setErrorMsg("Price must be a positive number");
      return;
    }

    setPendingId(tierId);
    setErrorId(null);
    setErrorMsg(null);
    setSavedId(null);

    startTransition(async () => {
      const result = await updateTierPricing(tierId, newPrice);
      setPendingId(null);

      if (result.success) {
        setSavedId(tierId);
        setTimeout(() => setSavedId(null), 2000);
      } else {
        setErrorId(tierId);
        setErrorMsg(result.error ?? "An error occurred");
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tierPricing")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-6">
          {tiers.map((tier) => {
            const hasChanged =
              prices[tier.id] !== String(tier.monthlyPriceMkd);

            return (
              <div
                key={tier.id}
                className="flex flex-col gap-3 pb-6 border-b border-surface-border last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-text-primary">
                      {tTiers(tier.nameKey)}
                    </p>
                    <p className="text-sm text-text-secondary">
                      {t("sportsAllowed")}:{" "}
                      {tier.sportsAllowed === -1
                        ? t("unlimited")
                        : tier.sportsAllowed}
                    </p>
                  </div>
                  <p className="text-sm text-text-muted">
                    {formatMKD(tier.monthlyPriceMkd)}
                  </p>
                </div>

                <div className="flex items-end gap-3">
                  <div className="flex-1">
                    <Input
                      label={t("monthlyPrice")}
                      type="number"
                      min="1"
                      step="1"
                      value={prices[tier.id]}
                      onChange={(e) =>
                        setPrices((prev) => ({
                          ...prev,
                          [tier.id]: e.target.value,
                        }))
                      }
                      error={
                        errorId === tier.id ? (errorMsg ?? undefined) : undefined
                      }
                    />
                  </div>
                  <Button
                    size="md"
                    onClick={() => handleSave(tier.id)}
                    loading={isPending && pendingId === tier.id}
                    disabled={
                      !hasChanged || (isPending && pendingId !== tier.id)
                    }
                  >
                    {tCommon("save")}
                  </Button>
                </div>

                {savedId === tier.id && (
                  <p className="text-sm text-success">{t("priceSaved")}</p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
