// step0-sanity.mjs — pre-flight: balances + contract liveness
import { W, read, assert, CONTRACT, RPC } from "./helpers.mjs";

export async function step0() {
  console.log(`\n${"═".repeat(60)}`);
  console.log(`STEP 0: Sanity check — RPC + balances + contract read`);
  console.log(`  Contract: ${CONTRACT}`);
  console.log(`  RPC:      ${RPC}`);
  console.log(`${"═".repeat(60)}`);

  // 1. Balance check for all 4 wallets
  for (const [label, w] of Object.entries(W)) {
    const bal = await w.client.getBalance({ address: w.address });
    console.log(`  ${label} ${w.address} balance=${bal.toString()}`);
    assert(bal > 0n, `${label} (${w.address}) has zero balance — top up before running tests.`);
  }

  // 2. Contract read — get_protocol_stats
  const stats = await read(W.PK1, "get_protocol_stats");
  console.log(`  protocol_stats: ${JSON.stringify(stats)}`);
  assert(typeof stats.total_cases === "number", "total_cases must be a number");
  assert(typeof stats.total_policies === "number", "total_policies must be a number");
  assert(typeof stats.total_reviews === "number", "total_reviews must be a number");

  console.log(`\n✅ STEP 0 PASSED — RPC live, all wallets funded, contract readable.\n`);
}
