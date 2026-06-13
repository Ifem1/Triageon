// suite3-nondet.mjs — Bucket 3: non-deterministic (GenLayer consensus) functions
import { W, write, read, assert, assertEqual, runSuite, uid, sleep } from "./helpers.mjs";

const VALID_CLASSIFICATIONS = ["REFUND_REQUEST","BILLING_DISPUTE","ACCOUNT_ACCESS","DELIVERY_FAILURE","TECHNICAL_FAILURE","SERVICE_OUTAGE","ABUSE_REPORT","POLICY_EXCEPTION","CLOSURE_REVIEW","SLA_BREACH","OTHER"];
const VALID_ROUTES          = ["ESCALATE","REFUND","PARTIAL_REFUND","CLOSE","REQUEST_MORE_INFO","HOLD_FOR_HUMAN","POLICY_EXCEPTION"];
const VALID_POLICY_MATCHES  = ["EXACT_MATCH","PARTIAL_MATCH","NO_MATCH","CONFLICTING_POLICIES","UNCLEAR"];
const VALID_REFUND          = ["SUPPORTED","PARTIALLY_SUPPORTED","NOT_SUPPORTED","PENDING_MORE_INFO","NOT_APPLICABLE"];
const VALID_ESCALATION      = ["NO_ESCALATION","TIER_2_REVIEW","MANAGER_REVIEW","TRUST_AND_SAFETY","LEGAL_OR_COMPLIANCE"];
const VALID_RISK            = ["LOW","MEDIUM","HIGH","CRITICAL","UNCLEAR"];
const VALID_MATCH_STRENGTH  = ["STRONG","MODERATE","WEAK","NONE"];
const VALID_RECON_OUTCOME   = ["UPHELD","MODIFIED","REVERSED"];

function assertReviewResult(result, label) {
  assert(VALID_CLASSIFICATIONS.includes(result.issue_classification),
    `${label}: issue_classification '${result.issue_classification}' not in allowed set`);
  assert(VALID_ROUTES.includes(result.recommended_route),
    `${label}: recommended_route '${result.recommended_route}' not in allowed set`);
  assert(typeof result.confidence === "number" && result.confidence >= 0 && result.confidence <= 100,
    `${label}: confidence ${result.confidence} not in [0,100]`);
  assert(VALID_POLICY_MATCHES.includes(result.policy_match),
    `${label}: policy_match '${result.policy_match}' not in allowed set`);
  assert(VALID_REFUND.includes(result.refund_recommendation),
    `${label}: refund_recommendation '${result.refund_recommendation}' not in allowed set`);
  assert(VALID_ESCALATION.includes(result.escalation_level),
    `${label}: escalation_level '${result.escalation_level}' not in allowed set`);
  assert(VALID_RISK.includes(result.risk_level),
    `${label}: risk_level '${result.risk_level}' not in allowed set`);
  assert(typeof result.semantic_equivalence === "object" && result.semantic_equivalence !== null,
    `${label}: semantic_equivalence must be an object`);
  assert(Array.isArray(result.customer_context_notes),
    `${label}: customer_context_notes must be an array`);
  assert(Array.isArray(result.missing_information),
    `${label}: missing_information must be an array`);
  assert(Array.isArray(result.recommended_next_actions),
    `${label}: recommended_next_actions must be an array`);
  assert(typeof result.reasoning_summary === "string" && result.reasoning_summary.length > 0,
    `${label}: reasoning_summary must be a non-empty string`);
}

// ── Shared policy for nondet suites ──────────────────────────────────────────
async function setupPolicy() {
  const pid = uid("policy-nd");
  await write(W.PK1, "create_policy_packet", [pid, JSON.stringify({
    name: "Enterprise SaaS Support Policy",
    refund_policy:
      "Full refund within 30 days. Partial refund (50%) days 31–60 at manager discretion. Gold/Platinum customers receive one annual exception to the refund window. Duplicate charges refunded in full regardless of time elapsed.",
    escalation_rules:
      "Escalate to Tier 2: billing errors >$200, account locked >48h, service outage affecting revenue. Escalate to Manager: Platinum tier unsatisfied after Tier 2, legal threats, repeat issues in 90 days.",
    closure_criteria:
      "Close only when: issue resolved and customer confirms, OR refund processed, OR no response in 14 days.",
    abuse_policy:
      "First warning noted. Second: involve supervisor. Third: flag Trust & Safety. Do not close a valid case solely due to customer tone.",
    exception_policy:
      "Gold/Platinum: one automatic refund window exception per year. Manager override required for all other exceptions. Must document reason.",
  })]);
  return pid;
}

// ── Suite 3A: review_support_case — refund edge case (day 31) ─────────────────
async function suite3A() {
  await runSuite("3A — review_support_case: refund request on day 31 (Gold tier, policy exception)", async () => {
    const pid = await setupPolicy();
    const caseId = uid("case-nd-refund");

    const casePayload = {
      ticket_title: "Refund request for annual subscription — purchased 31 days ago, not as described",
      ticket_text:
        "I purchased the annual Enterprise plan on November 12th for $1,188. The product was advertised as including unlimited API calls, but after activating my account I found API calls are capped at 10,000 per month — far below what our integration requires. I raised this with your sales team before purchasing and was told there was no cap. I am requesting a full refund. Today is December 13th — 31 days since purchase.",
      customer_id: "CUST-10482",
      customer_tier: "Gold",
      sla_state: "OK",
      policy_packet_id: pid,
      requested_outcome: "Full refund of $1,188 — product misrepresentation before purchase",
      chat_history_summary:
        "Pre-sale chat Nov 10: sales rep confirmed 'unlimited API calls' in writing. Nov 12: purchase confirmed. Dec 1: customer opened ticket about API cap. Dec 4: Tier 1 agent said refund window closed (30 days). Dec 5: customer escalated citing sales promise.",
    };

    await write(W.PK1, "open_case", [caseId, JSON.stringify(casePayload)]);

    await write(W.PK1, "attach_case_context", [caseId, JSON.stringify({
      chat_history_summary: casePayload.chat_history_summary,
      customer_context: "Gold tier since 2022. Clean payment history. Three successful renewals. Business-critical API integration.",
      agent_action_history:
        "Agent 1 (Dec 1): acknowledged API cap issue, escalated internally. Agent 2 (Dec 4): denied refund citing 30-day window, closed ticket. Customer reopened. Agent 3 (Dec 5): escalated to Tier 2.",
    })]);

    await write(W.PK1, "mark_ready_for_review", [caseId]);

    // Trigger GenLayer consensus review (owner is authorised reviewer)
    await write(W.PK_REV1, "review_support_case", [caseId], { label: "review_support_case [CONSENSUS — up to 5 min]" });

    // Read back and assert
    const review = await read(W.PK1, "get_support_review", [caseId]);
    console.log(`  consensus result: route=${review.recommended_route} confidence=${review.confidence} risk=${review.risk_level}`);
    assertReviewResult(review, "3A");

    // Case status must be REVIEW_COMPLETE
    const c = await read(W.PK1, "get_case", [caseId]);
    assertEqual(c.status, "REVIEW_COMPLETE", "case status after review");

    // Protocol stats incremented
    const stats = await read(W.PK1, "get_protocol_stats");
    assert(stats.total_reviews >= 1, "total_reviews >= 1 after review");
  });
}

// ── Suite 3B: review_support_case — service outage / SLA breach ───────────────
async function suite3B() {
  await runSuite("3B — review_support_case: SLA breach, Platinum customer, revenue loss", async () => {
    const pid = await setupPolicy();
    const caseId = uid("case-nd-outage");

    await write(W.PK1, "open_case", [caseId, JSON.stringify({
      ticket_title: "6-hour platform outage on Black Friday — $3,200 confirmed revenue loss",
      ticket_text:
        "Your platform was completely down from 09:47 to 15:52 UTC on November 29th (Black Friday). Our e-commerce integration relies on your API to process orders. During this window we lost 214 orders totalling $3,200. We have attached server logs confirming all errors originated from your API returning 503. Our SLA guarantees 99.95% uptime. 6 hours is a 99.17% monthly uptime — well below the SLA. We are requesting full compensation of $3,200 plus one month service credit.",
      customer_id: "CUST-77210",
      customer_tier: "Platinum",
      sla_state: "BREACHED",
      policy_packet_id: pid,
      requested_outcome: "Compensation of $3,200 + 1 month service credit (~$299)",
    })]);

    await write(W.PK1, "attach_case_context", [caseId, JSON.stringify({
      chat_history_summary:
        "Nov 29 09:50: customer opened P1 ticket. Nov 29 16:10: support confirmed outage was on provider side, said SLA review team would reach out in 48h. Dec 2: no response from SLA team. Dec 3: customer followed up. Dec 5: automated response asking for more time. Dec 6: customer escalated.",
      customer_context:
        "Platinum tier since 2020. $3,600/year plan. API-dependent e-commerce integration. No prior SLA incidents filed. Third-party uptime monitor (Pingdom) confirms outage duration.",
      agent_action_history:
        "Agent 1: acknowledged outage, created internal SLA review ticket. No further agent action in 7 days.",
    })]);

    await write(W.PK1, "mark_ready_for_review", [caseId]);
    await write(W.PK_REV1, "review_support_case", [caseId], { label: "review_support_case [CONSENSUS — up to 5 min]" });

    const review = await read(W.PK1, "get_support_review", [caseId]);
    console.log(`  consensus result: route=${review.recommended_route} confidence=${review.confidence} risk=${review.risk_level}`);
    assertReviewResult(review, "3B");

    const c = await read(W.PK1, "get_case", [caseId]);
    assertEqual(c.status, "REVIEW_COMPLETE", "case status after review");
  });
}

// ── Suite 3C: assess_policy_equivalence standalone ────────────────────────────
async function suite3C() {
  await runSuite("3C — assess_policy_equivalence: billing dispute vs refund policy", async () => {
    const pid = await setupPolicy();
    const caseId = uid("case-nd-equiv");

    await write(W.PK1, "open_case", [caseId, JSON.stringify({
      ticket_title: "Double charged for December — $149 unauthorised second debit",
      ticket_text:
        "I was charged $149 on December 1st and again on December 3rd. My subscription is monthly at $149. I only have one active plan. Please refund the duplicate immediately.",
      customer_id: "CUST-30091",
      customer_tier: "standard",
      sla_state: "OK",
      policy_packet_id: pid,
      requested_outcome: "Refund of $149 duplicate charge",
    })]);

    await write(W.PK1, "assess_policy_equivalence", [caseId, pid], { label: "assess_policy_equivalence [CONSENSUS]" });

    const review = await read(W.PK1, "get_support_review", [caseId]);
    console.log(`  equivalence result: ${JSON.stringify(review.semantic_equivalence)}`);
    assert(review.semantic_equivalence, "semantic_equivalence stored");
    assert(VALID_MATCH_STRENGTH.includes(review.semantic_equivalence.match_strength),
      `match_strength '${review.semantic_equivalence.match_strength}' not in allowed set`);
    assert(typeof review.semantic_equivalence.reason === "string" && review.semantic_equivalence.reason.length > 0,
      "reason must be a non-empty string");
  });
}

// ── Suite 3D: assess_refund_reasonableness standalone ────────────────────────
async function suite3D() {
  await runSuite("3D — assess_refund_reasonableness: account access failure", async () => {
    const pid = await setupPolicy();
    const caseId = uid("case-nd-refund2");

    await write(W.PK1, "open_case", [caseId, JSON.stringify({
      ticket_title: "Account inaccessible for 11 days after forced password reset — requesting refund",
      ticket_text:
        "Following a mandatory password reset email on November 28th, my account has been locked. I cannot access any of my data, projects, or billing history. I have submitted 4 support tickets — none resolved. I am paying $49/month for a service I cannot use. I want a refund for November and December, and immediate restoration of access.",
      customer_id: "CUST-41920",
      customer_tier: "standard",
      sla_state: "BREACHED",
      policy_packet_id: pid,
      requested_outcome: "Refund of 2 months ($98) + account restored immediately",
    })]);

    await write(W.PK1, "attach_case_context", [caseId, JSON.stringify({
      customer_context: "Standard tier, 2-year customer. No prior escalations. Account locked due to internal SSO bug (confirmed by engineering).",
      chat_history_summary: "4 tickets opened. Each closed without resolution. Engineering confirmed bug on Dec 4 but fix not deployed. Customer without access for 11 days as of today.",
    })]);

    await write(W.PK1, "assess_refund_reasonableness", [caseId], { label: "assess_refund_reasonableness [CONSENSUS]" });

    const review = await read(W.PK1, "get_support_review", [caseId]);
    console.log(`  refund result: recommendation=${review.refund_recommendation}`);
    assert(VALID_REFUND.includes(review.refund_recommendation),
      `refund_recommendation '${review.refund_recommendation}' not in allowed set`);
    assert(typeof review.refund_reasoning === "string" && review.refund_reasoning.length > 0,
      "refund_reasoning must be non-empty");
  });
}

// ── Suite 3E: review_reconsideration ─────────────────────────────────────────
async function suite3E() {
  await runSuite("3E — review_reconsideration: original denial reversed with new evidence", async () => {
    const pid = await setupPolicy();
    const caseId = uid("case-nd-recon");

    // Open and review a case first
    await write(W.PK1, "open_case", [caseId, JSON.stringify({
      ticket_title: "Refund request — software never worked on my operating system",
      ticket_text:
        "I purchased your desktop application on November 15th. It has never launched on my machine (macOS Ventura 13.6). I have tried reinstalling 3 times. Your system requirements page says 'macOS 12+'. Mine qualifies. I want a full refund.",
      customer_id: "CUST-60012",
      customer_tier: "standard",
      sla_state: "OK",
      policy_packet_id: pid,
      requested_outcome: "Full refund — product does not work on supported OS",
    })]);

    await write(W.PK1, "mark_ready_for_review", [caseId]);
    await write(W.PK_REV1, "review_support_case", [caseId], { label: "review_support_case [CONSENSUS — up to 5 min]" });

    const originalReview = await read(W.PK1, "get_support_review", [caseId]);
    console.log(`  original review: route=${originalReview.recommended_route}`);

    // Now open a reconsideration with new engineering evidence
    const reconId = uid("recon-nd");
    await write(W.PK1, "open_reconsideration", [reconId, caseId, JSON.stringify({
      case_id: caseId,
      new_evidence:
        "Engineering confirmed on December 10th that build v3.2.1 (released Nov 1) has a known crash bug on macOS Ventura 13.6 affecting GPU-accelerated rendering. A patch was released December 11th. The customer's complaint is a confirmed product defect — not user error.",
      requested_change:
        "Full refund should be approved regardless of route chosen originally, as the product had a confirmed defect on the customer's supported OS.",
      submitted_by: W.PK2.address,
    })]);

    await write(W.PK_REV1, "review_reconsideration", [reconId], { label: "review_reconsideration [CONSENSUS — up to 5 min]" });

    const reconReview = await read(W.PK1, "get_reconsideration_review", [reconId]);
    console.log(`  reconsideration result: outcome=${reconReview.reconsideration_outcome}`);
    assert(VALID_RECON_OUTCOME.includes(reconReview.reconsideration_outcome),
      `reconsideration_outcome '${reconReview.reconsideration_outcome}' not in allowed set`);

    // support_reviews[caseId] should now hold the reconsideration result
    const updatedReview = await read(W.PK1, "get_support_review", [caseId]);
    assert(updatedReview.reconsideration_outcome, "reconsideration_outcome persisted to support_reviews");
  });
}

export async function runAll() {
  await suite3A();
  await suite3B();
  await suite3C();
  await suite3D();
  await suite3E();
}
