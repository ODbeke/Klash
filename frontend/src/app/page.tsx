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
import { Crown, Shield, BookOpen, Flame, Copy, Check } from '@/components/icons';
import { copyText, ordinal, shortAddr } from '@/lib/format';

function StatCard({
  icon: Icon,
  label,
  value,
  description,
  actionButton,
  iconColor,
}: {
  icon: React.ComponentType<{ size?: number | string; color?: string; className?: string }>;
  label: string;
  value: React.ReactNode;
  description: string;
  actionButton?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div
      className="academic-card"
      style={{
        padding: '1.25rem',
        display: 'grid',
        gap: '0.5rem',
        backgroundColor: 'var(--surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span className="uppercase-label" style={{ fontSize: '0.62rem', letterSpacing: '0.12em' }}>
          {label}
        </span>
        <Icon size={16} color={iconColor} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
        <span className="serif-header" style={{ fontSize: '1.35rem', fontWeight: 600, color: 'var(--white-chalk)', lineHeight: 1.1 }}>
          {value}
        </span>
        {actionButton}
      </div>
      <p style={{ fontSize: '0.74rem', color: 'var(--text-faint)', lineHeight: 1.4 }}>
        {description}
      </p>
    </div>
  );
}

export default function Page() {
  const wallet = useWallet();
  const data = useContractData();
  const tx = useTransaction();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposeOpen, setProposeOpen] = useState(false);
  const [clashOpen, setClashOpen] = useState(false);
  const [outcome, setOutcome] = useState<'OVERTHROW' | 'DEFEND' | null>(null);
  const [justChanged, setJustChanged] = useState(false);
  const [proponentCopied, setProponentCopied] = useState(false);

  const handleCopyProponent = useCallback(async (address: string) => {
    const ok = await copyText(address);
    if (ok) {
      setProponentCopied(true);
      setTimeout(() => setProponentCopied(false), 1500);
    }
  }, []);

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
            <div className="layout-grid-three">
              <div className="academic-card" style={{ padding: '1rem', minHeight: 200 }} />
              <ThesisSkeleton />
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                <div className="academic-card" style={{ height: 100 }} />
                <div className="academic-card" style={{ height: 100 }} />
                <div className="academic-card" style={{ height: 100 }} />
                <div className="academic-card" style={{ height: 100 }} />
              </div>
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
            <div className="layout-grid-three">
              <aside>
                <ThesisIndex
                  arenas={data.arenas}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                  onPropose={openPropose}
                />
              </aside>
              <div style={{ display: 'grid', gap: '2rem', minWidth: 0 }}>
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
              <aside className="right-column" style={{ display: 'grid', gap: '1.25rem', height: 'fit-content' }}>
                {selected ? (
                  <>
                    <StatCard
                      icon={Crown}
                      iconColor="var(--amber-glow)"
                      label="Proponent"
                      value={shortAddr(selected.proponent)}
                      description="The reigning proponent address who currently holds the coliseum debate throne."
                      actionButton={
                        <button
                          onClick={() => handleCopyProponent(selected.proponent)}
                          aria-label="Copy proponent address"
                          style={{
                            color: 'var(--teal-accent)',
                            display: 'inline-flex',
                            cursor: 'pointer',
                            marginLeft: 4,
                          }}
                        >
                          {proponentCopied ? (
                            <Check size={14} aria-hidden="true" />
                          ) : (
                            <Copy size={14} aria-hidden="true" />
                          )}
                        </button>
                      }
                    />
                    <StatCard
                      icon={Shield}
                      iconColor="var(--teal-glow)"
                      label="Defended"
                      value={`${selected.defenses} Defenses`}
                      description="Number of times this proponent successfully defended their reigning thesis."
                    />
                    <StatCard
                      icon={BookOpen}
                      label="Progression"
                      value={`${ordinal(selected.progression_index)} Stage`}
                      description="The generational evolution stage of arguments within this coliseum topic."
                    />
                    <StatCard
                      icon={Flame}
                      iconColor="var(--red-accent)"
                      label="Overthrown"
                      value={`${selected.progression.length} Overthrown`}
                      description="Total count of previous proponents successfully usurped in this arena."
                    />
                  </>
                ) : (
                  <div className="academic-card" style={{ padding: '1.25rem', color: 'var(--text-faint)', textAlign: 'center' }}>
                    No topic selected. Choose a thesis from the directory to inspect its live status.
                  </div>
                )}
              </aside>
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
