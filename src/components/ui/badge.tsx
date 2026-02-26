import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "red" | "gold" | "blue" | "green" | "outline";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-hover text-text-primary border-transparent",
  red: "bg-brand-red/15 text-brand-red-light border-transparent",
  gold: "bg-brand-gold/15 text-brand-gold-light border-transparent",
  blue: "bg-blue-500/15 text-blue-400 border-transparent",
  green: "bg-success/15 text-success border-transparent",
  outline: "bg-transparent text-text-secondary border-surface-border",
};

function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors ${variantClasses[variant]} ${className}`}
      {...props}
    />
  );
}

export { Badge, type BadgeProps, type BadgeVariant };
