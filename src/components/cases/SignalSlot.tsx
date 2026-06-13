"use client";

import Link from "next/link";
import { cn, riskBg, statusColor, statusLabel, timeAgo } from "@/lib/utils";
import type { SupportCase } from "@/lib/genlayer/types";

interface SignalSlotProps {
  c: SupportCase;
  active?: boolean;
}

export function SignalSlot({ c, active }: SignalSlotProps) {
  return (
    <Link
      href={`/app/cases/${c.case_id}`}
      className="signal-slot block px-3 py-3 transition-colors cursor-pointer"
      style={{
        borderBottom: "1px solid var(--border)",
        borderLeft: active ? "2px solid var(--copper-wire)" : "2px solid transparent",
        background: active ? "rgba(183,106,60,0.08)" : "transparent",
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="font-dm-mono text-[10px] truncate" style={{ color: "var(--copper-wire)" }}>{c.case_id}</span>
        {c.risk_level && (
          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-sm font-dm-mono font-bold", riskBg(c.risk_level))}>
            {c.risk_level}
          </span>
        )}
      </div>
      <p className="text-xs truncate leading-tight" style={{ color: "var(--text-body)" }}>{c.ticket_title}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-sm font-dm-mono", statusColor(c.status))}>
          {statusLabel(c.status)}
        </span>
        <span className="text-[9px] font-dm-mono" style={{ color: "var(--text-faint)" }}>{timeAgo(c.created_at)}</span>
      </div>
    </Link>
  );
}
