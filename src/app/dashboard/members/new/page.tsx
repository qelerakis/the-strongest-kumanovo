import { getTranslations } from "next-intl/server";
import { getMembershipTiers, getAllSports } from "@/lib/queries/settings";
import PageTransition from "@/components/motion/page-transition";
import MemberForm from "@/components/members/member-form";

export default async function NewMemberPage() {
  const [tiers, sports, t] = await Promise.all([
    getMembershipTiers(),
    getAllSports(),
    getTranslations("members"),
  ]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-text-primary">
          {t("addMember")}
        </h1>
        <MemberForm tiers={tiers} sports={sports} />
      </div>
    </PageTransition>
  );
}
