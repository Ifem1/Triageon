"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { cn, riskBg, statusColor, statusLabel, formatDate, routeColor } from "@/lib/utils";
import { ChevronRight, FolderOpen, Search } from "lucide-react";
import { useState } from "react";

export default function AllCases() {
  const { cases } = useStore();
  const [search, setSearch] = useState("");

  const filtered = cases.filter(
    (c) =>
      c.ticket_title.toLowerCase().includes(search.toLowerCase()) ||
      c.case_id.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-syne text-2xl font-bold" style={{ color: "var(--text-primary)" }}>All Cases</h1>
        <Link
          href="/app/cases/new"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium btn-clip transition-colors"
          style={{ background: "var(--signal-teal)", color: "var(--bg-shell)" }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
          New Case
        </Link>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-faint)" }} />
        <input
          type="text"
          placeholder="Search by case ID, title, or customer…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="triageon-input w-full max-w-md rounded-sm pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="w-10 h-10 mb-4" style={{ color: "var(--border)" }} />
          <p style={{ color: "var(--text-faint)" }}>
            {search ? "No cases match your search." : "No cases yet. Open your first escalation."}
          </p>
          {!search && (
            <Link
              href="/app/cases/new"
              className="mt-4 flex items-center gap-1.5 px-4 py-2 text-sm font-medium btn-clip transition-colors"
              style={{ background: "var(--signal-teal)", color: "var(--bg-shell)" }}
            >
              <ChevronRight className="w-3.5 h-3.5" />
              Open Case
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link
              key={c.case_id}
              href={`/app/cases/${c.case_id}`}
              className="flex items-center gap-4 rounded-sm px-4 py-3 transition-colors"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex-shrink-0 w-36">
                <span className="font-dm-mono text-[10px]" style={{ color: "var(--copper-wire)" }}>{c.case_id}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ color: "var(--text-body)" }}>{c.ticket_title}</p>
                <p className="text-[10px] font-dm-mono mt-0.5" style={{ color: "var(--text-faint)" }}>{c.customer_id}</p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                {c.risk_level && (
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-sm font-dm-mono", riskBg(c.risk_level))}>
                    {c.risk_level}
                  </span>
                )}
                {c.review_result && (
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-sm font-dm-mono font-bold", routeColor(c.review_result.recommended_route))}>
                    {c.review_result.recommended_route.replace(/_/g, " ")}
                  </span>
                )}
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-sm font-dm-mono", statusColor(c.status))}>
                  {statusLabel(c.status)}
                </span>
                <span className="text-[10px] font-dm-mono w-36 text-right" style={{ color: "var(--text-faint)" }}>
                  {formatDate(c.created_at)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
