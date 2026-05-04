import { useEffect, useRef, useState } from 'react'

const ChevDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
)

export default function MultiSelectDropdown({ label, options, selected, onToggle, renderOption }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const count = selected.size

  useEffect(() => {
    if (!open) return
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 10,
          background: count > 0 ? 'var(--grd)' : 'var(--s2)',
          border: `1px solid ${count > 0 ? 'var(--grb)' : 'var(--bd2)'}`,
          color: count > 0 ? 'var(--gr)' : 'var(--tx2)',
          fontSize: 13, fontWeight: 500, cursor: 'pointer',
          fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all .12s',
        }}
      >
        {label}{count > 0 ? ` (${count})` : ''}
        <span style={{ transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'none', display: 'flex' }}>
          <ChevDown />
        </span>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0,
          background: '#1a1a1a', border: '1px solid #3f3f46',
          borderRadius: 12, padding: '6px 0',
          minWidth: 210, maxWidth: 290,
          maxHeight: 280, overflowY: 'auto',
          zIndex: 300, boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          scrollbarWidth: 'none',
        }}>
          {options.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--tx3)' }}>Sin opciones</div>
          ) : options.map(opt => {
            const on = selected.has(opt.id)
            return (
              <button
                key={opt.id}
                onClick={() => onToggle(opt.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '8px 14px',
                  background: on ? 'rgba(16,185,129,.06)' : 'none',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  textAlign: 'left', transition: 'background .1s',
                }}
              >
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `1.5px solid ${on ? 'var(--gr)' : 'var(--bd2)'}`,
                  background: on ? 'var(--grd)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all .12s',
                }}>
                  {on && (
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--gr)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                {renderOption(opt)}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
