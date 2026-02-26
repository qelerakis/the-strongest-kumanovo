import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAllMembers } from "@/lib/queries/members";
import { getMembershipTiers, getAllSports } from "@/lib/queries/settings";
import PageTransition from "@/components/motion/page-transition";
import MemberList from "@/components/members/member-list";
import { Button } from "@/components/ui/button";

export default async function MembersPage() {
  const [members, tiers, sports, t] = await Promise.all([
    getAllMembers(),
    getMembershipTiers(),
    getAllSports(),
    getTranslations("members"),
  ]);

  return (
    <PageTransition>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text-primary">
            {t("title")}
          </h1>
          <Link href="/dashboard/members/new">
            <Button>{t("addMember")}</Button>
          </Link>
        </div>
        <MemberList members={members} sports={sports} tiers={tiers} />
      </div>
    </PageTransition>
  );
}
