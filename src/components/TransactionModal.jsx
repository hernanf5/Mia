import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '../context/AuthContext'
import { fetchSubcategories } from '../hooks/useCategories'
import { useData } from '../context/DataContext'

// Nuevo / editar movimiento (docs/rediseno-v2.md §6).
// Bottom sheet en mobile, modal centrado en desktop (.sheet* en index.css).

// Fecha local (toISOString usa UTC: en Argentina después de las 21hs daría mañana)
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const TYPES = [
  { id: 'variable', label: 'Variable', hint: 'Gasto del día a día', color: 'var(--pu)', tint: 'var(--pud)', cta: 'Guardar gasto' },
  { id: 'fixed',    label: 'Fijo',     hint: 'Se repite cada mes',  color: 'var(--am)', tint: 'var(--amd)', cta: 'Agregar a fijos del mes' },
  { id: 'income',   label: 'Ingreso',  hint: 'Sueldo, extras',      color: 'var(--gr)', tint: 'var(--grd)', cta: 'Guardar ingreso' },
]

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/>
  </svg>
)

export default function TransactionModal({ transaction = null, onSave, onClose }) {
  const { user } = useAuth()
  const { createTransaction, updateTransaction, categories, loadingCategories } = useData()
  const ids = useId()
  const sheetRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  // Al editar, el tipo sale de la categoría (viene en el join de la transacción)
  const initialType = transaction?.category?.type
    ?? categories.find(c => c.id === transaction?.category_id)?.type
    ?? 'variable'

  const [type,          setType]          = useState(initialType)
  const [amount,        setAmount]        = useState(transaction ? Math.abs(Number(transaction.amount)).toString() : '')
  const [description,   setDesc]          = useState(transaction?.description ?? '')
  const [date,          setDate]          = useState(transaction?.date ?? today())
  const [categoryId,    setCategoryId]    = useState(transaction?.category_id ?? '')
  const [subcategoryId, setSubcategoryId] = useState(transaction?.subcategory_id ?? '')
  const [observations,  setObs]           = useState(transaction?.observations ?? '')
  const [showObs,       setShowObs]       = useState(Boolean(transaction?.observations))
  const [subcategories, setSubcategories] = useState([])
  const [error,         setError]         = useState(null)
  const [loading,       setLoading]       = useState(false)

  const typeMeta    = TYPES.find(t => t.id === type) ?? TYPES[0]
  const typeCats    = categories.filter(c => c.type === type)
  const selectedCat = categories.find(c => c.id === categoryId)

  // Subcategorías de la categoría elegida
  useEffect(() => {
    if (!categoryId) return
    let cancelled = false
    fetchSubcategories(categoryId).then(({ data }) => {
      if (!cancelled) setSubcategories(data ?? [])
    })
    return () => { cancelled = true }
  }, [categoryId])

  // Al abrir: foco en el sheet (teclado / lectores de pantalla) y Escape para cerrar
  useEffect(() => {
    sheetRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onCloseRef.current() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  function selectType(next) {
    if (next === type) return
    setType(next)
    // La categoría elegida ya no pertenece al tipo nuevo
    if (selectedCat && selectedCat.type !== next) selectCategory('')
  }

  function selectCategory(id) {
    setCategoryId(id)
    setSubcategoryId('')
    setSubcategories([])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || num <= 0) { setError('Monto inválido'); return }
    if (!categoryId)                       { setError('Seleccioná una categoría'); return }
    if (!date)                             { setError('Fecha requerida'); return }
    setError(null)
    setLoading(true)

    // Signo según el tipo de la categoría (sin cambios respecto de la lógica anterior)
    const finalAmount = selectedCat?.type === 'income' ? num : -num

    const payload = {
      amount:         finalAmount,
      description:    description.trim() || null,
      date,
      category_id:    categoryId,
      subcategory_id: subcategoryId || null,
      observations:   observations.trim() || null,
      user_id:        user.id,
    }

    const { data: saved, error: dbErr } = transaction
      ? await updateTransaction(transaction, payload)
      : await createTransaction(payload)

    setLoading(false)
    if (dbErr) { setError(dbErr.message); return }
    onSave?.(saved)
  }

  // Portal a <body>: si se renderiza dentro de .main-content (stacking context propio)
  // el z-index del overlay no alcanza para quedar sobre la nav flotante
  return createPortal(
    <div className="sheet-overlay" onClick={onClose}>
      <div
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${ids}-title`}
        tabIndex={-1}
        onClick={e => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />

        <div style={s.header}>
          <h2 id={`${ids}-title`} style={s.title}>
            {transaction ? 'Editar movimiento' : '¿Qué querés cargar?'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={s.closeBtn}><CloseIcon /></button>
        </div>

        <form onSubmit={handleSubmit} style={s.form} noValidate>
          <div style={s.body}>

            {/* Paso 1 — Tipo */}
            <div role="radiogroup" aria-label="Tipo de movimiento" style={s.typeGrid}>
              {TYPES.map(t => {
                const active = t.id === type
                return (
                  <button
                    key={t.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => selectType(t.id)}
                    style={{
                      ...s.typeCard,
                      background: active ? t.tint : 'var(--s2)',
                      border: active ? `2px solid ${t.color}` : '1px solid var(--bd2)',
                      padding: active ? '11px 9px' : '12px 10px',  // compensa el borde de 2px
                    }}
                  >
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color }} aria-hidden="true" />
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>{t.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--tx2)', lineHeight: 1.3 }}>{t.hint}</span>
                  </button>
                )
              })}
            </div>

            {/* Monto */}
            <div>
              <label htmlFor={`${ids}-amount`} style={s.label}>Monto</label>
              <div style={{ ...s.amountWrap, border: `2px solid ${typeMeta.color}` }}>
                <span className="mono" style={{ fontSize: 22, color: 'var(--tx2)' }} aria-hidden="true">$</span>
                <input
                  id={`${ids}-amount`}
                  className="mono"
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0"
                  style={s.amountInput}
                />
              </div>
            </div>

            {/* Categoría (filtrada por tipo) */}
            <div>
              <div id={`${ids}-cat`} style={s.label}>Categoría</div>
              {loadingCategories ? (
                <p style={s.muted}>Cargando categorías…</p>
              ) : typeCats.length === 0 ? (
                <p style={s.muted}>No tenés categorías de tipo {typeMeta.label.toLowerCase()}. Creá una desde Perfil → Categorías.</p>
              ) : (
                <div role="radiogroup" aria-labelledby={`${ids}-cat`} style={s.chips}>
                  {typeCats.map(c => (
                    <Chip key={c.id} active={c.id === categoryId} onClick={() => selectCategory(c.id)}>
                      {c.name}
                    </Chip>
                  ))}
                </div>
              )}
            </div>

            {/* Subcategoría (solo si la categoría tiene) */}
            {categoryId && subcategories.length > 0 && (
              <div>
                <div id={`${ids}-sub`} style={s.label}>Subcategoría <span style={{ color: 'var(--tx3)' }}>(opcional)</span></div>
                <div role="radiogroup" aria-labelledby={`${ids}-sub`} style={s.chips}>
                  {subcategories.map(sub => (
                    <Chip
                      key={sub.id}
                      active={sub.id === subcategoryId}
                      onClick={() => setSubcategoryId(prev => (prev === sub.id ? '' : sub.id))}
                    >
                      {sub.name}
                    </Chip>
                  ))}
                </div>
              </div>
            )}

            {type === 'fixed' && (
              <p style={s.fixedNotice}>
                Queda pendiente en Fijos y se descuenta del disponible cuando lo marques como pagado.
              </p>
            )}

            {/* Descripción + Fecha */}
            <div style={s.twoCols}>
              <div style={{ minWidth: 0 }}>
                <label htmlFor={`${ids}-desc`} style={s.label}>Descripción</label>
                <input
                  id={`${ids}-desc`}
                  style={s.input}
                  value={description}
                  onChange={e => setDesc(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div style={{ minWidth: 0 }}>
                <label htmlFor={`${ids}-date`} style={s.label}>Fecha</label>
                <input
                  id={`${ids}-date`}
                  style={s.input}
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Observaciones (colapsadas) */}
            {showObs ? (
              <div>
                <label htmlFor={`${ids}-obs`} style={s.label}>Observaciones</label>
                <textarea
                  id={`${ids}-obs`}
                  style={{ ...s.input, resize: 'none', minHeight: 72, padding: '12px 14px' }}
                  value={observations}
                  onChange={e => setObs(e.target.value)}
                  placeholder="Nota adicional…"
                  rows={2}
                  autoFocus={!transaction?.observations}
                />
              </div>
            ) : (
              <button type="button" onClick={() => setShowObs(true)} style={s.addObs}>
                + Agregar observación
              </button>
            )}

            {error && <p role="alert" style={s.error}>{error}</p>}
          </div>

          <div style={s.footer}>
            <button type="submit" disabled={loading} style={{ ...s.btnPrimary, opacity: loading ? .7 : 1 }}>
              {loading ? 'Guardando…' : typeMeta.cta}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      style={{
        ...s.chip,
        background:  active ? 'var(--tx)' : 'var(--s2)',
        color:       active ? 'var(--bg)' : 'var(--tx)',
        borderColor: active ? 'var(--tx)' : 'var(--bd2)',
      }}
    >
      {children}
    </button>
  )
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '8px 12px 4px 20px', flexShrink: 0,
  },
  title: { fontSize: 18, fontWeight: 700, color: 'var(--tx)' },
  closeBtn: {
    width: 44, height: 44, borderRadius: 14, flexShrink: 0,
    background: 'none', border: 'none', color: 'var(--tx2)', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  form: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 },
  body: {
    flex: 1, overflowY: 'auto', overscrollBehavior: 'contain',
    padding: '12px 20px 16px',
    display: 'flex', flexDirection: 'column', gap: 18,
  },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--tx2)', marginBottom: 8 },
  muted: { fontSize: 13, color: 'var(--tx2)', lineHeight: 1.5 },
  typeGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8 },
  typeCard: {
    minHeight: 92, borderRadius: 14, cursor: 'pointer', fontFamily: 'inherit',
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4, textAlign: 'left',
  },
  amountWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--s2)', borderRadius: 14, padding: '0 16px', minHeight: 64,
  },
  amountInput: {
    flex: 1, minWidth: 0, background: 'none', border: 'none', outline: 'none',
    fontSize: 30, fontWeight: 700, color: 'var(--tx)', padding: '10px 0',
  },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44, padding: '0 16px', borderRadius: 22,
    border: '1px solid', fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
    cursor: 'pointer', transition: 'background .12s, color .12s',
  },
  fixedNotice: {
    fontSize: 13, lineHeight: 1.5, color: 'var(--tx)',
    background: 'var(--amd)', border: '1px solid color-mix(in srgb, var(--am) 28%, transparent)',
    borderRadius: 14, padding: '12px 14px',
  },
  twoCols: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 },
  input: {
    width: '100%', minHeight: 48, padding: '0 14px',
    background: 'var(--s2)', border: '1px solid var(--bd2)', borderRadius: 14,
    color: 'var(--tx)', fontSize: 15, fontFamily: 'inherit', outline: 'none',
  },
  addObs: {
    alignSelf: 'flex-start', minHeight: 44, padding: '0 4px',
    background: 'none', border: 'none', color: 'var(--gr)',
    fontSize: 14, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
  },
  error: { color: 'var(--re)', fontSize: 13 },
  footer: {
    flexShrink: 0, borderTop: '1px solid var(--bd)',
    padding: '12px 20px calc(16px + env(safe-area-inset-bottom))',
  },
  btnPrimary: {
    width: '100%', height: 56, borderRadius: 14, border: 'none',
    background: 'var(--gr)', color: 'var(--on-accent)',
    fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer',
  },
}
