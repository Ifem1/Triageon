"use client";

import { AlertTriangle } from "lucide-react";

export function ContractNotice() {
  return (
    <div
      className="flex items-start gap-3 rounded-sm p-4"
      style={{ border: "1px solid rgba(183,106,60,0.4)", background: "rgba(183,106,60,0.06)" }}
    >
      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--copper-wire)" }} />
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--copper-wire)" }}>Contract not configured</p>
        <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
          GenLayer contract is not configured yet. Deploy{" "}
          <span className="font-dm-mono" style={{ color: "var(--text-muted)" }}>TriageonJudge</span> and add{" "}
          <span className="font-dm-mono" style={{ color: "var(--text-muted)" }}>NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS</span>{" "}
          to enable live support route review.
        </p>
      </div>
    </div>
  );
}
