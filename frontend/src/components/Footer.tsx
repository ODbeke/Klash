'use client';

import {
  CONTRACT_ADDRESS,
  DEPLOY_TX,
  DOCS,
  EXPLORER,
  FAUCET,
} from '@/lib/contract';
import { copyText, shortAddr } from '@/lib/format';
import { useState } from 'react';
import { Check, Copy, ExternalLink } from './icons';

export function Footer() {
  const [copied, setCopied] = useState(false);

  const onCopy = async () => {
    const ok = await copyText(CONTRACT_ADDRESS);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <footer
      style={{
        marginTop: '5rem',
        padding: '3rem 0 4rem',
        borderTop: '1px solid var(--border)',
        background: 'var(--slate-dark)',
        color: 'var(--text-faint)',
        fontSize: '0.82rem',
      }}
    >
      <div className="shell" style={{ display: 'grid', gap: '2rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'start',
            gap: '2rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h4
              className="serif-header"
              style={{
                color: 'var(--white-chalk)',
                fontSize: '1rem',
                letterSpacing: '0.05em',
                marginBottom: '0.5rem',
              }}
            >
              KLASH Dialectic Coliseum
            </h4>
            <p style={{ maxWidth: 360, lineHeight: 1.5 }}>
              A decentralized, validator-consensus debate arena running on GenLayer. 
              The reigning thesis stands until logically overthrown by a stronger opposing claim.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.6rem' }}>
            <span className="uppercase-label">Resources</span>
            <a
              href={FAUCET}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              className="btn-secondary-link"
            >
              Testnet Faucet <ExternalLink size={12} />
            </a>
            <a
              href={DOCS}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              className="btn-secondary-link"
            >
              Developer Docs <ExternalLink size={12} />
            </a>
          </div>
        </div>

        <div className="fine-rule" />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>Contract Address:</span>
            <span className="mono" style={{ color: 'var(--text-muted)' }}>
              {shortAddr(CONTRACT_ADDRESS)}
            </span>
            <button
              onClick={onCopy}
              aria-label="Copy contract address"
              style={{ color: 'var(--teal-accent)' }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
            </button>
            <a
              href={`${EXPLORER}/address/${CONTRACT_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View contract on explorer"
              style={{ color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              <span>Explorer</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {DEPLOY_TX ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Deployment Tx:</span>
              <a
                href={`${EXPLORER}/tx/${DEPLOY_TX}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mono"
                style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}
              >
                {shortAddr(DEPLOY_TX)}
              </a>
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
