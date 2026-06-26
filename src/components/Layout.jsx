import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'
import { useTheme } from '../context/ThemeContext'

const blobBase = {
  position: 'fixed',
  borderRadius: '50%',
  pointerEvents: 'none',
  zIndex: 0,
}

export default function Layout() {
  const { themeConfig } = useTheme()

  useEffect(() => {
    document.body.style.background = themeConfig.bg
    return () => { document.body.style.background = '' }
  }, [themeConfig.bg])

  return (
    <div className="shell" style={{ background: themeConfig.bg }}>
      <div style={{ ...blobBase, top: '-160px', left: '-120px', width: '560px', height: '560px', background: themeConfig.blob1, filter: 'blur(40px)', animation: 'miaFloat 18s ease-in-out infinite' }} />
      <div style={{ ...blobBase, bottom: '-200px', right: '-140px', width: '620px', height: '620px', background: themeConfig.blob2, filter: 'blur(46px)', animation: 'miaFloat2 22s ease-in-out infinite' }} />
      <div style={{ ...blobBase, top: '34%', right: '24%', width: '340px', height: '340px', background: themeConfig.blob3, filter: 'blur(40px)', animation: 'miaFloat 26s ease-in-out infinite' }} />
      <Sidebar />
      <div className="main-content">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  )
}
