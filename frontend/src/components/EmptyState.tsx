import { ReactNode } from 'react';
import { BookOpen } from './icons';

export interface EmptyStateProps {
  title: string;
  body: string;
  action: ReactNode;
}

export function EmptyState({ title, body, action }: EmptyStateProps) {
  return (
    <div
      className="academic-card"
      style={{
        padding: '3rem 2rem',
        display: 'grid',
        justifyItems: 'center',
        textAlign: 'center',
        gap: '1rem',
        maxWidth: 540,
        margin: '3rem auto',
      }}
    >
      <div
        style={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: 'rgba(20, 184, 166, 0.08)',
          color: 'var(--teal-glow)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <BookOpen size={24} />
      </div>
      <h3 className="serif-header" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, maxWidth: 360 }}>
        {body}
      </p>
      <div style={{ marginTop: '0.5rem' }}>{action}</div>
    </div>
  );
}
