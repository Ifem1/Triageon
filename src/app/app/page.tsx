"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { cn, statusColor, statusLabel, timeAgo, routeColor, riskBg } from "@/lib/utils";
import { ChevronRight, FolderOpen, Zap, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { isContractConfigured } from "@/lib/genlayer/config";
import { ContractNotice } from "@/components/ui/ContractNotice";
import type { SupportCase } from "@/lib/genlayer/types";

export default function EscalationDesk() {
  const { cases } = useStore();

  const open      = cases.filter(c => ["CASE_OPENED","POLICY_ATTACHED","READY_FOR_TRIAGE_REVIEW"].includes(c.status));
  const reviewing = cases.filter(c => c.status === "REVIEW_IN_PROGRESS");
  const complete  = cases.filter(c => c.status === "REVIEW_COMPLETE");
  const finalized = cases.filter(c => c.status === "FINALIZED");
  const slaRisk   = cases.filter(c => c.sla_state !== "OK");

  const stats = [
    { label: "Open Cases",      value: open.length,      color: "var(--alert-apricot)", icon: FolderOpen },
    { label: "In Consensus",    value: reviewing.length, color: "var(--signal-teal)",   icon: Zap },
    { label: "Review Complete", value: complete.length,  color: "var(--queue-sage)",    icon: CheckCircle2 },
    { label: "SLA Risk",        value: slaRisk.length,   color: "var(--critical-rose)", icon: AlertTriangle },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Escalation Desk</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>Incoming tickets routed by GenLayer consensus</p>
        </div>
        <Link
          href="/app/cases/new"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium btn-clip transition-colors"
          style={{ background: "var(--signal-teal)", color: "var(--bg-shell)" }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
          New Escalation
        </Link>
      </div>

      {!isContractConfigured() && <div className="mb-6"><ContractNotice /></div>}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map(s => (
          <div key={s.label} className="rounded-sm p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-2">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <span className="font-dm-mono text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
            <p className="text-xs" style={{ color: "var(--text-faint)" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {cases.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <FolderOpen className="w-10 h-10 mb-4" style={{ color: "var(--border)" }} />
          <p className="font-syne text-lg" style={{ color: "var(--text-faint)" }}>No cases yet</p>
          <p className="text-sm mt-1 mb-6" style={{ color: "var(--text-faint)", opacity: 0.6 }}>Open your first support escalation to get started</p>
          <Link
            href="/app/cases/new"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium btn-clip"
            style={{ background: "var(--signal-teal)", color: "var(--bg-shell)" }}
          >
            <ChevronRight className="w-3.5 h-3.5" />Open First Case
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {reviewing.length > 0 && <Section title="In Consensus Review" cases={reviewing} accentColor="var(--signal-teal)" />}
          {open.length > 0      && <Section title="Open / Pending"       cases={open}      accentColor="var(--alert-apricot)" />}
          {complete.length > 0  && <Section title="Review Complete"      cases={complete}  accentColor="var(--queue-sage)" />}
          {finalized.length > 0 && <Section title="Finalized"            cases={finalized} accentColor="var(--text-faint)" />}
        </div>
      )}
    </div>
  );
}

function Section({ title, cases, accentColor }: { title: string; cases: SupportCase[]; accentColor: string }) {
  return (
    <div>
      <h2
        className="font-syne text-sm font-semibold mb-3 pb-2"
        style={{ color: accentColor, borderBottom: `1px solid ${accentColor}33` }}
      >
        {title}
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cases.map(c => (
          <Link
            key={c.case_id}
            href={`/app/cases/${c.case_id}`}
            className="block rounded-sm p-4 transition-colors"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="font-dm-mono text-[10px]" style={{ color: "var(--copper-wire)" }}>{c.case_id}</span>
              <div className="flex items-center gap-2">
                {c.risk_level && (
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-sm font-dm-mono", riskBg(c.risk_level))}>{c.risk_level}</span>
                )}
                <span className={cn("text-[9px] px-1.5 py-0.5 rounded-sm font-dm-mono", statusColor(c.status))}>{statusLabel(c.status)}</span>
              </div>
            </div>
            <p className="text-sm font-medium mb-1 leading-tight" style={{ color: "var(--text-primary)" }}>{c.ticket_title}</p>
            <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>{c.issue_category?.replace(/_/g," ")}</p>
            {c.review_result && (
              <span className={cn("text-[10px] px-2 py-0.5 rounded-sm font-dm-mono font-bold", routeColor(c.review_result.recommended_route))}>
                → {c.review_result.recommended_route.replace(/_/g," ")}
              </span>
            )}
            <div className="flex items-center gap-1 mt-2">
              <Clock className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
              <span className="text-[10px] font-dm-mono" style={{ color: "var(--text-faint)" }}>{timeAgo(c.created_at)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
