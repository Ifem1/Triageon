// suite2-revert-paths.mjs — Bucket 2: every VmUserError / revert path
import { W, write, writeExpectRevert, read, assert, assertEqual, runSuite, uid, sleep } from "./helpers.mjs";

// Helper: set up a fresh policy + case for tests that need prior state
async function freshPolicy() {
  const id = uid("policy-rev");
  await write(W.PK1, "create_policy_packet", [id, JSON.stringify({ name: "Revert Suite Policy", refund_policy: "30 days full refund." })]);
  return id;
}

async function freshCase(policyId) {
  const id = uid("case-rev");
  const payload = {
    ticket_title: "Account locked after failed password reset — unable to access data for 4 days",
    ticket_text:
      "I attempted a password reset on December 1st. After clicking the link, I was logged out and my account was locked. I have tried contacting support 3 times. I am a freelance developer and all my client project files are in your cloud storage. This is causing direct financial harm.",
    customer_id: "CUST-55821",
    customer_tier: "standard",
    sla_state: "BREACHED",
    policy_packet_id: policyId || "",
  };
  await write(W.PK1, "open_case", [id, JSON.stringify(payload)]);
  return id;
}

// ── Suite 2A: create_policy_packet revert paths ───────────────────────────────
async function suite2A() {
  await runSuite("2A — create_policy_packet revert paths", async () => {
    // empty policy_id
    await writeExpectRevert(W.PK1, "create_policy_packet", [
      "", JSON.stringify({ name: "x" })
    ]);

    // policy_id > 64 chars
    await writeExpectRevert(W.PK1, "create_policy_packet", [
      "a".repeat(65), JSON.stringify({ name: "x" })
    ]);

    // invalid JSON
    await writeExpectRevert(W.PK1, "create_policy_packet", [
      uid("policy-bad"), "not-json{{"
    ]);

    // JSON missing 'name'
    await writeExpectRevert(W.PK1, "create_policy_packet", [
      uid("policy-noname"), JSON.stringify({ refund_policy: "30 days" })
    ]);

    // duplicate policy_id
    const dupId = uid("policy-dup");
    await write(W.PK1, "create_policy_packet", [dupId, JSON.stringify({ name: "Original" })]);
    await writeExpectRevert(W.PK1, "create_policy_packet", [
      dupId, JSON.stringify({ name: "Duplicate attempt" })
    ]);

    // verify state unchanged after duplicate attempt
    const policy = await read(W.PK1, "get_policy_packet", [dupId]);
    assertEqual(policy.name, "Original", "original policy name unchanged after duplicate revert");

    // paused protocol — create policy
    await write(W.PK_OWNER, "pause_protocol", []);
    await writeExpectRevert(W.PK1, "create_policy_packet", [uid("policy-paused"), JSON.stringify({ name: "Paused" })]);
    await write(W.PK_OWNER, "unpause_protocol", []);
  });
}

// ── Suite 2B: open_case revert paths ─────────────────────────────────────────
async function suite2B() {
  await runSuite("2B — open_case revert paths", async () => {
    // empty case_id
    await writeExpectRevert(W.PK1, "open_case", [
      "", JSON.stringify({ ticket_title: "t", ticket_text: "x", customer_id: "c" })
    ]);

    // case_id > 64 chars
    await writeExpectRevert(W.PK1, "open_case", [
      "b".repeat(65), JSON.stringify({ ticket_title: "t", ticket_text: "x", customer_id: "c" })
    ]);

    // invalid JSON
    await writeExpectRevert(W.PK1, "open_case", [uid("case-badjson"), "{bad}"]);

    // missing ticket_title
    await writeExpectRevert(W.PK1, "open_case", [
      uid("case-notitle"), JSON.stringify({ ticket_text: "x", customer_id: "c" })
    ]);

    // missing ticket_text
    await writeExpectRevert(W.PK1, "open_case", [
      uid("case-notext"), JSON.stringify({ ticket_title: "t", customer_id: "c" })
    ]);

    // missing customer_id
    await writeExpectRevert(W.PK1, "open_case", [
      uid("case-nocust"), JSON.stringify({ ticket_title: "t", ticket_text: "x" })
    ]);

    // duplicate case_id
    const dupCaseId = uid("case-dup");
    await write(W.PK1, "open_case", [
      dupCaseId,
      JSON.stringify({ ticket_title: "Original case", ticket_text: "details", customer_id: "CUST-00001" })
    ]);
    await writeExpectRevert(W.PK1, "open_case", [
      dupCaseId,
      JSON.stringify({ ticket_title: "Duplicate attempt", ticket_text: "x", customer_id: "CUST-00001" })
    ]);

    // verify state unchanged after dup
    const c = await read(W.PK1, "get_case", [dupCaseId]);
    assertEqual(c.ticket_title, "Original case", "original case title unchanged after duplicate revert");

    // paused protocol — open case
    await write(W.PK_OWNER, "pause_protocol", []);
    await writeExpectRevert(W.PK1, "open_case", [
      uid("case-paused"),
      JSON.stringify({ ticket_title: "t", ticket_text: "x", customer_id: "c" })
    ]);
    await write(W.PK_OWNER, "unpause_protocol", []);
  });
}

// ── Suite 2C: attach_case_context / mark_ready / finalize revert paths ────────
async function suite2C() {
  await runSuite("2C — attach_case_context / mark_ready_for_review / finalize_case revert paths", async () => {
    // attach_case_context — case not found
    await writeExpectRevert(W.PK1, "attach_case_context", [
      "nonexistent-case-xyz", JSON.stringify({ chat_history_summary: "x" })
    ]);

    // attach_case_context — invalid JSON
    const cid = await freshCase();
    await writeExpectRevert(W.PK1, "attach_case_context", [cid, "not-json"]);

    // mark_ready_for_review — case not found
    await writeExpectRevert(W.PK1, "mark_ready_for_review", ["nonexistent-case-xyz2"]);

    // finalize_case — case not found
    await writeExpectRevert(W.PK1, "finalize_case", [
      "nonexistent-case-xyz3", JSON.stringify({ action: "CLOSE" })
    ]);

    // finalize_case — invalid JSON
    const cid2 = await freshCase();
    await writeExpectRevert(W.PK1, "finalize_case", [cid2, "{bad-json"]);
  });
}

// ── Suite 2D: owner-only revert paths ────────────────────────────────────────
async function suite2D() {
  await runSuite("2D — owner-only operations rejected from non-owner wallet", async () => {
    // add_reviewer from non-owner (PK3)
    await writeExpectRevert(W.PK3, "add_reviewer", [W.PK4.address]);

    // remove_reviewer from non-owner (PK3)
    await writeExpectRevert(W.PK3, "remove_reviewer", [W.PK2.address]);

    // remove_reviewer — reviewer not found (owner calling on unknown address)
    await writeExpectRevert(W.PK_OWNER, "remove_reviewer", ["0x0000000000000000000000000000000000000001"]);

    // pause_protocol from non-owner
    await writeExpectRevert(W.PK3, "pause_protocol", []);

    // unpause_protocol from non-owner
    await writeExpectRevert(W.PK3, "unpause_protocol", []);
  });
}

// ── Suite 2E: review_support_case / review_reconsideration access control ─────
async function suite2E() {
  await runSuite("2E — review functions rejected from unauthorised caller", async () => {
    const caseId = await freshCase();

    // PK4 is not owner and not a reviewer — should revert
    await writeExpectRevert(W.PK4, "review_support_case", [caseId]);
    await writeExpectRevert(W.PK4, "review_reconsideration", [uid("recon-notfound")]);
  });
}

// ── Suite 2F: assess_policy_equivalence / assess_refund_reasonableness ────────
async function suite2F() {
  await runSuite("2F — assess functions with bad inputs revert", async () => {
    const pid = await freshPolicy();
    const cid = await freshCase(pid);

    // assess_policy_equivalence — case not found
    await writeExpectRevert(W.PK1, "assess_policy_equivalence", ["nonexistent-case-xyz4", pid]);

    // assess_policy_equivalence — policy not found
    await writeExpectRevert(W.PK1, "assess_policy_equivalence", [cid, "nonexistent-policy-xyz"]);

    // assess_refund_reasonableness — case not found
    await writeExpectRevert(W.PK1, "assess_refund_reasonableness", ["nonexistent-case-xyz5"]);
  });
}

// ── Suite 2G: paused protocol blocks all writes ───────────────────────────────
async function suite2G() {
  await runSuite("2G — paused protocol blocks open_reconsideration and assess functions", async () => {
    const pid = await freshPolicy();
    const cid = await freshCase(pid);

    await write(W.PK_OWNER, "pause_protocol", []);

    await writeExpectRevert(W.PK1, "open_reconsideration", [uid("recon"), cid, JSON.stringify({ case_id: cid })]);
    await writeExpectRevert(W.PK1, "assess_policy_equivalence", [cid, pid]);
    await writeExpectRevert(W.PK1, "assess_refund_reasonableness", [cid]);
    await writeExpectRevert(W.PK1, "mark_ready_for_review", [cid]);
    await writeExpectRevert(W.PK1, "finalize_case", [cid, JSON.stringify({ action: "CLOSE" })]);

    // Restore
    await write(W.PK_OWNER, "unpause_protocol", []);

    // Confirm case state unchanged (still CASE_OPENED)
    const c = await read(W.PK1, "get_case", [cid]);
    assertEqual(c.status, "CASE_OPENED", "case status unchanged after all paused reverts");
  });
}

export async function runAll() {
  await suite2A();
  await suite2B();
  await suite2C();
  await suite2D();
  await suite2E();
  await suite2F();
  await suite2G();
}
