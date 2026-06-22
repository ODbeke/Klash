'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { X } from './icons';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: ReactNode;
  closeable?: boolean;
}

export function Modal({ open, onClose, title, eyebrow, children, closeable = true }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeable) onClose();
    };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose, closeable]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => closeable && onClose()}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 70,
            background: 'rgba(5, 7, 12, 0.85)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            onMouseDown={(e) => e.stopPropagation()}
            className="modal-shell academic-card"
            style={{
              width: '100%',
              maxWidth: 540,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              backgroundColor: 'var(--surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '1.25rem 1.5rem 1rem',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div>
                {eyebrow ? (
                  <div className="uppercase-label" style={{ marginBottom: 4 }}>
                    {eyebrow}
                  </div>
                ) : null}
                <h2 className="serif-header" style={{ fontSize: '1.3rem', fontWeight: 600 }}>
                  {title}
                </h2>
              </div>
              {closeable ? (
                <button onClick={onClose} aria-label="Close dialog" style={{ color: 'var(--text-faint)', padding: 4 }}>
                  <X size={18} aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <div style={{ padding: '1.25rem 1.5rem 1.5rem' }}>{children}</div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
