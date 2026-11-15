import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../assets/mia.svg'
import ProfileModal from './ProfileModal'
import TransactionModal from './TransactionModal'
import { HomeIcon, ListIcon, PinIcon, ChartIcon, TagIcon, PlusIcon } from './navIcons'

// Navegación desktop (≥768px). Estilos en index.css (.sidebar, .sidebar-nav-item)
const TABS = [
  { to: '/',             label: 'Inicio',       Icon: HomeIcon, end: true },
  { to: '/transactions', label: 'Movimientos',  Icon: ListIcon },
  { to: '/fijos',        label: 'Gastos fijos', Icon: PinIcon },
  { to: '/informe',      label: 'Informe',      Icon: ChartIcon },
  { to: '/categories',   label: 'Categorías',   Icon: TagIcon },
]

export default function Sidebar() {
  const { user } = useAuth()
  const [showProfile, setShowProfile] = useState(false)
  const [showTxModal, setShowTxModal] = useState(false)

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      <aside className="sidebar" aria-label="Navegación principal">
        <div style={{ padding: '0 20px 20px', flexShrink: 0 }}>
          <img src={Logo} alt="Mia" style={{ height: 32, width: 'auto', display: 'block' }} />
        </div>

        {/* En desktop no hay navbar inferior: el alta de movimientos vive acá */}
        <div style={{ padding: '0 12px 16px' }}>
          <button type="button" className="sidebar-add" onClick={() => setShowTxModal(true)}>
            <span style={{ width: 18, height: 18, display: 'block' }}><PlusIcon /></span>
            Nuevo movimiento
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
          {TABS.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => 'sidebar-nav-item' + (isActive ? ' active' : '')}
            >
              <span style={{ width: 18, height: 18, flexShrink: 0, display: 'block' }}><Icon /></span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', padding: '16px 12px 0', borderTop: '1px solid var(--bd)', flexShrink: 0 }}>
          <button
            type="button"
            className="sidebar-profile"
            onClick={() => setShowProfile(true)}
            aria-label="Abrir perfil y configuración"
          >
            <span style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--grd)', border: '1px solid var(--grb)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, color: 'var(--gr)', fontWeight: 700, flexShrink: 0,
            }}>{initial}</span>
            <span style={{ fontSize: 12, color: 'var(--tx2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </span>
          </button>
        </div>
      </aside>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
      {showTxModal && (
        <TransactionModal
          onSave={() => setShowTxModal(false)}
          onClose={() => setShowTxModal(false)}
        />
      )}
    </>
  )
}
