import { useEffect, useRef } from 'react'
import useLiveLogs from '../hooks/useLiveLogs'

export default function LogTerminal({ jobId }) {
  const { logs, connected } = useLiveLogs(jobId)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  const getColor = (line = '') => {
    if (line.startsWith('✓')) return 'var(--green)'
    if (line.startsWith('✗')) return 'var(--red)'
    if (line.startsWith('━━━')) return 'var(--yellow)'
    if (line.startsWith('$')) return 'var(--blue)'
    return '#aaaaaa'
  }

  return (
    <div style={{
      background: '#050505',
      border: '1px solid var(--border)',
      borderRadius: '8px',
      overflow: 'hidden'
    }}>
      {/* terminal header */}
      <div style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'var(--bg2)'
      }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)' }}>
          flowdeploy — live output
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: connected ? 'var(--green)' : 'var(--text3)',
            animation: connected ? 'pulse 1.5s ease-in-out infinite' : 'none'
          }} />
          <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text3)' }}>
            {connected ? 'live' : 'disconnected'}
          </span>
        </span>
      </div>

      {/* log lines */}
      <div style={{
        padding: '16px',
        minHeight: '300px',
        maxHeight: '500px',
        overflowY: 'auto',
        fontFamily: 'var(--mono)',
        fontSize: '12px',
        lineHeight: '1.8'
      }}>
        {logs.length === 0 ? (
          <span style={{ color: 'var(--text3)' }}>Waiting for logs...</span>
        ) : (
          logs.map((log, i) => (
            <div key={i} style={{ color: getColor(log.line) }}>
              {log.line || '\u00A0'}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
    </div>
  )
}