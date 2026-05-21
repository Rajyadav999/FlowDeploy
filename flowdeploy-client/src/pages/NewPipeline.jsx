import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

const TEMPLATES = [
  {
    label: 'Basic',
    description: 'Simple hello world pipeline',
    yaml: `name: my-pipeline

trigger:
  on: push
  branch: main

steps:
  - name: Say hello
    image: alpine
    run: echo Hello from FlowDeploy!`
  },
  {
    label: 'Node.js',
    description: 'Install, test and build a Node.js app',
    yaml: `name: node-app

trigger:
  on: push
  branch: main

env:
  NODE_ENV: production

steps:
  - name: Install dependencies
    image: node:18
    run: cd /workspace && npm install

  - name: Run tests
    image: node:18
    run: cd /workspace && npm test

  - name: Build
    image: node:18
    run: cd /workspace && npm run build`
  },
  {
    label: 'Python',
    description: 'Install dependencies and run tests',
    yaml: `name: python-app

trigger:
  on: push
  branch: main

steps:
  - name: Install dependencies
    image: python:3.11-slim
    run: cd /workspace && pip install -r requirements.txt

  - name: Run tests
    image: python:3.11-slim
    run: cd /workspace && python -m pytest`
  },
  {
    label: 'Show repo',
    description: 'List files and print README',
    yaml: `name: inspect-repo

trigger:
  on: push
  branch: main

steps:
  - name: Show repo contents
    image: alpine
    run: ls -la /workspace

  - name: Print README
    image: alpine
    run: cat /workspace/README.md`
  },
  {
    label: 'Docker build',
    description: 'Build a Docker image from the repo',
    yaml: `name: docker-build

trigger:
  on: push
  branch: main

steps:
  - name: Show repo files
    image: alpine
    run: ls -la /workspace

  - name: Check Dockerfile exists
    image: alpine
    run: test -f /workspace/Dockerfile && echo "Dockerfile found!" || echo "No Dockerfile"`
  },
  {
    label: 'Custom',
    description: 'Write your own pipeline from scratch',
    yaml: `name: my-pipeline

trigger:
  on: push
  branch: main

steps:
  - name: My step
    image: alpine
    run: echo Hello!`
  }
]

export default function NewPipeline() {
  const [selectedTemplate, setSelectedTemplate] = useState(0)
  const [form, setForm] = useState({
    name: '',
    repoUrl: '',
    branch: 'main',
    yamlContent: TEMPLATES[0].yaml
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const selectTemplate = (index) => {
    setSelectedTemplate(index)
    setForm(f => ({ ...f, yamlContent: TEMPLATES[index].yaml }))
  }

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await client.post('/pipelines', form)
      navigate(`/pipeline/${data._id}`)
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to create pipeline')
    } finally {
      setLoading(false)
    }
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
        <span style={{ fontSize: '14px', color: 'var(--text2)' }}>New pipeline</span>
      </div>

      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '40px 24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '28px' }}>
          Create pipeline
        </h1>

        {/* template selector */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            fontSize: '12px', color: 'var(--text2)',
            display: 'block', marginBottom: '10px', fontWeight: 500
          }}>
            Choose a template
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {TEMPLATES.map((t, i) => (
              <div
                key={i}
                onClick={() => selectTemplate(i)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: `1px solid ${selectedTemplate === i ? 'var(--green)' : 'var(--border)'}`,
                  background: selectedTemplate === i ? 'var(--green-dim)' : 'var(--bg2)',
                  cursor: 'pointer',
                  transition: 'all .15s'
                }}
              >
                <div style={{
                  fontSize: '13px', fontWeight: 600,
                  color: selectedTemplate === i ? 'var(--green)' : 'var(--text)',
                  marginBottom: '3px'
                }}>
                  {t.label}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)', lineHeight: 1.4 }}>
                  {t.description}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* fields */}
        {[
          { label: 'Pipeline name', key: 'name', placeholder: 'my-app' },
          { label: 'GitHub repo URL', key: 'repoUrl', placeholder: 'https://github.com/user/repo' },
          { label: 'Branch', key: 'branch', placeholder: 'main' },
        ].map(({ label, key, placeholder }) => (
          <div key={key} style={{ marginBottom: '16px' }}>
            <label style={{
              fontSize: '12px', color: 'var(--text2)',
              display: 'block', marginBottom: '6px', fontWeight: 500
            }}>
              {label}
            </label>
            <input
              value={form[key]}
              placeholder={placeholder}
              onChange={e => setForm({ ...form, [key]: e.target.value })}
              style={{
                width: '100%', padding: '10px 12px',
                background: 'var(--bg2)', border: '1px solid var(--border)',
                borderRadius: '6px', color: 'var(--text)',
                fontSize: '13px', outline: 'none'
              }}
            />
          </div>
        ))}

        {/* yaml editor */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            fontSize: '12px', color: 'var(--text2)',
            display: 'block', marginBottom: '6px', fontWeight: 500
          }}>
            Pipeline YAML
          </label>
          <textarea
            value={form.yamlContent}
            onChange={e => setForm({ ...form, yamlContent: e.target.value })}
            rows={16}
            style={{
              width: '100%', padding: '14px 16px',
              background: '#050505', border: '1px solid var(--border)',
              borderRadius: '6px', color: 'var(--green)',
              fontSize: '12px', lineHeight: '1.8',
              outline: 'none', resize: 'vertical'
            }}
          />
        </div>

        {error && (
          <div style={{
            marginBottom: '16px', padding: '10px 12px',
            background: 'var(--red-dim)', border: '1px solid var(--red)44',
            borderRadius: '6px', fontFamily: 'var(--mono)',
            fontSize: '12px', color: 'var(--red)'
          }}>
            {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={submit} disabled={loading} style={{
            padding: '10px 24px', borderRadius: '6px',
            background: 'var(--green)', color: '#000',
            border: 'none', fontSize: '14px', fontWeight: 600,
            opacity: loading ? 0.6 : 1
          }}>
            {loading ? 'Creating...' : 'Create pipeline'}
          </button>
          <button onClick={() => navigate('/')} style={{
            padding: '10px 24px', borderRadius: '6px',
            background: 'transparent', color: 'var(--text3)',
            border: '1px solid var(--border)', fontSize: '14px'
          }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}