import { useEffect, useState } from 'react'

const TYPE_OPTIONS = [
  { value: 'income', label: 'Ingreso' },
  { value: 'fixed', label: 'Gasto fijo' },
  { value: 'variable', label: 'Variable' },
]

export default function CategoryModal({ category, onSave, onClose }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('variable')
  const [color, setColor] = useState('#10b981')
  const [icon, setIcon] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (category) {
      setName(category.name)
      setType(category.type)
      setColor(category.color)
      setIcon(category.icon ?? '')
    }
  }, [category])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setError(null)
    setLoading(true)
    const result = await onSave({ name: name.trim(), type, color, icon: icon.trim() || null })
    setLoading(false)
    if (result?.error) setError(result.error.message ?? 'Error al guardar')
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h3 style={s.title}>{category ? 'Editar categoría' : 'Nueva categoría'}</h3>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.scrollBody}>
            <label style={s.label} htmlFor="cat-nombre">Nombre</label>
            <input
              id="cat-nombre"
              style={s.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Supermercado"
              autoFocus
            />

            <label style={s.label} htmlFor="cat-tipo">Tipo</label>
            <select id="cat-tipo" style={s.input} value={type} onChange={e => setType(e.target.value)}>
              {TYPE_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <label style={s.label} htmlFor="cat-color">Color</label>
            <div style={s.colorRow}>
              <input
                id="cat-color"
                type="color"
                style={s.colorPicker}
                value={color}
                onChange={e => setColor(e.target.value)}
              />
              <span style={s.colorHex}>{color}</span>
            </div>

            <label style={s.label} htmlFor="cat-icono">Ícono (opcional)</label>
            <input
              id="cat-icono"
              style={s.input}
              value={icon}
              onChange={e => setIcon(e.target.value)}
              placeholder="Ej: shopping-cart"
            />

            {error && <p style={s.error}>{error}</p>}
          </div>

          <div style={s.footer}>
            <button type="button" style={s.btnSecondary} onClick={onClose}>Cancelar</button>
            <button type="submit" style={s.btnPrimary} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 300,
    padding: '16px',
  },
  modal: {
    background: 'rgba(15,25,20,0.97)',
    backdropFilter: 'blur(30px) saturate(150%)',
    WebkitBackdropFilter: 'blur(30px) saturate(150%)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 24,
    width: '100%', maxWidth: 480,
    boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
    maxHeight: '85vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  title: { color: 'var(--tx)', padding: '1.5rem 1.5rem 1rem', fontSize: '1.1rem', fontWeight: 600, flexShrink: 0, margin: 0 },
  form: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
  scrollBody: { flex: 1, overflowY: 'auto', padding: '0 1.5rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { color: 'var(--tx2)', fontSize: '0.8rem' },
  input: {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '8px',
    color: 'var(--tx)', padding: '0.6rem 0.75rem', fontSize: '0.95rem', outline: 'none',
    fontFamily: 'inherit', width: '100%',
  },
  colorRow: { display: 'flex', alignItems: 'center', gap: '0.75rem' },
  colorPicker: { width: '48px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', padding: 0 },
  colorHex: { color: 'var(--tx2)', fontSize: '0.85rem', fontFamily: 'monospace' },
  error: { color: 'var(--re)', fontSize: '0.82rem', margin: '0.25rem 0 0' },
  footer: { display: 'flex', gap: '0.75rem', padding: '0.75rem 1.5rem 1.25rem', borderTop: '1px solid var(--bd)', flexShrink: 0 },
  btnPrimary: {
    flex: 1, padding: '0.65rem', background: 'var(--gr)', color: '#000',
    border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSecondary: {
    flex: 1, padding: '0.65rem', background: 'var(--s2)', color: 'var(--tx)',
    border: '1px solid var(--bd2)', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
  },
}
