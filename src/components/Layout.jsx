import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

// Fondo plano: el color sale de var(--bg) en .shell (index.css)
export default function Layout() {
  return (
    <div className="shell">
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
