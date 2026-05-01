import { useEffect, useState } from 'react'

export default function SubcategoryModal({ subcategory, categoryName, onSave, onClose }) {
  const [name, setName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (subcategory) setName(subcategory.name)
  }, [subcategory])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es requerido'); return }
    setError(null)
    setLoading(true)
    await onSave({ name: name.trim() })
    setLoading(false)
  }

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h3 style={s.title}>{subcategory ? 'Editar subcategoría' : 'Nueva subcategoría'}</h3>
        {categoryName && <p style={s.parent}>en {categoryName}</p>}

        <form onSubmit={handleSubmit} style={s.form}>
          <label style={s.label}>Nombre</label>
          <input
            style={s.input}
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ej: Carnicería"
            autoFocus
          />
          {error && <p style={s.error}>{error}</p>}
          <div style={s.actions}>
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
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 100,
  },
  modal: {
    background: '#1a1a1a', borderRadius: '16px 16px 0 0',
    padding: '1.5rem', width: '100%', maxWidth: '430px',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
  },
  title: { color: '#f5f5f5', margin: '0 0 0.25rem', fontSize: '1.1rem' },
  parent: { color: '#71717a', fontSize: '0.82rem', margin: '0 0 1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  label: { color: '#71717a', fontSize: '0.8rem' },
  input: {
    background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: '8px',
    color: '#f5f5f5', padding: '0.6rem 0.75rem', fontSize: '0.95rem', outline: 'none',
  },
  error: { color: '#f43f5e', fontSize: '0.82rem', margin: '0.25rem 0 0' },
  actions: { display: 'flex', gap: '0.75rem', marginTop: '0.75rem' },
  btnPrimary: {
    flex: 1, padding: '0.65rem', background: '#10b981', color: '#fff',
    border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer',
  },
  btnSecondary: {
    flex: 1, padding: '0.65rem', background: '#2a2a2a', color: '#f5f5f5',
    border: 'none', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer',
  },
}
