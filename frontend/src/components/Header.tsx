'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Copy, Crown, Flame, Shield, Wallet, BookOpen } from './icons';
import { WalletState } from '@/hooks/useWallet';
import { Arena } from '@/lib/contract';
import { copyText, ordinal, shortAddr } from '@/lib/format';

export interface HeaderProps {
  wallet: WalletState;
  arena: Arena | null;
}

function WalletChip({ wallet }: { wallet: WalletState }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (!wallet.hasProvider) {
    return (
      <a
        className="chip btn btn-secondary"
        href="https://metamask.io/download/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Install a wallet"
        style={{ minHeight: 40, display: 'inline-flex', alignItems: 'center', gap: 8 }}
      >
        <Wallet size={15} aria-hidden="true" />
        <span>Install Wallet</span>
      </a>
    );
  }

  if (!wallet.address) {
    return (
      <button
        className="btn btn-primary"
        onClick={wallet.connect}
        disabled={wallet.connecting}
        aria-label="Connect wallet"
        style={{ minHeight: 40 }}
      >
        <Wallet size={15} aria-hidden="true" />
        {wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  const onCopy = async () => {
    const ok = await copyText(wallet.address ?? '');
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="btn btn-secondary"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Wallet menu"
        style={{ minHeight: 40, padding: '0 0.85rem' }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: wallet.onChain ? 'var(--green-accent)' : 'var(--amber-accent)',
          }}
        />
        <span className="mono" style={{ fontSize: '0.8rem', marginLeft: 4 }}>
          {shortAddr(wallet.address)}
        </span>
        <ChevronDown size={12} aria-hidden="true" style={{ marginLeft: 4 }} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="academic-card"
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 8px)',
              width: 260,
              zIndex: 60,
              padding: '1rem',
              display: 'grid',
              gap: '0.75rem',
              backgroundColor: 'var(--surface)',
            }}
          >
            <div>
              <div className="uppercase-label" style={{ marginBottom: 4 }}>
                Address
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="mono" style={{ fontSize: '0.72rem', wordBreak: 'break-all', color: 'var(--text-muted)' }}>
                  {wallet.address}
                </span>
                <button onClick={onCopy} aria-label="Copy address" style={{ color: 'var(--teal-accent)', flexShrink: 0 }}>
                  {copied ? <Check size={13} aria-hidden="true" /> : <Copy size={13} aria-hidden="true" />}
                </button>
              </div>
            </div>
            <div className="fine-rule" />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Balance</span>
              <span className="mono">{wallet.balance ?? '0'} GEN</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Network</span>
              <span style={{ color: wallet.onChain ? 'var(--green-accent)' : 'var(--amber-accent)', fontWeight: 600 }}>
                {wallet.onChain ? 'StudioNet' : 'Wrong Network'}
              </span>
            </div>
            <div className="fine-rule" />
            <button
              className="btn btn-secondary"
              onClick={() => {
                wallet.disconnect();
                setOpen(false);
              }}
              style={{ width: '100%', minHeight: 36, fontSize: '0.8rem' }}
            >
              Disconnect
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export function Header({ wallet, arena }: HeaderProps) {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--border)',
        background: 'var(--surface)',
        position: 'relative',
        zIndex: 30,
      }}
    >
      {/* Top Tier: Header Wordmark */}
      <div className="shell">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '1.25rem 0 1rem',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <h1
              style={{
                fontFamily: '"Sorgath", "UnifrakturMaguntia", "Pirata One", serif',
                fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                letterSpacing: '0.04em',
                textIndent: '0.04em',
                lineHeight: 1,
                color: 'var(--white-chalk)',
                fontWeight: 'normal',
              }}
            >
              KLASH
            </h1>
          </div>
          <div style={{ flexShrink: 0 }}>
            <WalletChip wallet={wallet} />
          </div>
        </div>
      </div>
    </header>
  );
}
