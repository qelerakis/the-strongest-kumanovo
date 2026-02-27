"use client";

import { useState, useRef, useEffect } from "react";

interface TimePickerProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

/** Generate time options from 06:00 to 22:00 in 15-minute intervals */
function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      // Stop after 22:00 (don't generate 22:15, 22:30, 22:45)
      if (hour === 22 && minute > 0) break;
      const hh = String(hour).padStart(2, "0");
      const mm = String(minute).padStart(2, "0");
      options.push(`${hh}:${mm}`);
    }
  }
  return options;
}

const TIME_OPTIONS = generateTimeOptions();

/** Format HH:MM for display (e.g. "18:30" -> "6:30 PM") */
function formatTimeDisplay(time: string): string {
  if (!time || time.length < 5) return time;
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  const m = mStr;
  if (isNaN(h)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayHour}:${m} ${period}`;
}

function ClockIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function TimePicker({
  label,
  value,
  onChange,
  error,
  required,
  className = "",
  placeholder,
}: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll selected time into view when dropdown opens
  useEffect(() => {
    if (!open || !listRef.current || !value) return;

    // Small delay to ensure the DOM has rendered
    const timer = setTimeout(() => {
      const selectedEl = listRef.current?.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "center" });
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [open, value]);

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
          {value ? formatTimeDisplay(value) : placeholder ?? "Select time"}
        </span>
        <ClockIcon />
      </button>

      {error && <p className="text-sm text-error">{error}</p>}

      {/* Dropdown panel */}
      {open && (
        <div className="absolute top-full left-0 z-50 mt-1 w-full rounded-lg border border-surface-border bg-surface-card shadow-lg shadow-black/40">
          <div
            ref={listRef}
            className="max-h-[250px] overflow-y-auto p-1"
          >
            {TIME_OPTIONS.map((time) => {
              const isSelected = value === time;

              return (
                <button
                  key={time}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => {
                    onChange(time);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors ${
                    isSelected
                      ? "bg-brand-red text-white font-semibold"
                      : "text-text-primary hover:bg-surface-hover"
                  }`}
                >
                  <span>{formatTimeDisplay(time)}</span>
                  <span className={`text-xs ${isSelected ? "text-white/70" : "text-text-muted"}`}>
                    {time}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

TimePicker.displayName = "TimePicker";

export { TimePicker, type TimePickerProps };
