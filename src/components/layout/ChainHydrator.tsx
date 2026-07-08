"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { isContractConfigured } from "@/lib/genlayer/config";
import { getCaseFromContract, getUserCaseIdsFromContract } from "@/lib/genlayer/client";

export function ChainHydrator() {
  const { walletAddress, cases, addCase } = useStore();
  const hydratedWallet = useRef("");

  useEffect(() => {
    if (!isContractConfigured() || !walletAddress) return;
    if (hydratedWallet.current.toLowerCase() === walletAddress.toLowerCase()) return;

    let cancelled = false;
    hydratedWallet.current = walletAddress;

    async function hydrateCases() {
      const caseIds = await getUserCaseIdsFromContract(walletAddress);
      const knownCaseIds = new Set(cases.map((c) => c.case_id));

      for (const caseId of caseIds) {
        if (cancelled || knownCaseIds.has(caseId)) continue;
        const supportCase = await getCaseFromContract(caseId);
        if (!cancelled && supportCase) addCase(supportCase);
      }
    }

    hydrateCases();

    return () => {
      cancelled = true;
    };
  }, [addCase, cases, walletAddress]);

  return null;
}
