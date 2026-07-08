"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { isContractConfigured } from "@/lib/genlayer/config";
import { ContractNotice } from "@/components/ui/ContractNotice";
import {
  callContractWrite,
  emitLog,
} from "@/lib/genlayer/client";
import type { SupportCase, IssueClassification } from "@/lib/genlayer/types";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const schema = z.object({
  ticket_title: z.string().min(5, "Title must be at least 5 characters"),
  customer_id: z.string().min(2, "Customer ID required"),
  issue_category: z.enum([
    "REFUND_REQUEST", "BILLING_DISPUTE", "ACCOUNT_ACCESS", "DELIVERY_FAILURE",
    "TECHNICAL_FAILURE", "SERVICE_OUTAGE", "ABUSE_REPORT", "POLICY_EXCEPTION",
    "CLOSURE_REVIEW", "SLA_BREACH", "OTHER",
  ]),
  ticket_text: z.string().min(20, "Ticket text must be at least 20 characters"),
  chat_history_summary: z.string().min(10, "Chat history summary required"),
  product_area: z.string().min(2, "Product area required"),
  customer_tier: z.string().optional(),
  order_reference: z.string().optional(),
  requested_outcome: z.string().min(5, "Requested outcome required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  sla_state: z.enum(["OK", "AT_RISK", "BREACHED"]),
  policy_packet_id: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const CATEGORIES: IssueClassification[] = [
  "REFUND_REQUEST", "BILLING_DISPUTE", "ACCOUNT_ACCESS", "DELIVERY_FAILURE",
  "TECHNICAL_FAILURE", "SERVICE_OUTAGE", "ABUSE_REPORT", "POLICY_EXCEPTION",
  "CLOSURE_REVIEW", "SLA_BREACH", "OTHER",
];

export default function NewCase() {
  const router = useRouter();
  const { addCase, policies, pushLog, walletAddress, walletProvider } = useStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { priority: "NORMAL", sla_state: "OK", issue_category: "OTHER" },
  });

  async function onSubmit(data: FormData) {
    setSubmitting(true);
    setError("");
    const caseId = generateId("CASE");
    const now = new Date().toISOString();

    const caseObj: SupportCase = {
      ...data,
      case_id: caseId,
      status: "CASE_OPENED",
      created_at: now,
      updated_at: now,
    };

    try {
      if (isContractConfigured() && walletAddress) {
        pushLog(emitLog("CASE_OPENED", `Opening case ${caseId} on-chain`));
        const tx = await callContractWrite("open_case", [caseId, JSON.stringify(caseObj)], walletAddress, walletProvider);
        caseObj.tx_hash = tx;
        pushLog(emitLog("TX", `Transaction: ${tx}`));
      } else {
        pushLog(emitLog("CASE_OPENED", `Case ${caseId} saved locally (contract not configured)`));
      }
      addCase(caseObj);
      router.push(`/app/cases/${caseId}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to open case.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/app/cases" className="transition-colors" style={{ color: "var(--text-faint)" }}>
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-syne text-2xl font-bold" style={{ color: "var(--text-primary)" }}>New Escalation</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-faint)" }}>Open a support case for GenLayer review</p>
        </div>
      </div>

      {!isContractConfigured() && (
        <div className="mb-6">
          <ContractNotice />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Ticket core */}
        <Section title="Ticket Details">
          <Field label="Ticket Title" error={errors.ticket_title?.message}>
            <input {...register("ticket_title")} placeholder="Brief summary of the issue" className={inputCls} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Customer ID / Reference" error={errors.customer_id?.message}>
              <input {...register("customer_id")} placeholder="CUST-001 or email hash" className={inputCls} />
            </Field>
            <Field label="Issue Category" error={errors.issue_category?.message}>
              <select {...register("issue_category")} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Ticket Text" error={errors.ticket_text?.message}>
            <textarea
              {...register("ticket_text")}
              rows={5}
              placeholder="The full customer complaint or ticket body…"
              className={inputCls}
            />
          </Field>
          <Field label="Chat History Summary" error={errors.chat_history_summary?.message}>
            <textarea
              {...register("chat_history_summary")}
              rows={4}
              placeholder="Summarise the conversation thread between customer and agent…"
              className={inputCls}
            />
          </Field>
        </Section>

        {/* Context */}
        <Section title="Context & Policy">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product / Service Area" error={errors.product_area?.message}>
              <input {...register("product_area")} placeholder="e.g. Subscription, Delivery" className={inputCls} />
            </Field>
            <Field label="Customer Tier" error={errors.customer_tier?.message}>
              <input {...register("customer_tier")} placeholder="Standard, Premium, VIP…" className={inputCls} />
            </Field>
            <Field label="Order / Subscription Reference" error={errors.order_reference?.message}>
              <input {...register("order_reference")} placeholder="ORD-12345 (optional)" className={inputCls} />
            </Field>
            <Field label="Policy Packet ID" error={errors.policy_packet_id?.message}>
              <select {...register("policy_packet_id")} className={inputCls}>
                <option value="">— Select policy —</option>
                {policies.map((p) => (
                  <option key={p.policy_id} value={p.policy_id}>{p.name}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Requested Outcome" error={errors.requested_outcome?.message}>
            <input {...register("requested_outcome")} placeholder="What is the customer asking for?" className={inputCls} />
          </Field>
        </Section>

        {/* Priority & SLA */}
        <Section title="Priority & SLA">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Priority" error={errors.priority?.message}>
              <select {...register("priority")} className={inputCls}>
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </Field>
            <Field label="SLA State" error={errors.sla_state?.message}>
              <select {...register("sla_state")} className={inputCls}>
                <option value="OK">OK</option>
                <option value="AT_RISK">At Risk</option>
                <option value="BREACHED">Breached</option>
              </select>
            </Field>
          </div>
        </Section>

        {error && (
          <p className="text-sm rounded-sm px-4 py-2" style={{ color: "var(--critical-rose)", background: "rgba(200,85,109,0.1)", border: "1px solid rgba(200,85,109,0.3)" }}>
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" variant="primary" loading={submitting}>
            ↳ Open Case
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <h2 className="font-syne text-sm font-semibold mb-4" style={{ color: "var(--copper-wire)" }}>{title}</h2>
      <div className="space-y-4">{children}</div>
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

const inputCls = "triageon-input w-full text-sm rounded-sm px-3 py-2.5 focus:outline-none transition-colors resize-none";
