"use client";

import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  cn, riskBg, statusColor, statusLabel, formatDate
} from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ConsensusPlateBig } from "@/components/cases/ConsensusPlateBig";
import { WhyGenLayer } from "@/components/cases/WhyGenLayer";
import {
  callContractWrite, callContractRead, emitLog, waitForTransaction
} from "@/lib/genlayer/client";
import { isContractConfigured } from "@/lib/genlayer/config";
import type { SupportReviewResult } from "@/lib/genlayer/types";
import {
  ChevronLeft, AlertCircle, MessageSquare, FileText,
  Clock, User, Package, Zap
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function CaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { cases, updateCase, pushLog, walletAddress } = useStore();
  const c = cases.find((x) => x.case_id === caseId);

  const [reviewLoading, setReviewLoading] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [finalAction, setFinalAction] = useState("");
  const [error, setError] = useState("");

  if (!c) {
    return (
      <div className="p-6">
        <p style={{ color: "var(--text-faint)" }}>Case not found: {caseId}</p>
      </div>
    );
  }

  async function startConsensusReview() {
    if (!c) return;
    setReviewLoading(true);
    setError("");
    try {
      updateCase(caseId, { status: "REVIEW_IN_PROGRESS" });
      pushLog(emitLog("CASE_OPENED", `Case ${caseId} status: REVIEW_IN_PROGRESS`));
      pushLog(emitLog("POLICY_ATTACHED", `Policy packet ${c.policy_packet_id || "none"} loaded`));
      pushLog(emitLog("SEMANTIC_CHECK", "Semantic equivalence assessment running"));
      pushLog(emitLog("GENLAYER", `review_support_case(${caseId}) invoked`));
      pushLog(emitLog("VALIDATORS", "Policy interpretation consensus running"));

      if (isContractConfigured() && walletAddress) {
        const tx = await callContractWrite("review_support_case", [caseId], walletAddress);
        pushLog(emitLog("TX", `Transaction submitted: ${tx}`));
        await waitForTransaction(tx);
        const raw = await callContractRead("get_support_review", [caseId]);
        const result: SupportReviewResult = JSON.parse(raw);
        updateCase(caseId, { status: "REVIEW_COMPLETE", review_result: result, tx_hash: tx });
        pushLog(emitLog("CONSENSUS", `Route: ${result.recommended_route}`));
        pushLog(emitLog("ACTION", result.recommended_next_actions?.[0] || "Review complete"));
      } else {
        await new Promise((r) => setTimeout(r, 1500));
        pushLog(emitLog("WARNING", "Contract not configured — review stored locally only"));
        updateCase(caseId, { status: "READY_FOR_TRIAGE_REVIEW" });
        setError("Contract not configured. Deploy TriageonJudge and set NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to run live consensus.");
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Review failed.");
      updateCase(caseId, { status: "READY_FOR_TRIAGE_REVIEW" });
    } finally {
      setReviewLoading(false);
    }
  }

  async function finalizeCase() {
    if (!c || !finalAction) return;
    setFinalizing(true);
    try {
      const payload = { action: finalAction, finalized_at: new Date().toISOString() };
      if (isContractConfigured() && walletAddress) {
        await callContractWrite("finalize_case", [caseId, JSON.stringify(payload)], walletAddress);
      }
      updateCase(caseId, { status: "FINALIZED", final_action: finalAction });
      pushLog(emitLog("ACTION", `Case ${caseId} finalized: ${finalAction}`));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Finalization failed.");
    } finally {
      setFinalizing(false);
    }
  }

  const canReview = ["READY_FOR_TRIAGE_REVIEW", "POLICY_ATTACHED", "CASE_OPENED"].includes(c.status);

  return (
    <div className="p-6 max-w-5xl">
      {/* Back */}
      <div className="flex items-center gap-3 mb-5">
        <button onClick={() => router.back()} className="transition-colors" style={{ color: "var(--text-faint)" }}>
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-dm-mono text-xs" style={{ color: "var(--copper-wire)" }}>{c.case_id}</span>
      </div>

      {/* Case Signal Header */}
      <div className="rounded-sm p-5 mb-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="font-syne text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>{c.ticket_title}</h1>
            <div className="flex flex-wrap items-center gap-3 text-xs font-dm-mono">
              <span className={cn("px-2 py-0.5 rounded-sm", statusColor(c.status))}>
                {statusLabel(c.status)}
              </span>
              {c.risk_level && (
                <span className={cn("px-2 py-0.5 rounded-sm", riskBg(c.risk_level))}>
                  {c.risk_level} RISK
                </span>
              )}
              {c.sla_state !== "OK" && (
                <span className="px-2 py-0.5 rounded-sm" style={{ background: "rgba(200,85,109,0.2)", color: "var(--critical-rose)" }}>
                  SLA {c.sla_state}
                </span>
              )}
              <span style={{ color: "var(--text-faint)" }}>{c.issue_category.replace(/_/g, " ")}</span>
            </div>
          </div>
          <div className="flex gap-2 ml-4 flex-shrink-0">
            {canReview && (
              <Button variant="primary" loading={reviewLoading} onClick={startConsensusReview}>
                ↳ START CONSENSUS REVIEW
              </Button>
            )}
            <Link href={`/app/cases/${caseId}/reconsideration`}>
              <Button variant="secondary">Reconsideration</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
          <MetaItem icon={User} label="Customer" value={c.customer_id} />
          <MetaItem icon={Package} label="Product Area" value={c.product_area} />
          <MetaItem icon={Clock} label="Opened" value={formatDate(c.created_at)} />
          <MetaItem icon={AlertCircle} label="Priority" value={c.priority} />
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2 rounded-sm px-4 py-3" style={{ background: "rgba(200,85,109,0.1)", border: "1px solid rgba(200,85,109,0.3)" }}>
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--critical-rose)" }} />
          <p className="text-sm" style={{ color: "var(--critical-rose)" }}>{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left: Thread + Context */}
        <div className="xl:col-span-2 space-y-5">
          {/* Thread Slab */}
          <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4" style={{ color: "var(--copper-wire)" }} />
              <h2 className="font-syne text-sm font-semibold" style={{ color: "var(--text-body)" }}>Thread Slab — Ticket</h2>
            </div>
            <div className="thread-slab rounded-sm p-4 mb-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text-muted)" }}>{c.ticket_text}</p>
            </div>
            <div>
              <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-2" style={{ color: "var(--text-faint)" }}>Chat History Summary</p>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-faint)" }}>{c.chat_history_summary}</p>
            </div>
            {c.requested_outcome && (
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1" style={{ color: "var(--text-faint)" }}>Requested Outcome</p>
                <p className="text-sm" style={{ color: "var(--alert-apricot)" }}>{c.requested_outcome}</p>
              </div>
            )}
          </div>

          {/* Consensus Plate */}
          {c.review_result && (
            <ConsensusPlateBig result={c.review_result} txHash={c.tx_hash} />
          )}

          {/* Action Route */}
          {c.status === "REVIEW_COMPLETE" && (
            <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4" style={{ color: "var(--signal-teal)" }} />
                <h2 className="font-syne text-sm font-semibold" style={{ color: "var(--text-body)" }}>Action Route</h2>
              </div>
              <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>
                Select and apply the final action for this case.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {["ESCALATE_TO_MANAGER", "REFUND", "PARTIAL_REFUND", "CLOSE_CASE", "REQUEST_MORE_INFO", "HOLD_FOR_HUMAN", "POLICY_EXCEPTION"].map(
                  (action) => (
                    <button
                      key={action}
                      onClick={() => setFinalAction(action)}
                      className="px-3 py-1.5 text-xs font-dm-mono rounded-sm transition-colors btn-clip"
                      style={
                        finalAction === action
                          ? { background: "var(--signal-teal)", color: "var(--bg-shell)", border: "1px solid var(--signal-teal)" }
                          : { background: "transparent", color: "var(--text-faint)", border: "1px solid var(--border)" }
                      }
                    >
                      {action.replace(/_/g, " ")}
                    </button>
                  )
                )}
              </div>
              {finalAction && (
                <Button variant="refund" loading={finalizing} onClick={finalizeCase}>
                  Apply: {finalAction.replace(/_/g, " ")}
                </Button>
              )}
            </div>
          )}

          {c.status === "FINALIZED" && c.final_action && (
            <div className="rounded-sm p-4" style={{ background: "var(--bg-card)", border: "1px solid rgba(141,170,145,0.3)" }}>
              <p className="text-xs font-dm-mono mb-1" style={{ color: "var(--text-faint)" }}>FINAL ACTION APPLIED</p>
              <p className="font-syne text-sm font-semibold" style={{ color: "var(--queue-sage)" }}>
                {c.final_action.replace(/_/g, " ")}
              </p>
            </div>
          )}

          <WhyGenLayer />
        </div>

        {/* Right: Policy Dock */}
        <div className="space-y-4">
          <PolicyDock caseId={caseId} />
        </div>
      </div>
    </div>
  );
}

function MetaItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
        <span className="text-[10px] font-dm-mono uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>{label}</span>
      </div>
      <p className="text-xs font-dm-mono" style={{ color: "var(--text-body)" }}>{value}</p>
    </div>
  );
}

function PolicyDock({ caseId }: { caseId: string }) {
  const { cases, policies } = useStore();
  const c = cases.find((x) => x.case_id === caseId);
  const policy = policies.find((p) => p.policy_id === c?.policy_packet_id);

  return (
    <div className="rounded-sm p-5 sticky top-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-4 h-4" style={{ color: "var(--route-blue)" }} />
        <h2 className="font-syne text-sm font-semibold" style={{ color: "var(--text-body)" }}>Policy Dock</h2>
      </div>

      {policy ? (
        <div className="space-y-4 text-xs">
          <PolicyTab label="Refund Policy" content={policy.refund_policy} />
          <PolicyTab label="Escalation Rules" content={policy.escalation_rules} />
          <PolicyTab label="Closure Criteria" content={policy.closure_criteria} />
          <PolicyTab label="Abuse Policy" content={policy.abuse_policy} />
          <PolicyTab label="Exception Policy" content={policy.exception_policy} />
        </div>
      ) : (
        <div className="text-center py-8">
          <FileText className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--border)" }} />
          <p className="text-xs" style={{ color: "var(--text-faint)" }}>No policy attached</p>
          <Link href="/app/policies" className="text-xs mt-1 block hover:underline" style={{ color: "var(--route-blue)" }}>
            Manage policies →
          </Link>
        </div>
      )}
    </div>
  );
}

function PolicyTab({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--route-blue)" }}>{label}</p>
      <p className="leading-relaxed text-[11px]" style={{ color: "var(--text-faint)" }}>{content}</p>
    </div>
  );
}
