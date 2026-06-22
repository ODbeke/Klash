'use client';

import { useCallback, useRef, useState } from 'react';
import {
  LeaderDraft,
  makeWalletClient,
  pollUntilDecided,
  WalletClient,
} from '@/lib/contract';

export type TxPhase = 'idle' | 'wallet' | 'submitted' | 'consensus' | 'confirmed' | 'error';

export interface TxState {
  phase: TxPhase;
  hash: `0x${string}` | null;
  liveStatus: string;
  draft: LeaderDraft | null;
  error: string | null;
}

const INITIAL: TxState = {
  phase: 'idle',
  hash: null,
  liveStatus: '',
  draft: null,
  error: null,
};

function friendly(e: unknown): string {
  const msg = String((e as { message?: string })?.message ?? e);
  if (/LackOfFundForMaxFee|insufficient funds/i.test(msg)) {
    return 'Your wallet is below the fee reserve for AI transactions (mostly refunded). Top up at the faucet.';
  }
  if (/reject|denied|4001/i.test(msg)) return 'You cancelled the signature';
  if (/rate limit|429|too many/i.test(msg)) {
    return 'The network is congested. Your transaction may still be processing.';
  }
  if (/network|fetch|timeout/i.test(msg)) return 'Network error. Check your connection.';
  return 'The transaction failed. Please try again.';
}

export interface RunOptions {
  account: `0x${string}`;
  send: (client: WalletClient) => Promise<unknown>;
  onConfirmed?: (status: string, draft: LeaderDraft | null) => void;
  onBusy?: (busy: boolean) => void;
}

export function useTransaction() {
  const [state, setState] = useState<TxState>(INITIAL);
  const submitting = useRef(false);

  const reset = useCallback(() => setState(INITIAL), []);

  const run = useCallback(async (opts: RunOptions) => {
    if (submitting.current) return;
    submitting.current = true;
    opts.onBusy?.(true);
    setState({ ...INITIAL, phase: 'wallet' });
    try {
      const client = makeWalletClient(opts.account);
      const result = (await opts.send(client)) as `0x${string}`;
      const hash = result;
      setState((s) => ({ ...s, phase: 'submitted', hash }));

      setState((s) => ({ ...s, phase: 'consensus', liveStatus: 'PENDING' }));
      const { status, draft } = await pollUntilDecided(client, hash, (st, dr) => {
        setState((s) => ({ ...s, liveStatus: st, draft: dr }));
      });

      if (status === 'ACCEPTED' || status === 'FINALIZED') {
        setState((s) => ({ ...s, phase: 'confirmed', liveStatus: status, draft }));
        opts.onConfirmed?.(status, draft);
      } else if (status === 'UNDETERMINED') {
        setState((s) => ({
          ...s,
          phase: 'error',
          liveStatus: status,
          error: 'The arbiters could not reach consensus. Please try again.',
        }));
      } else {
        setState((s) => ({
          ...s,
          phase: 'error',
          liveStatus: status,
          error: 'The network is still processing. Check the explorer for the final ruling.',
        }));
      }
    } catch (e) {
      setState((s) => ({ ...s, phase: 'error', error: friendly(e) }));
    } finally {
      submitting.current = false;
      opts.onBusy?.(false);
    }
  }, []);

  return { state, run, reset };
}
