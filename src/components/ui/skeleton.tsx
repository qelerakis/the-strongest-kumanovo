import { type HTMLAttributes } from "react";

function Skeleton({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-hover ${className}`}
      {...props}
    />
  );
}

export { Skeleton };
