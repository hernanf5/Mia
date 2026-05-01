import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode]       = useState('login')
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = mode === 'login'
      ? await signIn(email, password)
      : await signUp(email, password)

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      navigate('/')
    }
  }

  function toggleMode() {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError(null)
  }

  const isLogin = mode === 'login'

  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>
          M<span style={{ color: 'var(--gr)' }}>i</span>a
        </div>

        <h2 style={s.title}>{isLogin ? 'Bienvenido' : 'Crear cuenta'}</h2>

        <form onSubmit={handleSubmit} style={s.form}>
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
            <input
              id="login-password"
              style={s.input}
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              onFocus={e => e.target.style.setProperty('border-color', 'var(--gr)')}
              onBlur={e => e.target.style.setProperty('border-color', 'var(--bd2)')}
            />
          </div>

          {error && (
            <div style={s.errorBanner}>
              {error}
            </div>
          )}

          <button style={s.btnPrimary} type="submit" disabled={loading}>
            {loading ? 'Cargando...' : isLogin ? 'Iniciar sesión' : 'Crear cuenta'}
          </button>
        </form>

        <button style={s.toggleBtn} onClick={toggleMode}>
          {isLogin
            ? '¿No tenés cuenta? Registrate'
            : '¿Ya tenés cuenta? Iniciá sesión'}
        </button>
      </div>
    </div>
  )
}

const s = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '1.5rem',
  },
  card: {
    background: 'var(--s1)',
    border: '1px solid var(--bd2)',
    borderRadius: 16,
    padding: '2.25rem 2rem',
    width: '100%',
    maxWidth: 400,
    boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
  },
  logo: {
    fontSize: 28,
    fontWeight: 700,
    letterSpacing: '-.04em',
    color: 'var(--tx)',
    textAlign: 'center',
    marginBottom: '0.5rem',
  },
  title: {
    margin: '0 0 1.75rem',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: 'var(--tx)',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
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
  toggleBtn: {
    marginTop: '1.25rem',
    width: '100%',
    background: 'none',
    border: 'none',
    color: 'var(--tx2)',
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: 'inherit',
    textAlign: 'center',
  },
}
