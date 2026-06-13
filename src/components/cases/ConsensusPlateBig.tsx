"use client";

import { motion } from "framer-motion";
import {
  CheckCircle2, AlertCircle, Info, ArrowRight, MessageSquare, FileSearch,
  Shield, Search, ListChecks
} from "lucide-react";
import type { SupportReviewResult } from "@/lib/genlayer/types";
import { cn, riskBg, routeColor } from "@/lib/utils";
import { GENLAYER_STUDIONET } from "@/lib/genlayer/config";

interface ConsensusPlateBigProps {
  result: SupportReviewResult;
  txHash?: string;
}

export function ConsensusPlateBig({ result, txHash }: ConsensusPlateBigProps) {
  const explorerUrl = txHash
    ? `${GENLAYER_STUDIONET.explorerUrl}/tx/${txHash}`
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="consensus-glow rounded-sm overflow-hidden"
      style={{ border: "1px solid rgba(79,183,168,0.3)", background: "var(--bg-card)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ background: "rgba(79,183,168,0.06)", borderBottom: "1px solid rgba(79,183,168,0.2)" }}>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" style={{ color: "var(--signal-teal)" }} />
          <span className="font-syne text-sm font-semibold" style={{ color: "var(--signal-teal)" }}>Consensus Plate</span>
        </div>
        {txHash && explorerUrl && (
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-dm-mono text-[10px] transition-colors"
            style={{ color: "var(--route-blue)" }}
          >
            {txHash.slice(0, 10)}…{txHash.slice(-6)} ↗
          </a>
        )}
      </div>

      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Route */}
          <div>
            <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Recommended Route</p>
            <span className={cn("inline-flex items-center px-3 py-1.5 rounded-sm text-sm font-syne font-bold tracking-wide", routeColor(result.recommended_route))}>
              <ArrowRight className="w-3.5 h-3.5 mr-1.5" />
              {result.recommended_route.replace(/_/g, " ")}
            </span>
          </div>

          {/* Classification + Confidence */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Classification</p>
              <p className="text-xs font-dm-mono" style={{ color: "var(--text-body)" }}>{result.issue_classification.replace(/_/g, " ")}</p>
            </div>
            <div>
              <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Confidence</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${result.confidence}%`, background: "var(--signal-teal)" }}
                  />
                </div>
                <span className="text-xs font-dm-mono" style={{ color: "var(--signal-teal)" }}>{result.confidence}%</span>
              </div>
            </div>
          </div>

          {/* Risk + Escalation */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Risk Level</p>
              <span className={cn("text-xs px-2 py-0.5 rounded-sm font-dm-mono font-bold", riskBg(result.risk_level))}>
                {result.risk_level}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Escalation</p>
              <p className="text-xs font-dm-mono" style={{ color: "var(--text-body)" }}>{result.escalation_level.replace(/_/g, " ")}</p>
            </div>
          </div>

          {/* Refund */}
          <div>
            <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Refund Recommendation</p>
            <p className="text-xs font-dm-mono" style={{ color: "var(--text-body)" }}>{result.refund_recommendation.replace(/_/g, " ")}</p>
          </div>

          {/* Policy Match */}
          <div>
            <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Policy Match</p>
            <p className="text-xs font-dm-mono" style={{ color: "var(--text-body)" }}>{result.policy_match.replace(/_/g, " ")}</p>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Semantic Equivalence */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Search className="w-3 h-3" style={{ color: "var(--soft-plum)" }} />
              <p className="text-[10px] font-dm-mono uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Semantic Equivalence</p>
            </div>
            <div className="rounded-sm p-3" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-dm-mono" style={{ color: "var(--soft-plum)" }}>{result.semantic_equivalence.matched_policy}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm font-dm-mono" style={{ background: "rgba(117,101,138,0.2)", color: "var(--soft-plum)" }}>
                  {result.semantic_equivalence.match_strength}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-faint)" }}>{result.semantic_equivalence.reason}</p>
            </div>
          </div>

          {/* Suggested message */}
          {result.suggested_customer_message && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <MessageSquare className="w-3 h-3" style={{ color: "var(--route-blue)" }} />
                <p className="text-[10px] font-dm-mono uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Suggested Customer Message</p>
              </div>
              <p className="text-xs italic pl-3" style={{ color: "var(--text-muted)", borderLeft: "2px solid rgba(94,129,172,0.4)" }}>
                {result.suggested_customer_message}
              </p>
            </div>
          )}

          {/* Reasoning */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <FileSearch className="w-3 h-3" style={{ color: "var(--copper-wire)" }} />
              <p className="text-[10px] font-dm-mono uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Reasoning Summary</p>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{result.reasoning_summary}</p>
          </div>
        </div>
      </div>

      {/* Notes section */}
      <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-3 gap-4" style={{ borderTop: "1px solid var(--border)" }}>
        {result.customer_context_notes.length > 0 && (
          <div>
            <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Customer Notes</p>
            <ul className="space-y-1">
              {result.customer_context_notes.map((n, i) => (
                <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-faint)" }}>
                  <Info className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--route-blue)" }} />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.agent_action_notes.length > 0 && (
          <div>
            <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Agent Notes</p>
            <ul className="space-y-1">
              {result.agent_action_notes.map((n, i) => (
                <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-faint)" }}>
                  <Shield className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--queue-sage)" }} />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.missing_information.length > 0 && (
          <div>
            <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Missing Information</p>
            <ul className="space-y-1">
              {result.missing_information.map((n, i) => (
                <li key={i} className="text-xs flex gap-2" style={{ color: "var(--alert-apricot)", opacity: 0.8 }}>
                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--alert-apricot)" }} />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommended actions */}
      {result.recommended_next_actions.length > 0 && (
        <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <ListChecks className="w-3.5 h-3.5" style={{ color: "var(--signal-teal)" }} />
            <p className="text-[10px] font-dm-mono uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Recommended Next Actions</p>
          </div>
          <ul className="space-y-1.5">
            {result.recommended_next_actions.map((a, i) => (
              <li key={i} className="text-xs flex gap-2" style={{ color: "var(--text-body)" }}>
                <span className="font-dm-mono flex-shrink-0" style={{ color: "var(--signal-teal)" }}>{i + 1}.</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
