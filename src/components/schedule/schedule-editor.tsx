"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { addClassSlot, updateClassSlot } from "@/lib/actions/schedule";

interface Sport {
  id: string;
  name: string;
  nameKey: string;
  color: string | null;
}

interface SlotData {
  id: string;
  sportId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string | null;
}

interface ScheduleEditorProps {
  isOpen: boolean;
  onClose: () => void;
  sports: Sport[];
  slot?: SlotData | null;
  defaultDay?: number;
}

export default function ScheduleEditor({
  isOpen,
  onClose,
  sports,
  slot,
  defaultDay = 1,
}: ScheduleEditorProps) {
  const t = useTranslations("schedule");
  const tDays = useTranslations("days");
  const tCommon = useTranslations("common");
  const tSports = useTranslations("sports");

  const isEditing = !!slot;

  const [sportId, setSportId] = useState(slot?.sportId ?? "");
  const [dayOfWeek, setDayOfWeek] = useState<number>(slot?.dayOfWeek ?? defaultDay);
  const [startTime, setStartTime] = useState(slot?.startTime ?? "");
  const [endTime, setEndTime] = useState(slot?.endTime ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync form state when the dialog opens with new context
  useEffect(() => {
    if (isOpen) {
      setSportId(slot?.sportId ?? "");
      setDayOfWeek(slot?.dayOfWeek ?? defaultDay);
      setStartTime(slot?.startTime ?? "");
      setEndTime(slot?.endTime ?? "");
      setError(null);
    }
  }, [isOpen, slot, defaultDay]);

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData();
    formData.set("sportId", sportId);
    formData.set("dayOfWeek", String(dayOfWeek));
    formData.set("startTime", startTime);
    formData.set("endTime", endTime);

    startTransition(async () => {
      const result = isEditing
        ? await updateClassSlot(slot!.id, formData)
        : await addClassSlot(formData);

      if (result.success) {
        onClose();
      } else {
        setError(result.error ?? "An error occurred");
      }
    });
  };

  // Days available for scheduling (Mon=1 through Sat=6)
  const scheduleDays = [1, 2, 3, 4, 5, 6];

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("editClass") : t("addClass")}
          </DialogTitle>
        </DialogHeader>

        <DialogContent className="flex flex-col gap-4">
          <Select
            label={t("sport")}
            value={sportId}
            onChange={(e) => setSportId(e.target.value)}
            required
          >
            <option value="" disabled>
              {t("sport")}
            </option>
            {sports.map((sport) => (
              <option key={sport.id} value={sport.id}>
                {tSports(sport.nameKey)}
              </option>
            ))}
          </Select>

          <Select
            label={t("day")}
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(Number(e.target.value))}
            required
          >
            {scheduleDays.map((day) => (
              <option key={day} value={day}>
                {tDays(String(day))}
              </option>
            ))}
          </Select>

          <Input
            label={t("startTime")}
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            required
          />

          <Input
            label={t("endTime")}
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />

          {error && (
            <p className="text-sm text-error">{error}</p>
          )}
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isPending}
          >
            {tCommon("cancel")}
          </Button>
          <Button type="submit" loading={isPending}>
            {tCommon("save")}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
