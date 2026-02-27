"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createMember, updateMember } from "@/lib/actions/members";
import type { BeltRank } from "@/types";

interface Tier {
  id: string;
  name: string;
  sportsAllowed: number;
  monthlyPriceMkd: number;
}

interface Sport {
  id: string;
  name: string;
  nameKey: string;
  color: string | null;
}

interface MemberData {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  dateOfBirth: string | null;
  emergencyContact: string | null;
  membershipTierId: string;
  beltRank: string | null;
  joinDate: string;
  notes: string | null;
}

interface MemberFormProps {
  tiers: Tier[];
  sports: Sport[];
  member?: MemberData;
  memberSportIds?: string[];
}

const BELT_RANKS: BeltRank[] = ["white", "blue", "purple", "brown", "black"];

export default function MemberForm({
  tiers,
  sports,
  member,
  memberSportIds = [],
}: MemberFormProps) {
  const t = useTranslations("members");
  const tCommon = useTranslations("common");
  const tBelts = useTranslations("belts");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isEdit = !!member;

  const [dateOfBirth, setDateOfBirth] = useState(member?.dateOfBirth || "");
  const [joinDate, setJoinDate] = useState(member?.joinDate || "");
  const [selectedTierId, setSelectedTierId] = useState(
    member?.membershipTierId || ""
  );
  const [selectedSports, setSelectedSports] =
    useState<string[]>(memberSportIds);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const selectedTier = tiers.find((t) => t.id === selectedTierId);
  const maxSports = selectedTier?.sportsAllowed ?? 0;
  const isUnlimited = maxSports === -1;

  function handleSportToggle(sportId: string) {
    setSelectedSports((prev) => {
      if (prev.includes(sportId)) {
        return prev.filter((id) => id !== sportId);
      }
      // Check if we can add more sports
      if (!isUnlimited && prev.length >= maxSports) {
        return prev;
      }
      return [...prev, sportId];
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setFormError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("selectedSports", selectedSports.join(","));

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!formData.get("fullName")) {
      newErrors.fullName = "Full name is required";
    }
    if (!formData.get("membershipTierId")) {
      newErrors.membershipTierId = "Membership tier is required";
    }
    if (!formData.get("joinDate")) {
      newErrors.joinDate = "Join date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    startTransition(async () => {
      const result = isEdit
        ? await updateMember(member!.id, formData)
        : await createMember(formData);

      if (result.success) {
        if (isEdit) {
          router.refresh();
        } else {
          router.push("/dashboard/members");
        }
      } else {
        setFormError(result.error || "An error occurred");
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? t("editMember") : t("addMember")}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {formError && (
            <div className="rounded-lg border border-error bg-error/10 px-4 py-3 text-sm text-error">
              {formError}
            </div>
          )}

          {/* Personal info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              name="fullName"
              label={t("fullName")}
              defaultValue={member?.fullName || ""}
              error={errors.fullName}
              required
            />
            <Input
              name="phone"
              label={t("phone")}
              defaultValue={member?.phone || ""}
              type="tel"
            />
            <Input
              name="email"
              label={t("email")}
              defaultValue={member?.email || ""}
              type="email"
            />
            <DatePicker
              name="dateOfBirth"
              label={t("dateOfBirth")}
              value={dateOfBirth}
              onChange={setDateOfBirth}
            />
            <Input
              name="emergencyContact"
              label={t("emergencyContact")}
              defaultValue={member?.emergencyContact || ""}
              className="sm:col-span-2"
            />
          </div>

          {/* Membership info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              name="membershipTierId"
              label={t("membershipTier")}
              value={selectedTierId}
              onChange={(e) => {
                setSelectedTierId(e.target.value);
                // Reset sports if new tier has fewer allowed
                const newTier = tiers.find((t) => t.id === e.target.value);
                if (newTier && newTier.sportsAllowed !== -1) {
                  setSelectedSports((prev) =>
                    prev.slice(0, newTier.sportsAllowed)
                  );
                }
              }}
              error={errors.membershipTierId}
              required
            >
              <option value="">{t("membershipTier")}</option>
              {tiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </Select>

            <Select
              name="beltRank"
              label={t("beltRank")}
              defaultValue={member?.beltRank || "white"}
            >
              {BELT_RANKS.map((rank) => (
                <option key={rank} value={rank}>
                  {tBelts(rank)}
                </option>
              ))}
            </Select>

            <DatePicker
              name="joinDate"
              label={t("joinDate")}
              value={joinDate}
              onChange={setJoinDate}
              error={errors.joinDate}
              required
            />
          </div>

          {/* Sports selection */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-text-secondary">
              {t("enrolledSports")}
              {selectedTier && !isUnlimited && (
                <span className="ml-2 text-text-muted">
                  ({selectedSports.length}/{maxSports})
                </span>
              )}
            </label>
            <div className="flex flex-wrap gap-4">
              {sports.map((sport) => {
                const isChecked = selectedSports.includes(sport.id);
                const isDisabled =
                  !isChecked && !isUnlimited && selectedSports.length >= maxSports;

                return (
                  <Checkbox
                    key={sport.id}
                    label={sport.name}
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => handleSportToggle(sport.id)}
                  />
                );
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="notes"
              className="text-sm font-medium text-text-secondary"
            >
              {t("notes")}
            </label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={member?.notes || ""}
              rows={3}
              className="w-full rounded-lg border border-surface-border bg-surface-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 focus:ring-offset-surface hover:border-text-muted resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={isPending}>
              {tCommon("save")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              {tCommon("cancel")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
