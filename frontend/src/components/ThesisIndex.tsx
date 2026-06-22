'use client';

import { useState } from 'react';
import { Arena } from '@/lib/contract';
import { BookOpen, Plus, Swords } from './icons';

export interface ThesisIndexProps {
  arenas: Arena[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onPropose: () => void;
}

export function ThesisIndex({ arenas, selectedId, onSelect, onPropose }: ThesisIndexProps) {
  const [search, setSearch] = useState('');

  const filtered = arenas.filter(
    (a) =>
      a.topic.toLowerCase().includes(search.toLowerCase()) ||
      a.claim.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="academic-card"
      style={{
        padding: '1.25rem',
        display: 'grid',
        gap: '1rem',
        alignContent: 'start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span className="uppercase-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <BookOpen size={13} />
          Thesis Directory
        </span>
        <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-faint)' }}>
          {arenas.length} active
        </span>
      </div>

      <button className="btn btn-primary" onClick={onPropose} style={{ width: '100%' }}>
        <Plus size={16} />
        Propose Thesis
      </button>

      <input
        type="search"
        placeholder="Filter by topic or claim..."
        className="input-field"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ fontSize: '0.82rem', padding: '0.5rem 0.75rem', minHeight: 36 }}
      />

      <div
        className="scrollbar"
        style={{
          display: 'grid',
          gap: '0.5rem',
          maxHeight: '440px',
          overflowY: 'auto',
          paddingRight: '4px',
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.85rem' }}>
            No matching items.
          </div>
        ) : (
          filtered.map((a) => {
            const isSelected = a.id === selectedId;
            return (
              <button
                key={a.id}
                onClick={() => onSelect(a.id)}
                aria-current={isSelected ? 'true' : undefined}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.75rem 0.85rem',
                  borderRadius: 'var(--radius)',
                  border: '1px solid',
                  borderColor: isSelected ? 'var(--teal-accent)' : 'var(--border)',
                  backgroundColor: isSelected ? 'var(--surface-hover)' : 'rgba(0,0,0,0.1)',
                  transition: 'all 0.15s ease',
                  display: 'grid',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      fontSize: '0.84rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--white-chalk)' : 'var(--text-muted)',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      maxWidth: '170px',
                    }}
                  >
                    {a.topic}
                  </span>
                  <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--text-faint)' }}>
                    {a.id}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Swords size={11} /> {a.clashes} clashes
                  </span>
                  <span>{a.progression_index} edits</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
