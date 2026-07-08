"use client";

import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { callContractWrite, emitLog } from "@/lib/genlayer/client";
import { isContractConfigured } from "@/lib/genlayer/config";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const schema = z.object({
  reason: z.string().min(20, "Reason must be at least 20 characters"),
  new_evidence: z.string().min(10, "New evidence required"),
  requested_change: z.enum(["ESCALATE", "REFUND", "PARTIAL_REFUND", "CLOSE", "REQUEST_MORE_INFO", "HOLD_FOR_HUMAN", "POLICY_EXCEPTION"]),
});

type FormData = z.infer<typeof schema>;

export default function Reconsideration() {
  const { caseId } = useParams<{ caseId: string }>();
  const router = useRouter();
  const { cases, pushLog, walletAddress, walletProvider } = useStore();
  const c = cases.find((x) => x.case_id === caseId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { requested_change: "ESCALATE" },
  });

  if (!c) return <div className="p-6 text-[#D8D3C8]/40">Case not found.</div>;

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError("");
    const reconId = generateId("RECON");
    const payload = {
      reconsideration_id: reconId,
      case_id: caseId,
      ...data,
      submitted_at: new Date().toISOString(),
    };
    try {
      pushLog(emitLog("RECONSIDERATION", `Opening reconsideration ${reconId} for case ${caseId}`));
      if (isContractConfigured() && walletAddress) {
        await callContractWrite(
          "open_reconsideration",
          [reconId, caseId, JSON.stringify(payload)],
          walletAddress,
          walletProvider
        );
      }
      pushLog(emitLog("RECONSIDERATION", `Reconsideration ${reconId} submitted`));
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to submit reconsideration.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="p-6 max-w-2xl flex flex-col items-center justify-center min-h-64 text-center">
        <p className="font-syne text-lg text-[#8DAA91] mb-2">Reconsideration submitted.</p>
        <p className="text-sm text-[#D8D3C8]/50 mb-6">A reviewer will assess the new evidence and trigger a re-review.</p>
        <Link href={`/app/cases/${caseId}`}>
          <Button variant="secondary">Back to Case</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/app/cases/${caseId}`} className="text-[#D8D3C8]/40 hover:text-[#D8D3C8]">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-syne text-xl font-bold text-[#FCFAF5]">Request Reconsideration</h1>
          <p className="font-dm-mono text-xs text-[#B76A3C] mt-0.5">{caseId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="bg-[#161A24] border border-[#2C3443] rounded-sm p-5 space-y-4">
          <div>
            <label className="block text-xs text-[#D8D3C8]/60 mb-1.5">Reason for Reconsideration</label>
            <textarea
              {...register("reason")}
              rows={4}
              placeholder="Explain why you believe the initial decision should be reconsidered…"
              className={inputCls}
            />
            {errors.reason && <p className="text-xs text-[#C8556D] mt-1">{errors.reason.message}</p>}
          </div>

          <div>
            <label className="block text-xs text-[#D8D3C8]/60 mb-1.5">New Evidence or Context</label>
            <textarea
              {...register("new_evidence")}
              rows={3}
              placeholder="Any new evidence, context, or information not included in the original case…"
              className={inputCls}
            />
            {errors.new_evidence && <p className="text-xs text-[#C8556D] mt-1">{errors.new_evidence.message}</p>}
          </div>

          <div>
            <label className="block text-xs text-[#D8D3C8]/60 mb-1.5">Requested Change</label>
            <select {...register("requested_change")} className={inputCls}>
              {["ESCALATE", "REFUND", "PARTIAL_REFUND", "CLOSE", "REQUEST_MORE_INFO", "HOLD_FOR_HUMAN", "POLICY_EXCEPTION"].map((r) => (
                <option key={r} value={r}>{r.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <p className="text-sm text-[#C8556D] bg-[#C8556D]/10 border border-[#C8556D]/30 rounded-sm px-4 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="request" loading={submitting}>
            REQUEST REVIEW
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "w-full bg-[#1C2130] border border-[#2C3443] text-[#F5F1E8] text-sm rounded-sm px-3 py-2.5 focus:outline-none focus:border-[#B76A3C] placeholder-[#D8D3C8]/25 transition-colors resize-none";
