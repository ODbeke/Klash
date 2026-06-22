# Klash

**A Decentralized AI Dialectic Coliseum on GenLayer.**

Klash is an on-chain debate arena built on GenLayer where ideas clash for logical dominance. Each arena is founded on a specific topic and features a single reigning claim (the **Thesis**) held by its proponent. Challengers formulate a logical refutation (the **Antithesis**), and an AI consensus arbiter judges the two head-to-head. The Thesis only falls and changes hands when the opposing Antithesis is ruled decisively stronger by validator consensus; otherwise, the incumbent Thesis holds. Every succession of ideas is recorded permanently in the topic's **Dialectical Progression Timeline** on-chain.

- Live dApp: https://klash-pied.vercel.app/
- Deployed Contract (StudioNet): [`0x35dE19f52D209A4D841BA15bbEBefABb5B058C96`](https://explorer-studio.genlayer.com/address/0x35dE19f52D209A4D841BA15bbEBefABb5B058C96)

---

## Why GenLayer

Determining which of two competing arguments is logically superior is a subjective, language-level judgment. Traditionally, subjective arbitration on-chain has relied on expensive, slow crowdsourced oracle tribunals or centralized APIs prone to manipulation and prompt injections. 

Klash places subjective natural language evaluation under **decentralized validator consensus** in real-time. 

### Consensus Architecture & Stability
Subjective evaluation carries a major consensus risk: a naive "who wins?" query makes validators disagree on borderline decisions (near-ties), preventing transactions from settling. Klash mitigates this using two key layers:

1. **Incumbent Advantage Prompting:** The AI arbiter prompt enforces a strict rule: the reigning Thesis stands by default (`DEFEND`) unless the opposing Antithesis is *clearly* and decisively better reasoned. This forces borderline decisions away from the decision boundary and stabilizes consensus.
2. **Equivalence Principle with Tolerance:** The validator code executes a custom equivalence check via `gl.vm.run_nondet_unsafe`. It demands exact binary consensus on the verdict (`DEFEND` or `OVERTHROW`), but permits a tolerance threshold of up to **30 points** on the subjective margin score, preventing consensus splits due to minor non-deterministic numeric fluctuations.

```mermaid
graph TD
    classDef frontend fill:#121824,stroke:#0d9488,stroke-width:1.5px,color:#f1f5f9;
    classDef contract fill:#0b0f19,stroke:#d97706,stroke-width:1.5px,color:#f1f5f9;
    classDef network fill:#1b2334,stroke:#475569,stroke-width:1px,color:#f1f5f9;

    subgraph FrontendApp ["Frontend Application (Vercel)"]
        UI["UI (Academic Terminal)"]:::frontend
        GL_JS["genlayer-js Clients"]:::frontend
    end

    subgraph GenLayer ["GenLayer Network (StudioNet)"]
        L_NODE["Leader Node"]:::network
        VAL_NODES["Validator Nodes"]:::network
        STATE["GenVM State Storage"]:::contract
    end

    UI -->|1. User refutation / new topic| GL_JS
    GL_JS -->|2. Writes transaction| L_NODE
    GL_JS -->|6. Paged state reads| STATE
    
    L_NODE -->|3. Proposes block| VAL_NODES
    
    subgraph Consensus ["Decentralized Consensus"]
        L_NODE -.->|Executes leader_fn| LLM_L[("LLM Duel Analysis")]
        VAL_NODES -.->|Executes validator_fn| LLM_V[("LLM Re-Analysis")]
        
        VAL_NODES -->|Verify: Verdict exact & Margin delta <= 30| L_NODE
    end
    
    L_NODE -->|4. Writes to state on consensus| STATE
    GL_JS -.->|5. Draft ruling peeking| L_NODE
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
