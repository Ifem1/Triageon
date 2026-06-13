"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "refund" | "request";
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({ variant = "primary", loading, children, className, disabled, ...props }: ButtonProps) {
  const base = "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed btn-clip";

  const styles: Record<string, React.CSSProperties> = {
    primary:   { background: "var(--signal-teal)",  color: "var(--bg-shell)" },
    secondary: { background: "transparent",          color: "var(--text-muted)", border: "1px solid var(--copper-wire)" },
    ghost:     { background: "transparent",          color: "var(--text-muted)" },
    danger:    { background: "transparent",          color: "var(--critical-rose)", border: "1px solid var(--critical-rose)" },
    refund:    { background: "var(--queue-sage)",    color: "var(--bg-shell)" },
    request:   { background: "var(--bg-card)",       color: "var(--text-body)", border: "1px solid var(--route-blue)" },
  };

  return (
    <button
      className={cn(base, className)}
      style={styles[variant]}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
}
