"use client";

import { cn } from "@/lib/utils";

interface BadgeProps {
  label: string;
  className?: string;
}

export function Badge({ label, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-xs font-dm-mono rounded-sm font-medium tracking-wide uppercase",
        className
      )}
    >
      {label}
    </span>
  );
}
