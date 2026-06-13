#!/usr/bin/env node
// test-all.mjs — master test runner for TriageonJudge on GenLayer Studionet
//
// Usage:
//   PK1=0x... PK2=0x... PK3=0x... PK4=0x... node tests/test-all.mjs
//   PK1=0x... ... node tests/test-all.mjs suite1 suite3   # run subset by name

import { step0 } from "./step0-sanity.mjs";
import { runAll as runSuite1 } from "./suite1-happy-path.mjs";
import { runAll as runSuite2 } from "./suite2-revert-paths.mjs";
import { runAll as runSuite3 } from "./suite3-nondet.mjs";
import { CONTRACT, RPC } from "./helpers.mjs";

const SUITES = [
  { name: "suite1", label: "Happy Path",    fn: runSuite1 },
  { name: "suite2", label: "Revert Paths",  fn: runSuite2 },
  { name: "suite3", label: "Non-Det",       fn: runSuite3 },
];

const filter = process.argv.slice(2);

async function main() {
  console.log(`\n${"▓".repeat(60)}`);
  console.log(`TriageonJudge — End-to-End Test Suite`);
  console.log(`Contract : ${CONTRACT}`);
  console.log(`Network  : GenLayer Studionet (chainId 61999)`);
  console.log(`RPC      : ${RPC}`);
  console.log(`Time     : ${new Date().toISOString()}`);
  console.log(`${"▓".repeat(60)}\n`);

  // ── Step 0 is always mandatory ────────────────────────────────────────────
  try {
    await step0();
  } catch (err) {
    console.log(`\n🚫 STEP 0 FAILED — aborting all suites.\n   ${err.message}\n`);
    process.exit(1);
  }

  // ── Run each suite ────────────────────────────────────────────────────────
  const results = [];
  const suitesToRun = filter.length > 0
    ? SUITES.filter(s => filter.includes(s.name))
    : SUITES;

  for (const suite of suitesToRun) {
    const t0 = Date.now();
    try {
      await suite.fn();
      results.push({ name: suite.label, status: "✅ PASSED", ms: Date.now() - t0 });
    } catch (err) {
      const ms = Date.now() - t0;
      results.push({ name: suite.label, status: "❌ FAILED", ms, error: err.message });
      console.log(`\n🚫 Stopping on first failure in ${suite.label}.\n`);
      break;
    }
  }

  // ── Final summary ─────────────────────────────────────────────────────────
  console.log(`\n${"▓".repeat(60)}`);
  console.log(`FINAL SUMMARY`);
  console.log(`${"▓".repeat(60)}`);
  for (const r of results) {
    const t = `${(r.ms / 1000).toFixed(1)}s`.padStart(7);
    console.log(`  ${r.status.padEnd(12)} ${t}  ${r.name}`);
    if (r.error) console.log(`              ↳ ${r.error}`);
  }
  console.log(`${"▓".repeat(60)}\n`);

  const failed = results.some(r => r.status.includes("FAILED"));
  process.exit(failed ? 1 : 0);
}

main().catch(err => {
  console.error("Unhandled runner error:", err);
  process.exit(1);
});
