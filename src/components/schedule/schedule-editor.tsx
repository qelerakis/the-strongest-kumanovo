"use client";

import { useState, useTransition } from "react";
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
import { TimePicker } from "@/components/ui/time-picker";
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

/** Inner form that remounts each time the dialog opens, resetting all state. */
function ScheduleEditorInner({
  onClose,
  sports,
  slot,
  defaultDay = 1,
}: Omit<ScheduleEditorProps, "isOpen">) {
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

        <TimePicker
          label={t("startTime")}
          value={startTime}
          onChange={setStartTime}
          required
        />

        <TimePicker
          label={t("endTime")}
          value={endTime}
          onChange={setEndTime}
        />

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </DialogContent>

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isPending}
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit" loading={isPending}>
          {tCommon("save")}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ScheduleEditor({
  isOpen,
  onClose,
  sports,
  slot,
  defaultDay = 1,
}: ScheduleEditorProps) {
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {isOpen && (
        <ScheduleEditorInner
          key={`${String(isOpen)}-${slot?.id ?? "new"}`}
          onClose={onClose}
          sports={sports}
          slot={slot}
          defaultDay={defaultDay}
        />
      )}
    </Dialog>
  );
}
