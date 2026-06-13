import { create } from "zustand";
import type { SupportCase, PolicyPacket } from "./genlayer/types";
import type { ConsoleLog } from "./genlayer/client";

interface TriageonStore {
  cases: SupportCase[];
  policies: PolicyPacket[];
  consoleLogs: ConsoleLog[];
  walletAddress: string;

  addCase: (c: SupportCase) => void;
  updateCase: (caseId: string, patch: Partial<SupportCase>) => void;
  addPolicy: (p: PolicyPacket) => void;
  updatePolicy: (policyId: string, patch: Partial<PolicyPacket>) => void;
  pushLog: (log: ConsoleLog) => void;
  clearLogs: () => void;
  setWalletAddress: (addr: string) => void;
}

export const useStore = create<TriageonStore>((set) => ({
  cases: [],
  policies: [],
  consoleLogs: [],
  walletAddress: "",

  addCase: (c) => set((s) => ({ cases: [c, ...s.cases] })),
  updateCase: (caseId, patch) =>
    set((s) => ({
      cases: s.cases.map((c) => (c.case_id === caseId ? { ...c, ...patch } : c)),
    })),
  addPolicy: (p) => set((s) => ({ policies: [p, ...s.policies] })),
  updatePolicy: (policyId, patch) =>
    set((s) => ({
      policies: s.policies.map((p) => (p.policy_id === policyId ? { ...p, ...patch } : p)),
    })),
  pushLog: (log) => set((s) => ({ consoleLogs: [...s.consoleLogs, log] })),
  clearLogs: () => set({ consoleLogs: [] }),
  setWalletAddress: (addr) => set({ walletAddress: addr }),
}));
