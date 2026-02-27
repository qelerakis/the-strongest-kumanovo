import { getMembershipTiers } from "@/lib/queries/settings";
import { getTranslations } from "next-intl/server";
import PageTransition from "@/components/motion/page-transition";
import TierPricingForm from "@/components/payments/tier-pricing-form";
import ChangePasswordForm from "@/components/settings/change-password-form";

export default async function SettingsPage() {
  const [tiers, t] = await Promise.all([
    getMembershipTiers(),
    getTranslations("settings"),
  ]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">{t("title")}</h1>
        <TierPricingForm tiers={tiers} />
        <ChangePasswordForm />
      </div>
    </PageTransition>
  );
}
