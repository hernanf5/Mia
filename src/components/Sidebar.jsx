import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../assets/mia.svg'
import ProfileModal from './ProfileModal'

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
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/>
    <line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/>
    <line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
)
const TagIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
    <line x1="7" y1="7" x2="7.01" y2="7"/>
  </svg>
)

const TABS = [
  { path: '/',             label: 'Dashboard',      Icon: HomeIcon,  exact: true },
  { path: '/transactions', label: 'Transacciones',  Icon: ListIcon  },
  { path: '/fijos',        label: 'Gastos Fijos',   Icon: PinIcon   },
  { path: '/informe',      label: 'Informe',        Icon: ChartIcon },
  { path: '/categories',   label: 'Categorías',     Icon: TagIcon   },
]

export default function Sidebar() {
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

  const isActive = tab => tab.exact ? pathname === tab.path : pathname.startsWith(tab.path)

  return (
    <>
      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          onSignOut={handleSignOut}
        />
      )}

      <aside className="sidebar">
        <div style={{ padding: '0 20px 24px', flexShrink: 0 }}>
          <img src={Logo} alt="Mia" style={{ width: 100, height: 100, display: 'block' }} />
        </div>

        {TABS.map(tab => {
          const active = isActive(tab)
          return (
            <button
              key={tab.path}
              className={'sidebar-nav-item' + (active ? ' active' : '')}
              onClick={() => navigate(tab.path)}
              aria-current={active ? 'page' : undefined}
            >
              <div style={{ width: 18, height: 18, flexShrink: 0 }}>
                <tab.Icon />
              </div>
              <span>{tab.label}</span>
            </button>
          )
        })}

        <div style={{ marginTop: 'auto', padding: '20px 20px 0', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#22d3ee,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: '#fff', fontWeight: 700, flexShrink: 0,
            }}>{initial}</div>
            <span style={{ fontSize: 12, color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </span>
          </div>
          <button
            onClick={() => setShowProfile(true)}
            style={{
              width: '100%', padding: '8px', borderRadius: 8,
              background: 'var(--s2)', border: '1px solid var(--bd2)',
              color: 'var(--tx2)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit', marginBottom: 4,
            }}
          >
            Perfil y tema
          </button>
        </div>
      </aside>
    </>
  )
}
