import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import BeltRankBadge from "./belt-rank-badge";
import type { BeltRank } from "@/types";
import { useTranslations } from "next-intl";

interface MemberCardProps {
  member: {
    id: string;
    fullName: string;
    beltRank: string | null;
    tierName: string;
    isActive: boolean;
    sports: {
      sportId: string;
      sportName: string;
      sportColor: string | null;
    }[];
  };
}

export default function MemberCard({ member }: MemberCardProps) {
  const t = useTranslations("common");
  const tBelts = useTranslations("belts");

  const belt = (member.beltRank || "white") as BeltRank;

  return (
    <Link href={`/dashboard/members/${member.id}`}>
      <Card className="hover:border-brand-red/40 transition-colors cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col gap-3">
          {/* Name and status */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-text-primary truncate">
              {member.fullName}
            </h3>
            <Badge variant={member.isActive ? "green" : "red"}>
              {member.isActive ? t("active") : t("inactive")}
            </Badge>
          </div>

          {/* Belt rank */}
          <div className="flex items-center gap-2">
            <BeltRankBadge rank={belt} />
            <span className="text-xs text-text-secondary">
              {tBelts(belt)}
            </span>
          </div>

          {/* Tier badge */}
          <Badge variant="gold" className="self-start">
            {member.tierName}
          </Badge>

          {/* Sports */}
          {member.sports.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {member.sports.map((sport) => (
                <Badge
                  key={sport.sportId}
                  variant="outline"
                  style={
                    sport.sportColor
                      ? {
                          borderColor: sport.sportColor,
                          color: sport.sportColor,
                        }
                      : undefined
                  }
                >
                  {sport.sportName}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
