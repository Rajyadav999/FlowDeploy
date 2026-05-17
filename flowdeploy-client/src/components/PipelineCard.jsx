import { useNavigate } from 'react-router-dom'
import StatusBadge from './StatusBadge'

export default function PipelineCard({ pipeline, latestJob }) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/pipeline/${pipeline._id}`)}
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'border-color .15s, transform .15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border2)'
        e.currentTarget.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>
            {pipeline.name}
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)' }}>
            {pipeline.repoUrl}
          </div>
        </div>
        {latestJob && <StatusBadge status={latestJob.status} />}
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)' }}>
          branch: <span style={{ color: 'var(--blue)' }}>{pipeline.branch}</span>
        </div>
        {latestJob && (
          <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--text3)' }}>
            last run: {new Date(latestJob.createdAt).toLocaleString()}
          </div>
        )}
      </div>
    </div>
  )
}