// helpers.mjs — shared test utilities for TriageonJudge on GenLayer Studionet
import { createClient, createAccount, chains } from "genlayer-js";

export const CONTRACT = "0x17B9d11E4F0D8b3fD437De306A23fE1F92772EFC";
export const RPC = "https://studio.genlayer.com/api";
export const CHAIN = chains.studionet;

// Wallets — loaded from env, never hardcoded
const PK_KEYS = ["PK1", "PK2", "PK3", "PK4", "PK_OWNER", "PK_REV1", "PK_REV2"];
export const RAW_PKS = {};
for (const k of PK_KEYS) {
  const v = process.env[k];
  if (!v) throw new Error(`Missing required env var: ${k}. Aborting.`);
  RAW_PKS[k] = v.startsWith("0x") ? v : "0x" + v;
}

export function makeClient(pk) {
  const account = createAccount(pk);
  const client = createClient({ chain: CHAIN, endpoint: RPC, account });
  return { client, address: account.address };
}

// All clients
export const W = {};
for (const k of PK_KEYS) {
  W[k] = makeClient(RAW_PKS[k]);
}

// ── write-and-wait with 3-attempt retry loop ──────────────────────────────────
export async function write(clientObj, functionName, args, { label } = {}) {
  const { client, address } = clientObj;
  const tag = label || functionName;
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`  → [${address.slice(0, 8)}] ${functionName}(${summarize(args)})`);
      const t0 = Date.now();
      const hash = await client.writeContract({
        address: CONTRACT,
        functionName,
        args,
        value: 0n,
      });
      const receipt = await client.waitForTransactionReceipt({
        hash,
        retries: 200,
        interval: 3000,
      });
      const ms = Date.now() - t0;
      const lr = receipt?.consensus_data?.leader_receipt;
      const execResult = Array.isArray(lr) && lr.length > 0
        ? lr[0].execution_result
        : "UNKNOWN";
      const stderr = Array.isArray(lr) && lr.length > 0
        ? (lr[0].stderr || "")
        : "";

      if (execResult !== "SUCCESS" && execResult !== "ACCEPTED") {
        const errLines = stderr.trim().split("\n").slice(-2).join(" | ");
        throw new Error(`on-chain FAILURE: execution_result=${execResult} | ${errLines}`);
      }

      console.log(`  ✓ ${tag} (${ms}ms) tx=${hash}`);
      return { hash, receipt, execResult };
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.log(`  ⚠ ${tag} attempt ${attempt} failed: ${err.message} — retrying in 5s...`);
      await sleep(5000);
    }
  }
}

// ── write that is EXPECTED to revert ─────────────────────────────────────────
// Returns { reverted: true, hash, execResult, stderr } or throws if it succeeded
export async function writeExpectRevert(clientObj, functionName, args) {
  const { client, address } = clientObj;
  console.log(`  → [${address.slice(0, 8)}] ${functionName}(${summarize(args)}) [expect revert]`);
  const t0 = Date.now();
  try {
    const hash = await client.writeContract({
      address: CONTRACT,
      functionName,
      args,
      value: 0n,
    });
    const receipt = await client.waitForTransactionReceipt({
      hash,
      retries: 200,
      interval: 3000,
    });
    const ms = Date.now() - t0;
    const lr = receipt?.consensus_data?.leader_receipt;
    const execResult = Array.isArray(lr) && lr.length > 0
      ? lr[0].execution_result
      : "UNKNOWN";
    const stderr = Array.isArray(lr) && lr.length > 0
      ? (lr[0].stderr || "")
      : "";

    if (execResult === "SUCCESS" || execResult === "ACCEPTED") {
      throw new Error(`Expected revert but got ${execResult}. tx=${hash}`);
    }

    console.log(`  ✓ reverted as expected (${ms}ms) result=${execResult} tx=${hash}`);
    return { reverted: true, hash, execResult, stderr };
  } catch (err) {
    // writeContract itself may throw for reverts — that also counts
    if (err.message?.includes("Expected revert but got")) throw err;
    console.log(`  ✓ reverted as expected (threw): ${err.message.slice(0, 120)}`);
    return { reverted: true, execResult: "THREW", stderr: err.message };
  }
}

// ── read helper ───────────────────────────────────────────────────────────────
export async function read(clientObj, functionName, args = []) {
  const result = await clientObj.client.readContract({
    address: CONTRACT,
    functionName,
    args,
  });
  return typeof result === "string" ? JSON.parse(result) : result;
}

// ── assertions ────────────────────────────────────────────────────────────────
export function assert(condition, msg) {
  if (!condition) throw new Error(`ASSERT FAILED: ${msg}`);
}

export function assertEqual(actual, expected, msg) {
  if (actual !== expected)
    throw new Error(`ASSERT FAILED: ${msg} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// ── suite runner ──────────────────────────────────────────────────────────────
export async function runSuite(name, fn) {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`SUITE: ${name}`);
  console.log(`${"═".repeat(60)}`);
  const t0 = Date.now();
  try {
    await fn();
    const ms = Date.now() - t0;
    console.log(`\n✅ SUITE PASSED: ${name} (${ms}ms)\n`);
    return { name, status: "PASSED", ms };
  } catch (err) {
    const ms = Date.now() - t0;
    console.log(`\n❌ SUITE FAILED: ${name} (${ms}ms)`);
    console.log(`   Error: ${err.message}\n`);
    return { name, status: "FAILED", ms, error: err.message };
  }
}

// ── utilities ─────────────────────────────────────────────────────────────────
export function uid(prefix = "id") {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function summarize(args) {
  return args
    .map((a) => {
      const s = typeof a === "string" ? a : JSON.stringify(a);
      return s.length > 40 ? s.slice(0, 40) + "…" : s;
    })
    .join(", ");
}
