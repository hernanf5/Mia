import { useMemo, useState } from 'react'
import { Sparkles } from 'lucide-react'
import { useMonthsTransactions } from '../context/DataContext'
import { computeMetrics } from '../lib/metrics'
import { fmtARS } from '../lib/fmt'
import { typeByCategoryName } from '../lib/categoryTypes'
import { InformeSkeleton } from '../components/Skeleton'

// Informe (docs/rediseno-v2.md §7): ¿Cómo me fue? · ¿Qué cambió? · Consejo IA

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const ChevL = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)
const ChevR = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6"/>
  </svg>
)

/**
 * Variación porcentual segura.
 * - prev === 0 → null (no hay base: el que llama muestra "nuevo" o "igual")
 * - prev < 0  → divide por |prev| para que el signo no se invierta
 */
function pctChange(now, prev) {
  if (!prev) return null
  return ((now - prev) / Math.abs(prev)) * 100
}

// El color indica mejor/peor, no el signo (spec §1)
function toneFor(diff, betterWhen) {
  if (diff === 0) return 'var(--tx2)'
  const better = betterWhen === 'higher' ? diff > 0 : diff < 0
  return better ? 'var(--gr)' : 'var(--re)'
}

const signed = n => `${n > 0 ? '+' : '−'}${fmtARS(Math.abs(n))}`

const ADVICE_URL = import.meta.env.PROD
  ? '/api/advice'
  : 'https://mia-expense-tracker.vercel.app/api/advice'

export default function Informe() {
  const [monthOff, setMonthOff] = useState(0)
  const now    = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOff, 1)
  const year   = target.getFullYear()
  const month  = target.getMonth()
  const prevDate = new Date(year, month - 1, 1)
  const monthName = MONTHS[month].toLowerCase()
  const prevName  = MONTHS[prevDate.getMonth()].toLowerCase()

  const months = useMemo(() => {
    const prev = new Date(year, month - 1, 1)
    return [{ year, month }, { year: prev.getFullYear(), month: prev.getMonth() }]
  }, [year, month])
  const { data: [current, prev], loading } = useMonthsTransactions(months)
  const metrics     = useMemo(() => (loading ? null : computeMetrics(current ?? [])), [loading, current])
  const prevMetrics = useMemo(() => (loading ? null : computeMetrics(prev ?? [])), [loading, prev])
  const typeByName  = useMemo(() => typeByCategoryName(current ?? []), [current])
  const hasPrev     = (prev?.length ?? 0) > 0

  // Consejos guardados por mes: cambiar de mes no muestra el consejo de otro,
  // y una respuesta que llega tarde no pisa la del mes que se está viendo.
  const monthKey = `${year}-${month}`
  const [adviceByMonth, setAdviceByMonth] = useState({})
  const advice = adviceByMonth[monthKey] ?? { status: 'idle', tips: [], error: null }

  async function fetchAdvice() {
    const key = monthKey
    // Mientras se regenera se conservan los tips anteriores (no se vacía la card de golpe)
    const set = patch => setAdviceByMonth(all => ({ ...all, [key]: { tips: [], ...all[key], ...patch } }))
    set({ status: 'loading', error: null })
    try {
      const res = await fetch(ADVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Mismo contrato que antes con api/advice.js
        body: JSON.stringify({ metrics, prevMetrics, month: month + 1, year }),
      })
      if (!res.ok) throw new Error(`El servidor respondió ${res.status}`)
      const data = await res.json()
      const tips = Array.isArray(data.advice) ? data.advice.filter(t => typeof t === 'string' && t.trim()) : []
      if (tips.length === 0) throw new Error('La respuesta no trajo consejos')
      set({ status: 'done', tips })
    } catch (err) {
      set({ status: 'error', error: err.message })
    }
  }

  return (
    <div className="screen">
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Header + selector de mes */}
        <div style={{ padding: '6px 16px 16px' }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Informe</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button type="button" onClick={() => setMonthOff(o => o - 1)} style={s.navBtn} aria-label="Mes anterior"><ChevL /></button>
            <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)' }} aria-live="polite">{MONTHS[month]} {year}</h1>
            <button
              type="button"
              onClick={() => setMonthOff(o => Math.min(o + 1, 0))}
              style={{ ...s.navBtn, opacity: monthOff === 0 ? .35 : 1, cursor: monthOff === 0 ? 'default' : 'pointer' }}
              aria-label="Mes siguiente"
              aria-disabled={monthOff === 0}
            ><ChevR /></button>
          </div>
        </div>

        <div style={{ padding: '0 16px 32px' }}>
          {loading ? <InformeSkeleton /> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <HowDidIDo m={metrics} p={prevMetrics} hasPrev={hasPrev} monthName={monthName} prevName={prevName} />
              <VsPrevTable m={metrics} p={prevMetrics} hasPrev={hasPrev} monthLabel={MONTHS[month]} prevName={prevName} />
              <CategoryChanges m={metrics} p={prevMetrics} hasPrev={hasPrev} typeByName={typeByName} />
              <AdviceCard advice={advice} monthName={monthName} onGenerate={fetchAdvice} />
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

// ── 1. ¿Cómo me fue? ──
function HowDidIDo({ m, p, hasPrev, monthName, prevName }) {
  const positive = m.available >= 0
  const diff     = m.available - p.available
  const spent    = m.totalFixedPaid + m.totalVariable
  const spentPct = m.totalIncome > 0 ? Math.round((spent / m.totalIncome) * 100) : null

  return (
    <section className="card" style={{ padding: 20 }} aria-labelledby="inf-how">
      <h2 id="inf-how" style={s.label}>{positive ? `Te sobró en ${monthName}` : `Te faltó en ${monthName}`}</h2>
      <div className="mono" style={{ fontSize: 38, fontWeight: 700, lineHeight: 1.1, margin: '6px 0 10px', color: positive ? 'var(--gr)' : 'var(--re)' }}>
        {fmtARS(Math.abs(m.available))}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--tx2)' }}>
        {!hasPrev ? (
          <>Sin datos de {prevName} para comparar.</>
        ) : diff === 0 ? (
          <>Lo mismo que en {prevName}.</>
        ) : (
          <>
            <strong style={{ color: toneFor(diff, 'higher'), fontWeight: 700 }}>
              <span className="mono">{fmtARS(Math.abs(diff))}</span> {diff > 0 ? 'más' : 'menos'}
            </strong>{' '}
            que en {prevName}.
          </>
        )}{' '}
        {spentPct === null
          ? 'Todavía no hay ingresos cargados este mes.'
          : `Gastaste el ${spentPct}% de lo que entró.`}
      </p>
    </section>
  )
}

// ── 2a. Tabla vs mes anterior (reemplaza las MetricCards) ──
function VsPrevTable({ m, p, hasPrev, monthLabel, prevName }) {
  const rows = [
    { label: 'Ingresos',  color: 'var(--gr)', now: m.totalIncome,    prev: p.totalIncome,    betterWhen: 'higher' },
    { label: 'Fijos',     color: 'var(--am)', now: m.totalFixedPaid, prev: p.totalFixedPaid, betterWhen: 'lower' },
    { label: 'Variables', color: 'var(--pu)', now: m.totalVariable,  prev: p.totalVariable,  betterWhen: 'lower' },
  ]

  return (
    <section className="card" style={{ padding: 20 }} aria-labelledby="inf-vs">
      <h2 id="inf-vs" style={{ ...s.label, marginBottom: 8 }}>vs {prevName}</h2>
      <table style={s.table}>
        <thead>
          <tr>
            <th scope="col" style={{ ...s.th, textAlign: 'left' }}><span className="sr-only">Concepto</span></th>
            <th scope="col" style={s.th}>{monthLabel}</th>
            <th scope="col" style={s.th}>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const diff = r.now - r.prev
            return (
              <tr key={r.label}>
                <th scope="row" style={{ ...s.td, textAlign: 'left', fontWeight: 500, color: 'var(--tx)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: r.color }} aria-hidden="true" />
                    {r.label}
                  </span>
                </th>
                <td className="mono" style={{ ...s.td, color: 'var(--tx)' }}>{fmtARS(r.now)}</td>
                <td className="mono" style={{ ...s.td, color: hasPrev ? toneFor(diff, r.betterWhen) : 'var(--tx3)', fontWeight: 600 }}>
                  {!hasPrev ? '—' : diff === 0 ? 'igual' : signed(diff)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}

// ── 2b. Qué cambió por categoría ──
function CategoryChanges({ m, p, hasPrev, typeByName }) {
  const top = m.byCategory.slice(0, 5)                 // byCategory viene ordenado desc
  const max = top[0]?.amount ?? 0
  const prevByName = Object.fromEntries(p.byCategory.map(c => [c.name, c.amount]))

  return (
    <section className="card" style={{ padding: 20 }} aria-labelledby="inf-cats">
      <h2 id="inf-cats" style={{ ...s.label, marginBottom: 16 }}>Qué cambió por categoría</h2>

      {top.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--tx2)' }}>Sin gastos este mes.</p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {top.map(({ name, amount }) => {
            const isFixed = typeByName[name] === 'fixed'
            const pct     = pctChange(amount, prevByName[name] ?? 0)
            const rounded = pct === null ? null : Math.round(pct)
            // Sin dato previo → "nuevo"; sin cambio → "igual"; gasto que sube = peor (--re)
            const change = !hasPrev || pct === null
              ? { text: 'nuevo', color: 'var(--tx2)' }
              : rounded === 0
                ? { text: 'igual', color: 'var(--tx2)' }
                : { text: `${rounded > 0 ? '+' : '−'}${Math.abs(rounded)}%`, color: rounded > 0 ? 'var(--re)' : 'var(--gr)' }

            return (
              <li key={name}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                    {isFixed && <span style={{ color: 'var(--tx2)' }}> · fijo</span>}
                  </span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', flexShrink: 0 }}>{fmtARS(amount)}</span>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: change.color, flexShrink: 0, minWidth: 48, textAlign: 'right' }}>
                    {change.text}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--s3)', overflow: 'hidden' }}>
                  <div style={{
                    width: `${max > 0 ? (amount / max) * 100 : 0}%`, height: '100%', borderRadius: 3,
                    background: isFixed ? 'var(--am)' : 'var(--pu)',
                    transition: 'width .5s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ── 3. Consejo IA ──
function AdviceCard({ advice, monthName, onGenerate }) {
  const { status, tips, error } = advice
  const isLoading = status === 'loading'
  const hasTips   = tips.length > 0

  return (
    <section style={s.adviceCard} aria-labelledby="inf-ai">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 10, background: 'var(--grd)', color: 'var(--gr)' }} aria-hidden="true">
            <Sparkles style={{ width: 16, height: 16 }} />
          </span>
          <h2 id="inf-ai" style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)' }}>Consejo IA</h2>
        </div>
        <button type="button" onClick={onGenerate} disabled={isLoading} style={{ ...s.btnSecondary, opacity: isLoading ? .6 : 1, cursor: isLoading ? 'default' : 'pointer' }}>
          {isLoading ? 'Generando…' : hasTips ? 'Regenerar' : 'Generar'}
        </button>
      </div>

      <div aria-live="polite" aria-busy={isLoading}>
        {isLoading && !hasTips && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[88, 70, 80].map((w, i) => <span key={i} className="skel" style={{ width: `${w}%`, height: 13, borderRadius: 6 }} />)}
          </div>
        )}

        {status === 'error' && (
          <p role="alert" style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--re)', marginBottom: hasTips ? 12 : 0 }}>
            No se pudo generar el consejo ({error}). Probá de nuevo.
          </p>
        )}

        {hasTips && (
          <>
            <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, opacity: isLoading ? .5 : 1 }}>
              {tips.map((tip, i) => (
                <li key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--gr)', flexShrink: 0 }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--tx)' }}>{tip}</p>
                </li>
              ))}
            </ol>
            <p style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 14 }}>
              Generado con tus datos de {monthName} · orientativo
            </p>
          </>
        )}

        {status === 'idle' && (
          <p style={{ fontSize: 14, lineHeight: 1.55, color: 'var(--tx2)' }}>
            Generá 3 consejos a partir de tus números de {monthName}.
          </p>
        )}
      </div>
    </section>
  )
}

const s = {
  label: { fontSize: 12, fontWeight: 600, color: 'var(--tx2)' },
  navBtn: {
    width: 44, height: 44, borderRadius: 14,
    background: 'var(--s2)', border: '1px solid var(--bd2)',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', color: 'var(--tx2)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    padding: '8px 0', fontSize: 12, fontWeight: 600, color: 'var(--tx2)',
    textAlign: 'right', borderBottom: '1px solid var(--bd)',
  },
  td: {
    padding: '12px 0', textAlign: 'right', whiteSpace: 'nowrap',
    borderBottom: '1px solid var(--bd)',
  },
  adviceCard: {
    padding: 20, borderRadius: 20,
    background: 'var(--s2)', border: '1px solid var(--bd2)',
  },
  btnSecondary: {
    minHeight: 44, padding: '0 16px', borderRadius: 14,
    background: 'var(--surface)', border: '1px solid var(--bd2)',
    color: 'var(--tx)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
  },
}
