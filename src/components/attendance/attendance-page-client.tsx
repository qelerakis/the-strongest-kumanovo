"use client";

import { useState, useTransition } from "react";
import ClassPicker, { type ClassSession } from "./class-picker";
import AttendanceChecklist from "./attendance-checklist";
import {
  getSessionsForDateAction,
  getSessionDetailsAction,
} from "@/lib/actions/attendance";

interface AttendanceRecord {
  id: string;
  memberId: string;
  classSessionId: string;
  present: boolean;
  memberName: string;
}

interface Member {
  id: string;
  fullName: string;
}

interface AttendancePageClientProps {
  initialSessions: ClassSession[];
  initialDate: string;
}

export default function AttendancePageClient({
  initialSessions,
  initialDate,
}: AttendancePageClientProps) {
  const [sessions, setSessions] = useState<ClassSession[]>(initialSessions);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(
    null
  );
  const [members, setMembers] = useState<Member[]>([]);
  const [existingAttendance, setExistingAttendance] = useState<
    AttendanceRecord[]
  >([]);
  const [isLoadingSessions, startSessionsTransition] = useTransition();
  const [isLoadingDetails, startDetailsTransition] = useTransition();

  function handleDateChange(date: string) {
    setSelectedDate(date);
    setSelectedSession(null);
    setMembers([]);
    setExistingAttendance([]);

    startSessionsTransition(async () => {
      const result = await getSessionsForDateAction(date);
      if (result.success) {
        setSessions(result.sessions as ClassSession[]);
      }
    });
  }

  function handleSelectSession(session: ClassSession) {
    setSelectedSession(session);

    startDetailsTransition(async () => {
      const result = await getSessionDetailsAction(session.id, session.sportId);
      if (result.success) {
        setMembers(result.members);
        setExistingAttendance(result.existingAttendance as AttendanceRecord[]);
      }
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Class Picker with date selector */}
      <div className="relative">
        <ClassPicker
          sessions={sessions}
          selectedSessionId={selectedSession?.id ?? null}
          onSelectSession={handleSelectSession}
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
        />
        {isLoadingSessions && (
          <div className="absolute inset-0 flex items-center justify-center bg-surface/50 rounded-xl">
            <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Attendance Checklist */}
      {selectedSession && (
        <div className="relative">
          <AttendanceChecklist
            key={selectedSession.id}
            classSessionId={selectedSession.id}
            members={members}
            existingAttendance={existingAttendance}
          />
          {isLoadingDetails && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/50 rounded-xl">
              <div className="w-6 h-6 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
