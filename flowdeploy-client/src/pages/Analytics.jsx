import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from 'recharts'
import client from '../api/client'

export default function Analytics() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pipeline, setPipeline] = useState(null)
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      client.get(`/pipelines/${id}`),
      client.get(`/jobs/pipeline/${id}`)
    ]).then(([p, j]) => {
      setPipeline(p.data)
      setJobs(j.data.reverse()) // oldest first for charts
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div style={{ padding: '60px', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
      Loading analytics...
    </div>
  )

  // ── compute stats ──────────────────────────────────
  const totalRuns    = jobs.length
  const passedRuns   = jobs.filter(j => j.status === 'passed').length
  const failedRuns   = jobs.filter(j => j.status === 'failed').length
  const successRate  = totalRuns ? Math.round((passedRuns / totalRuns) * 100) : 0

  const avgDuration  = totalRuns
    ? Math.round(jobs.reduce((acc, j) => {
        if (j.startedAt && j.finishedAt) {
          return acc + (new Date(j.finishedAt) - new Date(j.startedAt)) / 1000
        }
        return acc
      }, 0) / totalRuns)
    : 0

  // build time per run
  const buildTimeData = jobs
    .filter(j => j.startedAt && j.finishedAt)
    .map((j, i) => ({
      run: `#${i + 1}`,
      duration: Math.round((new Date(j.finishedAt) - new Date(j.startedAt)) / 1000),
      status: j.status
    }))

  // success vs failure pie
  const pieData = [
    { name: 'Passed', value: passedRuns,  color: '#00ff88' },
    { name: 'Failed', value: failedRuns,  color: '#ff4455' },
  ].filter(d => d.value > 0)

  // step failure analysis
  const stepStats = {}
  jobs.forEach(job => {
    job.steps?.forEach(step => {
      if (!stepStats[step.name]) {
        stepStats[step.name] = { name: step.name, passed: 0, failed: 0, totalDuration: 0, count: 0 }
      }
      if (step.status === 'passed') stepStats[step.name].passed++
      if (step.status === 'failed') stepStats[step.name].failed++
      if (step.duration) {
        stepStats[step.name].totalDuration += step.duration
        stepStats[step.name].count++
      }
    })
  })

  const stepData = Object.values(stepStats).map(s => ({
    name: s.name,
    avgDuration: s.count ? Math.round(s.totalDuration / s.count) : 0,
    failRate: Math.round((s.failed / (s.passed + s.failed)) * 100)
  }))

  const tooltipStyle = {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '6px',
    color: '#e8e8e8',
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '11px'
  }

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
        <button onClick={() => navigate(`/pipeline/${id}`)} style={{
          fontSize: '14px', color: 'var(--text2)', background: 'none', border: 'none'
        }}>
          {pipeline?.name}
        </button>
        <span style={{ color: 'var(--text3)', margin: '0 10px' }}>/</span>
        <span style={{ fontSize: '14px', color: 'var(--text2)' }}>Analytics</span>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '28px' }}>
          Pipeline analytics — {pipeline?.name}
        </h1>

        {/* stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
          {[
            { label: 'Total runs',    value: totalRuns,       color: 'var(--blue)'   },
            { label: 'Success rate',  value: `${successRate}%`, color: 'var(--green)' },
            { label: 'Failed runs',   value: failedRuns,      color: 'var(--red)'    },
            { label: 'Avg duration',  value: `${avgDuration}s`, color: 'var(--yellow)'},
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '16px'
            }}>
              <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 600, color, fontFamily: 'var(--mono)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>

        {totalRuns === 0 ? (
          <div style={{
            border: '1px dashed var(--border)', borderRadius: '10px',
            padding: '60px', textAlign: 'center',
            color: 'var(--text3)', fontSize: '13px'
          }}>
            No runs yet — trigger a pipeline to see analytics
          </div>
        ) : (
          <>
            {/* build time chart */}
            <div style={{
              background: 'var(--bg2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '20px', marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
                Build duration per run (seconds)
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={buildTimeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="run" tick={{ fill: '#555', fontSize: 11, fontFamily: 'monospace' }} />
                  <YAxis tick={{ fill: '#555', fontSize: 11, fontFamily: 'monospace' }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="duration" radius={[4, 4, 0, 0]}>
                    {buildTimeData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.status === 'passed' ? '#00ff88' : '#ff4455'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* bottom row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* pie chart */}
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '20px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
                  Pass vs fail ratio
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                      labelLine={false}
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* step avg duration */}
              <div style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '10px', padding: '20px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 500, marginBottom: '16px' }}>
                  Avg duration per step (seconds)
                </div>
                {stepData.length === 0 ? (
                  <div style={{ color: 'var(--text3)', fontSize: '13px' }}>No step data yet</div>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={stepData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                      <XAxis type="number" tick={{ fill: '#555', fontSize: 11 }} />
                      <YAxis dataKey="name" type="category" tick={{ fill: '#888', fontSize: 10 }} width={80} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Bar dataKey="avgDuration" fill="#4488ff" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  )
}