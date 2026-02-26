"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { markAttendance } from "@/lib/actions/attendance";

interface Member {
  id: string;
  fullName: string;
}

interface AttendanceRecord {
  id: string;
  memberId: string;
  classSessionId: string;
  present: boolean;
  memberName: string;
}

interface AttendanceChecklistProps {
  classSessionId: string;
  members: Member[];
  existingAttendance: AttendanceRecord[];
}

export default function AttendanceChecklist({
  classSessionId,
  members,
  existingAttendance,
}: AttendanceChecklistProps) {
  const t = useTranslations("attendance");
  const tCommon = useTranslations("common");

  // Build initial set of present member IDs from existing attendance
  const initialPresent = new Set(
    existingAttendance.filter((a) => a.present).map((a) => a.memberId)
  );

  const [presentIds, setPresentIds] = useState<Set<string>>(initialPresent);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const presentCount = presentIds.size;
  const totalCount = members.length;
  const allSelected = presentCount === totalCount && totalCount > 0;

  function toggleMember(memberId: string) {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) {
        next.delete(memberId);
      } else {
        next.add(memberId);
      }
      return next;
    });
    setSaved(false);
  }

  function toggleAll() {
    if (allSelected) {
      setPresentIds(new Set());
    } else {
      setPresentIds(new Set(members.map((m) => m.id)));
    }
    setSaved(false);
  }

  function handleSave() {
    startTransition(async () => {
      const result = await markAttendance(
        classSessionId,
        Array.from(presentIds),
        members.map((m) => m.id)
      );
      if (result.success) {
        setSaved(true);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{t("markAttendance")}</CardTitle>
          <span className="text-sm text-text-secondary">
            {presentCount}/{totalCount} {t("present").toLowerCase()}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {members.length === 0 ? (
          <p className="text-center text-text-muted py-4">
            {tCommon("noResults")}
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {/* Select All / Deselect All toggle */}
            <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-surface-hover/50 mb-2">
              <Checkbox
                checked={allSelected}
                onChange={toggleAll}
                label={allSelected ? "Deselect All" : "Select All"}
              />
            </div>

            {/* Member list */}
            <div className="flex flex-col gap-0.5">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center py-2 px-3 rounded-lg hover:bg-surface-hover transition-colors"
                >
                  <Checkbox
                    checked={presentIds.has(member.id)}
                    onChange={() => toggleMember(member.id)}
                    label={member.fullName}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {members.length > 0 && (
        <CardFooter className="gap-3">
          <Button
            onClick={handleSave}
            loading={isPending}
            disabled={isPending}
          >
            {t("saveAttendance")}
          </Button>
          {saved && (
            <span className="text-sm text-success animate-in fade-in">
              Saved!
            </span>
          )}
        </CardFooter>
      )}
    </Card>
  );
}
