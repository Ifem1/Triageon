"use client";

import { Zap, CheckCircle2, XCircle } from "lucide-react";

export function WhyGenLayer() {
  return (
    <div className="rounded-sm p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4" style={{ color: "var(--signal-teal)" }} />
        <h3 className="font-syne text-sm font-semibold" style={{ color: "var(--text-body)" }}>Why this needed GenLayer</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-dm-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--queue-sage)" }}>Deterministic rules can check</p>
          <ul className="space-y-1.5">
            {[
              "Ticket age and SLA breach",
              "Customer tier from a field",
              "Keyword tags in subject line",
              "Whether a policy document exists",
              "Refund window (days since purchase)",
              "Number of messages in thread",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2" style={{ color: "var(--text-faint)" }}>
                <CheckCircle2 className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--queue-sage)" }} />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-dm-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: "var(--critical-rose)" }}>They cannot reliably judge</p>
          <ul className="space-y-1.5">
            {[
              "Whether the complaint matches a refund exception semantically",
              "Whether the agent misunderstood the issue",
              "Whether the policy should be interpreted narrowly or broadly",
              "Whether the support thread has enough context to close",
              "Whether the refund request is reasonable given chat history",
              "Whether prior support actions created a fairness issue",
              "Whether the customer is abusive, confused, or genuinely harmed",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2" style={{ color: "var(--text-faint)" }}>
                <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "var(--critical-rose)" }} />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-faint)" }}>
          Rules detect possible routes. GenLayer validators independently interpret the conversation and
          policy context to reach consensus on the support route. This standardises hard edge-case
          decisions without replacing human judgement where it is legally or ethically required.
        </p>
      </div>
    </div>
  );
}
