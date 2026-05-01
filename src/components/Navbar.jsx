import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { to: '/', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/categories', label: 'Categories' },
]

export default function Navbar() {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>💸 Mia</span>
      <div style={styles.links}>
        {links.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            style={({ isActive }) => ({
              ...styles.link,
              ...(isActive ? styles.active : {}),
            })}
          >
            {label}
          </NavLink>
        ))}
        <button style={styles.signOut} onClick={handleSignOut}>
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}

const styles = {
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1.5rem',
    background: '#1a1a2e',
    color: '#fff',
  },
  brand: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
  },
  links: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
  },
  link: {
    color: '#ccc',
    textDecoration: 'none',
    fontSize: '0.95rem',
  },
  active: {
    color: '#fff',
    fontWeight: 'bold',
    borderBottom: '2px solid #e94560',
    paddingBottom: '2px',
  },
  signOut: {
    background: 'none',
    border: '1px solid #555',
    color: '#ccc',
    padding: '0.3rem 0.75rem',
    borderRadius: '5px',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
}
