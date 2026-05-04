import { useState, useEffect } from 'react'
import Logo from '../assets/mia.svg'

export default function SplashScreen({ onFinish }) {
  const [phase, setPhase] = useState('favicon') // favicon | transition | logo | done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('transition'), 1200)
    const t2 = setTimeout(() => setPhase('logo'),       1700)
    const t3 = setTimeout(() => setPhase('done'),       2800)
    const t4 = setTimeout(onFinish,                     3300)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4) }
  }, [onFinish])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>

      {/* Small icon — pulses then fades out */}
      {(phase === 'favicon' || phase === 'transition') && (
        <div
          className={phase === 'favicon' ? 'animate-splash-pulse' : 'animate-splash-fade-out'}
          style={{ position: 'absolute' }}
        >
          <svg width="96" height="96" viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
            <rect width="64" height="64" rx="16" fill="#0B0B0F" />
            <path d="M20 44 L20 18 L32 34 L44 18 L44 44" fill="none" stroke="#EDEDED" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M32 16 c-1.5 -2 -5 -2 -5 1.5 c0 3.5 5 6.5 5 6.5 c0 0 5 -3 5 -6.5 c0 -3.5 -3.5 -3.5 -5 -1.5 Z" fill="#A78BFA" />
          </svg>
        </div>
      )}

      {/* Full logo — fades in then fades out */}
      {(phase === 'logo' || phase === 'done') && (
        <div
          className={phase === 'logo' ? 'animate-splash-fade-in' : 'animate-splash-fade-out'}
          style={{ position: 'absolute' }}
        >
          <img src={Logo} alt="Mia" style={{ width: 180, height: 180 }} />
        </div>
      )}

    </div>
  )
}
