import { Outlet } from 'react-router-dom'
import StatusBar from './StatusBar'
import BottomNav from './BottomNav'

export default function Layout() {
  return (
    <div className="shell">
      <StatusBar />
      <Outlet />
      <BottomNav />
    </div>
  )
}
