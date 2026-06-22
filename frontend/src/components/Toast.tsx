'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, ExternalLink, Loader2, X } from './icons';
import { EXPLORER } from '@/lib/contract';

export type ToastKind = 'loading' | 'success' | 'error' | 'info';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
  txHash?: string;
}

let counter = 0;
type Listener = (t: ToastItem) => void;
type Dismisser = (id: number) => void;
const addListeners = new Set<Listener>();
const dismissListeners = new Set<Dismisser>();

export function pushToast(t: Omit<ToastItem, 'id'>): number {
  const id = ++counter;
  const item: ToastItem = { id, ...t };
  addListeners.forEach((l) => l(item));
  return id;
}

export function dismissToast(id: number): void {
  dismissListeners.forEach((d) => d(id));
}

function kindColor(kind: ToastKind): string {
  switch (kind) {
    case 'success':
      return 'var(--green-accent)';
    case 'error':
      return 'var(--red-accent)';
    case 'info':
      return 'var(--amber-accent)';
    default:
      return 'var(--teal-accent)';
  }
}

function KindIcon({ kind }: { kind: ToastKind }) {
  const c = kindColor(kind);
  if (kind === 'loading') {
    return (
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, ease: 'linear', duration: 1 }}
        style={{ display: 'inline-flex', color: c }}
      >
        <Loader2 size={15} aria-hidden="true" />
      </motion.span>
    );
  }
  if (kind === 'error') return <AlertTriangle size={15} color={c} aria-hidden="true" />;
  return <Check size={15} color={c} aria-hidden="true" />;
}

export function ToastHost() {
  const [items, setItems] = useState<ToastItem[]>([]);

  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => {
    const onAdd: Listener = (t) => {
      setItems((prev) => [...prev.filter((p) => p.id !== t.id), t]);
      if (t.kind === 'success' || t.kind === 'info') {
        setTimeout(() => remove(t.id), 6000);
      }
    };
    const onDismiss: Dismisser = (id) => remove(id);
    addListeners.add(onAdd);
    dismissListeners.add(onDismiss);
    return () => {
      addListeners.delete(onAdd);
      dismissListeners.delete(onDismiss);
    };
  }, [remove]);

  return (
    <div
      aria-live="polite"
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem',
        maxWidth: 'min(92vw, 380px)',
      }}
    >
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, x: 30, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 30, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="academic-card"
            style={{
              padding: '0.8rem 1rem',
              borderLeft: `3px solid ${kindColor(t.kind)}`,
              display: 'flex',
              gap: '0.7rem',
              alignItems: 'flex-start',
              backgroundColor: 'var(--surface)',
            }}
          >
            <span style={{ marginTop: 2 }}>
              <KindIcon kind={t.kind} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--white-chalk)' }}>{t.title}</div>
              {t.body ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 2, lineHeight: 1.4 }}>
                  {t.body}
                </div>
              ) : null}
              {t.txHash ? (
                <a
                  href={`${EXPLORER}/tx/${t.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    color: 'var(--teal-glow)',
                    fontSize: '0.74rem',
                    marginTop: 4,
                  }}
                >
                  View Transaction
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
              ) : null}
            </div>
            <button
              onClick={() => remove(t.id)}
              aria-label="Dismiss notification"
              style={{ color: 'var(--text-faint)', padding: 2 }}
            >
              <X size={14} aria-hidden="true" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
