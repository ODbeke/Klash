'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { FormEvent, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Arena, LeaderDraft } from '@/lib/contract';
import { TxPhase, TxState } from '@/hooks/useTransaction';
import { AlertTriangle, BookOpen, Crown, Loader2, Shield, Swords } from './icons';

export interface ClashModalProps {
  open: boolean;
  onClose: () => void;
  arena: Arena | null;
  tx: TxState;
  outcome: 'OVERTHROW' | 'DEFEND' | null;
  onSubmit: (opponentClaim: string) => void;
  onRetry: () => void;
}

const STEPS = [
  { key: 'PROPOSING', label: 'Proposing' },
  { key: 'COMMITTING', label: 'Committing' },
  { key: 'REVEALING', label: 'Revealing' },
  { key: 'ACCEPTED', label: 'Ruled' },
];

function stepIndex(status: string): number {
  switch (status) {
    case 'PENDING':
    case 'PROPOSING':
      return 0;
    case 'COMMITTING':
      return 1;
    case 'REVEALING':
      return 2;
    case 'ACCEPTED':
    case 'FINALIZED':
      return 3;
    default:
      return 0;
  }
}

function Slab({
  side,
  claim,
  winner,
}: {
  side: 'proponent' | 'opponent';
  claim: string;
  winner: boolean | null;
}) {
  const isProp = side === 'proponent';
  const dim = winner === false;
  return (
    <motion.div
      animate={{
        opacity: dim ? 0.45 : 1,
        scale: winner ? 1.01 : 1,
        borderColor: winner ? 'var(--teal-accent)' : 'var(--border)',
      }}
      className="academic-card"
      style={{
        flex: 1,
        minWidth: 0,
        padding: '1rem',
        display: 'grid',
        gap: 6,
        alignContent: 'start',
        backgroundColor: 'rgba(0,0,0,0.1)',
      }}
    >
      <span
        className="badge"
        style={{
          color: isProp ? 'var(--amber-glow)' : 'var(--teal-glow)',
          borderColor: isProp ? 'rgba(245,158,11,0.2)' : 'rgba(20,184,166,0.2)',
          width: 'fit-content',
        }}
      >
        {isProp ? <Crown size={11} aria-hidden="true" /> : <Swords size={11} aria-hidden="true" />}
        {isProp ? 'Thesis Proponent' : 'Antithesis Opponent'}
      </span>
      <p style={{ fontSize: '0.85rem', color: 'var(--white-chalk)', lineHeight: 1.4 }}>{claim}</p>
    </motion.div>
  );
}

export function ClashModal({
  open,
  onClose,
  arena,
  tx,
  outcome,
  onSubmit,
  onRetry,
}: ClashModalProps) {
  const [claim, setClaim] = useState('');

  useEffect(() => {
    if (open && tx.phase === 'idle') {
      setClaim('');
    }
  }, [open, tx.phase]);

  if (!arena) return null;

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (claim.trim().length >= 10) {
      onSubmit(claim.trim());
    }
  };

  const valid = claim.trim().length >= 10;
  const inProgress =
    tx.phase === 'wallet' || tx.phase === 'submitted' || tx.phase === 'consensus';
  const settled = tx.phase === 'confirmed' && outcome !== null;

  const idx = stepIndex(tx.liveStatus);
  const isTimeout = tx.liveStatus === 'LEADER_TIMEOUT' || tx.liveStatus === 'VALIDATORS_TIMEOUT';
  const proponentWon = settled ? outcome === 'DEFEND' : null;
  const opponentWon = settled ? outcome === 'OVERTHROW' : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Clash Thesis: ${arena.topic}`}
      eyebrow="Consensus Dialectic"
      closeable={!inProgress}
    >
      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {/* Opposing claims stage (visible only when processing or settled) */}
        {(inProgress || settled) ? (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', position: 'relative' }}>
            <Slab side="proponent" claim={arena.claim} winner={proponentWon} />
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-faint)',
              }}
              aria-hidden="true"
            >
              <Swords size={18} />
            </div>
            <Slab side="opponent" claim={claim || '...'} winner={opponentWon} />
          </div>
        ) : null}

        {/* Input Form */}
        {tx.phase === 'idle' ? (
          <form onSubmit={onFormSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
            <div
              className="academic-card"
              style={{ padding: '0.85rem 1rem', display: 'grid', gap: 4, backgroundColor: 'rgba(0,0,0,0.15)' }}
            >
              <span className="uppercase-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--amber-glow)' }}>
                <Crown size={12} /> Current Dominant Thesis
              </span>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                "{arena.claim}"
              </p>
            </div>

            <div style={{ display: 'grid', gap: '0.4rem' }}>
              <label htmlFor="refutation-input" className="uppercase-label">
                Your Opposing Antithesis
              </label>
              <textarea
                id="refutation-input"
                rows={4}
                className="input-field"
                placeholder="Formulate your logical refutation. The consensus arbiters will evaluate claims head-to-head based on reasoning and evidence..."
                value={claim}
                onChange={(e) => setClaim(e.target.value)}
                maxLength={500}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                <span>Min 10 chars</span>
                <span>{claim.length}/500 chars</span>
              </div>
            </div>

            <div className="fine-rule" />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!valid} style={{ minWidth: 140 }}>
                <Swords size={15} />
                Clash Thesis
              </button>
            </div>
          </form>
        ) : null}

        {/* Polling / Consensus Progress */}
        {inProgress && tx.phase !== 'wallet' ? (
          <div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {STEPS.map((s, i) => (
                <div key={s.key} style={{ flex: 1, display: 'grid', gap: 4 }}>
                  <div
                    style={{
                      height: 3,
                      borderRadius: 1.5,
                      background: i <= idx ? 'var(--teal-accent)' : 'var(--border)',
                      transition: 'background 0.4s ease',
                    }}
                  />
                  <span
                    className="uppercase-label"
                    style={{
                      fontSize: '0.55rem',
                      color: i <= idx ? 'var(--teal-glow)' : 'var(--text-faint)',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-muted)',
                fontSize: '0.84rem',
                marginTop: 4,
              }}
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, ease: 'linear', duration: 1.2 }}
                style={{ display: 'inline-flex', color: 'var(--teal-glow)' }}
              >
                <Loader2 size={15} aria-hidden="true" />
              </motion.span>
              {isTimeout
                ? 'Arbiters deliberating, rotating consensus leader...'
                : 'Arbiters weighing claims under decentralized consensus...'}
            </div>

            {/* Leader Draft Peek */}
            <AnimatePresence>
              {tx.draft ? (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="academic-card"
                  style={{
                    padding: '0.75rem 1rem',
                    borderColor: 'var(--border-strong)',
                    display: 'grid',
                    gap: 4,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="uppercase-label" style={{ color: 'var(--amber-glow)' }}>
                      Arbiter Draft
                    </span>
                    <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--white-chalk)', fontWeight: 600 }}>
                      {tx.draft.verdict}
                      {typeof tx.draft.margin === 'number' ? ` (margin ${tx.draft.margin})` : ''}
                    </span>
                  </div>
                  {tx.draft.note ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                      "{tx.draft.note}"
                    </p>
                  ) : null}
                  <span style={{ color: 'var(--text-faint)', fontSize: '0.7rem' }}>
                    Draft results proposed by leader while validators deliberating.
                  </span>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}

        {/* Signing in Wallet */}
        {tx.phase === 'wallet' ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '2rem 1rem',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite', color: 'var(--teal-glow)' }} />
            <span>Approve the transaction in your wallet...</span>
          </div>
        ) : null}

        {/* Consensus Settled */}
        {settled ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'grid', justifyItems: 'center', gap: '0.85rem', textAlign: 'center', marginTop: '0.5rem' }}
          >
            {outcome === 'OVERTHROW' ? (
              <>
                <span className="stamp stamp-overthrown">Overthrown</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 400 }}>
                  The opponent's antithesis successfully defeated the thesis. The progression index increases.
                </p>
              </>
            ) : (
              <>
                <span className="stamp stamp-defended">Defended</span>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 400 }}>
                  The proponent successfully defended the thesis. The claim stands.
                </p>
              </>
            )}

            {tx.draft?.note ? (
              <div
                className="academic-card"
                style={{
                  padding: '0.75rem 1rem',
                  fontSize: '0.82rem',
                  maxWidth: 440,
                  lineHeight: 1.45,
                  textAlign: 'left',
                  marginTop: 6,
                  color: 'var(--text-muted)',
                  borderLeft: '3px solid var(--border-strong)',
                }}
              >
                "{tx.draft.note}"
              </div>
            ) : null}

            <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '0.75rem', minWidth: 150 }}>
              Return to Coliseum
            </button>
          </motion.div>
        ) : null}

        {/* Error State */}
        {tx.phase === 'error' ? (
          <div
            className="academic-card"
            role="alert"
            style={{
              padding: '1.25rem',
              borderColor: 'rgba(225,29,72,0.3)',
              display: 'grid',
              gap: 12,
              justifyItems: 'center',
              textAlign: 'center',
              backgroundColor: 'rgba(225,29,72,0.02)',
            }}
          >
            <span style={{ color: 'var(--red-accent)' }}>
              <AlertTriangle size={24} aria-hidden="true" />
            </span>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.4, maxWidth: 400 }}>
              {tx.error}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', marginTop: 4 }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={onRetry}>
                <Shield size={14} aria-hidden="true" />
                Retry Clash
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
