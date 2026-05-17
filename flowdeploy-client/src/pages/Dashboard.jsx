import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'
import PipelineCard from '../components/PipelineCard'

export default function Dashboard() {
  const [pipelines, setPipelines] = useState([])
  const [jobs, setJobs] = useState({})
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
      client.get('/pipelines')
        .then(async ({ data }) => {
         setPipelines(Array.isArray(data) ? data : [])
        // fetch latest job for each pipeline
        const jobMap = {}
        await Promise.all(data.map(async (p) => {
          try {
            const { data: j } = await client.get(`/jobs/pipeline/${p._id}`)
            if (j.length > 0) jobMap[p._id] = j[0]
          } catch {}
        }))
        setJobs(jobMap)
      })
      .finally(() => setLoading(false))
  }, [])

  const logout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* navbar */}
      <div style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center',
        height: '56px', background: 'var(--bg2)'
      }}>
        <div style={{
          fontFamily: 'var(--mono)', fontSize: '16px',
          fontWeight: 600, color: 'var(--green)'
        }}>
          flow<span style={{ color: 'var(--text)' }}>deploy</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => navigate('/pipeline/new')}
            style={{
              padding: '7px 16px', borderRadius: '6px',
              background: 'var(--green)', color: '#000',
              border: 'none', fontSize: '13px', fontWeight: 600
            }}>
            + New pipeline
          </button>
          <button
            onClick={logout}
            style={{
              padding: '7px 16px', borderRadius: '6px',
              background: 'transparent', color: 'var(--text3)',
              border: '1px solid var(--border)', fontSize: '13px'
            }}>
            Logout
          </button>
        </div>
      </div>

      {/* content */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 600, marginBottom: '6px' }}>
            Pipelines
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '14px' }}>
            {pipelines.length} pipeline{pipelines.length !== 1 ? 's' : ''} configured
          </p>
        </div>

        {loading ? (
          <div style={{ color: 'var(--text3)', fontFamily: 'var(--mono)', fontSize: '13px' }}>
            Loading...
          </div>
        ) : pipelines.length === 0 ? (
          <div style={{
            border: '1px dashed var(--border)', borderRadius: '10px',
            padding: '60px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: 'var(--text3)', marginBottom: '16px' }}>
              No pipelines yet
            </div>
            <button
              onClick={() => navigate('/pipeline/new')}
              style={{
                padding: '9px 20px', borderRadius: '6px',
                background: 'var(--green)', color: '#000',
                border: 'none', fontSize: '13px', fontWeight: 600
              }}>
              Create your first pipeline
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {pipelines.map(p => (
              <PipelineCard key={p._id} pipeline={p} latestJob={jobs[p._id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}