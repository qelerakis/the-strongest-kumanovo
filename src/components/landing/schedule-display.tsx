import { useTranslations } from "next-intl";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import type { getFullSchedule } from "@/lib/queries/schedule";

type ScheduleData = Awaited<ReturnType<typeof getFullSchedule>>;

/** Map a sport color hex to the closest Badge variant */
function sportBadgeVariant(color: string | null): BadgeVariant {
  if (!color) return "default";
  const c = color.toLowerCase();
  if (c.includes("dc2626") || c.includes("ef4444") || c.includes("b91c1c"))
    return "red";
  if (c.includes("eab308") || c.includes("facc15") || c.includes("ca8a04"))
    return "gold";
  if (c.includes("2563eb") || c.includes("3b82f6")) return "blue";
  if (c.includes("22c55e") || c.includes("16a34a")) return "green";
  return "default";
}

// Days to display (Mon-Sat, skipping Sunday=0 if desired)
const DISPLAY_DAYS = [1, 2, 3, 4, 5, 6] as const;

interface ScheduleDisplayProps {
  schedule: ScheduleData;
}

export default function ScheduleDisplay({ schedule }: ScheduleDisplayProps) {
  const t = useTranslations("landing");
  const tDays = useTranslations("days");

  const hasAnySlots = Object.keys(schedule).length > 0;

  return (
    <section id="schedule" className="px-4 py-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-12 text-center text-3xl font-bold text-brand-white sm:text-4xl">
          {t("scheduleTitle")}
        </h2>

        {!hasAnySlots ? (
          <p className="text-center text-text-secondary">
            {t("noClasses")}
          </p>
        ) : (
          <>
            {/* Desktop: column-based weekly grid */}
            <div className="hidden lg:grid lg:grid-cols-6 lg:gap-3">
              {DISPLAY_DAYS.map((day) => (
                <div key={day} className="flex flex-col">
                  {/* Day header */}
                  <div className="mb-3 rounded-lg bg-surface-card border border-surface-border px-3 py-2 text-center">
                    <span className="text-sm font-semibold text-brand-white">
                      {tDays(String(day))}
                    </span>
                  </div>

                  {/* Slots */}
                  <div className="flex flex-col gap-2">
                    {(schedule[day] ?? []).length === 0 ? (
                      <div className="rounded-lg border border-surface-border/50 bg-surface-card/50 px-3 py-4 text-center">
                        <span className="text-xs text-text-muted">--</span>
                      </div>
                    ) : (
                      (schedule[day] ?? []).map((slot) => (
                        <div
                          key={slot.id}
                          className="rounded-lg border border-surface-border bg-surface-card p-3 text-center transition-colors hover:bg-surface-hover"
                          style={{
                            borderLeftWidth: "3px",
                            borderLeftColor: slot.sportColor ?? undefined,
                          }}
                        >
                          <Badge
                            variant={sportBadgeVariant(slot.sportColor)}
                            className="mb-1.5"
                          >
                            {slot.sportName}
                          </Badge>
                          <p className="text-xs text-text-secondary">
                            {formatTime(slot.startTime)}
                            {slot.endTime ? ` - ${formatTime(slot.endTime)}` : ""}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Mobile / Tablet: stacked rows by day */}
            <div className="flex flex-col gap-6 lg:hidden">
              {DISPLAY_DAYS.map((day) => {
                const daySlots = schedule[day] ?? [];
                if (daySlots.length === 0) return null;

                return (
                  <div key={day}>
                    <h3 className="mb-3 text-sm font-semibold text-brand-white">
                      {tDays(String(day))}
                    </h3>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {daySlots.map((slot) => (
                        <div
                          key={slot.id}
                          className="flex items-center gap-3 rounded-lg border border-surface-border bg-surface-card p-3"
                          style={{
                            borderLeftWidth: "3px",
                            borderLeftColor: slot.sportColor ?? undefined,
                          }}
                        >
                          <div className="flex-1 text-center">
                            <Badge
                              variant={sportBadgeVariant(slot.sportColor)}
                              className="mb-1"
                            >
                              {slot.sportName}
                            </Badge>
                            <p className="text-xs text-text-secondary">
                              {formatTime(slot.startTime)}
                              {slot.endTime
                                ? ` - ${formatTime(slot.endTime)}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
