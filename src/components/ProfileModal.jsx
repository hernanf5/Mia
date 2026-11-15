import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { THEMES, useTheme } from '../context/ThemeContext'
import { supabase } from '../lib/supabaseClient'

const ChevronIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

// Perfil: Categorías · Tema · WhatsApp · Cerrar sesión (docs/rediseno-v2.md §3)
export default function ProfileModal({ onClose }) {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()

  const [waPhone, setWaPhone] = useState(null)
  const [phoneInput, setPhoneInput] = useState('')
  const [waError, setWaError] = useState(null)
  const [waBusy, setWaBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from('whatsapp_users')
      .select('phone')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => setWaPhone(data?.phone ?? null))
  }, [user])

  async function handleLink() {
    const normalized = phoneInput.replace(/[\s\-()]/g, '')
    if (!/^\+\d{8,15}$/.test(normalized)) {
      setWaError('Formato inválido. Usá formato internacional: +5492657604851')
      return
    }
    setWaError(null)
    setWaBusy(true)
    const { error } = await supabase
      .from('whatsapp_users')
      .insert({ phone: `whatsapp:${normalized}`, user_id: user.id })
    setWaBusy(false)
    if (error) {
      setWaError(error.code === '23505' ? 'Ese número ya está vinculado a otra cuenta' : 'No se pudo vincular el número')
      return
    }
    setWaPhone(`whatsapp:${normalized}`)
    setPhoneInput('')
  }

  async function handleUnlink() {
    setWaBusy(true)
    const { error } = await supabase
      .from('whatsapp_users')
      .delete()
      .eq('user_id', user.id)
    setWaBusy(false)
    if (error) {
      setWaError('No se pudo desvincular el número')
      return
    }
    setWaError(null)
    setWaPhone(null)
  }

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  function goToCategories() {
    onClose()
    navigate('/categories')
  }

  async function handleSignOut() {
    onClose()
    await signOut()
    navigate('/login')
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'var(--overlay)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--surface)',
          border: '1px solid var(--bd)',
          boxShadow: 'var(--shadow)',
          borderRadius: 20,
          padding: 28,
          maxWidth: 420,
          width: 'calc(100% - 32px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'var(--grd)', border: '1px solid var(--grb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: 'var(--gr)', flexShrink: 0,
            }}>{initial}</div>
            <span style={{ color: 'var(--tx2)', fontSize: 13 }}>{user?.email}</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--tx2)', width: 44, height: 44, margin: -10, fontSize: 20, lineHeight: 1,
              fontFamily: 'inherit',
            }}
          >✕</button>
        </div>

        <div style={{ height: 1, background: 'var(--bd)', marginBottom: 20 }} />

        <button
          type="button"
          onClick={goToCategories}
          style={{
            width: '100%', minHeight: 48, padding: '0 14px', borderRadius: 14, marginBottom: 24,
            background: 'var(--s2)', border: '1px solid var(--bd2)',
            color: 'var(--tx)', fontSize: 14, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          Categorías
          <span style={{ color: 'var(--tx2)', display: 'flex' }}><ChevronIcon /></span>
        </button>

        <p className="slbl" id="theme-label" style={{ marginBottom: 12 }}>Tema</p>
        <div role="radiogroup" aria-labelledby="theme-label" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8, marginBottom: 24 }}>
          {THEMES.map(({ id, label }) => {
            const active = theme === id
            return (
              <button
                key={id}
                role="radio"
                aria-checked={active}
                onClick={() => setTheme(id)}
                style={{
                  padding: 6, borderRadius: 14, minHeight: 44,
                  background: active ? 'var(--grd)' : 'var(--s2)',
                  border: `${active ? 2 : 1}px solid ${active ? 'var(--gr)' : 'var(--bd2)'}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 6,
                }}
              >
                {/* Swatch: data-theme hace que var(--bg)/var(--gr) resuelvan a ese tema */}
                <div
                  data-theme={id}
                  aria-hidden="true"
                  style={{
                    height: 36, borderRadius: 10,
                    background: 'var(--bg)', border: '1px solid var(--bd2)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end', padding: 6,
                  }}
                >
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: 'var(--gr)' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--gr)' : 'var(--tx2)' }}>
                  {label}
                </span>
              </button>
            )
          })}
        </div>

        <p className="slbl" style={{ marginBottom: 12 }}>WhatsApp</p>
        {waPhone ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <span style={{
              flex: 1, padding: '10px 12px', borderRadius: 12,
              background: 'var(--grd)', border: '1px solid var(--grb)',
              color: 'var(--gr)', fontSize: 13, fontWeight: 500,
            }}>
              ✓ {waPhone.replace('whatsapp:', '')}
            </span>
            <button
              onClick={handleUnlink}
              disabled={waBusy}
              style={{
                padding: '10px 14px', borderRadius: 12,
                background: 'var(--s2)', border: '1px solid var(--bd2)',
                color: 'var(--tx2)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Desvincular
            </button>
          </div>
        ) : (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={phoneInput}
                onChange={e => setPhoneInput(e.target.value)}
                placeholder="+5492657604851"
                inputMode="tel"
                aria-label="Número de WhatsApp"
                style={{
                  flex: 1, minWidth: 0, padding: '10px 12px', borderRadius: 12,
                  background: 'var(--s2)', border: '1px solid var(--bd2)',
                  color: 'var(--tx)', fontSize: 13, outline: 'none', fontFamily: 'inherit',
                }}
                onFocus={e => e.target.style.setProperty('border-color', 'var(--gr)')}
                onBlur={e => e.target.style.setProperty('border-color', 'var(--bd2)')}
              />
              <button
                onClick={handleLink}
                disabled={waBusy}
                style={{
                  padding: '10px 14px', borderRadius: 12,
                  background: 'var(--gr)', border: 'none',
                  color: 'var(--on-accent)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                {waBusy ? '...' : 'Vincular'}
              </button>
            </div>
            <p style={{ color: 'var(--tx3)', fontSize: 11, margin: '8px 0 0' }}>
              Vinculá tu número para registrar gastos mandando un mensaje de WhatsApp.
            </p>
          </div>
        )}
        {waError && (
          <p style={{ color: 'var(--re)', fontSize: 12, margin: '-16px 0 16px' }}>{waError}</p>
        )}

        <button
          onClick={handleSignOut}
          style={{
            width: '100%', padding: 10, borderRadius: 12,
            background: 'var(--red)', border: '1px solid color-mix(in srgb, var(--re) 25%, transparent)',
            color: 'var(--re)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
