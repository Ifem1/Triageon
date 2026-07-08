"use client";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { GENLAYER_STUDIONET, isContractConfigured } from "@/lib/genlayer/config";
import { Trash2, Terminal, ExternalLink, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { isSupportReviewResult } from "@/lib/genlayer/client";

const TAG_COLORS: Record<string, string> = {
  CASE_OPENED:       "var(--route-blue)",
  POLICY_ATTACHED:   "var(--soft-plum)",
  SEMANTIC_CHECK:    "var(--soft-plum)",
  GENLAYER:          "var(--signal-teal)",
  VALIDATORS:        "var(--signal-teal)",
  CONSENSUS:         "var(--queue-sage)",
  ACTION:            "var(--alert-apricot)",
  TX:                "var(--copper-wire)",
  WARNING:           "var(--alert-apricot)",
  ERROR:             "var(--critical-rose)",
  POLICY:            "var(--soft-plum)",
  RECONSIDERATION:   "var(--soft-plum)",
};

export default function ReviewConsole() {
  const { consoleLogs, clearLogs, cases } = useStore();

  const openCases = cases.length;
  const reviewedCases = cases.filter((c) => isSupportReviewResult(c.review_result)).length;
  const routeEntries = cases
    .reduce((acc, c) => {
      if (!isSupportReviewResult(c.review_result)) return acc;

      const route = c.review_result.recommended_route;
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const stats = { routes: routeEntries };

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne text-2xl font-bold" style={{ color: "var(--text-primary)" }}>GenLayer Review Console</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>Real-time consensus activity and protocol stats</p>
        </div>
        <Button variant="ghost" onClick={clearLogs}>
          <Trash2 className="w-3.5 h-3.5" />
          Clear
        </Button>
      </div>

      {/* Protocol stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Cases" value={openCases} color="var(--alert-apricot)" />
        <StatCard label="Reviewed" value={reviewedCases} color="var(--signal-teal)" />
        <StatCard label="Contract" value={isContractConfigured() ? "Live" : "Not Set"} color={isContractConfigured() ? "var(--queue-sage)" : "var(--critical-rose)"} />
        <StatCard label="Chain ID" value={String(GENLAYER_STUDIONET.chainId)} color="var(--copper-wire)" />
      </div>

      {/* Route distribution */}
      {Object.keys(stats.routes).length > 0 && (
        <div className="rounded-sm p-4 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-3" style={{ color: "var(--text-faint)" }}>Route Distribution</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.routes).map(([route, count]) => (
              <div key={route} className="flex items-center gap-1.5">
                <span className="text-xs font-dm-mono" style={{ color: "var(--text-faint)" }}>{route.replace(/_/g, " ")}</span>
                <span className="font-dm-mono text-xs font-bold" style={{ color: "var(--signal-teal)" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Studionet config */}
      <div className="rounded-sm p-4 mb-6" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5" style={{ color: "var(--signal-teal)" }} />
          <p className="text-[10px] font-dm-mono uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Studionet Configuration</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs font-dm-mono">
          <ConfigRow label="RPC URL" value={GENLAYER_STUDIONET.rpcUrl} />
          <ConfigRow label="Chain ID" value={String(GENLAYER_STUDIONET.chainId)} />
          <ConfigRow label="Currency" value={GENLAYER_STUDIONET.currency} />
          <ConfigRow
            label="Contract"
            value={process.env.NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS || "NOT SET"}
            highlight={!isContractConfigured()}
          />
        </div>
        <a
          href={GENLAYER_STUDIONET.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[10px] mt-3 transition-colors font-dm-mono"
          style={{ color: "var(--route-blue)" }}
        >
          <ExternalLink className="w-3 h-3" />
          Open Explorer
        </a>
      </div>

      {/* Log terminal */}
      <div className="rounded-sm overflow-hidden" style={{ background: "var(--bg-shell)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between px-4 py-2.5" style={{ background: "var(--bg-card)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5" style={{ color: "var(--signal-teal)" }} />
            <span className="font-dm-mono text-xs" style={{ color: "var(--signal-teal)" }}>review.log</span>
          </div>
          <span className="font-dm-mono text-[10px]" style={{ color: "var(--text-faint)" }}>{consoleLogs.length} entries</span>
        </div>
        <div className="p-4 h-96 overflow-y-auto space-y-1.5 font-dm-mono text-xs">
          {consoleLogs.length === 0 ? (
            <div className="py-8 text-center" style={{ color: "var(--text-faint)" }}>
              <p>No activity yet.</p>
              <p className="mt-2 text-[10px]">Open a case or trigger a consensus review to see logs here.</p>
              <div className="mt-4 space-y-1 text-left max-w-sm mx-auto" style={{ opacity: 0.3 }}>
                <p>[CASE_OPENED] ticket received</p>
                <p>[POLICY_ATTACHED] policy packet loaded</p>
                <p>[SEMANTIC_CHECK] equivalence running</p>
                <p>[GENLAYER] review_support_case invoked</p>
                <p>[VALIDATORS] consensus running</p>
                <p>[CONSENSUS] route: REQUEST_MORE_INFO</p>
                <p>[ACTION] hold case pending evidence</p>
              </div>
            </div>
          ) : (
            consoleLogs.map((log, i) => (
              <div key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-20" style={{ color: "var(--text-faint)" }}>
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={cn("flex-shrink-0 w-28")}
                  style={{ color: TAG_COLORS[log.tag] || "var(--text-faint)" }}
                >
                  [{log.tag}]
                </span>
                <span style={{ color: "var(--text-muted)" }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-sm p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <p className="font-dm-mono text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>{label}</p>
    </div>
  );
}

function ConfigRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] mb-0.5" style={{ color: "var(--text-faint)" }}>{label}</p>
      <p className="text-[11px] truncate" style={{ color: highlight ? "var(--critical-rose)" : "var(--text-faint)" }}>{value}</p>
    </div>
  );
}
