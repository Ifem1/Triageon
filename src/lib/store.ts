import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { SupportCase, PolicyPacket } from "./genlayer/types";
import type { ConsoleLog } from "./genlayer/client";
import type { EIP1193Provider } from "@privy-io/react-auth";

interface TriageonStore {
  cases: SupportCase[];
  policies: PolicyPacket[];
  consoleLogs: ConsoleLog[];
  walletAddress: string;
  walletProvider: EIP1193Provider | null;

  addCase: (c: SupportCase) => void;
  updateCase: (caseId: string, patch: Partial<SupportCase>) => void;
  addPolicy: (p: PolicyPacket) => void;
  updatePolicy: (policyId: string, patch: Partial<PolicyPacket>) => void;
  pushLog: (log: ConsoleLog) => void;
  clearLogs: () => void;
  setWalletAddress: (addr: string) => void;
  setWalletProvider: (provider: EIP1193Provider | null) => void;
}

type PersistedTriageonStore = Pick<
  TriageonStore,
  "cases" | "policies" | "consoleLogs" | "walletAddress"
>;

export const useStore = create<TriageonStore>()(
  persist(
    (set) => ({
      cases: [],
      policies: [],
      consoleLogs: [],
      walletAddress: "",
      walletProvider: null,

      addCase: (c) =>
        set((s) => ({
          cases: [c, ...s.cases.filter((existing) => existing.case_id !== c.case_id)],
        })),
      updateCase: (caseId, patch) =>
        set((s) => ({
          cases: s.cases.map((c) => (c.case_id === caseId ? { ...c, ...patch } : c)),
        })),
      addPolicy: (p) =>
        set((s) => ({
          policies: [p, ...s.policies.filter((existing) => existing.policy_id !== p.policy_id)],
        })),
      updatePolicy: (policyId, patch) =>
        set((s) => ({
          policies: s.policies.map((p) => (p.policy_id === policyId ? { ...p, ...patch } : p)),
        })),
      pushLog: (log) => set((s) => ({ consoleLogs: [...s.consoleLogs, log] })),
      clearLogs: () => set({ consoleLogs: [] }),
      setWalletAddress: (addr) => set({ walletAddress: addr }),
      setWalletProvider: (provider) => set({ walletProvider: provider }),
    }),
    {
      name: "triageon-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedTriageonStore => ({
        cases: state.cases,
        policies: state.policies,
        consoleLogs: state.consoleLogs.slice(-100),
        walletAddress: state.walletAddress,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setWalletProvider(null);
      },
    }
  )
);
