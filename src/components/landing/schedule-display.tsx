"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";
import { formatTime } from "@/lib/utils";
import type { getFullSchedule } from "@/lib/queries/schedule";

type ScheduleData = Awaited<ReturnType<typeof getFullSchedule>>;

import { DISPLAY_DAYS, mutedColor } from "./landing-utils";

const EASE = [0.25, 0.1, 0.25, 1] as const;

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
    <section id="schedule" className="flex flex-col items-center justify-center px-6 py-20 sm:px-8 lg:px-12">
      <div ref={ref} className="mx-auto w-full max-w-6xl">
        {/* Section label */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, ease: EASE }}
          className="mb-10 block text-center text-sm font-medium tracking-[0.2em] uppercase text-text-secondary"
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
