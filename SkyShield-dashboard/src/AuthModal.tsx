import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'
import { AlertCircle, Eye, EyeOff, Mail, ShieldCheck, User, X } from 'lucide-react'
import { login, loginWithGoogle, signup, type AuthUser } from './auth'

type Props = {
  onClose: () => void
  onAuthenticated: (user: AuthUser) => void
}

export default function AuthModal({ onClose, onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError('')

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const user = mode === 'login'
        ? await login(email, password)
        : await signup(name, email, password)
      onAuthenticated(user)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async (credential?: string) => {
    if (!credential) {
      setError('Google did not return an authentication credential.')
      return
    }
    setError('')
    setLoading(true)
    try {
      const user = await loginWithGoogle(credential)
      onAuthenticated(user)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-backdrop" onMouseDown={event => event.target === event.currentTarget && onClose()}>
      <section className="auth-card" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <header className="auth-card-header">
          <div className="auth-title-group">
            <div className="auth-brand-kicker"><ShieldCheck size={12} /> SKYSHIELD ACCESS</div>
            <h3 id="auth-title">{mode === 'login' ? 'Welcome back' : 'Create your workspace account'}</h3>
            <p>Secure access to aviation safety intelligence and incident operations.</p>
          </div>
          <button className="auth-close-btn" onClick={onClose} aria-label="Close"><X size={16} /></button>
        </header>

        {error && <div className="auth-error-banner"><AlertCircle size={15} /> <span>{error}</span></div>}

        <div className="auth-card-body">
          <div className="google-auth-box">
            <GoogleLogin
              onSuccess={response => { void handleGoogle(response.credential) }}
              onError={() => setError('Google sign-in was cancelled or could not be completed.')}
              theme="filled_black"
              shape="rectangular"
              width="100%"
              text="continue_with"
            />
          </div>

          <div className="auth-divider"><span /> OR USE EMAIL <span /></div>

          <div className="auth-tabs">
            <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError('') }}>Login</button>
            <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError('') }}>Sign up</button>
          </div>

          <form className="auth-form" onSubmit={submit}>
            {mode === 'signup' && (
              <label className="auth-field">
                <span>FULL NAME</span>
                <div className="auth-input-wrap"><User size={15} /><input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name" required /></div>
              </label>
            )}

            <label className="auth-field">
              <span>EMAIL ADDRESS</span>
              <div className="auth-input-wrap"><Mail size={15} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required /></div>
            </label>

            <label className="auth-field">
              <span>PASSWORD</span>
              <div className="auth-input-wrap">
                <ShieldCheck size={15} />
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" minLength={8} required />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword(value => !value)} aria-label="Toggle password visibility">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>

            {mode === 'signup' && (
              <label className="auth-field">
                <span>CONFIRM PASSWORD</span>
                <div className="auth-input-wrap"><ShieldCheck size={15} /><input type={showPassword ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" minLength={8} required /></div>
              </label>
            )}

            <button className="auth-submit-btn" disabled={loading}>
              {loading ? 'AUTHENTICATING…' : mode === 'login' ? 'Login to SkyShield' : 'Create SkyShield account'}
            </button>
          </form>
        </div>

        <footer className="auth-card-footer"><ShieldCheck size={12} /> Credentials are securely verified by the SkyShield backend.</footer>
      </section>
    </div>
  )
}
