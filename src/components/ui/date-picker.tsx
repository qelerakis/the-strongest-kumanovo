"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface DatePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  mode?: "date" | "month";
  error?: string;
  required?: boolean;
  className?: string;
  name?: string;
}

const DAY_LABELS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Returns 0=Mon ... 6=Sun for a given date */
function dayOfWeekMondayStart(year: number, month: number, day: number): number {
  const jsDay = new Date(year, month, day).getDay(); // 0=Sun
  return jsDay === 0 ? 6 : jsDay - 1;
}

function CalendarIcon() {
  return (
    <svg
      className="h-4 w-4 text-brand-red"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function ChevronLeft() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function DatePicker({
  label,
  value,
  onChange,
  mode = "date",
  error,
  required,
  className = "",
  name,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewing state for calendar navigation
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  const todayDay = today.getDate();

  // Parse initial viewing year/month from value or default to today
  const initialYear = value ? parseInt(value.substring(0, 4), 10) || todayYear : todayYear;
  const initialMonth =
    mode === "date" && value
      ? parseInt(value.substring(5, 7), 10) - 1
      : mode === "month" && value
        ? 0
        : todayMonth;

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(
    mode === "date" ? (value ? initialMonth : todayMonth) : 0
  );

  // Sync viewing state when value changes externally
  useEffect(() => {
    if (value && mode === "date") {
      const y = parseInt(value.substring(0, 4), 10);
      const m = parseInt(value.substring(5, 7), 10) - 1;
      if (!isNaN(y) && !isNaN(m)) {
        setViewYear(y);
        setViewMonth(m);
      }
    } else if (value && mode === "month") {
      const y = parseInt(value.substring(0, 4), 10);
      if (!isNaN(y)) {
        setViewYear(y);
      }
    }
  }, [value, mode]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const navigatePrev = useCallback(() => {
    if (mode === "date") {
      setViewMonth((prev) => {
        if (prev === 0) {
          setViewYear((y) => y - 1);
          return 11;
        }
        return prev - 1;
      });
    } else {
      setViewYear((y) => y - 1);
    }
  }, [mode]);

  const navigateNext = useCallback(() => {
    if (mode === "date") {
      setViewMonth((prev) => {
        if (prev === 11) {
          setViewYear((y) => y + 1);
          return 0;
        }
        return prev + 1;
      });
    } else {
      setViewYear((y) => y + 1);
    }
  }, [mode]);

  const selectDate = useCallback(
    (day: number) => {
      const mm = String(viewMonth + 1).padStart(2, "0");
      const dd = String(day).padStart(2, "0");
      onChange(`${viewYear}-${mm}-${dd}`);
      setOpen(false);
    },
    [viewYear, viewMonth, onChange]
  );

  const selectMonth = useCallback(
    (monthIndex: number) => {
      const mm = String(monthIndex + 1).padStart(2, "0");
      onChange(`${viewYear}-${mm}`);
      setOpen(false);
    },
    [viewYear, onChange]
  );

  // Format display value
  function formatDisplayValue(): string {
    if (!value) return "";
    if (mode === "month" && value.length >= 7) {
      const y = value.substring(0, 4);
      const m = parseInt(value.substring(5, 7), 10);
      if (!isNaN(m) && m >= 1 && m <= 12) {
        return `${MONTH_LABELS[m - 1]} ${y}`;
      }
      return value;
    }
    if (mode === "date" && value.length >= 10) {
      const y = value.substring(0, 4);
      const m = parseInt(value.substring(5, 7), 10);
      const d = parseInt(value.substring(8, 10), 10);
      if (!isNaN(m) && !isNaN(d) && m >= 1 && m <= 12) {
        return `${d} ${MONTH_LABELS[m - 1]} ${y}`;
      }
      return value;
    }
    return value;
  }

  // Selected value parsing
  const selectedYear = value ? parseInt(value.substring(0, 4), 10) : null;
  const selectedMonth = value ? parseInt(value.substring(5, 7), 10) - 1 : null;
  const selectedDay =
    mode === "date" && value && value.length >= 10
      ? parseInt(value.substring(8, 10), 10)
      : null;

  const inputId = label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div ref={containerRef} className={`relative flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
          {required && <span className="text-error ml-0.5">*</span>}
        </label>
      )}

      {/* Trigger button */}
      <button
        id={inputId}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-lg border bg-surface-card px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-red focus:ring-offset-1 focus:ring-offset-surface ${
          error
            ? "border-error focus:ring-error"
            : "border-surface-border hover:border-text-muted"
        } ${open ? "ring-2 ring-brand-red ring-offset-1 ring-offset-surface" : ""}`}
      >
        <span className={value ? "text-text-primary" : "text-text-muted"}>
          {value ? formatDisplayValue() : mode === "date" ? "Select date" : "Select month"}
        </span>
        <CalendarIcon />
      </button>

      {/* Hidden input for form submission */}
      {name && <input type="hidden" name={name} value={value} />}

      {error && <p className="text-sm text-error">{error}</p>}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full min-w-[280px] rounded-lg border border-surface-border bg-surface-card p-3 shadow-lg shadow-black/40">
          {/* Header with navigation */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={navigatePrev}
              className="rounded p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft />
            </button>
            <span className="text-sm font-semibold text-text-primary">
              {mode === "date"
                ? `${MONTH_LABELS[viewMonth]} ${viewYear}`
                : String(viewYear)}
            </span>
            <button
              type="button"
              onClick={navigateNext}
              className="rounded p-1 text-text-secondary hover:bg-surface-hover hover:text-text-primary transition-colors"
              aria-label="Next"
            >
              <ChevronRight />
            </button>
          </div>

          {mode === "date" ? (
            <DateGrid
              viewYear={viewYear}
              viewMonth={viewMonth}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              selectedDay={selectedDay}
              todayYear={todayYear}
              todayMonth={todayMonth}
              todayDay={todayDay}
              onSelect={selectDate}
            />
          ) : (
            <MonthGrid
              viewYear={viewYear}
              selectedYear={selectedYear}
              selectedMonth={selectedMonth}
              onSelect={selectMonth}
            />
          )}
        </div>
      )}
    </div>
  );
}

/** Full calendar day grid (Mon-Sun, 7 columns) */
function DateGrid({
  viewYear,
  viewMonth,
  selectedYear,
  selectedMonth,
  selectedDay,
  todayYear,
  todayMonth,
  todayDay,
  onSelect,
}: {
  viewYear: number;
  viewMonth: number;
  selectedYear: number | null;
  selectedMonth: number | null;
  selectedDay: number | null;
  todayYear: number;
  todayMonth: number;
  todayDay: number;
  onSelect: (day: number) => void;
}) {
  const totalDays = daysInMonth(viewYear, viewMonth);
  const startOffset = dayOfWeekMondayStart(viewYear, viewMonth, 1);

  const cells: (number | null)[] = [];
  // Leading empty cells
  for (let i = 0; i < startOffset; i++) {
    cells.push(null);
  }
  // Day cells
  for (let d = 1; d <= totalDays; d++) {
    cells.push(d);
  }

  const isSelected =
    selectedYear === viewYear && selectedMonth === viewMonth;
  const isCurrentMonth = todayYear === viewYear && todayMonth === viewMonth;

  return (
    <div>
      {/* Day labels */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-text-muted py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="h-8" />;
          }

          const isDaySelected = isSelected && selectedDay === day;
          const isToday = isCurrentMonth && todayDay === day;

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(day)}
              className={`flex h-8 items-center justify-center rounded text-sm transition-colors ${
                isDaySelected
                  ? "bg-brand-red text-white font-semibold"
                  : isToday
                    ? "ring-1 ring-brand-gold text-text-primary hover:bg-surface-hover"
                    : "text-text-primary hover:bg-surface-hover"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Month selection grid (4x3) for month mode */
function MonthGrid({
  viewYear,
  selectedYear,
  selectedMonth,
  onSelect,
}: {
  viewYear: number;
  selectedYear: number | null;
  selectedMonth: number | null;
  onSelect: (monthIndex: number) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {MONTH_LABELS.map((label, index) => {
        const isSelected = selectedYear === viewYear && selectedMonth === index;

        return (
          <button
            key={label}
            type="button"
            onClick={() => onSelect(index)}
            className={`rounded-md px-2 py-2 text-sm transition-colors ${
              isSelected
                ? "bg-brand-red text-white font-semibold"
                : "text-text-primary hover:bg-surface-hover"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

DatePicker.displayName = "DatePicker";

export { DatePicker, type DatePickerProps };
