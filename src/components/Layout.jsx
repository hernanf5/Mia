import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

const blobBase = {
  position: 'fixed',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 0,
}

export default function Layout() {
  return (
    <div className="shell">
      <div style={{ ...blobBase, top: '-160px', left: '-120px', width: '560px', height: '560px', background: 'radial-gradient(circle,rgba(16,185,129,0.42),transparent 66%)', filter: 'blur(40px)', animation: 'miaFloat 18s ease-in-out infinite' }} />
      <div style={{ ...blobBase, bottom: '-200px', right: '-140px', width: '620px', height: '620px', background: 'radial-gradient(circle,rgba(34,211,238,0.34),transparent 66%)', filter: 'blur(46px)', animation: 'miaFloat2 22s ease-in-out infinite' }} />
      <div style={{ ...blobBase, top: '34%', right: '24%', width: '340px', height: '340px', background: 'radial-gradient(circle,rgba(45,212,191,0.20),transparent 70%)', filter: 'blur(40px)', animation: 'miaFloat 26s ease-in-out infinite' }} />
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
