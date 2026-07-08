"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { isContractConfigured } from "@/lib/genlayer/config";
import {
  getCaseFromContract,
  getCaseIdsFromContract,
  getPolicyFromContract,
  getPolicyIdsFromContract,
} from "@/lib/genlayer/client";

export function ChainHydrator() {
  const { cases, policies, addCase, addPolicy } = useStore();
  const hydratedCases = useRef(false);
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
    if (!isContractConfigured() || hydratedCases.current) return;

    let cancelled = false;
    hydratedCases.current = true;

    async function hydrateCases() {
      const caseIds = await getCaseIdsFromContract();
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
  }, [addCase, cases]);

  return null;
}
