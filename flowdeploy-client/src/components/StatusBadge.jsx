export default function StatusBadge({ status }) {
  const map = {
    passed:  { label: 'PASSED',  color: 'var(--green)', bg: 'var(--green-dim)' },
    failed:  { label: 'FAILED',  color: 'var(--red)',   bg: 'var(--red-dim)'   },
    running: { label: 'RUNNING', color: 'var(--yellow)', bg: '#ffcc0022'        },
    queued:  { label: 'QUEUED',  color: 'var(--blue)',  bg: '#4488ff22'         },
  }

  const s = map[status] || { label: status?.toUpperCase() || 'UNKNOWN', color: 'var(--text2)', bg: 'var(--bg3)' }

  return (
    <span style={{
      fontFamily: 'var(--mono)',
      fontSize: '10px',
      fontWeight: 600,
      letterSpacing: '0.08em',
      padding: '3px 8px',
      borderRadius: '4px',
      color: s.color,
      background: s.bg,
      border: `1px solid ${s.color}44`,
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px'
    }}>
      {status === 'running' && (
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: 'var(--yellow)',
          animation: 'pulse 1s ease-in-out infinite'
        }} />
      )}
      {s.label}
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </span>
  )
}