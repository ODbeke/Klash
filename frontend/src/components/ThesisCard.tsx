'use client';

import { motion } from 'framer-motion';
import { Check, Copy, Crown, Plus, Swords } from './icons';
import { Arena } from '@/lib/contract';
import { copyText, ordinal, shortAddr } from '@/lib/format';
import { useState } from 'react';

export interface ThesisCardProps {
  arena: Arena;
  onClash: () => void;
  onPropose: () => void;
  justChanged?: boolean;
}

function StatField({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ display: 'grid', gap: 2, minWidth: 80 }}>
      <span className="serif-header" style={{ fontSize: '1.75rem', color: 'var(--white-chalk)', fontWeight: 600 }}>
        {value}
      </span>
      <span className="uppercase-label" style={{ fontSize: '0.62rem' }}>{label}</span>
    </div>
  );
}

export function ThesisCard({ arena, onClash, onPropose, justChanged }: ThesisCardProps) {
  const [copied, setCopied] = useState(false);

  const onCopyProponent = async () => {
    const ok = await copyText(arena.proponent);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <section
      aria-label="Dominant thesis details"
      className="academic-card"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      <motion.div
        key={`${arena.id}-${arena.progression_index}`}
        initial={justChanged ? { opacity: 0, y: 16 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)', display: 'grid', gap: '1.25rem' }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <span className="uppercase-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--teal-glow)' }}>
            <Crown size={14} aria-hidden="true" />
            {arena.topic}
          </span>
          <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-faint)' }}>
            {arena.id}
          </span>
        </div>

        <div className="fine-rule" />

        <h2
          className="serif-header"
          style={{
            fontSize: 'clamp(1.5rem, 4vw, 2.4rem)',
            lineHeight: 1.25,
            color: 'var(--white-chalk)',
            fontWeight: 500,
            textShadow: '0 2px 8px rgba(0,0,0,0.2)',
          }}
        >
          {arena.claim}
        </h2>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--text-muted)',
            fontSize: '0.85rem',
          }}
        >
          <span>Dominant thesis proposed by</span>
          <span className="mono" style={{ color: 'var(--white-chalk)' }}>
            {shortAddr(arena.proponent)}
          </span>
          <button
            onClick={onCopyProponent}
            aria-label="Copy address"
            style={{ color: 'var(--teal-accent)', display: 'inline-flex' }}
          >
            {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 'clamp(1.2rem, 4vw, 3rem)',
            flexWrap: 'wrap',
            margin: '0.5rem 0',
          }}
        >
          <StatField label="Progression" value={ordinal(arena.progression_index)} />
          <StatField label="Defenses" value={arena.defenses} />
          <StatField label="Clashes" value={arena.clashes} />
          <StatField label="Archived Theses" value={arena.progression.length} />
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
          <motion.button
            className="btn btn-primary"
            onClick={onClash}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{ minHeight: 44, padding: '0 1.5rem', fontSize: '0.9rem' }}
          >
            <Swords size={16} aria-hidden="true" />
            Clash Thesis
          </motion.button>
          <button className="btn btn-secondary" onClick={onPropose} style={{ minHeight: 44 }}>
            <Plus size={16} aria-hidden="true" />
            New Topic
          </button>
        </div>

        {arena.last_winner ? (
          <div
            style={{
              paddingTop: '1.25rem',
              borderTop: '1px solid var(--border)',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              display: 'grid',
              gap: 4,
            }}
          >
            <span className="uppercase-label">Last Consensus Ruling</span>
            <p style={{ marginTop: 2, lineHeight: 1.5 }}>
              {arena.last_winner === 'OPPONENT'
                ? 'An opponent successfully toppled the thesis'
                : 'The proponent successfully defended the thesis'}
              {arena.last_margin ? `, margin ${arena.last_margin}` : ''}
              {arena.last_note ? `. "${arena.last_note}"` : '.'}
            </p>
          </div>
        ) : null}
      </motion.div>
    </section>
  );
}
