import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

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
