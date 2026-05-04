import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../assets/mia.svg'
import SplashScreen from '../components/SplashScreen'

let splashShown = false

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)
const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

function floatStyle(delay, extra = {}) {
  return { opacity: 0, animationDelay: `${delay}s`, ...extra }
}

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const [showSplash, setShowSplash] = useState(!splashShown)
  const [ready,      setReady]      = useState(splashShown)

  const [mode,         setMode]     = useState('login')
  const [email,        setEmail]    = useState('')
  const [password,     setPassword] = useState('')
  const [showPassword, setShowPw]   = useState(false)
  const [error,        setError]    = useState(null)
  const [loading,      setLoading]  = useState(false)

  const handleSplashFinish = useCallback(() => {
    splashShown = true
    setShowSplash(false)
    setReady(true)
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)
    setLoading(false)
    if (error) setError(error.message)
    else navigate('/')
  }

  function switchMode(m) {
    setMode(m)
    setError(null)
    setShowPw(false)
  }

  return (
    <div style={s.page}>
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <div style={s.container}>

        {/* Logo + tagline */}
        <div
          className={ready ? 'animate-float-up' : undefined}
          style={{ textAlign: 'center', marginBottom: 28, ...(ready ? floatStyle(0) : {}) }}
        >
          <img src={Logo} alt="Mia" style={{ width: 80, height: 80, margin: '0 auto 10px', display: 'block' }} />
          <p style={{ fontSize: 13, color: 'var(--tx2)' }}>Tu expense tracker con amor 💜</p>
        </div>

        {/* Tab toggle */}
        <div
          className={ready ? 'animate-float-up' : undefined}
          style={{ display: 'flex', background: 'var(--s2)', borderRadius: 12, padding: 4, marginBottom: 24, ...(ready ? floatStyle(0.1) : {}) }}
        >
          {(['login', 'register']).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => switchMode(m)}
              style={{
                flex: 1, padding: '9px 0', borderRadius: 9,
                border: 'none', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all .15s',
                background: mode === m ? 'var(--s1)' : 'transparent',
                color:      mode === m ? 'var(--tx)' : 'var(--tx3)',
                boxShadow:  mode === m ? '0 1px 4px rgba(0,0,0,.4)' : 'none',
              }}
            >
              {m === 'login' ? 'Iniciar sesión' : 'Registrarse'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className={ready ? 'animate-float-up' : undefined}
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem', ...(ready ? floatStyle(0.2) : {}) }}
        >
          <div style={s.field}>
            <label style={s.label} htmlFor="login-email">Email</label>
            <input
              id="login-email"
              style={s.input}
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              onFocus={e => e.target.style.setProperty('border-color', 'var(--gr)')}
              onBlur={e => e.target.style.setProperty('border-color', 'var(--bd2)')}
            />
          </div>

          <div style={s.field}>
            <label style={s.label} htmlFor="login-password">Contraseña</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="login-password"
                style={{ ...s.input, paddingRight: '2.75rem' }}
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                onFocus={e => e.target.style.setProperty('border-color', 'var(--gr)')}
                onBlur={e => e.target.style.setProperty('border-color', 'var(--bd2)')}
              />
              <button
                type="button"
                style={s.eyeBtn}
                onClick={() => setShowPw(v => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && <div style={s.errorBanner}>{error}</div>}

          <button style={s.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Cargando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        {/* Forgot password */}
        {mode === 'login' && (
          <p
            className={ready ? 'animate-float-up' : undefined}
            style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--tx3)', ...(ready ? floatStyle(0.3) : {}) }}
          >
            ¿Olvidaste tu contraseña?{' '}
            <button
              type="button"
              style={{ background: 'none', border: 'none', color: 'var(--pu)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}
            >
              Recuperar
            </button>
          </p>
        )}

      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100dvh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  container: {
    width: '100%',
    maxWidth: 380,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.8rem',
    fontWeight: 500,
    color: 'var(--tx2)',
  },
  input: {
    background: 'var(--s2)',
    border: '1px solid var(--bd2)',
    borderRadius: 8,
    color: 'var(--tx)',
    padding: '0.65rem 0.8rem',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
    transition: 'border-color .15s',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--tx2)',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    lineHeight: 1,
  },
  errorBanner: {
    background: 'var(--red)',
    border: '1px solid rgba(244,63,94,.25)',
    borderRadius: 8,
    padding: '0.6rem 0.8rem',
    color: 'var(--re)',
    fontSize: '0.85rem',
    lineHeight: 1.4,
  },
  btnPrimary: {
    background: 'var(--gr)',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    padding: '0.7rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    width: '100%',
    marginTop: '0.25rem',
  },
}
