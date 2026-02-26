"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import MemberCard from "./member-card";

interface MemberData {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  beltRank: string | null;
  isActive: boolean;
  membershipTierId: string;
  tierName: string;
  sports: {
    sportId: string;
    sportName: string;
    sportColor: string | null;
  }[];
}

interface Sport {
  id: string;
  name: string;
  nameKey: string;
  color: string | null;
}

interface Tier {
  id: string;
  name: string;
}

interface MemberListProps {
  members: MemberData[];
  sports: Sport[];
  tiers: Tier[];
}

export default function MemberList({ members, sports, tiers }: MemberListProps) {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [sportFilter, setSportFilter] = useState("");
  const [tierFilter, setTierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    return members.filter((member) => {
      // Search by name
      if (
        search &&
        !member.fullName.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }

      // Filter by sport
      if (
        sportFilter &&
        !member.sports.some((s) => s.sportId === sportFilter)
      ) {
        return false;
      }

      // Filter by tier
      if (tierFilter && member.membershipTierId !== tierFilter) {
        return false;
      }

      // Filter by status
      if (statusFilter === "active" && !member.isActive) return false;
      if (statusFilter === "inactive" && member.isActive) return false;

      return true;
    });
  }, [members, search, sportFilter, tierFilter, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder={tCommon("search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          value={sportFilter}
          onChange={(e) => setSportFilter(e.target.value)}
        >
          <option value="">{t("filterBySport")}</option>
          {sports.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.name}
            </option>
          ))}
        </Select>
        <Select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
        >
          <option value="">{t("filterByTier")}</option>
          {tiers.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name}
            </option>
          ))}
        </Select>
        <Select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as "all" | "active" | "inactive")
          }
        >
          <option value="all">{tCommon("all")}</option>
          <option value="active">{tCommon("active")}</option>
          <option value="inactive">{tCommon("inactive")}</option>
        </Select>
      </div>

      {/* Results count */}
      <p className="text-sm text-text-muted">
        {filtered.length} {filtered.length === 1 ? "member" : "members"}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="py-12 text-center text-text-muted">
          {t("noMembers")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member) => (
            <MemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  );
}
