"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { removeClassSlot } from "@/lib/actions/schedule";
import ScheduleEditor from "./schedule-editor";

interface ScheduleSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string | null;
  sportId: string;
  sportName: string;
  sportColor: string | null;
}

interface Sport {
  id: string;
  name: string;
  nameKey: string;
  color: string | null;
}

interface WeeklyGridProps {
  schedule: Record<number, ScheduleSlot[]>;
  sports: Sport[];
}

/** Map sport color hex to a Badge variant */
function sportBadgeVariant(color: string | null) {
  if (!color) return "default" as const;
  const c = color.toLowerCase();
  if (c.includes("red") || c === "#dc2626" || c === "#ef4444") return "red" as const;
  if (c.includes("gold") || c.includes("yellow") || c === "#eab308") return "gold" as const;
  if (c.includes("blue") || c === "#3b82f6") return "blue" as const;
  if (c.includes("green") || c === "#22c55e") return "green" as const;
  return "default" as const;
}

export default function WeeklyGrid({ schedule, sports }: WeeklyGridProps) {
  const t = useTranslations("schedule");
  const tDays = useTranslations("days");
  const tCommon = useTranslations("common");
  const tSports = useTranslations("sports");

  // Editor dialog state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ScheduleSlot | null>(null);
  const [addForDay, setAddForDay] = useState<number>(1);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Days to display (Mon=1 through Sat=6)
  const days = [1, 2, 3, 4, 5, 6];

  const handleAdd = (day: number) => {
    setEditingSlot(null);
    setAddForDay(day);
    setEditorOpen(true);
  };

  const handleEdit = (slot: ScheduleSlot) => {
    setEditingSlot(slot);
    setAddForDay(slot.dayOfWeek);
    setEditorOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirmDeleteId === id) {
      setDeletingId(id);
      startTransition(async () => {
        await removeClassSlot(id);
        setDeletingId(null);
        setConfirmDeleteId(null);
      });
    } else {
      setConfirmDeleteId(id);
      // Auto-cancel confirmation after 3 seconds
      setTimeout(() => setConfirmDeleteId((prev) => (prev === id ? null : prev)), 3000);
    }
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingSlot(null);
  };

  const formatTime = (time: string) => time;

  return (
    <>
      {/* Desktop grid: horizontal columns per day */}
      <div className="hidden lg:grid lg:grid-cols-6 gap-4">
        {days.map((day) => {
          const slots = schedule[day] ?? [];
          return (
            <div key={day} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-primary">
                  {tDays(String(day))}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAdd(day)}
                  className="text-xs px-2 py-1"
                >
                  + {t("addClass")}
                </Button>
              </div>

              {slots.length === 0 ? (
                <p className="text-xs text-text-muted py-4 text-center">
                  {t("noClasses")}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {slots.map((slot) => (
                    <Card key={slot.id} className="p-0">
                      <CardContent className="p-3 flex flex-col gap-2">
                        <Badge
                          variant={sportBadgeVariant(slot.sportColor)}
                          className="self-start"
                        >
                          {tSports(
                            sports.find((s) => s.id === slot.sportId)?.nameKey ??
                              slot.sportName
                          )}
                        </Badge>
                        <p className="text-sm font-medium text-text-primary">
                          {formatTime(slot.startTime)}
                          {slot.endTime ? ` - ${formatTime(slot.endTime)}` : ""}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(slot)}
                            className="text-xs flex-1"
                          >
                            {tCommon("edit")}
                          </Button>
                          <Button
                            variant={confirmDeleteId === slot.id ? "destructive" : "ghost"}
                            size="sm"
                            onClick={() => handleDelete(slot.id)}
                            loading={deletingId === slot.id && isPending}
                            className="text-xs flex-1"
                          >
                            {confirmDeleteId === slot.id
                              ? tCommon("confirm")
                              : tCommon("delete")}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile / tablet: stacked cards per day */}
      <div className="flex flex-col gap-6 lg:hidden">
        {days.map((day) => {
          const slots = schedule[day] ?? [];
          return (
            <Card key={day}>
              <div className="flex items-center justify-between p-4 pb-2">
                <h3 className="text-base font-semibold text-text-primary">
                  {tDays(String(day))}
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAdd(day)}
                >
                  + {t("addClass")}
                </Button>
              </div>
              <CardContent className="pt-2">
                {slots.length === 0 ? (
                  <p className="text-sm text-text-muted py-2">
                    {t("noClasses")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="flex items-center justify-between rounded-lg border border-surface-border p-3"
                      >
                        <div className="flex flex-col gap-1">
                          <Badge
                            variant={sportBadgeVariant(slot.sportColor)}
                            className="self-start"
                          >
                            {tSports(
                              sports.find((s) => s.id === slot.sportId)
                                ?.nameKey ?? slot.sportName
                            )}
                          </Badge>
                          <p className="text-sm font-medium text-text-primary">
                            {formatTime(slot.startTime)}
                            {slot.endTime
                              ? ` - ${formatTime(slot.endTime)}`
                              : ""}
                          </p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(slot)}
                          >
                            {tCommon("edit")}
                          </Button>
                          <Button
                            variant={
                              confirmDeleteId === slot.id
                                ? "destructive"
                                : "ghost"
                            }
                            size="sm"
                            onClick={() => handleDelete(slot.id)}
                            loading={deletingId === slot.id && isPending}
                          >
                            {confirmDeleteId === slot.id
                              ? tCommon("confirm")
                              : tCommon("delete")}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Schedule Editor Dialog */}
      <ScheduleEditor
        isOpen={editorOpen}
        onClose={handleEditorClose}
        sports={sports}
        defaultDay={addForDay}
        slot={
          editingSlot
            ? {
                id: editingSlot.id,
                sportId: editingSlot.sportId,
                dayOfWeek: editingSlot.dayOfWeek,
                startTime: editingSlot.startTime,
                endTime: editingSlot.endTime,
              }
            : null
        }
      />
    </>
  );
}
