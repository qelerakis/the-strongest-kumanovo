"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { formatTime } from "@/lib/utils";
import type { getFullSchedule } from "@/lib/queries/schedule";

type ScheduleData = Awaited<ReturnType<typeof getFullSchedule>>;

const EASE = [0.25, 0.1, 0.25, 1] as const;
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6] as const;

/** Map sport color to muted variant */
function mutedColor(color: string | null): string {
  if (!color) return "#A8A29E";
  const c = color.toLowerCase();
  if (c.includes("dc2626") || c.includes("ef4444") || c.includes("b91c1c")) return "#B91C1C";
  if (c.includes("eab308") || c.includes("facc15") || c.includes("ca8a04")) return "#A16207";
  if (c.includes("22c55e") || c.includes("16a34a")) return "#22C55E";
  return "#A8A29E";
}

interface ScheduleDisplayProps {
  schedule: ScheduleData;
}

export default function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  const t = useTranslations("landing");
  const tDays = useTranslations("days");
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-15%" });

  const hasAnySlots = Object.keys(schedule).length > 0;

  return (
    <section id="schedule" className="flex min-h-screen flex-col items-center justify-center px-6 py-32 sm:px-8 lg:px-12">
      <div ref={ref} className="mx-auto w-full max-w-6xl">
        {/* Section label */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-16 block text-center text-sm font-medium tracking-[0.2em] uppercase text-text-secondary"
        >
          {t("scheduleLabel")}
        </motion.span>

        {!hasAnySlots ? (
          <p className="text-center text-lg text-text-secondary">{t("noClasses")}</p>
        ) : (
          <>
            {/* Desktop grid */}
            <div className="hidden lg:grid lg:grid-cols-6 lg:gap-8">
              {DISPLAY_DAYS.map((day, colIndex) => (
                <motion.div
                  key={day}
                  initial={{ opacity: 0, y: 24 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{
                    duration: 0.5,
                    delay: colIndex * 0.1,
                    ease: EASE,
                  }}
                  className="flex flex-col"
                >
                  {/* Day header */}
                  <div className="mb-6 border-b border-surface-border pb-3">
                    <span className="text-lg font-semibold text-brand-white">
                      {tDays(String(day))}
                    </span>
                  </div>

                  {/* Slots */}
                  <div className="flex flex-col gap-4">
                    {(schedule[day] ?? []).length === 0 ? (
                      <span className="text-sm text-text-muted">&mdash;</span>
                    ) : (
                      (schedule[day] ?? []).map((slot) => (
                        <div key={slot.id} className="flex items-start gap-3">
                          <div
                            className="mt-1.5 h-4 w-[2px] shrink-0 rounded-full"
                            style={{ backgroundColor: mutedColor(slot.sportColor) }}
                          />
                          <div>
                            <p className="text-base font-medium text-brand-white">
                              {slot.sportName}
                            </p>
                            <p className="text-sm text-text-secondary">
                              {formatTime(slot.startTime)}
                              {slot.endTime ? ` \u2013 ${formatTime(slot.endTime)}` : ""}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile layout */}
            <div className="flex flex-col gap-10 lg:hidden">
              {DISPLAY_DAYS.map((day, index) => {
                const daySlots = schedule[day] ?? [];
                if (daySlots.length === 0) return null;

                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                      ease: EASE,
                    }}
                  >
                    <h3 className="mb-4 text-lg font-semibold text-brand-white">
                      {tDays(String(day))}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {daySlots.map((slot) => (
                        <div key={slot.id} className="flex items-start gap-3">
                          <div
                            className="mt-1.5 h-4 w-[2px] shrink-0 rounded-full"
                            style={{ backgroundColor: mutedColor(slot.sportColor) }}
                          />
                          <div>
                            <p className="text-base font-medium text-brand-white">
                              {slot.sportName}
                            </p>
                            <p className="text-sm text-text-secondary">
                              {formatTime(slot.startTime)}
                              {slot.endTime ? ` \u2013 ${formatTime(slot.endTime)}` : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
