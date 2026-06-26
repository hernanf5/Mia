import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

const THEMES_META = {
  aurora:   { label: 'Aurora',   dots: ['#10b981', '#22d3ee', '#2dd4bf'] },
  obsidian: { label: 'Obsidian', dots: ['#2dd4bf', '#6366f1', '#2dd4bf'] },
  nebula:   { label: 'Nebula',   dots: ['#a855f7', '#3b82f6', '#2dd4bf'] },
}

export default function ProfileModal({ onClose, onSignOut }) {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()

  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(255,255,255,0.07)',
          backdropFilter: 'blur(30px) saturate(150%)',
          WebkitBackdropFilter: 'blur(30px) saturate(150%)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 26,
          padding: 28,
          maxWidth: 420,
          width: 'calc(100% - 32px)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'linear-gradient(135deg,#22d3ee,#a855f7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20, fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>{initial}</div>
            <span style={{ color: 'var(--tx3)', fontSize: 13 }}>{user?.email}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--tx3)', padding: 4, fontSize: 20, lineHeight: 1,
              fontFamily: 'inherit',
            }}
          >✕</button>
        </div>

        <div style={{ height: 1, background: 'var(--bd)', marginBottom: 20 }} />

        <p className="slbl" style={{ marginBottom: 12 }}>Tema</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {Object.entries(THEMES_META).map(([key, meta]) => {
            const active = theme === key
            return (
              <button
                key={key}
                onClick={() => setTheme(key)}
                style={{
                  flex: 1, padding: '10px 8px', borderRadius: 14,
                  background: active ? 'var(--grd)' : 'var(--s2)',
                  border: `1px solid ${active ? 'var(--gr)' : 'var(--bd2)'}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 4 }}>
                  {meta.dots.map((c, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                  ))}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? 'var(--gr)' : 'var(--tx2)' }}>
                  {meta.label}
                </span>
              </button>
            )
          })}
        </div>

        <button
          onClick={onSignOut}
          style={{
            width: '100%', padding: 10, borderRadius: 12,
            background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
            color: 'var(--re)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
