'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Loader2 } from './icons';

export interface ThesisModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (topic: string, claim: string) => void;
  submitting: boolean;
}

export function ThesisModal({ open, onClose, onSubmit, submitting }: ThesisModalProps) {
  const [topic, setTopic] = useState('');
  const [claim, setClaim] = useState('');

  useEffect(() => {
    if (open) {
      setTopic('');
      setClaim('');
    }
  }, [open]);

  const onFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (topic.trim().length >= 4 && claim.trim().length >= 10) {
      onSubmit(topic.trim(), claim.trim());
    }
  };

  const valid = topic.trim().length >= 4 && claim.trim().length >= 10;

  return (
    <Modal open={open} onClose={onClose} title="Propose Debate Thesis" eyebrow="New arena" closeable={!submitting}>
      <form onSubmit={onFormSubmit} style={{ display: 'grid', gap: '1.25rem' }}>
        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <label htmlFor="topic-input" className="uppercase-label">
            Topic Title
          </label>
          <input
            id="topic-input"
            type="text"
            className="input-field"
            placeholder="e.g., General Artificial Intelligence Timeline"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={submitting}
            maxLength={90}
            required
          />
          <span style={{ fontSize: '0.72rem', color: 'var(--text-faint)', justifySelf: 'end' }}>
            {topic.length}/90 chars
          </span>
        </div>

        <div style={{ display: 'grid', gap: '0.4rem' }}>
          <label htmlFor="claim-input" className="uppercase-label">
            Opening Dominant Thesis
          </label>
          <textarea
            id="claim-input"
            rows={4}
            className="input-field"
            placeholder="e.g., AGI will be achieved by 2030 through compute scaling and reinforcement learning..."
            value={claim}
            onChange={(e) => setClaim(e.target.value)}
            disabled={submitting}
            maxLength={500}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-faint)' }}>
            <span>Min 10 chars</span>
            <span>{claim.length}/500 chars</span>
          </div>
        </div>

        <div className="fine-rule" />

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.25rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={!valid || submitting} style={{ minWidth: 130 }}>
            {submitting ? (
              <>
                <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting
              </>
            ) : (
              'Submit Thesis'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
