import { useState } from 'react'
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import { useDashboard } from '../hooks/useDashboard'
import TransactionModal from '../components/TransactionModal'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

function fmtARS(n) {
  return '$ ' + Math.abs(Math.round(n)).toLocaleString('es-AR')
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

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const byName = Object.fromEntries(payload.map(p => [p.name, p]))
  const fixed   = byName['Fijos']?.value   ?? 0
  const varbl   = byName['Variables']?.value ?? 0
  const avail   = byName['Disp.']?.value   ?? 0
  const income  = fixed + varbl + avail

  return (
    <div style={{ background: 'var(--s1)', border: '1px solid var(--bd)', borderRadius: 8, padding: '8px 12px', fontSize: 12, minWidth: 140 }}>
      <p style={{ color: 'var(--tx2)', marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {income > 0 && <p style={{ color: 'var(--gr)', margin: '2px 0'  }}>Ingresos: {fmtARS(income)}</p>}
      <p style={{ color: '#f59e0b',  margin: '2px 0' }}>Fijos: {fmtARS(fixed)}</p>
      <p style={{ color: '#7c5cfc',  margin: '2px 0' }}>Variables: {fmtARS(varbl)}</p>
      <p style={{ color: 'var(--gr)', margin: '2px 0' }}>Disp.: {fmtARS(avail)}</p>
    </div>
  )
}

export default function Dashboard() {
  const [monthOff, setMonthOff]     = useState(0)
  const [showTxModal, setShowTxModal] = useState(false)

  const now    = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOff, 1)
  const year   = target.getFullYear()
  const month  = target.getMonth()

  const { metrics, history, loading, reload } = useDashboard({ year, month })

  const totalIncome    = metrics?.totalIncome    ?? 0
  const totalFixed     = metrics?.totalFixed     ?? 0
  const totalVariable  = metrics?.totalVariable  ?? 0
  const available      = metrics?.available      ?? 0
  const byCategory     = metrics?.byCategory     ?? []
  const totalSpent     = totalFixed + totalVariable

  const fixedPct = totalIncome > 0 ? Math.min(totalFixed    / totalIncome * 100, 100)                            : 0
  const varPct   = totalIncome > 0 ? Math.min(totalVariable / totalIncome * 100, Math.max(0, 100 - fixedPct))    : 0

  function handleTxSave() {
    setShowTxModal(false)
    reload()
  }

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div style={{ padding: '6px 16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-.04em' }}>
            M<span style={{ color: 'var(--pu)' }}>i</span>a
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--s2)', border: '1px solid var(--bd2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#666', fontWeight: 600 }}>A</div>
        </div>

        {/* Month nav */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <button onClick={() => setMonthOff(o => o - 1)} style={s.navBtn}><ChevL /></button>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#bbb' }}>{MONTHS[month]} {year}</span>
          <button onClick={() => setMonthOff(o => Math.min(o + 1, 0))} style={{ ...s.navBtn, opacity: monthOff === 0 ? .3 : 1 }}>
            <ChevR />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 12 }}>

        {/* ── Summary card ── */}
        <div className="card" style={{ padding: 16 }}>
          <div className="slbl" style={{ marginBottom: 4 }}>Ingresos del mes</div>
          <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--tx)', lineHeight: 1.1, marginBottom: 4 }}>
            {loading ? '—' : fmtARS(totalIncome)}
          </div>

          {/* Stacked progress bar */}
          <div style={{ height: 8, background: 'var(--s3)', borderRadius: 4, overflow: 'hidden', marginTop: 10, display: 'flex' }}>
            <div style={{ width: `${fixedPct.toFixed(1)}%`,  background: '#f59e0b', transition: 'width .5s' }} />
            <div style={{ width: `${varPct.toFixed(1)}%`,   background: '#7c5cfc', transition: 'width .5s' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#f59e0b' }}>{fixedPct.toFixed(0)}% fijos</span>
            <span style={{ fontSize: 10, color: '#7c5cfc' }}>{varPct.toFixed(0)}% variables</span>
          </div>

          {/* 3 chips */}
          <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
            <div style={{ ...s.chip, color: '#f59e0b', borderColor: 'rgba(245,158,11,.25)', background: 'rgba(245,158,11,.08)' }}>
              Fijos {fmtARS(totalFixed)}
            </div>
            <div style={{ ...s.chip, color: '#7c5cfc', borderColor: 'rgba(124,92,252,.25)', background: 'var(--pud)' }}>
              Variables {fmtARS(totalVariable)}
            </div>
            <div style={{ ...s.chip, color: available >= 0 ? 'var(--gr)' : 'var(--re)', borderColor: available >= 0 ? 'var(--grb)' : 'rgba(244,63,94,.25)', background: available >= 0 ? 'var(--grd)' : 'var(--red)' }}>
              Disponible {fmtARS(available)}
            </div>
          </div>
        </div>

        {/* ── Donut chart ── */}
        {!loading && (
          byCategory.length > 0 ? (
            <div className="card" style={{ padding: 16 }}>
              <div className="slbl" style={{ marginBottom: 12 }}>Por categoría</div>

              {/* Donut + center label */}
              <div style={{ position: 'relative', width: 160, height: 160, margin: '0 auto' }}>
                <PieChart width={160} height={160}>
                  <Pie
                    data={byCategory}
                    cx={80} cy={80}
                    innerRadius={52} outerRadius={72}
                    paddingAngle={3}
                    dataKey="amount"
                    isAnimationActive
                  >
                    {byCategory.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <span style={{ fontSize: 10, color: 'var(--tx2)', letterSpacing: '.04em', textTransform: 'uppercase' }}>Gastos</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--tx)' }}>{fmtARS(totalSpent)}</span>
                </div>
              </div>

              {/* Legend 2 cols */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: 14 }}>
                {byCategory.map(({ name, color, amount }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--tx2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
                    <span className="mono" style={{ fontSize: 11, color: 'var(--tx)', fontWeight: 600, flexShrink: 0 }}>{fmtARS(amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ color: 'var(--tx3)', fontSize: 13 }}>Sin gastos este mes</p>
            </div>
          )
        )}

        {/* ── Bar chart: últimos 4 meses ── */}
        {history.length > 0 && (
          <div className="card" style={{ padding: 16 }}>
            <div className="slbl" style={{ marginBottom: 4 }}>Últimos meses</div>
            {/* Legend */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
              {[['#f59e0b','Fijos'],['#7c5cfc','Variables'],['#10b981','Disp.']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                  <span style={{ fontSize: 10, color: 'var(--tx2)' }}>{l}</span>
                </div>
              ))}
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={history} barSize={28} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--tx2)', fontSize: 11, fontFamily: 'Inter, sans-serif' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  content={<BarTooltip />}
                  cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                />
                <Bar dataKey="totalFixed"      name="Fijos"     stackId="a" fill="#f59e0b" isAnimationActive />
                <Bar dataKey="totalVariable"   name="Variables" stackId="a" fill="#7c5cfc" isAnimationActive />
                <Bar dataKey="availableClamped" name="Disp."    stackId="a" fill="#10b981" radius={[4,4,0,0]} isAnimationActive />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>

      {/* ── FAB ── */}
      <button style={s.fab} onClick={() => setShowTxModal(true)} aria-label="Nueva transacción">
        <PlusIcon />
      </button>

      {/* ── Transaction modal ── */}
      {showTxModal && (
        <TransactionModal
          onSave={handleTxSave}
          onClose={() => setShowTxModal(false)}
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
  chip: {
    display: 'inline-flex', alignItems: 'center',
    padding: '4px 10px', borderRadius: 20,
    fontSize: 11, fontWeight: 500,
    border: '1px solid', whiteSpace: 'nowrap',
  },
  fab: {
    position: 'fixed', bottom: 76, right: 18,
    width: 48, height: 48, borderRadius: '50%',
    background: 'var(--gr)', border: 'none',
    cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    color: '#000', boxShadow: '0 4px 20px rgba(16,185,129,0.35)',
    zIndex: 90,
  },
}
