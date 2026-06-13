"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { ConsensusPlateBig } from "@/components/cases/ConsensusPlateBig";
import { WhyGenLayer } from "@/components/cases/WhyGenLayer";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function CaseReview() {
  const { caseId } = useParams<{ caseId: string }>();
  const { cases } = useStore();
  const c = cases.find((x) => x.case_id === caseId);

  if (!c) {
    return <div className="p-6 text-[#D8D3C8]/40">Case not found.</div>;
  }

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/app/cases/${caseId}`} className="text-[#D8D3C8]/40 hover:text-[#D8D3C8]">
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="font-syne text-xl font-bold text-[#FCFAF5]">Consensus Review</h1>
          <p className="font-dm-mono text-xs text-[#B76A3C] mt-0.5">{caseId}</p>
        </div>
      </div>

      {c.review_result ? (
        <div className="space-y-5">
          <ConsensusPlateBig result={c.review_result} txHash={c.tx_hash} />
          <WhyGenLayer />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-[#D8D3C8]/40 mb-2">No consensus review yet.</p>
          <Link href={`/app/cases/${caseId}`} className="text-sm text-[#4FB7A8] hover:underline">
            Go back to case and trigger review →
          </Link>
        </div>
      )}
    </div>
  );
}
