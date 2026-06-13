import { GENLAYER_STUDIONET, CONTRACT_ADDRESS, isContractConfigured } from "./config";
import type { SupportCase, PolicyPacket, SupportReviewResult } from "./types";

export type ConsoleLog = {
  tag: string;
  message: string;
  timestamp: string;
};

function timestamp(): string {
  return new Date().toISOString();
}

export function emitLog(tag: string, message: string): ConsoleLog {
  return { tag, message, timestamp: timestamp() };
}

export async function callContractRead(method: string, args: unknown[]): Promise<string> {
  if (!isContractConfigured()) {
    throw new Error("GenLayer contract is not configured yet. Deploy TriageonJudge and add NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to enable live support route review.");
  }

  const body = {
    jsonrpc: "2.0",
    method: "gen_call",
    id: 1,
    params: [
      {
        to: CONTRACT_ADDRESS,
        data: { method, args },
      },
      "latest",
    ],
  };

  const res = await fetch(GENLAYER_STUDIONET.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`RPC error: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result;
}

export async function callContractWrite(
  method: string,
  args: unknown[],
  senderAddress: string
): Promise<string> {
  if (!isContractConfigured()) {
    throw new Error("GenLayer contract is not configured yet.");
  }

  const body = {
    jsonrpc: "2.0",
    method: "gen_sendTransaction",
    id: 1,
    params: [
      {
        from: senderAddress,
        to: CONTRACT_ADDRESS,
        data: { method, args },
      },
    ],
  };

  const res = await fetch(GENLAYER_STUDIONET.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`RPC error: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(json.error.message || "RPC error");
  return json.result;
}

export async function waitForTransaction(txHash: string): Promise<unknown> {
  const maxAttempts = 60;
  for (let i = 0; i < maxAttempts; i++) {
    const body = {
      jsonrpc: "2.0",
      method: "gen_getTransactionByHash",
      id: 1,
      params: [txHash],
    };

    const res = await fetch(GENLAYER_STUDIONET.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) continue;
    const json = await res.json();
    const tx = json.result;

    if (tx && (tx.status === "FINALIZED" || tx.consensus_data)) {
      return tx;
    }

    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Transaction did not finalize within timeout.");
}

export async function getCaseFromContract(caseId: string): Promise<SupportCase | null> {
  try {
    const raw = await callContractRead("get_case", [caseId]);
    return JSON.parse(raw) as SupportCase;
  } catch {
    return null;
  }
}

export async function getPolicyFromContract(policyId: string): Promise<PolicyPacket | null> {
  try {
    const raw = await callContractRead("get_policy_packet", [policyId]);
    return JSON.parse(raw) as PolicyPacket;
  } catch {
    return null;
  }
}

export async function getReviewFromContract(caseId: string): Promise<SupportReviewResult | null> {
  try {
    const raw = await callContractRead("get_support_review", [caseId]);
    return JSON.parse(raw) as SupportReviewResult;
  } catch {
    return null;
  }
}
