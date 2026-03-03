"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface ClassSession {
  sessionId: string;
  date: string;
  startTime: string;
  endTime: string | null;
  attendeeCount: number;
}

interface Sport {
  id: string;
  name: string;
  nameKey: string;
  color: string | null;
}

interface AttendanceBySportProps {
  sports: Sport[];
  sessionsBySport: Record<string, ClassSession[]>;
  defaultSportId: string;
}

function SportIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 text-text-muted"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTimeSlot(start: string, end: string | null): string {
  if (!end) return start;
  return `${start} - ${end}`;
}

export default function AttendanceBySport({
  sports,
  sessionsBySport,
  defaultSportId,
}: AttendanceBySportProps) {
  const [activeSportId, setActiveSportId] = useState(defaultSportId);
  const t = useTranslations("dashboard");
  const tSports = useTranslations("sports");

  const sessions = sessionsBySport[activeSportId] ?? [];

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let newIndex = index;
    if (e.key === "ArrowRight") {
      newIndex = (index + 1) % sports.length;
    } else if (e.key === "ArrowLeft") {
      newIndex = (index - 1 + sports.length) % sports.length;
    } else {
      return;
    }
    e.preventDefault();
    setActiveSportId(sports[newIndex].id);
    // Focus the new tab button
    const buttons = e.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons?.[newIndex]?.focus();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <SportIcon />
          <CardTitle>{t("attendanceBySport")}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {/* Sport tabs */}
        <div
          role="tablist"
          className="mb-4 flex gap-1 rounded-lg bg-surface-alt p-1"
        >
          {sports.map((sport, index) => (
            <button
              key={sport.id}
              role="tab"
              aria-selected={activeSportId === sport.id}
              tabIndex={activeSportId === sport.id ? 0 : -1}
              onClick={() => setActiveSportId(sport.id)}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
              className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                activeSportId === sport.id
                  ? "bg-surface text-text-primary shadow-sm"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {tSports(sport.nameKey)}
            </button>
          ))}
        </div>

        {/* Sessions list */}
        <div role="tabpanel">
          {sessions.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-surface-border py-8">
              <p className="text-sm text-text-muted">
                {t("noClassSessions")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between rounded-lg border border-surface-border px-4 py-3"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium text-text-primary">
                      {formatSessionDate(session.date)}
                    </span>
                    <span className="text-xs text-text-muted">
                      {formatTimeSlot(session.startTime, session.endTime)}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-text-secondary">
                    {t("attendees", { count: session.attendeeCount })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
