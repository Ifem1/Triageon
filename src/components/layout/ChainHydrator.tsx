"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/lib/store";
import { isContractConfigured } from "@/lib/genlayer/config";
import {
  getCaseFromContract,
  getCaseIdsFromContract,
  getPolicyFromContract,
  getPolicyIdsFromContract,
  getReviewFromContract,
} from "@/lib/genlayer/client";

export function ChainHydrator() {
  const { addCase, addPolicy } = useStore();
  const hydratedCases = useRef(false);
  const hydratedPolicies = useRef(false);

  useEffect(() => {
    if (!isContractConfigured() || hydratedPolicies.current) return;

    let cancelled = false;
    hydratedPolicies.current = true;

    async function hydratePolicies() {
      const policyIds = await getPolicyIdsFromContract();

      for (const policyId of policyIds) {
        if (cancelled) continue;
        const policy = await getPolicyFromContract(policyId);
        if (!cancelled && policy) addPolicy(policy);
      }
    }

    hydratePolicies();

    return () => {
      cancelled = true;
    };
  }, [addPolicy]);

  useEffect(() => {
    if (!isContractConfigured() || hydratedCases.current) return;

    let cancelled = false;
    hydratedCases.current = true;

    async function hydrateCases() {
      const caseIds = await getCaseIdsFromContract();

      for (const caseId of caseIds) {
        if (cancelled) continue;
        const supportCase = await getCaseFromContract(caseId);
        if (!cancelled && supportCase) {
          const review = await getReviewFromContract(caseId);
          addCase(review ? { ...supportCase, review_result: review } : supportCase);
        }
      }
    }

    hydrateCases();

    return () => {
      cancelled = true;
    };
  }, [addCase]);

  return null;
}
