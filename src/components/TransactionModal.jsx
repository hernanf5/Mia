import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useCategories } from '../hooks/useCategories'
import { useTransactions } from '../hooks/useTransactions'

const today = () => new Date().toISOString().slice(0, 10)

export default function TransactionModal({ transaction = null, onSave, onClose }) {
  const { user }            = useAuth()
  const { fetchCategories, fetchSubcategories } = useCategories()
  const { createTransaction, updateTransaction } = useTransactions()

  const [categories,    setCategories]    = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [amount,        setAmount]        = useState(transaction ? Math.abs(Number(transaction.amount)).toString() : '')
  const [description,   setDesc]          = useState(transaction?.description ?? '')
  const [date,          setDate]          = useState(transaction?.date ?? today())
  const [categoryId,    setCategoryId]    = useState(transaction?.category_id ?? '')
  const [subcategoryId, setSubcategoryId] = useState(transaction?.subcategory_id ?? '')
  const [observations,  setObs]           = useState(transaction?.observations ?? '')
  const [error,         setError]         = useState(null)
  const [loading,       setLoading]       = useState(false)

  useEffect(() => {
    fetchCategories().then(({ data }) => setCategories(data ?? []))
  }, [])

  useEffect(() => {
    if (!categoryId) { setSubcategories([]); return }
    fetchSubcategories(categoryId).then(({ data }) => {
      setSubcategories(data ?? [])
      if (!transaction || transaction.category_id !== categoryId) setSubcategoryId('')
    })
  }, [categoryId])

  async function handleSubmit(e) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || num <= 0) { setError('Monto inválido'); return }
    if (!description.trim())               { setError('Descripción requerida'); return }
    if (!categoryId)                       { setError('Seleccioná una categoría'); return }
    if (!date)                             { setError('Fecha requerida'); return }
    setError(null)
    setLoading(true)

    const selectedCat = categories.find(c => c.id === categoryId)
    const finalAmount = selectedCat?.type === 'income' ? num : -num

    const payload = {
      amount:         finalAmount,
      description:    description.trim(),
      date,
      category_id:    categoryId,
      subcategory_id: subcategoryId || null,
      observations:   observations.trim() || null,
      user_id:        user.id,
    }

    const { error: dbErr } = transaction
      ? await updateTransaction(transaction.id, payload)
      : await createTransaction(payload)

    setLoading(false)
    if (dbErr) { setError(dbErr.message); return }
    onSave()
  }

  const grouped = {
    income:   categories.filter(c => c.type === 'income'),
    fixed:    categories.filter(c => c.type === 'fixed'),
    variable: categories.filter(c => c.type === 'variable'),
  }
  const TYPE_LABEL = { income: 'Ingresos', fixed: 'Gastos fijos', variable: 'Variables' }
  const selectedCat = categories.find(c => c.id === categoryId)
  const isFixed = selectedCat?.type === 'fixed'

  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={e => e.stopPropagation()}>
        <h3 style={s.title}>{transaction ? 'Editar transacción' : 'Nueva transacción'}</h3>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.scrollBody}>
            <label style={s.label} htmlFor="tx-monto">Monto</label>
            <input
              id="tx-monto"
              style={s.input}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
              inputMode="decimal"
            />

            <label style={s.label} htmlFor="tx-categoria">Categoría</label>
            <select id="tx-categoria" style={s.input} value={categoryId} onChange={e => setCategoryId(e.target.value)}>
              <option value="">Seleccioná...</option>
              {Object.entries(grouped).map(([type, cats]) =>
                cats.length > 0 && (
                  <optgroup key={type} label={TYPE_LABEL[type]}>
                    {cats.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </optgroup>
                )
              )}
            </select>

            {isFixed && (
              <div style={{ background: 'rgba(124,92,252,.1)', border: '1px solid rgba(124,92,252,.25)', borderRadius: 8, padding: '8px 10px', fontSize: 11, color: 'var(--pu)' }}>
                Este gasto se agregará a tus gastos fijos del mes
              </div>
            )}

            {subcategories.length > 0 && (
              <>
                <label style={s.label} htmlFor="tx-subcategoria">Subcategoría</label>
                <select id="tx-subcategoria" style={s.input} value={subcategoryId} onChange={e => setSubcategoryId(e.target.value)}>
                  <option value="">Sin subcategoría</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                </select>
              </>
            )}

            <label style={s.label} htmlFor="tx-desc">Descripción</label>
            <input
              id="tx-desc"
              style={s.input}
              value={description}
              onChange={e => setDesc(e.target.value)}
              placeholder="Ej: Supermercado"
            />

            <label style={s.label} htmlFor="tx-fecha">Fecha</label>
            <input
              id="tx-fecha"
              style={{ ...s.input, colorScheme: 'dark' }}
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />

            <label style={s.label} htmlFor="tx-obs">Observaciones</label>
            <textarea
              id="tx-obs"
              style={{ ...s.input, resize: 'none', minHeight: 58 }}
              value={observations}
              onChange={e => setObs(e.target.value)}
              placeholder="Nota adicional..."
              rows={2}
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
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200,
  },
  modal: {
    background: 'var(--s1)', borderRadius: '16px 16px 0 0',
    width: '100%', maxWidth: 430,
    boxShadow: '0 -4px 32px rgba(0,0,0,0.6)',
    maxHeight: '90vh',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  title: {
    color: 'var(--tx)', padding: '1.5rem 1.5rem 1rem',
    fontSize: '1.1rem', fontWeight: 600, flexShrink: 0,
  },
  form: {
    display: 'flex', flexDirection: 'column',
    flex: 1, minHeight: 0,
  },
  scrollBody: {
    flex: 1, overflowY: 'auto',
    padding: '0 1.5rem 0.5rem',
    display: 'flex', flexDirection: 'column', gap: '0.5rem',
  },
  label: { color: 'var(--tx2)', fontSize: '0.8rem' },
  input: {
    background: 'var(--bg)', border: '1px solid var(--bd2)', borderRadius: 8,
    color: 'var(--tx)', padding: '0.6rem 0.75rem', fontSize: '0.95rem',
    outline: 'none', fontFamily: 'inherit', width: '100%',
  },
  error: { color: 'var(--re)', fontSize: '0.82rem', margin: '0.25rem 0 0' },
  footer: {
    display: 'flex', gap: '0.75rem',
    padding: '0.75rem 1.5rem 1.25rem',
    borderTop: '1px solid var(--bd)',
    flexShrink: 0,
  },
  btnPrimary: {
    flex: 1, padding: '0.65rem', background: 'var(--gr)', color: '#000',
    border: 'none', borderRadius: 8, fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
  },
  btnSecondary: {
    flex: 1, padding: '0.65rem', background: 'var(--s2)', color: 'var(--tx)',
    border: '1px solid var(--bd2)', borderRadius: 8, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit',
  },
}
