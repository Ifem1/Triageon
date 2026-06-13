# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
from genlayer import *
import json


class TriageonJudge(gl.Contract):
    owner: Address
    cases: TreeMap[str, str]
    policy_packets: TreeMap[str, str]
    case_contexts: TreeMap[str, str]
    support_reviews: TreeMap[str, str]
    reconsiderations: TreeMap[str, str]
    reconsideration_reviews: TreeMap[str, str]
    reviewers: TreeMap[str, str]
    user_cases: TreeMap[str, str]
    protocol_stats: TreeMap[str, str]
    case_count: u256
    policy_count: u256
    review_count: u256
    paused: bool

    def __init__(self) -> None:
        self.owner = gl.message.sender_address
        self.cases = TreeMap()
        self.policy_packets = TreeMap()
        self.case_contexts = TreeMap()
        self.support_reviews = TreeMap()
        self.reconsiderations = TreeMap()
        self.reconsideration_reviews = TreeMap()
        self.reviewers = TreeMap()
        self.user_cases = TreeMap()
        self.protocol_stats = TreeMap()
        self.case_count = u256(0)
        self.policy_count = u256(0)
        self.review_count = u256(0)
        self.paused = False
        self.protocol_stats["global"] = json.dumps({"total_cases": 0, "total_reviews": 0, "total_policies": 0})

    # ── Deterministic writes ──────────────────────────────────────────

    @gl.public.write
    def create_policy_packet(self, policy_id: str, policy_json: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        if not policy_id or len(policy_id) > 64:
            raise VmUserError("Invalid policy_id.")
        if self.policy_packets.get(policy_id) is not None:
            raise VmUserError("Policy packet already exists.")
        try:
            data = json.loads(policy_json)
        except Exception:
            raise VmUserError("policy_json must be valid JSON.")
        if "name" not in data:
            raise VmUserError("policy_json must include 'name'.")
        self.policy_packets[policy_id] = policy_json
        self.policy_count = u256(int(self.policy_count) + 1)
        stats = json.loads(self.protocol_stats["global"])
        stats["total_policies"] = int(stats.get("total_policies", 0)) + 1
        self.protocol_stats["global"] = json.dumps(stats)

    @gl.public.write
    def open_case(self, case_id: str, case_json: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        if not case_id or len(case_id) > 64:
            raise VmUserError("Invalid case_id.")
        if self.cases.get(case_id) is not None:
            raise VmUserError("Case already exists.")
        try:
            data = json.loads(case_json)
        except Exception:
            raise VmUserError("case_json must be valid JSON.")
        for field in ["ticket_title", "ticket_text", "customer_id"]:
            if field not in data:
                raise VmUserError("case_json missing required field: " + field)
        data["status"] = "CASE_OPENED"
        data["case_id"] = case_id
        self.cases[case_id] = json.dumps(data)
        self.case_count = u256(int(self.case_count) + 1)
        sender = str(gl.message.sender_address)
        existing = self.user_cases.get(sender)
        user_list = json.loads(existing) if existing else []
        user_list.append(case_id)
        self.user_cases[sender] = json.dumps(user_list)
        stats = json.loads(self.protocol_stats["global"])
        stats["total_cases"] = int(stats.get("total_cases", 0)) + 1
        self.protocol_stats["global"] = json.dumps(stats)

    @gl.public.write
    def attach_case_context(self, case_id: str, context_json: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        if self.cases.get(case_id) is None:
            raise VmUserError("Case not found.")
        try:
            json.loads(context_json)
        except Exception:
            raise VmUserError("context_json must be valid JSON.")
        self.case_contexts[case_id] = context_json
        case = json.loads(self.cases[case_id])
        if case.get("status") == "CASE_OPENED":
            case["status"] = "POLICY_ATTACHED"
            self.cases[case_id] = json.dumps(case)

    @gl.public.write
    def mark_ready_for_review(self, case_id: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        if self.cases.get(case_id) is None:
            raise VmUserError("Case not found.")
        case = json.loads(self.cases[case_id])
        case["status"] = "READY_FOR_TRIAGE_REVIEW"
        self.cases[case_id] = json.dumps(case)

    @gl.public.write
    def open_reconsideration(self, reconsideration_id: str, case_id: str, reconsideration_json: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        if self.cases.get(case_id) is None:
            raise VmUserError("Case not found.")
        try:
            json.loads(reconsideration_json)
        except Exception:
            raise VmUserError("reconsideration_json must be valid JSON.")
        self.reconsiderations[reconsideration_id] = reconsideration_json

    @gl.public.write
    def finalize_case(self, case_id: str, final_action_json: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        if self.cases.get(case_id) is None:
            raise VmUserError("Case not found.")
        try:
            json.loads(final_action_json)
        except Exception:
            raise VmUserError("final_action_json must be valid JSON.")
        case = json.loads(self.cases[case_id])
        case["status"] = "FINALIZED"
        case["final_action"] = final_action_json
        self.cases[case_id] = json.dumps(case)

    @gl.public.write
    def add_reviewer(self, reviewer: Address) -> None:
        if gl.message.sender_address != self.owner:
            raise VmUserError("Only owner can perform this action.")
        self.reviewers[str(reviewer)] = json.dumps({"active": True})

    @gl.public.write
    def remove_reviewer(self, reviewer: Address) -> None:
        if gl.message.sender_address != self.owner:
            raise VmUserError("Only owner can perform this action.")
        if self.reviewers.get(str(reviewer)) is None:
            raise VmUserError("Reviewer not found.")
        self.reviewers[str(reviewer)] = json.dumps({"active": False})

    @gl.public.write
    def pause_protocol(self) -> None:
        if gl.message.sender_address != self.owner:
            raise VmUserError("Only owner can perform this action.")
        self.paused = True

    @gl.public.write
    def unpause_protocol(self) -> None:
        if gl.message.sender_address != self.owner:
            raise VmUserError("Only owner can perform this action.")
        self.paused = False

    # ── GenLayer intelligent functions ────────────────────────────────

    @gl.public.write
    def review_support_case(self, case_id: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        sender = str(gl.message.sender_address)
        is_owner = gl.message.sender_address == self.owner
        reviewer_raw = self.reviewers.get(sender)
        is_reviewer = reviewer_raw is not None and json.loads(reviewer_raw).get("active", False)
        if not is_owner and not is_reviewer:
            raise VmUserError("Only authorised reviewers can trigger consensus review.")
        if self.cases.get(case_id) is None:
            raise VmUserError("Case not found.")

        case = json.loads(self.cases[case_id])
        context_raw = self.case_contexts.get(case_id)
        context = json.loads(context_raw) if context_raw else {}
        policy_id = case.get("policy_packet_id", "")
        policy_raw = self.policy_packets.get(policy_id) if policy_id else None
        policy = json.loads(policy_raw) if policy_raw else {}

        case["status"] = "REVIEW_IN_PROGRESS"
        self.cases[case_id] = json.dumps(case)

        ticket_text = case.get("ticket_text", "")
        chat_history = context.get("chat_history_summary", case.get("chat_history_summary", ""))
        customer_context = context.get("customer_context", "Not provided.")
        agent_history = context.get("agent_action_history", "Not provided.")
        requested_outcome = case.get("requested_outcome", "Not specified.")
        customer_tier = case.get("customer_tier", "standard")
        sla_state = case.get("sla_state", "OK")
        refund_policy = policy.get("refund_policy", "No refund policy provided.")
        escalation_rules = policy.get("escalation_rules", "No escalation rules provided.")
        closure_criteria = policy.get("closure_criteria", "No closure criteria provided.")
        abuse_policy = policy.get("abuse_policy", "No abuse policy provided.")
        exception_policy = policy.get("exception_policy", "No exception policy provided.")

        prompt = (
            "You are reviewing a difficult customer support case as a fair, experienced support policy expert.\n\n"
            "Rules:\n"
            "- Do not act as a chatbot or write only a customer reply.\n"
            "- Do not invent missing facts. If policy context is insufficient, say so.\n"
            "- If closure is not justified, do not recommend closure.\n"
            "- If customer language is abusive but the issue may be valid, separate conduct from issue merit.\n"
            "- Do not guarantee legal compliance.\n\n"
            "=== TICKET ===\n" + ticket_text + "\n\n"
            "=== CHAT HISTORY SUMMARY ===\n" + chat_history + "\n\n"
            "=== CUSTOMER CONTEXT ===\n" + customer_context + "\n\n"
            "=== AGENT ACTION HISTORY ===\n" + agent_history + "\n\n"
            "=== CUSTOMER REQUESTED OUTCOME ===\n" + requested_outcome + "\n\n"
            "=== CUSTOMER TIER ===\n" + customer_tier + "\n\n"
            "=== SLA STATE ===\n" + sla_state + "\n\n"
            "=== REFUND POLICY ===\n" + refund_policy + "\n\n"
            "=== ESCALATION RULES ===\n" + escalation_rules + "\n\n"
            "=== CLOSURE CRITERIA ===\n" + closure_criteria + "\n\n"
            "=== ABUSE POLICY ===\n" + abuse_policy + "\n\n"
            "=== EXCEPTION POLICY ===\n" + exception_policy + "\n\n"
            "Tasks:\n"
            "1. Classify the issue type.\n"
            "2. Assess semantic equivalence between the complaint and policy categories.\n"
            "3. Recommend the support route.\n"
            "4. Assess refund reasonableness.\n"
            "5. Determine escalation level and risk level.\n"
            "6. Note missing information and recommended next actions.\n"
            "7. Suggest an appropriate customer message.\n"
            "8. Summarise your reasoning.\n\n"
            "Respond as JSON with exactly these fields:\n"
            '{"issue_classification":"<REFUND_REQUEST|BILLING_DISPUTE|ACCOUNT_ACCESS|DELIVERY_FAILURE|TECHNICAL_FAILURE|SERVICE_OUTAGE|ABUSE_REPORT|POLICY_EXCEPTION|CLOSURE_REVIEW|SLA_BREACH|OTHER>",'
            '"recommended_route":"<ESCALATE|REFUND|PARTIAL_REFUND|CLOSE|REQUEST_MORE_INFO|HOLD_FOR_HUMAN|POLICY_EXCEPTION>",'
            '"confidence":<integer 0-100>,'
            '"policy_match":"<EXACT_MATCH|PARTIAL_MATCH|NO_MATCH|CONFLICTING_POLICIES|UNCLEAR>",'
            '"semantic_equivalence":{"matched_policy":"<name or none>","match_strength":"<STRONG|MODERATE|WEAK|NONE>","reason":"<explanation>"},'
            '"refund_recommendation":"<SUPPORTED|PARTIALLY_SUPPORTED|NOT_SUPPORTED|PENDING_MORE_INFO|NOT_APPLICABLE>",'
            '"escalation_level":"<NO_ESCALATION|TIER_2_REVIEW|MANAGER_REVIEW|TRUST_AND_SAFETY|LEGAL_OR_COMPLIANCE>",'
            '"risk_level":"<LOW|MEDIUM|HIGH|CRITICAL|UNCLEAR>",'
            '"customer_context_notes":["<note>"],'
            '"agent_action_notes":["<note>"],'
            '"missing_information":["<item>"],'
            '"recommended_next_actions":["<action>"],'
            '"suggested_customer_message":"<message>",'
            '"reasoning_summary":"<summary>"}'
        )

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            my_result = leader_fn()
            leader_data = leaders_res.calldata
            return (
                my_result.get("recommended_route") == leader_data.get("recommended_route")
                and my_result.get("issue_classification") == leader_data.get("issue_classification")
                and my_result.get("risk_level") == leader_data.get("risk_level")
            )

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

        valid_classifications = ["REFUND_REQUEST", "BILLING_DISPUTE", "ACCOUNT_ACCESS", "DELIVERY_FAILURE", "TECHNICAL_FAILURE", "SERVICE_OUTAGE", "ABUSE_REPORT", "POLICY_EXCEPTION", "CLOSURE_REVIEW", "SLA_BREACH", "OTHER"]
        valid_routes = ["ESCALATE", "REFUND", "PARTIAL_REFUND", "CLOSE", "REQUEST_MORE_INFO", "HOLD_FOR_HUMAN", "POLICY_EXCEPTION"]
        valid_policy_matches = ["EXACT_MATCH", "PARTIAL_MATCH", "NO_MATCH", "CONFLICTING_POLICIES", "UNCLEAR"]
        valid_refund = ["SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED", "PENDING_MORE_INFO", "NOT_APPLICABLE"]
        valid_escalation = ["NO_ESCALATION", "TIER_2_REVIEW", "MANAGER_REVIEW", "TRUST_AND_SAFETY", "LEGAL_OR_COMPLIANCE"]
        valid_risk = ["LOW", "MEDIUM", "HIGH", "CRITICAL", "UNCLEAR"]

        if result.get("issue_classification") not in valid_classifications:
            raise VmUserError("Invalid issue_classification in result.")
        if result.get("recommended_route") not in valid_routes:
            raise VmUserError("Invalid recommended_route in result.")
        confidence = result.get("confidence", -1)
        if not isinstance(confidence, (int, float)) or confidence < 0 or confidence > 100:
            raise VmUserError("confidence must be 0-100.")
        if result.get("policy_match") not in valid_policy_matches:
            raise VmUserError("Invalid policy_match in result.")
        if result.get("refund_recommendation") not in valid_refund:
            raise VmUserError("Invalid refund_recommendation in result.")
        if result.get("escalation_level") not in valid_escalation:
            raise VmUserError("Invalid escalation_level in result.")
        if result.get("risk_level") not in valid_risk:
            raise VmUserError("Invalid risk_level in result.")
        if not isinstance(result.get("semantic_equivalence"), dict):
            raise VmUserError("semantic_equivalence must be an object.")
        if not isinstance(result.get("customer_context_notes"), list):
            raise VmUserError("customer_context_notes must be an array.")
        if not isinstance(result.get("missing_information"), list):
            raise VmUserError("missing_information must be an array.")
        if not result.get("reasoning_summary"):
            raise VmUserError("reasoning_summary must not be empty.")

        self.support_reviews[case_id] = json.dumps(result)
        case["status"] = "REVIEW_COMPLETE"
        self.cases[case_id] = json.dumps(case)
        self.review_count = u256(int(self.review_count) + 1)
        stats = json.loads(self.protocol_stats["global"])
        stats["total_reviews"] = int(stats.get("total_reviews", 0)) + 1
        self.protocol_stats["global"] = json.dumps(stats)

    @gl.public.write
    def review_reconsideration(self, reconsideration_id: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        sender = str(gl.message.sender_address)
        is_owner = gl.message.sender_address == self.owner
        reviewer_raw = self.reviewers.get(sender)
        is_reviewer = reviewer_raw is not None and json.loads(reviewer_raw).get("active", False)
        if not is_owner and not is_reviewer:
            raise VmUserError("Only authorised reviewers can trigger reconsideration.")
        recon_raw = self.reconsiderations.get(reconsideration_id)
        if recon_raw is None:
            raise VmUserError("Reconsideration not found.")

        recon = json.loads(recon_raw)
        case_id = recon.get("case_id", "")
        original_review_raw = self.support_reviews.get(case_id)
        original_review = json.loads(original_review_raw) if original_review_raw else {}

        prompt = (
            "You are reviewing a reconsideration request for a previously decided support case.\n\n"
            "Original decision: " + json.dumps(original_review) + "\n\n"
            "Reconsideration request: " + json.dumps(recon) + "\n\n"
            "Assess whether the original decision should be upheld, modified, or reversed based on the new evidence.\n"
            "Respond as JSON with the same fields as a standard review, plus:\n"
            '"reconsideration_outcome": "<UPHELD|MODIFIED|REVERSED>"'
        )

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            my_result = leader_fn()
            return my_result.get("reconsideration_outcome") == leaders_res.calldata.get("reconsideration_outcome")

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        self.reconsideration_reviews[reconsideration_id] = json.dumps(result)
        self.support_reviews[case_id] = json.dumps(result)

    @gl.public.write
    def assess_policy_equivalence(self, case_id: str, policy_id: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        if self.cases.get(case_id) is None:
            raise VmUserError("Case not found.")
        if self.policy_packets.get(policy_id) is None:
            raise VmUserError("Policy not found.")

        case = json.loads(self.cases[case_id])
        policy = json.loads(self.policy_packets[policy_id])

        prompt = (
            "Assess whether this support case is semantically equivalent to any rule in the policy.\n\n"
            "Case ticket: " + case.get("ticket_text", "") + "\n\n"
            "Policy: " + json.dumps(policy) + "\n\n"
            'Respond as JSON: {"matched_policy":"<rule name or none>","match_strength":"<STRONG|MODERATE|WEAK|NONE>","reason":"<explanation>"}'
        )

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            my_result = leader_fn()
            return my_result.get("match_strength") == leaders_res.calldata.get("match_strength")

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        existing_raw = self.support_reviews.get(case_id)
        existing = json.loads(existing_raw) if existing_raw else {}
        existing["semantic_equivalence"] = result
        self.support_reviews[case_id] = json.dumps(existing)

    @gl.public.write
    def assess_refund_reasonableness(self, case_id: str) -> None:
        if self.paused:
            raise VmUserError("Protocol is paused.")
        if self.cases.get(case_id) is None:
            raise VmUserError("Case not found.")

        case = json.loads(self.cases[case_id])
        context_raw = self.case_contexts.get(case_id)
        context = json.loads(context_raw) if context_raw else {}
        policy_id = case.get("policy_packet_id", "")
        policy_raw = self.policy_packets.get(policy_id) if policy_id else None
        policy = json.loads(policy_raw) if policy_raw else {}

        prompt = (
            "Assess whether a refund is reasonable for this support case.\n\n"
            "Ticket: " + case.get("ticket_text", "") + "\n"
            "Customer context: " + context.get("customer_context", "Not provided.") + "\n"
            "Refund policy: " + policy.get("refund_policy", "Not provided.") + "\n\n"
            'Respond as JSON: {"refund_recommendation":"<SUPPORTED|PARTIALLY_SUPPORTED|NOT_SUPPORTED|PENDING_MORE_INFO|NOT_APPLICABLE>","reasoning":"<explanation>"}'
        )

        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leaders_res) -> bool:
            if not isinstance(leaders_res, gl.vm.Return):
                return False
            my_result = leader_fn()
            return my_result.get("refund_recommendation") == leaders_res.calldata.get("refund_recommendation")

        result = gl.vm.run_nondet_unsafe(leader_fn, validator_fn)
        existing_raw = self.support_reviews.get(case_id)
        existing = json.loads(existing_raw) if existing_raw else {}
        existing["refund_recommendation"] = result.get("refund_recommendation", "PENDING_MORE_INFO")
        existing["refund_reasoning"] = result.get("reasoning", "")
        self.support_reviews[case_id] = json.dumps(existing)

    # ── View functions ────────────────────────────────────────────────

    @gl.public.view
    def get_case(self, case_id: str) -> str:
        result = self.cases.get(case_id)
        if result is None:
            return json.dumps({"error": "Case not found."})
        return result

    @gl.public.view
    def get_policy_packet(self, policy_id: str) -> str:
        result = self.policy_packets.get(policy_id)
        if result is None:
            return json.dumps({"error": "Policy not found."})
        return result

    @gl.public.view
    def get_case_context(self, case_id: str) -> str:
        result = self.case_contexts.get(case_id)
        if result is None:
            return json.dumps({"error": "Context not found."})
        return result

    @gl.public.view
    def get_support_review(self, case_id: str) -> str:
        result = self.support_reviews.get(case_id)
        if result is None:
            return json.dumps({"error": "Review not found."})
        return result

    @gl.public.view
    def get_reconsideration(self, reconsideration_id: str) -> str:
        result = self.reconsiderations.get(reconsideration_id)
        if result is None:
            return json.dumps({"error": "Reconsideration not found."})
        return result

    @gl.public.view
    def get_user_cases(self, user: Address) -> str:
        result = self.user_cases.get(str(user))
        return result if result else json.dumps([])

    @gl.public.view
    def get_protocol_stats(self) -> str:
        stats = self.protocol_stats.get("global")
        return stats if stats else json.dumps({})
