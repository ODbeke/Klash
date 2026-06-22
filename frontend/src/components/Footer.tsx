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
            textAlign: 'center',
            margin: '0 auto',
            maxWidth: 680,
            display: 'grid',
            gap: '0.75rem',
          }}
        >
          <h4
            className="serif-header"
            style={{
              color: 'var(--white-chalk)',
              fontSize: '1.25rem',
              letterSpacing: '0.08em',
              marginBottom: '0.25rem',
            }}
          >
            KLASH Dialectic Coliseum
          </h4>
          <p style={{ lineHeight: 1.6, color: 'var(--text-muted)', fontSize: '0.86rem' }}>
            KLASH Dialectic Coliseum is a decentralized debate terminal built on GenLayer, governed by intelligent validator consensus. 
            Here, ideas are treated as assets: any proponent can establish a Thesis, and any challenger can duel it by presenting an Antithesis. 
            The reigning thesis holds power until logically overthrown by the consensus verdict of an AI validator jury. 
            Designed for rigorous intellectual duel, mathematical objectivity, and perpetual dialectical progression.
          </p>
        </div>

        <div className="fine-rule" />

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '2.5rem',
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
