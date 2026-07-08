"use client";

import { useStore } from "@/lib/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/Button";
import { ContractNotice } from "@/components/ui/ContractNotice";
import { callContractWrite, emitLog } from "@/lib/genlayer/client";
import { isContractConfigured } from "@/lib/genlayer/config";
import { generateId, formatDate } from "@/lib/utils";
import type { PolicyPacket } from "@/lib/genlayer/types";
import { FileText, Plus, ChevronRight, Hash } from "lucide-react";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(3, "Name required"),
  refund_policy: z.string().min(10, "Refund policy required"),
  escalation_rules: z.string().min(10, "Escalation rules required"),
  closure_criteria: z.string().min(10, "Closure criteria required"),
  abuse_policy: z.string().min(10, "Abuse policy required"),
  exception_policy: z.string().min(10, "Exception policy required"),
  sla_rules: z.string().min(5, "SLA rules required"),
  product_rules: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function PolicyLibrary() {
  const { policies, addPolicy, pushLog, walletAddress, walletProvider } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<PolicyPacket | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError("");
    const policyId = generateId("POLICY");
    const packet: PolicyPacket = {
      policy_id: policyId,
      version: "1.0",
      created_at: new Date().toISOString(),
      ...data,
    };
    try {
      if (isContractConfigured() && walletAddress) {
        pushLog(emitLog("POLICY", `Creating policy packet ${policyId}`));
        await callContractWrite("create_policy_packet", [policyId, JSON.stringify(packet)], walletAddress, walletProvider);
      }
      addPolicy(packet);
      pushLog(emitLog("POLICY_ATTACHED", `Policy ${policyId} (${data.name}) created`));
      reset();
      setShowForm(false);
      setSelected(packet);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create policy.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-syne text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Policy Library</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-faint)" }}>Support policy packets used in GenLayer reviews</p>
        </div>
        <Button variant="secondary" onClick={() => setShowForm(!showForm)}>
          <Plus className="w-3.5 h-3.5" />
          New Policy Packet
        </Button>
      </div>

      {!isContractConfigured() && <div className="mb-6"><ContractNotice /></div>}

      {showForm && (
        <div className="rounded-sm p-6 mb-6" style={{ background: "var(--bg-card)", border: "1px solid rgba(183,106,60,0.3)" }}>
          <h2 className="font-syne text-base font-semibold mb-5" style={{ color: "var(--copper-wire)" }}>New Policy Packet</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Field label="Policy Name" error={errors.name?.message}>
              <input {...register("name")} placeholder="e.g. Standard Refund Policy v2" className="triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Refund Policy" error={errors.refund_policy?.message}>
                <textarea {...register("refund_policy")} rows={3} placeholder="Describe when refunds are approved or denied…" className="triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors resize-none" />
              </Field>
              <Field label="Escalation Rules" error={errors.escalation_rules?.message}>
                <textarea {...register("escalation_rules")} rows={3} placeholder="When should a case be escalated and to which tier…" className="triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors resize-none" />
              </Field>
              <Field label="Closure Criteria" error={errors.closure_criteria?.message}>
                <textarea {...register("closure_criteria")} rows={3} placeholder="When is it acceptable to close a case…" className="triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors resize-none" />
              </Field>
              <Field label="Abuse Policy" error={errors.abuse_policy?.message}>
                <textarea {...register("abuse_policy")} rows={3} placeholder="How to handle abusive or harassing customers…" className="triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors resize-none" />
              </Field>
              <Field label="Exception Policy" error={errors.exception_policy?.message}>
                <textarea {...register("exception_policy")} rows={3} placeholder="When can policy exceptions be granted…" className="triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors resize-none" />
              </Field>
              <Field label="SLA Rules" error={errors.sla_rules?.message}>
                <textarea {...register("sla_rules")} rows={3} placeholder="Response time requirements and SLA breach conditions…" className="triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors resize-none" />
              </Field>
            </div>
            <Field label="Product-Specific Rules (optional)" error={errors.product_rules?.message}>
              <textarea {...register("product_rules")} rows={2} placeholder="Any additional product or service-specific rules…" className="triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors resize-none" />
            </Field>
            {error && <p className="text-sm" style={{ color: "var(--critical-rose)" }}>{error}</p>}
            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={submitting}>↳ Create Policy Packet</Button>
              <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {policies.length === 0 ? (
          <div className="col-span-3 flex flex-col items-center justify-center py-24 text-center">
            <FileText className="w-10 h-10 mb-4" style={{ color: "var(--border)" }} />
            <p className="mb-4" style={{ color: "var(--text-faint)" }}>No policy packets yet.</p>
            <Button variant="secondary" onClick={() => setShowForm(true)}>
              <Plus className="w-3.5 h-3.5" />
              Create First Policy
            </Button>
          </div>
        ) : (
          policies.map((p) => (
            <button
              key={p.policy_id}
              onClick={() => setSelected(selected?.policy_id === p.policy_id ? null : p)}
              className="text-left rounded-sm p-4 transition-colors"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start gap-3">
                <FileText className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--route-blue)" }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: "var(--text-body)" }}>{p.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Hash className="w-3 h-3" style={{ color: "var(--text-faint)" }} />
                    <span className="font-dm-mono text-[10px]" style={{ color: "var(--copper-wire)" }}>{p.policy_id}</span>
                  </div>
                  <p className="text-[10px] font-dm-mono mt-1" style={{ color: "var(--text-faint)" }}>{formatDate(p.created_at)}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-faint)" }} />
              </div>
            </button>
          ))
        )}
      </div>

      {selected && (
        <div className="mt-6 rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid rgba(94,129,172,0.3)" }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-syne text-base font-semibold" style={{ color: "var(--text-primary)" }}>{selected.name}</h2>
              <span className="font-dm-mono text-[10px]" style={{ color: "var(--copper-wire)" }}>{selected.policy_id}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-xs transition-colors" style={{ color: "var(--text-faint)" }}>✕ Close</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
            <PolicyTab label="Refund Policy" content={selected.refund_policy} />
            <PolicyTab label="Escalation Rules" content={selected.escalation_rules} />
            <PolicyTab label="Closure Criteria" content={selected.closure_criteria} />
            <PolicyTab label="Abuse Policy" content={selected.abuse_policy} />
            <PolicyTab label="Exception Policy" content={selected.exception_policy} />
            <PolicyTab label="SLA Rules" content={selected.sla_rules} />
            {selected.product_rules && (
              <PolicyTab label="Product Rules" content={selected.product_rules} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs mb-1.5" style={{ color: "var(--text-faint)" }}>{label}</label>
      {children}
      {error && <p className="text-xs mt-1" style={{ color: "var(--critical-rose)" }}>{error}</p>}
    </div>
  );
}

function PolicyTab({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="text-[10px] font-dm-mono uppercase tracking-widest mb-1.5" style={{ color: "var(--route-blue)" }}>{label}</p>
      <p className="leading-relaxed" style={{ color: "var(--text-faint)" }}>{content}</p>
    </div>
  );
}
