'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { ThesisIndex } from '@/components/ThesisIndex';
import { ThesisCard } from '@/components/ThesisCard';
import { ProgressionHistory } from '@/components/ProgressionHistory';
import { Footer } from '@/components/Footer';
import { ThesisModal } from '@/components/ThesisModal';
import { ClashModal } from '@/components/ClashModal';
import { ToastHost, dismissToast, pushToast } from '@/components/Toast';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState, DataErrorBoundary } from '@/components/ErrorState';
import { ThesisSkeleton } from '@/components/Skeleton';
import { useWallet } from '@/hooks/useWallet';
import { useContractData } from '@/hooks/useContractData';
import { useTransaction } from '@/hooks/useTransaction';
import {
  Arena,
  clashThesis,
  fetchArena,
  proposeThesis,
} from '@/lib/contract';

export default function Page() {
  const wallet = useWallet();
  const data = useContractData();
  const tx = useTransaction();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [clashOpen, setClashOpen] = useState(false);
  const [outcome, setOutcome] = useState<'OVERTHROW' | 'DEFEND' | null>(null);
  const [justChanged, setJustChanged] = useState(false);

  const lastSubmit = useRef<{ kind: 'propose' | 'clash'; topic?: string; claim?: string } | null>(
    null,
  );

  // Keep selection valid as arenas load and change.
  useEffect(() => {
    if (data.arenas.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !data.arenas.some((a) => a.id === selectedId)) {
      setSelectedId(data.arenas[0].id);
    }
  }, [data.arenas, selectedId]);

  const selected: Arena | null = useMemo(
    () => data.arenas.find((a) => a.id === selectedId) ?? null,
    [data.arenas, selectedId],
  );

  const ensureReady = useCallback((): boolean => {
    if (!wallet.address) {
      pushToast({ kind: 'info', title: 'Connect your wallet to propose or clash a thesis.' });
      wallet.connect();
      return false;
    }
    if (!wallet.onChain) {
      pushToast({
        kind: 'info',
        title: 'Switch to Bradbury Testnet',
        body: 'Your wallet is on a different network.',
      });
      return false;
    }
    return true;
  }, [wallet]);

  const openPropose = useCallback(() => {
    if (!ensureReady()) return;
    setProposeOpen(true);
  }, [ensureReady]);

  const openClash = useCallback(() => {
    if (!selected) return;
    if (!ensureReady()) return;
    tx.reset();
    setOutcome(null);
    setClashOpen(true);
  }, [ensureReady, selected, tx]);

  // ---- propose a new thesis ----
  const submitPropose = useCallback(
    (topic: string, openingClaim: string) => {
      if (!wallet.address) return;
      lastSubmit.current = { kind: 'propose', topic, claim: openingClaim };
      const loadingId = pushToast({ kind: 'loading', title: 'Submitting thesis proposal' });
      tx.run({
        account: wallet.address,
        send: (client) => proposeThesis(client, topic, openingClaim),
        onBusy: data.setBusy,
        onConfirmed: async (_status, _draft) => {
          dismissToast(loadingId);
          pushToast({
            kind: 'success',
            title: 'Thesis Proposed',
            body: 'Your debate thesis has been registered.',
            txHash: tx.state.hash ?? undefined,
          });
          await data.refresh();
        },
      });
    },
    [wallet.address, tx, data],
  );

  // close propose modal once confirmed
  useEffect(() => {
    if (proposeOpen && lastSubmit.current?.kind === 'propose') {
      if (tx.state.phase === 'confirmed') {
        setProposeOpen(false);
        tx.reset();
      }
    }
  }, [tx.state.phase, proposeOpen, tx]);

  // surface propose errors as toast
  useEffect(() => {
    if (lastSubmit.current?.kind === 'propose' && tx.state.phase === 'error') {
      pushToast({ kind: 'error', title: 'Could not propose thesis', body: tx.state.error ?? '' });
    }
  }, [tx.state.phase, tx.state.error]);

  // ---- clash an existing thesis ----
  const submitClash = useCallback(
    (contenderClaim: string) => {
      if (!wallet.address || !selected) return;
      lastSubmit.current = { kind: 'clash', claim: contenderClaim };
      const arenaId = selected.id;
      tx.run({
        account: wallet.address,
        send: (client) => clashThesis(client, arenaId, contenderClaim),
        onBusy: data.setBusy,
        onConfirmed: async () => {
          let result: 'OVERTHROW' | 'DEFEND' = 'DEFEND';
          try {
            const fresh = await fetchArena(arenaId);
            result = fresh.last_winner === 'OPPONENT' ? 'OVERTHROW' : 'DEFEND';
          } catch {
            result = 'DEFEND';
          }
          setOutcome(result);
          if (result === 'OVERTHROW') setJustChanged(true);
          pushToast({
            kind: 'success',
            title: result === 'OVERTHROW' ? 'Thesis Overthrown!' : 'Thesis Defended!',
            txHash: tx.state.hash ?? undefined,
          });
          await data.refresh();
        },
      });
    },
    [wallet.address, selected, tx, data],
  );

  const retryClash = useCallback(() => {
    const last = lastSubmit.current;
    if (last?.kind === 'clash' && last.claim) {
      tx.reset();
      setOutcome(null);
      submitClash(last.claim);
    }
  }, [submitClash, tx]);

  const closeClash = useCallback(() => {
    setClashOpen(false);
    tx.reset();
    setOutcome(null);
    setTimeout(() => setJustChanged(false), 1200);
  }, [tx]);

  const showSkeleton = data.loading && data.arenas.length === 0 && !data.error;

  return (
    <>
      <Header wallet={wallet} arena={selected} />

      <main className="shell" style={{ padding: '2rem 1.5rem 0' }}>
        {data.stale ? (
          <div
            className="badge badge-amber"
            style={{ marginBottom: '1rem' }}
            role="status"
          >
            Reconnecting to network...
          </div>
        ) : null}

        <DataErrorBoundary onRetry={data.refresh}>
          {data.error && data.arenas.length === 0 ? (
            <ErrorState message={data.error} onRetry={data.refresh} />
          ) : showSkeleton ? (
            <div className="layout-grid">
              <div className="academic-card" style={{ padding: '1rem', minHeight: 200 }} />
              <ThesisSkeleton />
            </div>
          ) : data.arenas.length === 0 ? (
            <EmptyState
              title="No Arenas Registered"
              body="Establish the first dialectic debate. Provide a topic title and a dominant opening thesis claim to begin."
              action={
                <button className="btn btn-primary" onClick={openPropose}>
                  Propose Initial Thesis
                </button>
              }
            />
          ) : (
            <div className="layout-grid">
              <aside>
                <ThesisIndex
                  arenas={data.arenas}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onPropose={openPropose}
                />
              </aside>
              <div style={{ display: 'grid', gap: '2.5rem', minWidth: 0 }}>
                {selected ? (
                  <>
                    <ThesisCard
                      arena={selected}
                      onClash={openClash}
                      onPropose={openPropose}
                      justChanged={justChanged}
                    />
                    <ProgressionHistory arena={selected} />
                  </>
                ) : null}
              </div>
            </div>
          )}
        </DataErrorBoundary>
      </main>

      <Footer />

      <ThesisModal
        open={proposeOpen}
        onClose={() => {
          if (tx.state.phase === 'wallet' || tx.state.phase === 'submitted') return;
          setProposeOpen(false);
        }}
        onSubmit={submitPropose}
        submitting={
          lastSubmit.current?.kind === 'propose' &&
          (tx.state.phase === 'wallet' ||
            tx.state.phase === 'submitted' ||
            tx.state.phase === 'consensus')
        }
      />

      <ClashModal
        open={clashOpen}
        onClose={closeClash}
        arena={selected}
        tx={tx.state}
        outcome={outcome}
        onSubmit={submitClash}
        onRetry={retryClash}
      />

      <ToastHost />
    </>
  );
}
