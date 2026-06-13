// suite1-happy-path.mjs — Bucket 1: deterministic happy-path state transitions
import { W, write, read, assert, assertEqual, runSuite, uid } from "./helpers.mjs";

// ── Real policy packet used across scenarios ──────────────────────────────────
const STANDARD_POLICY = {
  name: "Standard Customer Policy v2",
  refund_policy:
    "Full refund within 30 days of purchase. Day 31–60: partial refund (50%) at manager discretion. After 60 days: no refund unless product defect is proven. Support agents may offer a one-time goodwill extension to Gold/Platinum tier customers.",
  escalation_rules:
    "Escalate to Tier 2 if: (1) refund request denied twice, (2) customer threatens legal action, (3) billing error >$500, (4) account locked for >72h. Escalate to manager if customer is Gold/Platinum tier and unsatisfied after Tier 2.",
  closure_criteria:
    "Close case only when: refund processed AND confirmed, OR customer explicitly accepts resolution, OR no response for 14 days after final offer.",
  abuse_policy:
    "First abusive message: warn and note in record. Second: allow supervisor to decide whether to continue. Three or more: flag for Trust & Safety review.",
  exception_policy:
    "Exceptions to refund window require manager approval and must be documented. Gold/Platinum tier customers receive one automatic exception per calendar year.",
};

// ── Suite 1A: Full happy-path for a billing dispute escalation ────────────────
async function suite1A() {
  await runSuite("1A — Policy create + Case open + Context attach + Mark ready + Finalize", async () => {
    const policyId = uid("policy-billing");
    const caseId = uid("case-billing");

    // 1. Create policy packet
    await write(W.PK1, "create_policy_packet", [policyId, JSON.stringify(STANDARD_POLICY)]);

    // Verify policy stored
    const policy = await read(W.PK1, "get_policy_packet", [policyId]);
    assertEqual(policy.name, STANDARD_POLICY.name, "policy name round-trips");
    assertEqual(policy.refund_policy, STANDARD_POLICY.refund_policy, "refund_policy round-trips");

    // 2. Open a case — billing dispute with overcharge
    const casePayload = {
      ticket_title: "Charged twice for November subscription — $148 unauthorised debit",
      ticket_text:
        "My bank statement shows two separate charges of $74 on November 3rd and November 5th for my monthly subscription. I only have one active account. I contacted my bank and they confirmed both charges came from you. I have been a customer for 3 years. I need an immediate refund of the duplicate charge of $74.",
      customer_id: "CUST-88341",
      customer_tier: "Gold",
      sla_state: "AT_RISK",
      policy_packet_id: policyId,
      requested_outcome: "Full refund of $74 duplicate charge",
    };

    await write(W.PK1, "open_case", [caseId, JSON.stringify(casePayload)]);

    // Verify case stored with CASE_OPENED status
    let caseData = await read(W.PK1, "get_case", [caseId]);
    assertEqual(caseData.status, "CASE_OPENED", "status after open_case");
    assertEqual(caseData.ticket_title, casePayload.ticket_title, "ticket_title round-trips");
    assertEqual(caseData.customer_id, casePayload.customer_id, "customer_id round-trips");
    assertEqual(caseData.case_id, caseId, "case_id injected by contract");

    // Verify user_cases updated
    const userCases = await read(W.PK1, "get_user_cases", [W.PK1.address]);
    assert(userCases.includes(caseId), "case_id appears in user_cases");

    // Verify protocol_stats total_cases incremented
    const stats = await read(W.PK1, "get_protocol_stats");
    assert(stats.total_cases >= 1, "total_cases >= 1 after open_case");
    assert(stats.total_policies >= 1, "total_policies >= 1 after create_policy_packet");

    // 3. Attach case context (chat history + customer context)
    const contextPayload = {
      chat_history_summary:
        "Agent initially told customer the duplicate charge would be investigated within 48h (Nov 3). Second agent (Nov 6) said they could not locate the second transaction and asked customer to send bank statement. Customer sent PDF on Nov 7. No further follow-up from support in 5 days.",
      customer_context:
        "Gold tier since 2021. Annual spend ~$900. No prior disputes. Consistent payment history. Currently running a small business that depends on the platform.",
      agent_action_history:
        "Agent 1: created internal ticket, promised 48h response. Agent 2: denied seeing duplicate in system, requested bank statement. Agent 3: no action taken. Total elapsed: 9 days.",
    };

    await write(W.PK1, "attach_case_context", [caseId, JSON.stringify(contextPayload)]);

    // Verify status moved to POLICY_ATTACHED
    caseData = await read(W.PK1, "get_case", [caseId]);
    assertEqual(caseData.status, "POLICY_ATTACHED", "status after attach_case_context");

    // Verify context stored
    const ctx = await read(W.PK1, "get_case_context", [caseId]);
    assertEqual(ctx.customer_context, contextPayload.customer_context, "customer_context round-trips");

    // 4. Mark ready for review
    await write(W.PK1, "mark_ready_for_review", [caseId]);

    caseData = await read(W.PK1, "get_case", [caseId]);
    assertEqual(caseData.status, "READY_FOR_TRIAGE_REVIEW", "status after mark_ready_for_review");

    // 5. Finalize case
    const finalAction = {
      action: "REFUND_PROCESSED",
      amount: 74,
      currency: "USD",
      note: "Duplicate charge confirmed via payment processor. Refund issued to original payment method.",
      resolved_by: W.PK1.address,
    };

    await write(W.PK1, "finalize_case", [caseId, JSON.stringify(finalAction)]);

    caseData = await read(W.PK1, "get_case", [caseId]);
    assertEqual(caseData.status, "FINALIZED", "status after finalize_case");
    assert(caseData.final_action, "final_action stored on case");
  });
}

// ── Suite 1B: Reviewer management (owner adds, removes, re-adds reviewer) ─────
async function suite1B() {
  await runSuite("1B — add_reviewer + remove_reviewer by owner", async () => {
    // Add PK1 as a temp reviewer using owner
    await write(W.PK_OWNER, "add_reviewer", [W.PK1.address]);

    // Remove it
    await write(W.PK_OWNER, "remove_reviewer", [W.PK1.address]);
  });
}

// ── Suite 1C: Pause and unpause protocol ─────────────────────────────────────
async function suite1C() {
  await runSuite("1C — pause_protocol + unpause_protocol", async () => {
    await write(W.PK_OWNER, "pause_protocol", []);
    await write(W.PK_OWNER, "unpause_protocol", []);
  });
}

// ── Suite 1D: Open reconsideration ───────────────────────────────────────────
async function suite1D() {
  await runSuite("1D — open_reconsideration on existing case", async () => {
    // Create a case to attach reconsideration to
    const caseId = uid("case-recon");
    const casePayload = {
      ticket_title: "Service outage on Black Friday — 6h downtime, lost $2,400 in sales",
      ticket_text:
        "Our online store was completely inaccessible from 10am to 4pm on November 29 (Black Friday). This is our highest sales day. We lost approximately $2,400 in revenue and had to issue manual refunds to 47 customers. Your SLA guarantees 99.9% uptime. We are requesting compensation.",
      customer_id: "CUST-20123",
      customer_tier: "Platinum",
      sla_state: "BREACHED",
      requested_outcome: "Compensation of $2,400 or 3 months free service",
    };

    await write(W.PK1, "open_case", [caseId, JSON.stringify(casePayload)]);

    const reconId = uid("recon");
    const reconPayload = {
      case_id: caseId,
      new_evidence:
        "Attaching AWS CloudWatch logs showing our infrastructure was healthy. The outage was exclusively on the provider side. Third-party monitoring service Pingdom confirms 6h 14m outage window.",
      requested_change: "Increase compensation to $3,000 given documented third-party evidence.",
      submitted_by: W.PK1.address,
    };

    await write(W.PK1, "open_reconsideration", [reconId, caseId, JSON.stringify(reconPayload)]);

    // Verify stored
    const recon = await read(W.PK1, "get_reconsideration", [reconId]);
    assertEqual(recon.case_id, caseId, "case_id in reconsideration");
    assert(recon.new_evidence, "new_evidence stored");
  });
}

export async function runAll() {
  await suite1A();
  await suite1B();
  await suite1C();
  await suite1D();
}
