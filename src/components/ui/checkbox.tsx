"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className = "", id, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <label
        htmlFor={checkboxId}
        className="inline-flex items-center gap-2 cursor-pointer select-none group"
      >
        <div className="relative flex items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={`peer h-4 w-4 shrink-0 appearance-none rounded border border-surface-border bg-surface-card transition-colors checked:bg-brand-red checked:border-brand-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-red focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-50 disabled:cursor-not-allowed hover:border-text-muted ${className}`}
            {...props}
          />
          <svg
            className="pointer-events-none absolute h-3 w-3 text-brand-white opacity-0 peer-checked:opacity-100"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        {label && (
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
            {label}
          </span>
        )}
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";

export { Checkbox, type CheckboxProps };
