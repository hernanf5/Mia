import { useCallback, useEffect, useRef, useState } from 'react'
import { useTransactions } from '../hooks/useTransactions'
import TransactionModal from '../components/TransactionModal'
import ConfirmModal from '../components/ConfirmModal'
import { fmtARS } from '../lib/fmt'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function useFlash(val) {
  const ref  = useRef(null)
  const prev = useRef(val)
  useEffect(() => {
    if (prev.current !== val && ref.current) {
      ref.current.classList.remove('flash')
      void ref.current.offsetWidth
      ref.current.classList.add('flash')
    }
    prev.current = val
  }, [val])
  return ref
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
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
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

export default function Fijos() {
  const [monthOff, setMonthOff] = useState(0)
  const now    = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOff, 1)
  const year   = target.getFullYear()
  const month  = target.getMonth()

  const { fetchTransactions, updateTransaction, deleteTransaction } = useTransactions()
  const [fijos,      setFijos]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [expanded,   setExpanded]   = useState(null)
  const [txModal,    setTxModal]    = useState(false)   // false=closed | null=create | tx=edit
  const [confirmDel, setConfirmDel] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data } = await fetchTransactions({ year, month })
    setFijos((data ?? []).filter(t => t.category?.type === 'fixed'))
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])
  useEffect(() => { setExpanded(null) }, [monthOff])

  async function toggle(tx) {
    const next = !tx.is_checked
    setFijos(prev => prev.map(f => f.id === tx.id ? { ...f, is_checked: next } : f))
    await updateTransaction(tx.id, { is_checked: next })
  }

  async function handleDelete() {
    await deleteTransaction(confirmDel.id)
    setConfirmDel(null)
    load()
  }

  const paid    = fijos.filter(f => f.is_checked).reduce((s, f) => s + Math.abs(Number(f.amount)), 0)
  const pending = fijos.filter(f => !f.is_checked).reduce((s, f) => s + Math.abs(Number(f.amount)), 0)
  const total   = paid + pending
  const pct     = total > 0 ? (paid / total * 100).toFixed(1) : 0
  const paidRef = useFlash(paid)

  return (
    // Flex column replaces .screen so the sticky footer can sit above the nav
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>

      {/* Scrollable content */}
      <div className="screen" style={{ paddingBottom: 0 }}>
        {/* Header */}
        <div style={{ padding: '6px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>Gastos Fijos</span>
            <button
              style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--s2)', border: '1px solid var(--bd2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gr)' }}
              onClick={() => setTxModal(null)}
              aria-label="Agregar gasto fijo"
            >
              <PlusIcon />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button onClick={() => setMonthOff(o => o - 1)} style={s.navBtn} aria-label="Mes anterior"><ChevL /></button>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#bbb' }}>{MONTHS[month]} {year}</span>
            <button
              onClick={() => setMonthOff(o => Math.min(o + 1, 0))}
              style={{ ...s.navBtn, opacity: monthOff === 0 ? .3 : 1 }}
              aria-label="Mes siguiente"
              aria-disabled={monthOff === 0}
            ><ChevR /></button>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <p style={{ color: 'var(--tx3)', textAlign: 'center', padding: '2rem', fontSize: 13 }}>Cargando...</p>
        ) : fijos.length === 0 ? (
          <p style={{ color: 'var(--tx3)', textAlign: 'center', padding: '2rem', fontSize: 13, lineHeight: 1.6 }}>
            Sin gastos fijos este mes.<br/>Tocá + para agregar.
          </p>
        ) : (
          <div className="card" style={{ margin: '0 16px 16px', padding: 0 }}>
            {fijos.map((fi, idx) => {
              const isOpen = expanded === fi.id
              const isLast = idx === fijos.length - 1
              return (
                <div key={fi.id}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', borderBottom: (!isLast || isOpen) ? '1px solid var(--bd)' : 'none', cursor: 'pointer' }}
                    onClick={() => setExpanded(isOpen ? null : fi.id)}
                  >
                    <button
                      className={'cb' + (fi.is_checked ? ' on' : '')}
                      onClick={e => { e.stopPropagation(); toggle(fi) }}
                    >
                      {fi.is_checked && <CheckIcon />}
                    </button>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: fi.category?.color ?? '#555', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 500, color: fi.is_checked ? '#444' : '#e0e0e0', textDecoration: fi.is_checked ? 'line-through' : 'none', transition: 'all .2s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {fi.description}
                        </span>
                        {fi.observations && <div className="note-dot" />}
                      </div>
                      <span style={{ fontSize: 11, color: '#555' }}>
                        {fi.category?.name}
                        {fi.subcategory?.name ? ` · ${fi.subcategory.name}` : ''}
                      </span>
                    </div>
                    <span className="mono" style={{ fontSize: 13, fontWeight: 600, color: fi.is_checked ? 'var(--tx3)' : '#ccc', flexShrink: 0, transition: 'color .2s' }}>
                      {fmtARS(fi.amount)}
                    </span>
                  </div>

                  {isOpen && (
                    <div style={{ padding: '10px 14px 12px', background: 'rgba(0,0,0,.2)' }}>
                      {fi.observations && (
                        <div style={{ background: '#141414', borderRadius: 8, padding: '7px 10px', borderLeft: '2px solid var(--am)', fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 10 }}>
                          {fi.observations}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button style={s.actionBtn} onClick={() => { setTxModal(fi); setExpanded(null) }}>
                          <EditIcon /> Editar
                        </button>
                        <button style={{ ...s.actionBtn, color: 'var(--re)', borderColor: 'rgba(244,63,94,.2)', background: 'var(--red)' }} onClick={() => setConfirmDel(fi)}>
                          <TrashIcon /> Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Sticky footer — sits between scrollable content and nav spacer */}
      <div style={{ flexShrink: 0, background: 'var(--s1)', borderTop: '1px solid var(--bd)', padding: '12px 16px' }}>
        {/* Progress bar */}
        <div className="prog" style={{ marginBottom: 10 }}>
          <div className="prog-f" style={{ width: `${pct}%`, background: 'var(--gr)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <div className="slbl" style={{ marginBottom: 2 }}>Pagado</div>
            <div ref={paidRef} className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--gr)' }}>
              {fmtARS(paid)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="slbl" style={{ marginBottom: 2 }}>Pendiente</div>
            <div className="mono" style={{ fontSize: 16, fontWeight: 700, color: pending > 0 ? 'var(--re)' : 'var(--tx3)' }}>
              {fmtARS(pending)}
            </div>
          </div>
        </div>
      </div>

      {/* Nav spacer — BottomNav is position:absolute and overlaps this */}
      <div style={{ height: 60, flexShrink: 0 }} />

      {/* Modals */}
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
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 8,
    border: '1px solid var(--bd2)', background: 'var(--s2)',
    color: 'var(--tx2)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
  },
}
