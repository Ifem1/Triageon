import { createClient, createAccount, chains } from "genlayer-js";

const CONTRACT = "0xdBD61DD0c7CB54daB6355D4A33FA2daB26579611";
const RPC = "https://studio.genlayer.com/api";

async function addReviewer(ownerPk, reviewerPk) {
  const ownerAcc = createAccount(ownerPk);
  const client = createClient({ chain: chains.studionet, endpoint: RPC, account: ownerAcc });
  const revAcc = createAccount(reviewerPk);
  console.log("Adding reviewer:", revAcc.address);
  const hash = await client.writeContract({ address: CONTRACT, functionName: "add_reviewer", args: [revAcc.address], value: 0n });
  const receipt = await client.waitForTransactionReceipt({ hash, retries: 100, interval: 3000 });
  const lr = receipt?.consensus_data?.leader_receipt;
  const result = Array.isArray(lr) && lr.length > 0 ? lr[0].execution_result : "UNKNOWN";
  console.log("  result:", result, "tx:", hash);
  if (result !== "SUCCESS" && result !== "ACCEPTED") throw new Error(`add_reviewer failed: ${result}`);
}

const ownerPk = process.env.PK_OWNER.startsWith("0x") ? process.env.PK_OWNER : "0x" + process.env.PK_OWNER;
const rev1Pk  = process.env.PK_REV1;
const rev2Pk  = process.env.PK_REV2;

await addReviewer(ownerPk, rev1Pk);
await addReviewer(ownerPk, rev2Pk);
console.log("Both reviewers added.");
