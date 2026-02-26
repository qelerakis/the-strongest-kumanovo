"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime, cn } from "@/lib/utils";

export interface ClassSession {
  id: string;
  scheduleId: string;
  date: string;
  notes: string | null;
  startTime: string;
  endTime: string | null;
  sportId: string;
  sportName: string;
  sportColor: string | null;
}

interface ClassPickerProps {
  sessions: ClassSession[];
  selectedSessionId: string | null;
  onSelectSession: (session: ClassSession) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function ClassPicker({
  sessions,
  selectedSessionId,
  onSelectSession,
  selectedDate,
  onDateChange,
}: ClassPickerProps) {
  const t = useTranslations("attendance");
  const tDays = useTranslations("days");

  const dayOfWeek = new Date(selectedDate + "T00:00:00").getDay();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-lg font-semibold text-text-primary">
          {t("todayClasses")}
        </h2>
        <div className="flex items-center gap-2">
          <label
            htmlFor="attendance-date"
            className="text-sm text-text-secondary"
          >
            {t("selectDate")}:
          </label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface-card px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-2 focus:ring-offset-surface"
          />
        </div>
      </div>

      {sessions.length === 0 ? (
        <Card className="p-6">
          <p className="text-center text-text-muted">{t("noClassesToday")}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sessions.map((session) => {
            const isSelected = selectedSessionId === session.id;

            return (
              <Card
                key={session.id}
                onClick={() => onSelectSession(session)}
                className={cn(
                  "p-4 cursor-pointer transition-all hover:border-brand-red/50",
                  isSelected &&
                    "border-brand-red ring-2 ring-brand-red/20 bg-brand-red/5"
                )}
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <Badge
                      style={
                        session.sportColor
                          ? {
                              backgroundColor: `${session.sportColor}20`,
                              color: session.sportColor,
                            }
                          : undefined
                      }
                    >
                      {session.sportName}
                    </Badge>
                    <span className="text-xs text-text-muted">
                      {tDays(String(dayOfWeek))}
                    </span>
                  </div>
                  <div className="text-sm text-text-secondary">
                    {formatTime(session.startTime)}
                    {session.endTime && ` - ${formatTime(session.endTime)}`}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {sessions.length > 0 && !selectedSessionId && (
        <p className="text-sm text-text-muted text-center">
          {t("selectClass")}
        </p>
      )}
    </div>
  );
}
