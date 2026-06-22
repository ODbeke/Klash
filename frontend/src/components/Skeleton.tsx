export function ThesisSkeleton() {
  return (
    <div
      className="academic-card"
      style={{
        padding: '2rem',
        display: 'grid',
        gap: '1rem',
        animation: 'skeleton-pulse 1.8s infinite ease-in-out',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ height: 12, width: 120, backgroundColor: 'var(--border)', borderRadius: 2 }} />
        <div style={{ height: 12, width: 40, backgroundColor: 'var(--border)', borderRadius: 2 }} />
      </div>
      <div className="fine-rule" />
      <div style={{ height: 26, width: '90%', backgroundColor: 'var(--border)', borderRadius: 2, marginTop: 4 }} />
      <div style={{ height: 26, width: '45%', backgroundColor: 'var(--border)', borderRadius: 2 }} />
      <div style={{ height: 14, width: 185, backgroundColor: 'var(--border)', borderRadius: 2, marginTop: 6 }} />
      <div style={{ display: 'flex', gap: '2rem', marginTop: 12 }}>
        <div style={{ height: 32, width: 60, backgroundColor: 'var(--border)', borderRadius: 2 }} />
        <div style={{ height: 32, width: 60, backgroundColor: 'var(--border)', borderRadius: 2 }} />
      </div>
      <style jsx global>{`
        @keyframes skeleton-pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
