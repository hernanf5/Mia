import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="9" y1="9" x2="15" y2="9"/>
    <line x1="9" y1="13" x2="15" y2="13"/>
    <line x1="9" y1="17" x2="12" y2="17"/>
  </svg>
)

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="17" x2="12" y2="22"/>
    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
  </svg>
)

const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)

const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)

const TABS = [
  { path: '/',             label: 'Inicio', Icon: HomeIcon, exact: true },
  { path: '/transactions', label: 'Gastos', Icon: ListIcon },
  { path: '/fijos',        label: 'Fijos',  Icon: PinIcon  },
  { path: '/informe',      label: 'Informe', Icon: ChartIcon },
  { path: '/categories',   label: 'Categ.', Icon: TagIcon  },
]

export default function BottomNav() {
  const navigate     = useNavigate()
  const { pathname } = useLocation()
  const { user, signOut } = useAuth()
  const [showProfile, setShowProfile] = useState(false)

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  async function handleSignOut() {
    setShowProfile(false)
    await signOut()
    navigate('/login')
  }

  const isActive = (tab) =>
    tab.exact ? pathname === tab.path : pathname.startsWith(tab.path)

  return (
    <>
      {showProfile && (
        <div
          onClick={() => setShowProfile(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 150 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              bottom: 68,
              right: 12,
              background: '#1a1a1a',
              border: '1px solid #27272a',
              borderRadius: 12,
              padding: '1rem',
              minWidth: 220,
              boxShadow: '0 -4px 24px rgba(0,0,0,.6)',
            }}
          >
            <p style={{
              color: '#71717a',
              fontSize: '0.78rem',
              margin: '0 0 0.75rem',
              wordBreak: 'break-all',
            }}>
              {user?.email}
            </p>
            <button
              onClick={handleSignOut}
              style={{
                width: '100%',
                background: 'rgba(244,63,94,.1)',
                border: '1px solid rgba(244,63,94,.25)',
                color: '#f43f5e',
                borderRadius: 8,
                padding: '0.6rem',
                fontSize: '0.88rem',
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <nav className="mobile-nav" style={{
        height: 60,
        background: '#111',
        borderTop: '1px solid #1c1c1c',
        display: 'flex',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
      }}>
        {TABS.map((tab) => {
          const active = isActive(tab)
          return (
            <button
              key={tab.path}
              onClick={() => { setShowProfile(false); navigate(tab.path) }}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: active ? 'var(--gr)' : '#404040',
                transition: 'color .15s',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ width: 22, height: 22 }}><tab.Icon /></div>
              <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '.02em' }}>{tab.label}</span>
            </button>
          )
        })}

        <button
          onClick={() => setShowProfile(v => !v)}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 3,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: showProfile ? '#10b981' : '#27272a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: showProfile ? '#000' : '#888',
            transition: 'background .15s, color .15s',
            flexShrink: 0,
          }}>
            {initial}
          </div>
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            letterSpacing: '.02em',
            color: showProfile ? 'var(--gr)' : '#404040',
            transition: 'color .15s',
          }}>
            Perfil
          </span>
        </button>
      </nav>
    </>
  )
}
