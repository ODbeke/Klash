import { createClient } from 'genlayer-js';
import { testnetBradbury } from 'genlayer-js/chains';

// Klash contract on GenLayer Bradbury Testnet (account ODbeke).
export const CONTRACT_ADDRESS =
  '0x35dE19f52D209A4D841BA15bbEBefABb5B058C96' as `0x${string}`;
export const DEPLOY_TX = '';

export const EXPLORER = 'https://explorer-bradbury.genlayer.com';
export const FAUCET = 'https://testnet-faucet.genlayer.foundation/';
export const DOCS = 'https://docs.genlayer.com';

export const readClient = createClient({ chain: testnetBradbury });

export const makeWalletClient = (account: `0x${string}`) =>
  createClient({ chain: testnetBradbury, account });

export type WalletClient = ReturnType<typeof makeWalletClient>;

// ---- shapes returned by the contract views -----------------------------

export type LastWinner = 'PROPONENT' | 'OPPONENT' | '' | string;
export type DuelResult = 'OVERTHROW' | 'DEFEND' | string;

export interface ProgressionEntry {
  proponent: string;
  claim: string;
  defenses: number;
  progression_index: number;
  toppled_by: string;
  margin: number;
}

export interface Arena {
  id: string;
  topic: string;
  proponent: string;
  claim: string;
  founder: string;
  progression_index: number;
  defenses: number;
  clashes: number;
  last_winner: LastWinner;
  last_margin: number;
  last_note: string;
  progression: ProgressionEntry[];
}

export interface LedgerEvent {
  arena: string;
  topic: string;
  opponent: string;
  result: DuelResult;
  margin: number;
  note: string;
  proponent: string;
}

export interface Stats {
  arenas: number;
  debates: number;
  overthrows: number;
}

// ---- normalization (Map -> object, bigint -> string) --------------------

function toRecord<T>(value: unknown): T {
  if (value instanceof Map) {
    const obj: Record<string, unknown> = {};
    for (const [k, v] of value.entries()) obj[String(k)] = normalize(v);
    return obj as T;
  }
  return value as T;
}

function normalize(value: unknown): unknown {
  if (value instanceof Map) return toRecord(value);
  if (Array.isArray(value)) return value.map(normalize);
  if (typeof value === 'bigint') return value.toString();
  return value;
}

function num(v: unknown): number {
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(String(v ?? '0'));
  return Number.isFinite(n) ? n : 0;
}

function asProgressionEntry(raw: unknown): ProgressionEntry {
  const r = toRecord<Record<string, unknown>>(raw);
  return {
    proponent: String(r.proponent ?? ''),
    claim: String(r.claim ?? ''),
    defenses: num(r.defenses),
    progression_index: num(r.progression_index),
    toppled_by: String(r.toppled_by ?? ''),
    margin: num(r.margin),
  };
}

function asArena(raw: unknown): Arena {
  const r = toRecord<Record<string, unknown>>(raw);
  const progressionRaw = normalize(r.progression);
  const progression = Array.isArray(progressionRaw) ? progressionRaw.map(asProgressionEntry) : [];
  return {
    id: String(r.id ?? ''),
    topic: String(r.topic ?? ''),
    proponent: String(r.proponent ?? r.holder ?? ''),
    claim: String(r.claim ?? ''),
    founder: String(r.founder ?? ''),
    progression_index: num(r.progression_index ?? r.reign_index),
    defenses: num(r.defenses),
    clashes: num(r.clashes ?? r.challenges),
    last_winner: String(r.last_winner ?? ''),
    last_margin: num(r.last_margin),
    last_note: String(r.last_note ?? ''),
    progression,
  };
}

function asLedgerEvent(raw: unknown): LedgerEvent {
  const r = toRecord<Record<string, unknown>>(raw);
  return {
    arena: String(r.arena ?? ''),
    topic: String(r.topic ?? ''),
    opponent: String(r.opponent ?? r.challenger ?? ''),
    result: String(r.result ?? ''),
    margin: num(r.margin),
    note: String(r.note ?? ''),
    proponent: String(r.proponent ?? r.holder ?? ''),
  };
}

// ---- resilient reads ----------------------------------------------------

export async function withRpcRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!/rate limit|429|timeout|network|fetch|too many/i.test(String(e))) throw e;
      await new Promise((r) => setTimeout(r, 2500 * 2 ** i));
    }
  }
  throw last;
}

export async function fetchArenas(start = 0): Promise<Arena[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_arenas',
      args: [start],
    }),
  );
  const arr = (normalize(raw) as unknown[]) ?? [];
  return arr.map(asArena);
}

export async function fetchArena(id: string): Promise<Arena> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_arena',
      args: [id],
    }),
  );
  return asArena(normalize(raw));
}

export async function fetchLedger(start = 0): Promise<LedgerEvent[]> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_ledger',
      args: [start],
    }),
  );
  const arr = (normalize(raw) as unknown[]) ?? [];
  return arr.map(asLedgerEvent);
}

export async function fetchStats(): Promise<Stats> {
  const raw = await withRpcRetry(() =>
    readClient.readContract({
      address: CONTRACT_ADDRESS,
      functionName: 'get_stats',
      args: [],
    }),
  );
  const r = toRecord<Record<string, unknown>>(normalize(raw));
  return {
    arenas: num(r.arenas),
    debates: num(r.debates ?? r.challenges),
    overthrows: num(r.overthrows ?? r.usurps),
  };
}

// ---- writes -------------------------------------------------------------

export function proposeThesis(client: WalletClient, topic: string, openingClaim: string) {
  return client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'propose_thesis',
    args: [topic, openingClaim],
    value: 0n,
  });
}

export function clashThesis(
  client: WalletClient,
  arenaId: string,
  contenderClaim: string,
) {
  return client.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: 'clash_thesis',
    args: [arenaId, contenderClaim],
    value: 0n,
  });
}

// ---- transaction polling ------------------------------------------------

const STATUS_NAME: Record<string, string> = {
  '1': 'PENDING',
  '2': 'PROPOSING',
  '3': 'COMMITTING',
  '4': 'REVEALING',
  '5': 'ACCEPTED',
  '6': 'UNDETERMINED',
  '7': 'FINALIZED',
  '8': 'CANCELED',
  '12': 'VALIDATORS_TIMEOUT',
  '13': 'LEADER_TIMEOUT',
};

export const statusName = (s: unknown): string =>
  STATUS_NAME[String(s)] ?? String(s ?? 'PENDING').toUpperCase();

const TERMINAL = new Set(['ACCEPTED', 'FINALIZED', 'UNDETERMINED', 'CANCELED']);

export interface LeaderDraft {
  verdict: string;
  margin?: number;
  note?: string;
}

function pick(obj: unknown, key: string): unknown {
  if (obj instanceof Map) return obj.get(key);
  if (obj && typeof obj === 'object') return (obj as Record<string, unknown>)[key];
  return undefined;
}

function parseDraft(value: unknown): LeaderDraft | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (!('verdict' in v)) return null;
  return {
    verdict: String(v.verdict ?? '').toUpperCase(),
    margin: 'margin' in v ? num(v.margin) : undefined,
    note: 'note' in v ? String(v.note ?? '') : undefined,
  };
}

function scanForDraft(text: string): LeaderDraft | null {
  for (let i = text.length - 1; i >= 0; i--) {
    if (text[i] !== '{') continue;
    try {
      const obj = JSON.parse(text.slice(i));
      const draft = parseDraft(obj);
      if (draft) return draft;
    } catch {
      /* keep scanning */
    }
  }
  return null;
}

export function extractLeaderDraft(tx: unknown): LeaderDraft | null {
  try {
    const receipts = pick(pick(tx, 'consensus_data'), 'leader_receipt');
    const first = Array.isArray(receipts) ? receipts[0] : receipts;
    const payload = pick(pick(first, 'eq_outputs'), '0');
    if (payload == null) return null;

    if (typeof payload === 'object') {
      const readable = pick(payload, 'readable') ?? pick(payload, 'payload');
      if (typeof readable === 'string') {
        try {
          const direct = parseDraft(JSON.parse(readable));
          if (direct) return direct;
        } catch {
          /* fall through to scan */
        }
        const scanned = scanForDraft(readable);
        if (scanned) return scanned;
      }
      const inline = parseDraft(payload);
      if (inline) return inline;
      return null;
    }

    if (typeof payload === 'string' && payload.length > 0) {
      let text = payload;
      try {
        text = atob(payload);
      } catch {
        /* not base64, use raw */
      }
      return scanForDraft(text);
    }
    return null;
  } catch {
    return null;
  }
}

export async function pollUntilDecided(
  client: WalletClient,
  hash: `0x${string}`,
  onUpdate?: (status: string, draft: LeaderDraft | null) => void,
): Promise<{ status: string; draft: LeaderDraft | null }> {
  let draft: LeaderDraft | null = null;
  for (let i = 0; i < 150; i++) {
    const tx = await client
      .getTransaction({ hash } as Parameters<typeof client.getTransaction>[0])
      .catch(() => null);
    const status = statusName(tx ? (tx as { status?: unknown }).status : 'PENDING');
    draft = extractLeaderDraft(tx) ?? draft;
    onUpdate?.(status, draft);
    if (TERMINAL.has(status)) return { status, draft };
    await new Promise((r) => setTimeout(r, 8000));
  }
  return { status: 'TIMEOUT', draft };
}
