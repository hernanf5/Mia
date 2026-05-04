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
        <div style={s.header}>
          <h3 style={s.title}>{subcategory ? 'Editar subcategoría' : 'Nueva subcategoría'}</h3>
          {categoryName && <p style={s.parent}>en {categoryName}</p>}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={s.form}>
            <label style={s.label} htmlFor="subcat-nombre">Nombre</label>
            <input
              id="subcat-nombre"
              style={s.input}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Carnicería"
              autoFocus
            />
            {error && <p style={s.error}>{error}</p>}
          </div>
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
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: 'var(--s1)', borderRadius: '16px 16px 0 0',
    width: '100%', maxWidth: '430px',
    boxShadow: '0 -4px 32px rgba(0,0,0,0.6)',
    maxHeight: '90vh', overflowY: 'auto',
    paddingBottom: '80px',
  },
  header: { padding: '1.5rem 1.5rem 0' },
  title: { color: 'var(--tx)', margin: '0 0 0.25rem', fontSize: '1.1rem', fontWeight: 600 },
  parent: { color: 'var(--tx2)', fontSize: '0.82rem', margin: '0 0 1.25rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0 1.5rem' },
  label: { color: 'var(--tx2)', fontSize: '0.8rem' },
  input: {
    background: 'var(--bg)', border: '1px solid var(--bd2)', borderRadius: '8px',
    color: 'var(--tx)', padding: '0.6rem 0.75rem', fontSize: '0.95rem', outline: 'none',
    fontFamily: 'inherit', width: '100%',
  },
  error: { color: 'var(--re)', fontSize: '0.82rem', margin: '0.25rem 0 0' },
  actions: {
    position: 'sticky', bottom: 0,
    display: 'flex', gap: '0.75rem',
    padding: '1rem 1.5rem',
    background: 'var(--s1)',
    borderTop: '1px solid var(--bd)',
    marginTop: '0.75rem',
  },
  btnPrimary: {
    flex: 1, padding: '0.65rem', background: 'var(--gr)', color: '#000',
    border: 'none', borderRadius: '8px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSecondary: {
    flex: 1, padding: '0.65rem', background: 'var(--s2)', color: 'var(--tx)',
    border: '1px solid var(--bd2)', borderRadius: '8px', fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
  },
}
