import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import client from '../api/client'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const submit = async () => {
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await client.post(endpoint, form)
      localStorage.setItem('token', data.token)
      navigate('/')
    } catch (e) {
      setError(e.response?.data?.error || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)'
    }}>
      <div style={{ width: '100%', maxWidth: '380px', padding: '0 20px' }}>

        {/* logo */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'var(--mono)', fontSize: '22px',
            fontWeight: 600, color: 'var(--green)', letterSpacing: '-0.5px'
          }}>
            flow<span style={{ color: 'var(--text)' }}>deploy</span>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '6px' }}>
            self-hosted CI/CD
          </div>
        </div>

        {/* card */}
        <div style={{
          background: 'var(--bg2)', border: '1px solid var(--border)',
          borderRadius: '12px', padding: '28px'
        }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {['login', 'register'].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{
                flex: 1, padding: '8px',
                borderRadius: '6px', border: '1px solid var(--border)',
                background: mode === m ? 'var(--green-dim)' : 'transparent',
                color: mode === m ? 'var(--green)' : 'var(--text3)',
                fontSize: '13px', fontWeight: 500,
                borderColor: mode === m ? 'var(--green)44' : 'var(--border)',
                transition: 'all .15s'
              }}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>

          {mode === 'register' && (
            <input
              placeholder="Name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          )}
          <input
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={inputStyle}
          />
          <input
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ ...inputStyle, marginBottom: 0 }}
          />

          {error && (
            <div style={{
              marginTop: '12px', padding: '10px 12px',
              background: 'var(--red-dim)', border: '1px solid var(--red)44',
              borderRadius: '6px', fontFamily: 'var(--mono)',
              fontSize: '12px', color: 'var(--red)'
            }}>
              {error}
            </div>
          )}

          <button onClick={submit} disabled={loading} style={{
            width: '100%', marginTop: '16px', padding: '11px',
            background: 'var(--green)', color: '#000',
            border: 'none', borderRadius: '6px',
            fontSize: '14px', fontWeight: 600,
            opacity: loading ? 0.6 : 1,
            transition: 'opacity .15s'
          }}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign in' : 'Create account'}
          </button>
        </div>
      </div>
    </div>
  )
}

const inputStyle = {
  width: '100%', padding: '10px 12px', marginBottom: '10px',
  background: 'var(--bg3)', border: '1px solid var(--border)',
  borderRadius: '6px', color: 'var(--text)', fontSize: '13px',
  outline: 'none', display: 'block'
}