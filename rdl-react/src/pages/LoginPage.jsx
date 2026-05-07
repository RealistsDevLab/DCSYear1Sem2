// src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { loginMember, loginAdmin } from '../services/auth'
import styles from './LoginPage.module.css'

const MAX_ATTEMPTS = 5
const LOCKOUT_MS   = 5 * 60 * 1000

const lockout = { member: { attempts: 0, until: 0 }, admin: { attempts: 0, until: 0 } }

export default function LoginPage() {
  const { login, loginAdmin: ctxLoginAdmin } = useAuth()
  const navigate = useNavigate()

  const [tab,      setTab]      = useState('member') // 'member' | 'admin'
  const [identity, setIdentity] = useState('')
  const [code,     setCode]     = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  function isLockedOut(type) {
    const l = lockout[type]
    if (l.until && Date.now() < l.until) return true
    if (l.until && Date.now() >= l.until) { l.attempts = 0; l.until = 0 }
    return false
  }

  function recordFail(type) {
    const l = lockout[type]
    l.attempts++
    if (l.attempts >= MAX_ATTEMPTS) {
      l.until = Date.now() + LOCKOUT_MS
      setError(`🔒 Too many attempts. Try again in 5 minutes.`)
    } else {
      const left = MAX_ATTEMPTS - l.attempts
      setError(`❌ Wrong credentials. ${left} attempt${left !== 1 ? 's' : ''} left.`)
    }
  }

  async function handleMemberLogin(e) {
    e.preventDefault()
    if (isLockedOut('member')) { setError('🔒 Too many attempts. Try again in 5 minutes.'); return }
    setLoading(true); setError('')
    const result = await loginMember(identity, code)
    setLoading(false)
    if (result.ok) {
      lockout.member.attempts = 0
      login(result.member, result.token)
      navigate('/')
    } else {
      recordFail('member')
      setError(result.error)
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault()
    if (isLockedOut('admin')) { setError('🔒 Too many attempts.'); return }
    setLoading(true); setError('')
    const result = await loginAdmin(password)
    setLoading(false)
    if (result.ok) {
      lockout.admin.attempts = 0
      ctxLoginAdmin()
      navigate('/')
    } else {
      recordFail('admin')
      setError(result.error)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>🚀</div>
        <h1 className={styles.title}>TheRealistDevLab</h1>
        <p className={styles.sub}>DCS Year 1 · Semester 2 · UICT 2026</p>

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'member' ? styles.active : ''}`}
            onClick={() => { setTab('member'); setError('') }}
          >Member</button>
          <button
            className={`${styles.tab} ${tab === 'admin' ? styles.active : ''}`}
            onClick={() => { setTab('admin'); setError('') }}
          >Admin</button>
        </div>

        {tab === 'member' ? (
          <form onSubmit={handleMemberLogin}>
            <div className={styles.field}>
              <label className={styles.label}>Name / Email / Phone</label>
              <input
                className="form-input"
                value={identity}
                onChange={e => setIdentity(e.target.value)}
                placeholder="Your name or contact"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Access Code</label>
              <input
                className="form-input"
                type="password"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Your access code"
                required
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={loading}>
              {loading ? '⏳ Verifying…' : '🔓 Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin}>
            <div className={styles.field}>
              <label className={styles.label}>Admin Password</label>
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Admin password"
                required
              />
            </div>
            {error && <div className={styles.error}>{error}</div>}
            <button type="submit" className={`btn btn-primary ${styles.submit}`} disabled={loading}>
              {loading ? '⏳ Verifying…' : '🛡️ Admin Login'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
