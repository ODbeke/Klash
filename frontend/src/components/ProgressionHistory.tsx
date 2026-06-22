'use client';

import { Arena, ProgressionEntry } from '@/lib/contract';
import { copyText, defenseWord, ordinal, shortAddr } from '@/lib/format';
import { useState } from 'react';
import { Check, Copy, Crown, Flame } from './icons';

interface TimelineItemProps {
  item: ProgressionEntry;
  isLast: boolean;
}

function TimelineItem({ item, isLast }: TimelineItemProps) {
  const [copiedProponent, setCopiedProponent] = useState(false);
  const [copiedOpponent, setCopiedOpponent] = useState(false);

  const onCopyProp = async () => {
    const ok = await copyText(item.proponent);
    if (ok) {
      setCopiedProponent(true);
      setTimeout(() => setCopiedProponent(false), 1500);
    }
  };

  const onCopyOpp = async () => {
    const ok = await copyText(item.toppled_by);
    if (ok) {
      setCopiedOpponent(true);
      setTimeout(() => setCopiedOpponent(false), 1500);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', position: 'relative' }}>
      {/* timeline line & node */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: 'var(--border-strong)',
            border: '2px solid var(--border)',
            zIndex: 2,
            marginTop: '0.4rem',
          }}
        />
        {!isLast ? (
          <div
            style={{
              width: 1,
              flex: 1,
              backgroundColor: 'var(--border)',
              margin: '0.4rem 0',
            }}
          />
        ) : null}
      </div>

      <div style={{ flex: 1, paddingBottom: isLast ? 0 : '1.5rem', display: 'grid', gap: 6 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span
            className="serif-header"
            style={{
              fontSize: '0.94rem',
              fontWeight: 600,
              color: 'var(--white-chalk)',
            }}
          >
            {ordinal(item.progression_index)} dominant thesis
          </span>
          <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-faint)' }}>
            Overthrown with margin {item.margin}
          </span>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
          "{item.claim}"
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
            fontSize: '0.74rem',
            color: 'var(--text-faint)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Proposed by:
            <span className="mono" style={{ color: 'var(--text-muted)' }}>{shortAddr(item.proponent)}</span>
            <button onClick={onCopyProp} aria-label="Copy proponent address" style={{ color: 'var(--teal-accent)' }}>
              {copiedProponent ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </span>

          <span>•</span>

          <span>{defenseWord(item.defenses)}</span>

          <span>•</span>

          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            Overthrown by:
            <span className="mono" style={{ color: 'var(--text-muted)' }}>{shortAddr(item.toppled_by)}</span>
            <button onClick={onCopyOpp} aria-label="Copy opponent address" style={{ color: 'var(--teal-accent)' }}>
              {copiedOpponent ? <Check size={11} /> : <Copy size={11} />}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProgressionHistory({ arena }: { arena: Arena }) {
  if (arena.progression.length === 0) {
    return (
      <div
        className="academic-card"
        style={{
          padding: '1.5rem',
          textAlign: 'center',
          color: 'var(--text-faint)',
          fontSize: '0.85rem',
        }}
      >
        <Crown size={22} style={{ marginBottom: 8, display: 'block', margin: '0 auto var(--border)' }} />
        <span>First thesis reign. No progression history.</span>
      </div>
    );
  }

  return (
    <div className="academic-card" style={{ padding: '1.5rem', display: 'grid', gap: '1rem' }}>
      <span className="uppercase-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <Flame size={14} color="var(--red-accent)" />
        Dialectical Progression Timeline
      </span>

      <div className="fine-rule" />

      <div style={{ display: 'grid', gap: 4, marginTop: '0.5rem' }}>
        {arena.progression.map((item, i) => (
          <TimelineItem
            key={`${item.progression_index}-${item.toppled_by}`}
            item={item}
            isLast={i === arena.progression.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
