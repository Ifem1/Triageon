# Triageon

**Hard support cases need better judgement.**

Triageon is an on-chain support escalation judge built on [GenLayer](https://genlayer.com). It routes difficult customer support cases through distributed AI validators that read your policy, interpret ticket context, and reach consensus on the right action — all verifiable on-chain.

🔗 **Live app:** [triageon.vercel.app](https://triageon.vercel.app)

---

## What it does

When a support case is too complex for a simple rule, Triageon:

1. Accepts the ticket, customer context, chat history, and policy packet
2. Submits the case to GenLayer's validator network for AI consensus
3. Returns a structured verdict — route, refund recommendation, escalation level, risk, and reasoning
4. Records everything on-chain for auditability

Support teams get a consistent, explainable decision on every hard case. No black box, no single model opinion — a consensus across multiple independent validators.

---

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript |
| Auth | Privy v3 (wallet + social login) |
| Smart contract | Python on GenLayer (intelligent contract) |
| Consensus | GenLayer Studionet — 5 validator nodes |
| Deployment | Vercel |

---

## Contract

The `TriageonJudge` contract lives on GenLayer Studionet:

```
0xdBD61DD0c7CB54daB6355D4A33FA2daB26579611
```

Key functions:

| Function | Type | Description |
|---|---|---|
| `create_policy_packet` | write | Register a support policy |
| `open_case` | write | Submit a new support ticket |
| `attach_case_context` | write | Add chat history and agent notes |
| `mark_ready_for_review` | write | Queue the case for consensus |
| `review_support_case` | write (nondet) | Trigger AI validator consensus |
| `assess_policy_equivalence` | write (nondet) | Check how well a case maps to policy |
| `assess_refund_reasonableness` | write (nondet) | Standalone refund assessment |
| `open_reconsideration` | write | Submit new evidence for review |
| `review_reconsideration` | write (nondet) | Re-evaluate with new evidence |
| `finalize_case` | write | Record the final action taken |
| `get_case` / `get_support_review` | view | Read case and verdict data |

---

## Running locally

```bash
npm install
npm run dev
```

Create a `.env.local` file:

```env
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_secret
NEXT_PUBLIC_GENLAYER_CONTRACT_ADDRESS=0xdBD61DD0c7CB54daB6355D4A33FA2daB26579611
NEXT_PUBLIC_GENLAYER_CHAIN_ID=61999
NEXT_PUBLIC_GENLAYER_RPC_URL=https://studio.genlayer.com/api
```

---

## Testing

End-to-end tests run against the live contract on GenLayer Studionet.

```bash
# Set the 7 required wallet env vars, then:
node tests/test-all.mjs

# Run specific suites only:
node tests/test-all.mjs suite1 suite3
```

Test coverage:

- **Suite 1** — happy path: policy create, case open, context attach, review, finalize, reconsideration
- **Suite 2** — revert paths: all validation errors, access control, paused protocol
- **Suite 3** — non-deterministic: AI consensus on real support scenarios (refund edge cases, SLA breach, policy equivalence, reconsideration reversal)

---

## Who it's for

- **Support teams** handling escalations that require policy interpretation
- **Platforms** that want an auditable, on-chain record of every escalation decision
- **Builders** exploring GenLayer's intelligent contract model for real-world use cases
