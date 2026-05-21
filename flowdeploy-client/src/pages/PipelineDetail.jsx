import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import usePipeline from '../hooks/usePipeline'
import StatusBadge from '../components/StatusBadge'
import LogTerminal from '../components/LogTerminal'
import client from '../api/client'

// ── Step breakdown component ───────────────────────
function StepBreakdown({ steps }) {
  if (!steps || steps.length === 0) return null

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{
        fontSize: '11px', fontWeight: 500, color: 'var(--text3)',
        textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px'
      }}>
        Step breakdown
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {steps.map((step, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center',
            gap: '10px', padding: '8px 10px',
            background: 'var(--bg)', borderRadius: '6px',
            border: '1px solid var(--border)'
          }}>
            {/* status dot */}
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: step.status === 'passed' ? 'var(--green)'
                : step.status === 'failed' ? 'var(--red)' : 'var(--border2)'
            }} />

            {/* step name */}
            <span style={{
              flex: 1, fontSize: '12px',
              color: 'var(--text)', fontFamily: 'var(--mono)'
            }}>
              {step.name}
            </span>

            {/* duration bar */}
            {step.duration && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '60px', height: '3px',
                  background: 'var(--border)', borderRadius: '2px', overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%', borderRadius: '2px',
                    background: step.status === 'passed' ? 'var(--green)' : 'var(--red)',
                    width: `${Math.min((step.duration / 60) * 100, 100)}%`
                  }} />
                </div>
                <span style={{
                  fontFamily: 'var(--mono)', fontSize: '11px',
                  color: 'var(--text3)', minWidth: '36px', textAlign: 'right'
                }}>
                  {step.duration}s
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────
export default function PipelineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { pipeline, jobs, loading, refresh } = usePipeline(id)
  const [activeJob, setActiveJob] = useState(null)
  const [triggering, setTriggering] = useState(false)
  const pollRef = useRef(null)

  // auto-refresh while any job is running or queued
  useEffect(() => {
    const hasRunning = jobs.some(j => j.status === 'running' || j.status === 'queued')

    if (hasRunning) {
      pollRef.current = setInterval(() => {
        refresh()
      }, 3000)
    } else {
      clearInterval(pollRef.current)
    }

    return () => clearInterval(pollRef.current)
  }, [jobs])

  const triggerRun = async () => {
    setTriggering(true)
    try {
      const { data } = await client.post(`/jobs/trigger/${id}`)
      setActiveJob(data._id)
      refresh()
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to trigger')
    } finally {
      setTriggering(false)
    }
  }

  if (loading) return (
    <div style={{ padding: '60px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
      Loading...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* navbar */}
      <div style={{
        borderBottom: '1px solid var(--border)', padding: '0 32px',
        display: 'flex', alignItems: 'center', height: '56px', background: 'var(--bg2)'
      }}>
        <button onClick={() => navigate('/')} style={{
          fontFamily: 'var(--mono)', fontSize: '16px', fontWeight: 600,
          color: 'var(--green)', background: 'none', border: 'none'
        }}>
          flow<span style={{ color: 'var(--text)' }}>deploy</span>
        </button>
        <span style={{ color: 'var(--text3)', margin: '0 10px' }}>/</span>
        <span style={{ fontSize: '14px', color: 'var(--text2)' }}>{pipeline?.name}</span>

        {/* navbar buttons */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button onClick={() => navigate(`/pipeline/${id}/analytics`)} style={{
            padding: '7px 14px', borderRadius: '6px',
            background: 'transparent', color: 'var(--text3)',
            border: '1px solid var(--border)', fontSize: '13px'
          }}>
            📊 Analytics
          </button>
          <button onClick={refresh} style={{
            padding: '7px 14px', borderRadius: '6px',
            background: 'transparent', color: 'var(--text3)',
            border: '1px solid var(--border)', fontSize: '13px'
          }}>
            Refresh
          </button>
          <button onClick={triggerRun} disabled={triggering} style={{
            padding: '7px 16px', borderRadius: '6px',
            background: 'var(--green)', color: '#000',
            border: 'none', fontSize: '13px', fontWeight: 600,
            opacity: triggering ? 0.6 : 1
          }}>
            {triggering ? 'Triggering...' : '▶ Run pipeline'}
          </button>
        </div>
      </div>
      
            
    {/* badge section */}
    {pipeline && (
      <div style={{
        maxWidth: '1000px', margin: '0 auto',
        padding: '20px 24px 0',
        display: 'flex', alignItems: 'center', gap: '16px'
      }}>
    {/* live badge preview */}
    <img
      src={`http://localhost:5000/api/badges/${id}?t=${Date.now()}`}
      alt="pipeline status badge"
      style={{ height: '20px' }}
      onError={(e) => { e.target.style.display = 'none' }}
    />
    {/* copyable markdown */}
    <div style={{
      flex: 1, background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: '6px', padding: '8px 12px',
      fontFamily: 'var(--mono)', fontSize: '11px',
      color: 'var(--text3)', overflow: 'hidden',
      textOverflow: 'ellipsis', whiteSpace: 'nowrap'
    }}>
      ![{pipeline.name}](http://localhost:5000/api/badges/{id})
    </div>

    {/* copy button */}
    <button
      onClick={() => {
        navigator.clipboard.writeText(
          `![${pipeline.name}](http://localhost:5000/api/badges/${id})`
        )
        alert('Badge markdown copied! Paste it in your GitHub README.')
      }}
      style={{
        padding: '7px 14px', borderRadius: '6px',
        background: 'var(--bg2)', color: 'var(--text2)',
        border: '1px solid var(--border)', fontSize: '12px',
        fontWeight: 500, flexShrink: 0
      }}
    >
    Copy badge
    </button>
     </div>
   )}
      {/* content */}
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

          {/* run history */}
          <div>
            <h2 style={{
              fontSize: '14px', fontWeight: 600, color: 'var(--text2)',
              marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              Run history
            </h2>

            {jobs.length === 0 ? (
              <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No runs yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {jobs.map(job => (
                  <div
                    key={job._id}
                    onClick={() => setActiveJob(job._id)}
                    style={{
                      padding: '12px 14px',
                      background: activeJob === job._id ? 'var(--bg3)' : 'var(--bg2)',
                      border: `1px solid ${activeJob === job._id ? 'var(--border2)' : 'var(--border)'}`,
                      borderRadius: '8px', cursor: 'pointer',
                      transition: 'all .15s'
                    }}
                  >
                    {/* status + time */}
                    <div style={{
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', marginBottom: '6px'
                    }}>
                      <StatusBadge status={job.status} />
                      <span style={{ fontFamily: 'var(--mono)', fontSize: '10px', color: 'var(--text3)' }}>
                        {new Date(job.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {/* trigger info + total duration */}
                    <div style={{
                      fontFamily: 'var(--mono)', fontSize: '11px',
                      color: 'var(--text3)', marginBottom: '6px'
                    }}>
                      {job.triggeredBy} · {job._id.slice(-8)}
                      {job.startedAt && job.finishedAt && (
                        <span style={{ marginLeft: '8px', color: 'var(--blue)' }}>
                          ⏱ {Math.round((new Date(job.finishedAt) - new Date(job.startedAt)) / 1000)}s total
                        </span>
                      )}
                    </div>

                    {/* step progress bars */}
                    {job.steps?.length > 0 && (
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        {job.steps.map((s, i) => (
                          <div
                            key={i}
                            title={`${s.name} — ${s.duration || '?'}s`}
                            style={{
                              height: '3px', flex: 1, borderRadius: '2px',
                              background: s.status === 'passed' ? 'var(--green)'
                                : s.status === 'failed' ? 'var(--red)' : 'var(--border2)'
                            }}
                          />
                        ))}
                      </div>
                    )}

                    {/* step breakdown — only when selected */}
                    {activeJob === job._id && (
                      <StepBreakdown steps={job.steps} />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* live logs */}
          <div>
            <h2 style={{
              fontSize: '14px', fontWeight: 600, color: 'var(--text2)',
              marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              Live logs
            </h2>
            {activeJob ? (
              <LogTerminal jobId={activeJob} />
            ) : (
              <div style={{
                border: '1px dashed var(--border)', borderRadius: '8px',
                padding: '40px', textAlign: 'center',
                color: 'var(--text3)', fontSize: '13px', fontFamily: 'var(--mono)'
              }}>
                Select a run to see logs
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}