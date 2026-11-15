import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import TransactionModal from './TransactionModal'
import { HomeIcon, ListIcon, PinIcon, ChartIcon, PlusIcon } from './navIcons'

// Navbar flotante mobile (docs/rediseno-v2.md §3). Estilos en index.css (.mobile-nav, .nav-item, .nav-add)
const LEFT  = [
  { to: '/',             label: 'Inicio',      Icon: HomeIcon, end: true },
  { to: '/transactions', label: 'Movimientos', Icon: ListIcon },
]
const RIGHT = [
  { to: '/fijos',   label: 'Fijos',   Icon: PinIcon },
  { to: '/informe', label: 'Informe', Icon: ChartIcon },
]

function NavItem({ to, label, Icon, end }) {
  // NavLink setea aria-current="page" en la ruta activa
  return (
    <NavLink to={to} end={end} aria-label={label} title={label} className="nav-item">
      <span className="nav-item-ind">
        <span style={{ width: 22, height: 22, display: 'block' }}><Icon /></span>
      </span>
    </NavLink>
  )
}

export default function BottomNav() {
  const [showTxModal, setShowTxModal] = useState(false)

  return (
    <>
      <nav className="mobile-nav" aria-label="Navegación principal">
        {LEFT.map(item => <NavItem key={item.to} {...item} />)}

        <div className="nav-cell">
          <button
            type="button"
            className="nav-add"
            onClick={() => setShowTxModal(true)}
            aria-label="Nuevo movimiento"
            title="Nuevo movimiento"
          >
            <span style={{ width: 22, height: 22, display: 'block' }}><PlusIcon /></span>
          </button>
        </div>

        {RIGHT.map(item => <NavItem key={item.to} {...item} />)}
      </nav>

      {showTxModal && (
        <TransactionModal
          onSave={() => setShowTxModal(false)}
          onClose={() => setShowTxModal(false)}
        />
      )}
    </>
  )
}
