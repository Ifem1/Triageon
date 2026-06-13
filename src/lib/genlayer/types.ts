export type IssueClassification =
  | "REFUND_REQUEST"
  | "BILLING_DISPUTE"
  | "ACCOUNT_ACCESS"
  | "DELIVERY_FAILURE"
  | "TECHNICAL_FAILURE"
  | "SERVICE_OUTAGE"
  | "ABUSE_REPORT"
  | "POLICY_EXCEPTION"
  | "CLOSURE_REVIEW"
  | "SLA_BREACH"
  | "OTHER";

export type RecommendedRoute =
  | "ESCALATE"
  | "REFUND"
  | "PARTIAL_REFUND"
  | "CLOSE"
  | "REQUEST_MORE_INFO"
  | "HOLD_FOR_HUMAN"
  | "POLICY_EXCEPTION";

export type PolicyMatch =
  | "EXACT_MATCH"
  | "PARTIAL_MATCH"
  | "NO_MATCH"
  | "CONFLICTING_POLICIES"
  | "UNCLEAR";

export type RefundRecommendation =
  | "SUPPORTED"
  | "PARTIALLY_SUPPORTED"
  | "NOT_SUPPORTED"
  | "PENDING_MORE_INFO"
  | "NOT_APPLICABLE";

export type EscalationLevel =
  | "NO_ESCALATION"
  | "TIER_2_REVIEW"
  | "MANAGER_REVIEW"
  | "TRUST_AND_SAFETY"
  | "LEGAL_OR_COMPLIANCE";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "UNCLEAR";

export type CaseStatus =
  | "CASE_OPENED"
  | "POLICY_ATTACHED"
  | "READY_FOR_TRIAGE_REVIEW"
  | "REVIEW_IN_PROGRESS"
  | "REVIEW_COMPLETE"
  | "FINALIZED";

export interface SemanticEquivalence {
  matched_policy: string;
  match_strength: "STRONG" | "MODERATE" | "WEAK" | "NONE";
  reason: string;
}

export interface SupportReviewResult {
  issue_classification: IssueClassification;
  recommended_route: RecommendedRoute;
  confidence: number;
  policy_match: PolicyMatch;
  semantic_equivalence: SemanticEquivalence;
  refund_recommendation: RefundRecommendation;
  escalation_level: EscalationLevel;
  risk_level: RiskLevel;
  customer_context_notes: string[];
  agent_action_notes: string[];
  missing_information: string[];
  recommended_next_actions: string[];
  suggested_customer_message: string;
  reasoning_summary: string;
}

export interface SupportCase {
  case_id: string;
  customer_id: string;
  ticket_title: string;
  issue_category: IssueClassification;
  ticket_text: string;
  chat_history_summary: string;
  product_area: string;
  customer_tier?: string;
  order_reference?: string;
  requested_outcome: string;
  current_agent_action?: string;
  policy_packet_id?: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  sla_state: "OK" | "AT_RISK" | "BREACHED";
  status: CaseStatus;
  created_at: string;
  updated_at: string;
  review_result?: SupportReviewResult;
  final_action?: string;
  tx_hash?: string;
  risk_level?: RiskLevel;
}

export interface PolicyPacket {
  policy_id: string;
  name: string;
  refund_policy: string;
  escalation_rules: string;
  closure_criteria: string;
  abuse_policy: string;
  exception_policy: string;
  sla_rules: string;
  product_rules?: string;
  created_at: string;
  version: string;
}
