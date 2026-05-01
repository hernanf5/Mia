export default function StatusBar() {
  const now = new Date()
  const time = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })

  return (
    <div style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx)' }}>{time}</span>
      <span style={{ display: 'flex', gap: 6, alignItems: 'center', color: '#666' }}>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor">
          <rect x="0" y="4" width="3" height="7" rx="1"/>
          <rect x="4" y="2.5" width="3" height="8.5" rx="1"/>
          <rect x="8" y="1" width="3" height="10" rx="1"/>
          <rect x="12" y="0" width="3" height="11" rx="1" opacity=".3"/>
        </svg>
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
          <rect x=".5" y=".5" width="20" height="11" rx="3" stroke="#555"/>
          <rect x="2" y="2" width="14" height="8" rx="1.5" fill="#888"/>
          <path d="M22 4v4a2 2 0 0 0 0-4z" fill="#555"/>
        </svg>
      </span>
    </div>
  )
}
