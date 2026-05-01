import { useCallback, useEffect, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionModal from '../components/TransactionModal'
import ConfirmModal from '../components/ConfirmModal'

const MONTHS       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtARS(n) {
  return '$ ' + Math.abs(Math.round(n)).toLocaleString('es-AR')
}

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

const TYPE_CHIPS = [
  { id: 'all',      label: 'Todos'     },
  { id: 'income',   label: 'Ingresos'  },
  { id: 'fixed',    label: 'Fijos'     },
  { id: 'variable', label: 'Variables' },
]

export default function Transactions() {
  const [monthOff, setMonthOff] = useState(0)
  const now    = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOff, 1)
  const year   = target.getFullYear()
  const month  = target.getMonth()

  const { fetchTransactions, deleteTransaction } = useTransactions()
  const [txns,       setTxns]       = useState([])
  const [loading,    setLoading]    = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [catFilter,  setCatFilter]  = useState(null)
  const [expanded,   setExpanded]   = useState(null)
  const [txModal,    setTxModal]    = useState(false)   // false=closed | null=create | tx=edit
  const [confirmDel, setConfirmDel] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await fetchTransactions({ year, month })
    setTxns(data ?? [])
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])
  useEffect(() => { setCatFilter(null); setExpanded(null) }, [typeFilter, monthOff])

  const typeFiltered = txns.filter(tx =>
    typeFilter === 'all' || tx.category?.type === typeFilter
  )
  const catOptions = [...new Set(typeFiltered.map(t => t.category?.name).filter(Boolean))]
  const filtered   = typeFiltered.filter(tx => !catFilter || tx.category?.name === catFilter)
  const groups     = groupByDate(filtered)

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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setMonthOff(o => o - 1)} style={s.navBtn}><ChevL /></button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#bbb' }}>{MONTHS[month]} {year}</span>
          <button
            onClick={() => setMonthOff(o => Math.min(o + 1, 0))}
            style={{ ...s.navBtn, opacity: monthOff === 0 ? .3 : 1 }}
          ><ChevR /></button>
        </div>
      </div>

      {/* Type chips */}
      <div className="chips" style={{ paddingBottom: 8 }}>
        {TYPE_CHIPS.map(f => (
          <button
            key={f.id}
            className={'chip' + (typeFilter === f.id ? ' on' : '')}
            onClick={() => setTypeFilter(f.id)}
          >{f.label}</button>
        ))}
      </div>

      {/* Category chips */}
      {catOptions.length > 1 && (
        <div className="chips" style={{ paddingBottom: 10 }}>
          {catOptions.map(c => (
            <button
              key={c}
              className={'chip' + (catFilter === c ? ' on' : '')}
              onClick={() => setCatFilter(catFilter === c ? null : c)}
            >{c}</button>
          ))}
        </div>
      )}

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
                        {/* Color icon */}
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
                            <div style={{ background: '#171717', borderRadius: 8, padding: '8px 10px', borderLeft: '2px solid var(--am)', fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 10 }}>
                              {tx.observations}
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
      <button style={s.fab} onClick={() => setTxModal(null)} aria-label="Nueva transacción">
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
    width: 30, height: 30, borderRadius: 8,
    background: 'var(--s2)', border: '1px solid var(--bd2)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#666',
  },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid var(--bd2)', background: 'var(--s2)',
    color: 'var(--tx2)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
  fab: {
    position: 'fixed', bottom: 76, right: 18,
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--gr)', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: '#000',
    boxShadow: '0 4px 20px rgba(16,185,129,0.35)', zIndex: 90,
  },
}
