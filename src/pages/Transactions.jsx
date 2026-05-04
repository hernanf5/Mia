import { useCallback, useEffect, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionModal from '../components/TransactionModal'
import ConfirmModal from '../components/ConfirmModal'
import MultiSelectDropdown from '../components/MultiSelectDropdown'
import { fmtARS } from '../lib/fmt'

const MONTHS       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function dateLabel(dateStr) {
  const today = new Date().toISOString().slice(0, 10)
  const yest  = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (dateStr === today) return 'Hoy'
  if (dateStr === yest)  return 'Ayer'
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

function groupByDate(txns) {
  const map = new Map()
  txns.forEach(tx => {
    const lbl = dateLabel(tx.date)
    if (!map.has(lbl)) map.set(lbl, [])
    map.get(lbl).push(tx)
  })
  return [...map.entries()]
}

const ChevL = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ChevR = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)
const PlusIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)
const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
)

export default function Transactions() {
  const [monthOff, setMonthOff] = useState(0)
  const now    = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOff, 1)
  const year   = target.getFullYear()
  const month  = target.getMonth()

  const { fetchTransactions, deleteTransaction } = useTransactions()
  const [txns,         setTxns]         = useState([])
  const [loading,      setLoading]      = useState(true)
  const [selectedCats,    setSelectedCats]    = useState(new Set())
  const [selectedSubcats, setSelectedSubcats] = useState(new Set())
  const [expanded,   setExpanded]   = useState(null)
  const [txModal,    setTxModal]    = useState(false)
  const [confirmDel, setConfirmDel] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await fetchTransactions({ year, month })
    setTxns(data ?? [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])
  useEffect(() => { setSelectedCats(new Set()); setSelectedSubcats(new Set()); setExpanded(null) }, [monthOff])

  // Base: exclude unchecked fixed (not real expenses yet)
  const base = txns.filter(tx => !(tx.category?.type === 'fixed' && !tx.is_checked))

  // Category options: unique categories present this month
  const catOptions = [...new Map(
    base.map(tx => tx.category).filter(Boolean).map(c => [c.id, c])
  ).values()]

  // Subcategory options: subcats of selected cats (or all if none selected)
  const subcatOptions = [...new Map(
    base
      .filter(tx => selectedCats.size === 0 || selectedCats.has(tx.category?.id))
      .filter(tx => tx.subcategory?.id)
      .map(tx => [tx.subcategory.id, { ...tx.subcategory, categoryName: tx.category?.name, categoryColor: tx.category?.color }])
  ).values()]

  // Apply filters
  const filtered = base.filter(tx => {
    if (selectedCats.size > 0 && !selectedCats.has(tx.category?.id)) return false
    if (selectedSubcats.size > 0 && !selectedSubcats.has(tx.subcategory?.id)) return false
    return true
  })

  const groups = groupByDate(filtered)
  const hasFilters = selectedCats.size > 0 || selectedSubcats.size > 0

  function toggleCat(id) {
    setSelectedCats(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    // clear subcats that no longer belong
    setSelectedSubcats(new Set())
  }

  function toggleSubcat(id) {
    setSelectedSubcats(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function clearFilters() {
    setSelectedCats(new Set())
    setSelectedSubcats(new Set())
  }

  async function handleDelete() {
    await deleteTransaction(confirmDel.id)
    setConfirmDel(null)
    load()
  }

  return (
    <div className="screen">
      {/* Header */}
      <div style={{ padding: '6px 16px 12px' }}>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Transacciones</div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <button onClick={() => setMonthOff(o => o - 1)} style={s.navBtn} aria-label="Mes anterior"><ChevL /></button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#bbb' }}>{MONTHS[month]} {year}</span>
          <button
            onClick={() => setMonthOff(o => Math.min(o + 1, 0))}
            style={{ ...s.navBtn, opacity: monthOff === 0 ? .3 : 1 }}
            aria-label="Mes siguiente"
            aria-disabled={monthOff === 0}
          ><ChevR /></button>
        </div>

        {/* Filter row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <MultiSelectDropdown
            label="Categorías"
            options={catOptions}
            selected={selectedCats}
            onToggle={toggleCat}
            renderOption={opt => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color ?? '#555', flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'var(--tx)', fontWeight: 500 }}>{opt.name}</span>
              </div>
            )}
          />
          <MultiSelectDropdown
            label="Subcategorías"
            options={subcatOptions}
            selected={selectedSubcats}
            onToggle={toggleSubcat}
            renderOption={opt => (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 13, color: 'var(--tx)', fontWeight: 500 }}>{opt.name}</span>
                {opt.categoryName && (
                  <span style={{ fontSize: 11, color: 'var(--tx3)' }}>{opt.categoryName}</span>
                )}
              </div>
            )}
          />
          {hasFilters && (
            <button onClick={clearFilters} style={s.clearBtn}>
              Limpiar filtros ✕
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <p style={{ color: 'var(--tx3)', textAlign: 'center', padding: '2rem', fontSize: 13 }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: 'var(--tx3)', textAlign: 'center', padding: '2rem', fontSize: 13 }}>
          Sin transacciones este mes
        </p>
      ) : (
        <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {groups.map(([lbl, items]) => (
            <div key={lbl}>
              <div className="slbl" style={{ marginBottom: 6, paddingLeft: 2 }}>{lbl}</div>
              <div className="card" style={{ padding: 0 }}>
                {items.map((tx, idx) => {
                  const isOpen   = expanded === tx.id
                  const isIncome = Number(tx.amount) > 0
                  const isLast   = idx === items.length - 1
                  return (
                    <div key={tx.id}>
                      <div
                        className="tx-r"
                        style={{ cursor: 'pointer', borderBottom: (!isLast || isOpen) ? '1px solid var(--bd)' : 'none' }}
                        onClick={() => setExpanded(isOpen ? null : tx.id)}
                      >
                        <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--s2)', border: '1px solid var(--bd)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: tx.category?.color ?? '#555' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tx.description}
                            </span>
                            {tx.observations && <div className="note-dot" />}
                          </div>
                          <span style={{ fontSize: 11, color: '#555' }}>
                            {tx.category?.name ?? '—'}
                            {tx.subcategory?.name ? ` · ${tx.subcategory.name}` : ''}
                          </span>
                        </div>
                        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: isIncome ? 'var(--gr)' : 'var(--re)', flexShrink: 0 }}>
                          {isIncome ? '+' : '−'}{fmtARS(tx.amount)}
                        </span>
                      </div>

                      {isOpen && (
                        <div style={{ padding: '10px 14px 12px', background: 'rgba(0,0,0,.2)' }}>
                          {tx.observations && (
                            <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', borderRadius: 8, padding: '8px 10px', background: 'rgba(245,158,11,.05)', fontSize: 12, color: 'var(--tx2)', lineHeight: 1.5, marginBottom: 10 }}>
                              <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--am)', flexShrink: 0, marginTop: '0.35em' }} />
                              <span>{tx.observations}</span>
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button style={s.actionBtn} onClick={() => { setTxModal(tx); setExpanded(null) }}>
                              <EditIcon /> Editar
                            </button>
                            <button style={{ ...s.actionBtn, color: 'var(--re)', borderColor: 'rgba(244,63,94,.2)', background: 'var(--red)' }} onClick={() => setConfirmDel(tx)}>
                              <TrashIcon /> Eliminar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button style={s.fab} className="fab-r" onClick={() => setTxModal(null)} aria-label="Nueva transacción">
        <PlusIcon />
      </button>

      {txModal !== false && (
        <TransactionModal
          transaction={txModal}
          onSave={() => { setTxModal(false); load() }}
          onClose={() => setTxModal(false)}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title={`Eliminar "${confirmDel.description}"`}
          message="Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </div>
  )
}

const s = {
  navBtn: {
    width: 40, height: 40, borderRadius: 10,
    background: 'var(--s2)', border: '1px solid var(--bd2)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#666',
  },
  clearBtn: {
    padding: '7px 12px', borderRadius: 10,
    background: 'var(--red)', border: '1px solid rgba(244,63,94,.2)',
    color: 'var(--re)', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid var(--bd2)', background: 'var(--s2)',
    color: 'var(--tx2)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  fab: {
    position: 'fixed', bottom: 76,
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--gr)', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#000',
    boxShadow: '0 4px 20px rgba(16,185,129,0.35)', zIndex: 90,
  },
}
