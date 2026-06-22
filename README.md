# Klash

**A Decentralized AI Dialectic Coliseum on GenLayer.**

Klash is an on-chain debate arena built on GenLayer where ideas clash for logical dominance. Each arena is founded on a specific topic and features a single reigning claim (the **Thesis**) held by its proponent. Challengers formulate a logical refutation (the **Antithesis**), and an AI consensus arbiter judges the two head-to-head. The Thesis only falls and changes hands when the opposing Antithesis is ruled decisively stronger by validator consensus; otherwise, the incumbent Thesis holds. Every succession of ideas is recorded permanently in the topic's **Dialectical Progression Timeline** on-chain.

- Live dApp: https://klash-pied.vercel.app/
- Deployed Contract (StudioNet): [`0x35dE19f52D209A4D841BA15bbEBefABb5B058C96`](https://explorer-studio.genlayer.com/address/0x35dE19f52D209A4D841BA15bbEBefABb5B058C96)

---

## Why GenLayer & Stack Integration

KLASH is designed to push the boundaries of what is possible on-chain by integrating directly with GenLayer's unique intelligent contract capabilities. Determining which of two competing arguments is logically superior is a subjective, language-level judgment. Traditionally, this required centralized APIs or slow, crowdsourced oracle tribunals. KLASH brings subjective natural language arbitration directly into the core consensus loop.

### 1. Intelligent Validator Consensus (GenVM)
At the heart of the system is a Python-based contract compiled for the **GenVM** environment. Rather than utilizing external web2 oracles, the contract executes natural language prompt duels natively inside validator nodes. When `clash_thesis` is invoked, GenLayer's leader node prompts its internal LLM to perform a deep semantic analysis between the incumbent thesis and the contender claim.

### 2. Multi-Agent Equivalence with Tolerance
Subjective language evaluation carries a high consensus risk: minor non-deterministic outputs from different LLM models can lead to consensus splits. KLASH solves this using a two-tier stabilization architecture:
* **Incumbent Advantage Prompting:** The arbiter prompt enforces a rule where the incumbent Thesis stands by default (`DEFEND`) unless the Antithesis is decisively stronger. This moves borderline decisions away from the decision boundary.
* **Equivalence-With-Tolerance Check:** The contract code leverages `gl.vm.run_nondet_unsafe` to collect LLM verdicts. The consensus logic demands an exact binary match on the categorical verdict (`DEFEND` vs `OVERTHROW`) but allows a numeric tolerance threshold of up to **30 points** on the subjective strength margin. This prevents minor numeric differences from splitting the validator consensus.

### 3. Pre-Consensus UX (Leader Receipt Peeking)
Waiting for full blockchain consensus on complex AI transactions can degrade user experience. KLASH bypasses this by implementing a **Leader Node Receipt Peeking** mechanism in the frontend:
* The dApp polls the leader node for the transaction progress in real-time.
* It base64-decodes the leader's execution receipt (`eq_outputs`) as soon as the leader finishes its run.
* This allows the UI to display a live *Draft Arbiter Ruling* to the challenger within seconds, while the validator nodes are still actively verifying and voting on-chain.

### 4. Custom Integration via genlayer-js
The client uses the `genlayer-js` SDK to interface with the GenLayer StudioNet. We built custom React hooks (`useWallet`, `useTransaction`, `useContractData`) to manage web3 wallets, watch state changes, and poll consensus stages.

```mermaid
graph TD
    classDef frontend fill:#121824,stroke:#4f46e5,stroke-width:1.5px,color:#f1f5f9;
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

## Intelligent Contract API

The **Klash** smart contract exposes two primary transaction types (write methods) to progress state through validator consensus, alongside read-only methods (view methods) to query the coliseum state.

### State-Mutating Transactions (Writes)

* **`propose_thesis(topic: str, opening_claim: str) -> int`**
  * *Execution:* Deterministic Write Transaction
  * *Description:* Deterministically establishes a new debate topic, setting the caller as the initial proponent and registering the opening thesis claim.
* **`clash_thesis(arena_id: int, contender_claim: str)`**
  * *Execution:* AI Consensus Write Transaction
  * *Description:* Triggers validator-consensus evaluation between the active thesis and the contender claim, returning either `DEFEND` or `OVERTHROW`.

### Read-Only Queries (Views)

* **`get_stats() -> dict`**
  * *Returns:* `{ arenas: int, debates: int, overthrows: int }`
  * *Description:* Returns global coliseum stats across all debate arenas.
* **`get_arena(arena_id: int) -> dict`**
  * *Returns:* Details, counters, and the succession progression for a single topic.
  * *Description:* Queries current state and progression timeline.
* **`get_arenas(start: int) -> list`**
  * *Returns:* A page of up to 20 debate arenas (ordered newest first).
  * *Description:* Queries active debate arenas.
* **`get_ledger(start: int) -> list`**
  * *Returns:* A page of paged ledger events.
  * *Description:* Queries historical event logs of transitions and overthrows.

---

## Frontend Technology Stack

* **Core:** Next.js 14 (App Router, static export), TypeScript, React.
* **Styling:** Tailwind-free vanilla CSS design system styled as an **Academic Research Terminal** with support for seamless dark/light (parchment) theme toggle, Recoleta & Russo One typography, and premium Indigo & Amber accents.
* **Interactivity:**
  * Framer Motion for spring card transitions and theme toggle spin/scale animations.
  * Lucide React icons.
  * A mouse-interactive spotlight radial glow background layered over a high-precision grid-plus pattern that dynamically adapts to the selected theme.
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
