import { createClient, chains } from "genlayer-js";
import { TransactionStatus, type CalldataEncodable, type TransactionHash } from "genlayer-js/types";
import type { Address } from "viem";
import type { EIP1193Provider } from "@privy-io/react-auth";
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

function getClient(account?: string, provider?: EIP1193Provider | null) {
  return createClient({
    chain: chains.studionet,
    endpoint: GENLAYER_STUDIONET.rpcUrl,
    account: account as Address | undefined,
    provider: provider ?? undefined,
  });
}

function toCalldataArgs(args: unknown[]): CalldataEncodable[] {
  return args as CalldataEncodable[];
}

function stringifyReadResult(result: CalldataEncodable): string {
  return typeof result === "string" ? result : JSON.stringify(result);
}

function getBrowserProvider(): EIP1193Provider | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { ethereum?: EIP1193Provider }).ethereum;
}

async function ensureStudionet(provider?: EIP1193Provider | null) {
  const walletProvider = provider ?? getBrowserProvider();
  if (!walletProvider) return;

  const chainIdHex = `0x${GENLAYER_STUDIONET.chainId.toString(16)}`;
  const currentChainId = await walletProvider.request({ method: "eth_chainId" });

  if (currentChainId === chainIdHex) return;

  const chainParams = {
    chainId: chainIdHex,
    chainName: GENLAYER_STUDIONET.name,
    rpcUrls: [GENLAYER_STUDIONET.rpcUrl],
    nativeCurrency: {
      name: GENLAYER_STUDIONET.currency,
      symbol: GENLAYER_STUDIONET.currency,
      decimals: 18,
    },
    blockExplorerUrls: [GENLAYER_STUDIONET.explorerUrl],
  };

  try {
    await walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  } catch {
    await walletProvider.request({
      method: "wallet_addEthereumChain",
      params: [chainParams],
    });
    await walletProvider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: chainIdHex }],
    });
  }
}

export async function callContractRead(method: string, args: unknown[]): Promise<string> {
  if (!isContractConfigured()) {
    throw new Error("GenLayer contract is not configured yet. Deploy TriageonJudge and add NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS to enable live support route review.");
  }

  const result = await getClient().readContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: method,
    args: toCalldataArgs(args),
  });

  return stringifyReadResult(result);
}

export async function callContractWrite(
  method: string,
  args: unknown[],
  senderAddress: string,
  provider?: EIP1193Provider | null
): Promise<string> {
  if (!isContractConfigured()) {
    throw new Error("GenLayer contract is not configured yet.");
  }

  const client = getClient(senderAddress, provider);
  await ensureStudionet(provider);

  return client.writeContract({
    address: CONTRACT_ADDRESS as Address,
    functionName: method,
    args: toCalldataArgs(args),
    value: BigInt(0),
  });
}

export async function waitForTransaction(txHash: string): Promise<unknown> {
  return getClient().waitForTransactionReceipt({
    hash: txHash as TransactionHash,
    status: TransactionStatus.ACCEPTED,
    interval: 3000,
    retries: 200,
  });
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
