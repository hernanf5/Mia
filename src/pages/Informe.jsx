import { useState, useCallback, useEffect } from 'react'
import {
  ArrowDownRight, ArrowUpRight, Wallet, Receipt,
  ShoppingBag, TrendingUp, Sparkles, Loader2,
} from 'lucide-react'
import { useData } from '../context/DataContext'
import { computeMetrics } from '../lib/metrics'
import { fmtARS } from '../lib/fmt'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

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

function delta(now, prev) {
  const diff = now - prev
  const pct = prev === 0 ? 0 : (diff / prev) * 100
  return { diff, pct }
}

function DeltaPill({ value, tone }) {
  const up = value >= 0
  const color = tone === 'positive' ? '#2ee6a8' : tone === 'negative' ? '#f87171' : '#f5a524'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 600,
      color, backgroundColor: `${color}1a`, border: `1px solid ${color}33`,
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      {up
        ? <ArrowUpRight style={{ width: 12, height: 12 }} />
        : <ArrowDownRight style={{ width: 12, height: 12 }} />}
      {up ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

function MetricCard({ label, value, prev, betterWhen, icon: Icon, accent }) {
  const d = delta(value, prev)
  const isBetter = betterWhen === 'higher' ? d.diff >= 0 : d.diff <= 0
  const pillTone = isBetter ? 'positive' : 'negative'
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 16, padding: 16,
      background: 'rgba(255,255,255,0.055)', backdropFilter: 'blur(28px) saturate(150%)',
      WebkitBackdropFilter: 'blur(28px) saturate(150%)',
      border: '1px solid rgba(255,255,255,0.11)',
      boxShadow: '0 16px 50px rgba(0,0,0,0.4)',
    }}>
      <div style={{
        position: 'absolute', right: -40, top: -40, width: 128, height: 128,
        borderRadius: '50%', opacity: 0.25, filter: 'blur(24px)', background: accent,
        pointerEvents: 'none',
      }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--tx3)' }}>
          <span style={{
            display: 'grid', placeItems: 'center', width: 28, height: 28,
            borderRadius: 8, background: `${accent}1f`, color: accent,
          }}>
            <Icon style={{ width: 14, height: 14 }} />
          </span>
          {label}
        </div>
        <DeltaPill value={d.pct} tone={pillTone} />
      </div>
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--tx3)', fontFamily: 'JetBrains Mono, monospace' }}>$</span>
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, fontWeight: 700, color: 'var(--tx)', letterSpacing: '-0.02em' }}>
          {fmtARS(Math.abs(value))}
        </span>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: 'var(--tx3)', fontFamily: 'JetBrains Mono, monospace' }}>
        antes {fmtARS(Math.abs(prev))} · {d.diff >= 0 ? '+' : '−'}{fmtARS(Math.abs(d.diff))}
      </div>
    </div>
  )
}

function Donut({ income, spent }) {
  const pct = income > 0 ? Math.min(100, Math.round((spent / income) * 100)) : 0
  const r = 70
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div style={{ position: 'relative', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
      <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="donut-ring" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="#2ee6a8" />
            <stop offset="100%" stopColor="#7dd3fc" />
          </linearGradient>
        </defs>
        <circle cx="90" cy="90" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="14" fill="none" />
        <circle
          cx="90" cy="90" r={r}
          stroke="url(#donut-ring)" strokeWidth="14" fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 800ms ease' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
        <div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tx3)' }}>Gastado</div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: 'var(--tx)' }}>{pct}%</div>
          <div style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: 'JetBrains Mono, monospace' }}>de {fmtARS(income)}</div>
        </div>
      </div>
    </div>
  )
}

function Legend({ color, label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 11, color: 'var(--tx3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'var(--tx)', marginLeft: 'auto', flexShrink: 0 }}>{fmtARS(value)}</span>
    </div>
  )
}

const glassCard = {
  borderRadius: 24, padding: 20,
  background: 'rgba(255,255,255,0.055)',
  backdropFilter: 'blur(28px) saturate(150%)',
  WebkitBackdropFilter: 'blur(28px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.11)',
  boxShadow: '0 16px 50px rgba(0,0,0,0.4)',
}

export default function Informe() {
  const [monthOff, setMonthOff] = useState(0)
  const { getTransactionsForMonth } = useData()
  const now = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOff, 1)
  const year = target.getFullYear()
  const month = target.getMonth()
  const [metrics, setMetrics] = useState(null)
  const [prevMetrics, setPrevMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [advice, setAdvice] = useState([])
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const [adviceError, setAdviceError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    const prevTarget = new Date(now.getFullYear(), now.getMonth() + monthOff - 1, 1)
    const prevYear = prevTarget.getFullYear()
    const prevMonth = prevTarget.getMonth()
    const [current, prev] = await Promise.all([
      getTransactionsForMonth(year, month),
      getTransactionsForMonth(prevYear, prevMonth),
    ])
    setMetrics(computeMetrics(current ?? []))
    setPrevMetrics(computeMetrics(prev ?? []))
    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  const fetchAdvice = async () => {
    setLoadingAdvice(true)
    setAdviceError(null)
    const apiUrl = import.meta.env.PROD
      ? '/api/advice'
      : 'https://mia-expense-tracker.vercel.app/api/advice'
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metrics, prevMetrics, month: month + 1, year }),
      })
      if (!res.ok) throw new Error(`Error ${res.status}`)
      const data = await res.json()
      setAdvice(data.advice)
    } catch (err) {
      setAdviceError(err.message)
    } finally {
      setLoadingAdvice(false)
    }
  }

  const m = metrics ?? { totalIncome: 0, totalFixedPaid: 0, totalVariable: 0, available: 0, byCategory: [] }
  const p = prevMetrics ?? { totalIncome: 0, totalFixedPaid: 0, totalVariable: 0, available: 0, byCategory: [] }
  const spent = m.totalFixedPaid + m.totalVariable
  const income = m.totalIncome || 1
  const fixedPct  = Math.min(100, (m.totalFixedPaid / income) * 100)
  const varPct    = Math.min(100 - fixedPct, (m.totalVariable / income) * 100)
  const availPct  = Math.max(0, 100 - fixedPct - varPct)
  const totalCatAmt = m.byCategory.reduce((s, c) => s + c.amount, 0)
  const dAvail    = delta(m.available, p.available)

  return (
    <div className="screen">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ padding: '6px 16px 12px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Informe</div>
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

        {/* Loading */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem 0' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)', borderTop: '2px solid #2ee6a8', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <div style={{ padding: '0 16px 32px', display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Hero card */}
            <div style={glassCard}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center' }}>
                <Donut income={m.totalIncome} spent={spent} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tx3)', marginBottom: 6 }}>Disponible este mes</div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 28, fontWeight: 700, color: m.available >= 0 ? 'var(--gr)' : 'var(--re)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 8 }}>
                    {fmtARS(m.available)}
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <DeltaPill value={dAvail.pct} tone={dAvail.diff >= 0 ? 'positive' : 'negative'} />
                  </div>
                  <div style={{ height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 10, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ width: `${fixedPct.toFixed(1)}%`, background: '#f5a524', transition: 'width .5s' }} />
                    <div style={{ width: `${varPct.toFixed(1)}%`, background: '#f87171', transition: 'width .5s' }} />
                    <div style={{ width: `${availPct.toFixed(1)}%`, background: '#2ee6a8', transition: 'width .5s' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <Legend color="#f5a524" label="Fijos" value={m.totalFixedPaid} />
                    <Legend color="#f87171" label="Variables" value={m.totalVariable} />
                    <Legend color="#2ee6a8" label="Disponible" value={Math.max(0, m.available)} />
                  </div>
                </div>
              </div>
            </div>

            {/* 4 metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <MetricCard label="Ingresos"   value={m.totalIncome}    prev={p.totalIncome}    betterWhen="higher" icon={Wallet}      accent="#2ee6a8" />
              <MetricCard label="Fijos"      value={m.totalFixedPaid} prev={p.totalFixedPaid} betterWhen="lower"  icon={Receipt}     accent="#f5a524" />
              <MetricCard label="Variables"  value={m.totalVariable}  prev={p.totalVariable}  betterWhen="lower"  icon={ShoppingBag} accent="#f87171" />
              <MetricCard label="Disponible" value={m.available}      prev={p.available}      betterWhen="higher" icon={TrendingUp}   accent="#7dd3fc" />
            </div>

            {/* Top categorías */}
            {m.byCategory.length > 0 && (
              <div style={glassCard}>
                <div className="slbl" style={{ marginBottom: 14 }}>Top categorías</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {m.byCategory.slice(0, 6).map(cat => {
                    const pct = totalCatAmt > 0 ? (cat.amount / totalCatAmt * 100) : 0
                    return (
                      <div key={cat.name}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: `${cat.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                          </div>
                          <span style={{ fontSize: 12, color: 'var(--tx2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cat.name}</span>
                          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--tx)', fontWeight: 600, flexShrink: 0 }}>{fmtARS(cat.amount)}</span>
                          <span style={{ fontSize: 11, color: 'var(--tx3)', flexShrink: 0, minWidth: 34, textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', marginLeft: 36 }}>
                          <div style={{
                            height: '100%', borderRadius: 3, width: `${pct}%`,
                            background: `linear-gradient(90deg, ${cat.color}, ${cat.color}66)`,
                            transition: 'width .5s cubic-bezier(.4,0,.2,1)',
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* AI advice */}
            <div style={{ position: 'relative', borderRadius: 24, padding: 1, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 24, background: 'conic-gradient(from 140deg at 50% 50%, #2ee6a8, #7dd3fc, #f5a524, #2ee6a8)', opacity: 0.55, filter: 'blur(0.5px)' }} />
              <div style={{ position: 'relative', borderRadius: 23, background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(28px) saturate(150%)', WebkitBackdropFilter: 'blur(28px) saturate(150%)', padding: '20px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 28, height: 28, borderRadius: 8, background: 'rgba(46,230,168,0.12)', color: '#2ee6a8' }}>
                    <Sparkles style={{ width: 14, height: 14 }} />
                  </span>
                  <span className="slbl" style={{ color: '#05100d' }}>Consejo IA</span>
                </div>
                <button
                  onClick={fetchAdvice}
                  disabled={loadingAdvice}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 20,
                    background: loadingAdvice ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg,#2ee6a8,#22d3ee)',
                    border: 'none', color: loadingAdvice ? 'var(--tx3)' : '#000',
                    fontSize: 12, fontWeight: 600,
                    cursor: loadingAdvice ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', opacity: loadingAdvice ? 0.6 : 1,
                  }}
                >
                  <>
                    {loadingAdvice
                      ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} />
                      : <Sparkles style={{ width: 14, height: 14 }} />
                    }
                    {advice.length > 0 ? 'Regenerar' : 'Generar'}
                  </>
                </button>
              </div>

              {loadingAdvice && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[80, 60, 72].map((w, i) => (
                    <div key={i} style={{ height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.07)', width: `${w}%`, animation: `flash 1.4s ease-in-out infinite`, animationDelay: `${i * 0.18}s` }} />
                  ))}
                </div>
              )}

              {adviceError && (
                <p style={{ fontSize: 13, color: 'var(--re)', margin: 0 }}>{adviceError}</p>
              )}

              {!loadingAdvice && advice.length > 0 && (
                <div>
                  {advice.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginTop: i === 0 ? 16 : 12 }}>
                      <span style={{ color: '#05100d', opacity: 0.6, fontSize: 18, lineHeight: 1.4, flexShrink: 0 }}>•</span>
                      <p style={{ fontSize: 13, lineHeight: 1.6, color: '#05100d', margin: 0 }}>{tip}</p>
                    </div>
                  ))}
                </div>
              )}

              {!loadingAdvice && advice.length === 0 && !adviceError && (
                <p style={{ fontSize: 13, color: 'rgba(5,16,13,0.7)', margin: 0 }}>Generá un análisis IA de tus finanzas del mes.</p>
              )}
              </div>
            </div>

          </div>
        )}

      </div>
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
}
