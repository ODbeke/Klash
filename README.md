# Klash

**A Decentralized AI Dialectic Coliseum on GenLayer.**

Klash is an on-chain debate arena built on GenLayer where ideas clash for logical dominance. Each arena is founded on a specific topic and features a single reigning claim (the **Thesis**) held by its proponent. Challengers formulate a logical refutation (the **Antithesis**), and an AI consensus arbiter judges the two head-to-head. The Thesis only falls and changes hands when the opposing Antithesis is ruled decisively stronger by validator consensus; otherwise, the incumbent Thesis holds. Every succession of ideas is recorded permanently in the topic's **Dialectical Progression Timeline** on-chain.

- Live dApp: https://madbenofficial.github.io/klash/
- Deployed Contract (Bradbury Testnet): `0x0000000000000000000000000000000000000000` (Placeholder - updated on deployment)

---

## Why GenLayer

Determining which of two competing arguments is logically superior is a subjective, language-level judgment. Traditionally, subjective arbitration on-chain has relied on expensive, slow crowdsourced oracle tribunals or centralized APIs prone to manipulation and prompt injections. 

Klash places subjective natural language evaluation under **decentralized validator consensus** in real-time. 

### Consensus Architecture & Stability
Subjective evaluation carries a major consensus risk: a naive "who wins?" query makes validators disagree on borderline decisions (near-ties), preventing transactions from settling. Klash mitigates this using two key layers:

1. **Incumbent Advantage Prompting:** The AI arbiter prompt enforces a strict rule: the reigning Thesis stands by default (`DEFEND`) unless the opposing Antithesis is *clearly* and decisively better reasoned. This forces borderline decisions away from the decision boundary and stabilizes consensus.
2. **Equivalence Principle with Tolerance:** The validator code executes a custom equivalence check via `gl.vm.run_nondet_unsafe`. It demands exact binary consensus on the verdict (`DEFEND` or `OVERTHROW`), but permits a tolerance threshold of up to **30 points** on the subjective margin score, preventing consensus splits due to minor non-deterministic numeric fluctuations.

```
                          GenLayer Testnet
+-----------------------------------------------------------------+
|  Klash (Intelligent Contract)                                   |
|   storage: arenas (TreeMap, each: dominant thesis + history),   |
|            arena_ids, ledger, counters                          |
|   propose_thesis()   -> deterministic write, registers topic    |
|   clash_thesis()     -> AI consensus write -> DEFEND/OVERTHROW  |
|   _duel()            -> leader_fn (exec_prompt) + validator_fn  |
|                         (verdict exact, margin tolerance <= 30) |
+-----------------------------------------------------------------+
                          ^ reads (paged, 95s poll)
                          | writes (genlayer-js)
+-----------------------------------------------------------------+
|  Frontend SPA (Next.js, Tailwind-Free Vanilla CSS):             |
|   Academic Research Terminal design system.                     |
|   Decodes leader receipts in real-time to show draft rulings.   |
+-----------------------------------------------------------------+
```

---

## Contract Methods

| Method | Type | Signature | Description |
| --- | --- | --- | --- |
| `propose_thesis` | write | `(topic, opening_claim) -> arena_id` | Deterministically establishes a new debate topic and its opening thesis. |
| `clash_thesis` | write (AI) | `(arena_id, contender_claim) -> void` | Runs validator-consensus evaluation, resulting in `DEFEND` or `OVERTHROW`. |
| `get_arenas` | view | `(start) -> list` | Retrieves a page of 20 arenas (newest first). |
| `get_arena` | view | `(arena_id) -> dict` | Returns details, counters, and the succession progression for a single topic. |
| `get_ledger` | view | `(start) -> list` | Retrieves a page of paged ledger events. |
| `get_stats` | view | `() -> { arenas, debates, overthrows }` | Returns global coliseum stats. |

---

## Frontend Technology Stack

* **Core:** Next.js 14 (App Router, static export), TypeScript, React.
* **Styling:** Tailwind-free vanilla CSS design system styled as an **Academic Research Terminal** (Deep slate, muted borders, serif typography, glowing teal and bronze status nodes).
* **Interactivity:** Framer Motion for spring card transitions, Lucide React icons.
* **Blockchain Connection:** `genlayer-js` client wrapper with built-in poll handlers.
* **Advanced Integration:** The frontend reads raw transaction progress states and base64-decodes the proposer receipt from the active leader block (`consensus_data.leader_receipt.eq_outputs`). This displays a live *Draft Arbiter Ruling* to users while validators are voting on-chain.

---

## Quick Start

### 1. Install & Lint Contract
```bash
pip install genvm-linter
genvm-lint contracts/klash.py
```

### 2. Run Consensus Integration Tests
```bash
gltest tests/integration/ -v -s --network studionet
```

### 3. Run Frontend Locally
```bash
cd frontend
npm install
npm run dev
```

---

## License

MIT.
