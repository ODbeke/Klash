'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Arena,
  fetchArenas,
  fetchLedger,
  fetchStats,
  LedgerEvent,
  Stats,
} from '@/lib/contract';

const POLL_MS = 95_000;

export interface ContractData {
  arenas: Arena[];
  ledger: LedgerEvent[];
  stats: Stats | null;
  loading: boolean;
  error: string | null;
  stale: boolean;
  refresh: () => Promise<void>;
  setBusy: (busy: boolean) => void;
}

function classifyError(e: unknown): string {
  const msg = String(e);
  if (/contract not found|execution reverted|no contract/i.test(msg)) {
    return 'No contract found at the configured address on Bradbury. The deployment may need repair.';
  }
  if (/rate limit|429|too many/i.test(msg)) {
    return 'The network is rate limiting reads. Retrying shortly.';
  }
  return 'Could not reach the contract. Check your connection and retry.';
}

export function useContractData(): ContractData {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [ledger, setLedger] = useState<LedgerEvent[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  const alive = useRef(true);
  const busy = useRef(false);
  const lastLoad = useRef<number>(0);

  const load = useCallback(async () => {
    try {
      const [ar, lg, st] = await Promise.all([fetchArenas(0), fetchLedger(0), fetchStats()]);
      if (!alive.current) return;
      setArenas(ar);
      setLedger(lg);
      setStats(st);
      setError(null);
      setStale(false);
      lastLoad.current = Date.now();
    } catch (e) {
      if (!alive.current) return;
      setError(classifyError(e));
    } finally {
      if (alive.current) setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading((prev) => prev || arenas.length === 0);
    await load();
  }, [load, arenas.length]);

  const setBusy = useCallback((b: boolean) => {
    busy.current = b;
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    const id = setInterval(() => {
      if (busy.current) return; // pause polling while a tx is in flight
      if (Date.now() - lastLoad.current > POLL_MS * 1.5) setStale(true);
      load();
    }, POLL_MS);
    return () => {
      alive.current = false;
      clearInterval(id);
    };
  }, [load]);

  return {
    arenas,
    ledger,
    stats,
    loading,
    error,
    stale,
    refresh,
    setBusy,
  };
}
