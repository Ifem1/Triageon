"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { isContractConfigured } from "@/lib/genlayer/config";
import {
  getCaseFromContract,
  getPolicyFromContract,
  getPolicyIdsFromContract,
  getUserCaseIdsFromContract,
} from "@/lib/genlayer/client";

export function ChainHydrator() {
  const { walletAddress, cases, policies, addCase, addPolicy } = useStore();
  const hydratedWallet = useRef("");
  const hydratedPolicies = useRef(false);

  useEffect(() => {
    if (!isContractConfigured() || hydratedPolicies.current) return;

    let cancelled = false;
    hydratedPolicies.current = true;

    async function hydratePolicies() {
      const policyIds = await getPolicyIdsFromContract();
      const knownPolicyIds = new Set(policies.map((p) => p.policy_id));

      for (const policyId of policyIds) {
        if (cancelled || knownPolicyIds.has(policyId)) continue;
        const policy = await getPolicyFromContract(policyId);
        if (!cancelled && policy) addPolicy(policy);
      }
    }

    hydratePolicies();

    return () => {
      cancelled = true;
    };
  }, [addPolicy, policies]);

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
