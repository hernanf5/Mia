import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDashboard } from '../hooks/useDashboard'
import { useAuth } from '../context/AuthContext'
import ProfileModal from '../components/ProfileModal'
import { DashboardSkeleton } from '../components/Skeleton'
import { fmtARS } from '../lib/fmt'
import { typeByCategoryName } from '../lib/categoryTypes'
import Logo from '../assets/mia.svg'

// Dashboard (docs/rediseno-v2.md §4)

const MONTHS       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']

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

const TYPE_COLOR = { fixed: 'var(--am)', variable: 'var(--pu)', income: 'var(--gr)' }

// 'YYYY-MM-DD' → '12 nov' (sin pasar por Date para no correr el día por zona horaria)
function fmtDay(date) {
  const [, m, d] = String(date).split('-').map(Number)
  return `${d} ${MONTHS_SHORT[m - 1]}`
}

export default function Dashboard() {
  const [monthOff, setMonthOff]       = useState(0)
  const [showProfile, setShowProfile] = useState(false)
  const { user } = useAuth()
  const initial = user?.email?.[0]?.toUpperCase() ?? '?'

  const now    = new Date()
  const target = new Date(now.getFullYear(), now.getMonth() + monthOff, 1)
  const year   = target.getFullYear()
  const month  = target.getMonth()

  const { metrics, transactions, loading } = useDashboard({ year, month })

  return (
    <div className="screen">
      {/* ── Header ── */}
      <div style={{ padding: '6px 16px 0' }}>
        {/* Wordmark + avatar: solo mobile (el Sidebar los muestra en desktop) */}
        <div className="hide-on-desktop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <img src={Logo} alt="Mia" style={{ height: 28, width: 'auto', display: 'block' }} />
          {/* Avatar → ProfileModal (Categorías, Tema, WhatsApp, Cerrar sesión). Área táctil 44px */}
          <button type="button" onClick={() => setShowProfile(true)} aria-label="Abrir perfil y configuración" style={s.avatarBtn}>
            <span style={s.avatar}>{initial}</span>
          </button>
        </div>

        {/* Selector de mes */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <button type="button" onClick={() => setMonthOff(o => o - 1)} style={s.navBtn} aria-label="Mes anterior"><ChevL /></button>
          <h1 style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)' }} aria-live="polite">{MONTHS[month]} {year}</h1>
          <button
            type="button"
            onClick={() => setMonthOff(o => Math.min(o + 1, 0))}
            style={{ ...s.navBtn, opacity: monthOff === 0 ? .35 : 1, cursor: monthOff === 0 ? 'default' : 'pointer' }}
            aria-label="Mes siguiente"
            aria-disabled={monthOff === 0}
          >
            <ChevR />
          </button>
        </div>
      </div>

      <div style={{ padding: '0 16px 12px' }}>
        {loading
          ? <DashboardSkeleton />
          : <DashboardContent metrics={metrics} transactions={transactions} />}
      </div>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  )
}

function DashboardContent({ metrics, transactions }) {
  const { totalIncome, totalFixedPaid, totalFixedPending, totalVariable, available, byCategory } = metrics

  // byCategory no trae el tipo: se deriva de las transacciones (ver lib/categoryTypes)
  const typeByName = useMemo(() => typeByCategoryName(transactions), [transactions])

  const pendingCount = useMemo(
    () => transactions.filter(t => t.category?.type === 'fixed' && !t.is_checked).length,
    [transactions]
  )

  // Igual que Transactions: un fijo sin pagar todavía no es un movimiento
  const latest = useMemo(
    () => transactions.filter(t => !(t.category?.type === 'fixed' && !t.is_checked)).slice(0, 4),
    [transactions]
  )

  return (
    <div className="dash-layout">
      <div className="dash-left">
        <SummaryCard
          totalIncome={totalIncome}
          totalFixedPaid={totalFixedPaid}
          totalVariable={totalVariable}
          available={available}
        />
        {totalFixedPending > 0 && <PendingFixedNotice count={pendingCount} amount={totalFixedPending} />}
        <WhereItWent byCategory={byCategory} typeByName={typeByName} />
      </div>

      <div className="dash-right">
        <LatestMovements items={latest} />
      </div>
    </div>
  )
}

// ── Card principal ──
function SummaryCard({ totalIncome, totalFixedPaid, totalVariable, available }) {
  // Proporciones sobre ingresos; si se gastó más de lo que entró, fijos+variables llenan la barra
  const base     = Math.max(totalIncome, totalFixedPaid + totalVariable)
  const fixedPct = base > 0 ? (totalFixedPaid / base) * 100 : 0
  const varPct   = base > 0 ? (totalVariable / base) * 100 : 0
  const freePct  = base > 0 ? Math.max(0, 100 - fixedPct - varPct) : 0
  const freeOfIncome = totalIncome > 0 ? Math.round((available / totalIncome) * 100) : 0
  const positive = available >= 0

  const segments = [
    { key: 'fijos',     pct: fixedPct, color: 'var(--am)' },
    { key: 'variables', pct: varPct,   color: 'var(--pu)' },
    { key: 'libre',     pct: freePct,  color: 'var(--gr)' },
  ].filter(seg => seg.pct > 0)

  return (
    <section className="card" style={{ padding: 20 }} aria-labelledby="dash-available">
      <div id="dash-available" style={s.label}>Disponible</div>
      <div className="mono" style={{ fontSize: 42, fontWeight: 700, lineHeight: 1.1, margin: '6px 0 4px', color: positive ? 'var(--gr)' : 'var(--re)' }}>
        {fmtARS(available)}
      </div>
      <div style={{ fontSize: 13, color: 'var(--tx2)' }}>
        de {fmtARS(totalIncome)} de ingresos
      </div>

      {/* Barra segmentada: fijos · variables · libre */}
      <div
        role="img"
        aria-label={`Fijos ${Math.round(fixedPct)}%, variables ${Math.round(varPct)}%, libre ${Math.round(freePct)}%`}
        style={{ display: 'flex', gap: 2, height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--s3)', margin: '18px 0 16px' }}
      >
        {segments.map(seg => (
          <div key={seg.key} style={{ flex: `${seg.pct} 1 0`, background: seg.color, transition: 'flex-grow .5s' }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
        <Stat label="Fijos"     color="var(--am)" value={fmtARS(totalFixedPaid)} />
        <Stat label="Variables" color="var(--pu)" value={fmtARS(totalVariable)} />
        <Stat label="Libre"     color={positive ? 'var(--gr)' : 'var(--re)'} value={`${freeOfIncome}%`} />
      </div>
    </section>
  )
}

function Stat({ label, color, value }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--tx2)', marginBottom: 4 }}>
        <span style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} aria-hidden="true" />
        {label}
      </div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  )
}

// ── Aviso de fijos pendientes ──
function PendingFixedNotice({ count, amount }) {
  return (
    <Link to="/fijos" style={s.notice}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--am)', flexShrink: 0 }} aria-hidden="true" />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 600, color: 'var(--tx)' }}>
          {count} {count === 1 ? 'fijo por pagar' : 'fijos por pagar'}
        </span>
        <span style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>
          <span className="mono">{fmtARS(amount)}</span> todavía no descontados
        </span>
      </span>
      <span style={{ color: 'var(--am)', display: 'flex' }}><ChevR /></span>
    </Link>
  )
}

// ── En qué se fue ──
function WhereItWent({ byCategory, typeByName }) {
  const max = byCategory[0]?.amount ?? 0   // byCategory viene ordenado desc

  return (
    <section className="card" style={{ padding: 20 }} aria-labelledby="dash-where">
      <h2 id="dash-where" style={{ ...s.label, marginBottom: 16 }}>En qué se fue</h2>

      {byCategory.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--tx2)' }}>Sin gastos este mes.</p>
      ) : (
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {byCategory.map(({ name, amount }) => {
            const isFixed = typeByName[name] === 'fixed'
            const color   = isFixed ? 'var(--am)' : 'var(--pu)'
            const pct     = max > 0 ? (amount / max) * 100 : 0
            return (
              <li key={name}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
                  <span style={{ flex: 1, minWidth: 0, fontSize: 14, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name}
                    {isFixed && <span style={{ color: 'var(--tx2)' }}> · fijo</span>}
                  </span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx)', flexShrink: 0 }}>{fmtARS(amount)}</span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--s3)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: color, transition: 'width .5s cubic-bezier(.4,0,.2,1)' }} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// ── Últimos movimientos ──
function LatestMovements({ items }) {
  return (
    <section className="card" style={{ padding: 20 }} aria-labelledby="dash-latest">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <h2 id="dash-latest" style={s.label}>Últimos movimientos</h2>
        <Link to="/transactions" style={s.seeAll}>Ver todos</Link>
      </div>

      {items.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--tx2)', padding: '8px 0' }}>Todavía no cargaste movimientos este mes.</p>
      ) : (
        <ul style={{ listStyle: 'none' }}>
          {items.map((tx, i) => {
            const type     = tx.category?.type
            const isIncome = type === 'income'
            const color    = TYPE_COLOR[type] ?? 'var(--tx3)'
            return (
              <li key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid var(--bd)' }}>
                <span style={{ width: 36, height: 36, borderRadius: 12, background: `color-mix(in srgb, ${color} 13%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }} aria-hidden="true">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.description || tx.category?.name || 'Sin descripción'}
                  </span>
                  <span style={{ display: 'block', fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>
                    {tx.category?.name ?? 'Sin categoría'} · {fmtDay(tx.date)}
                  </span>
                </span>
                <span className="mono" style={{ fontSize: 14, fontWeight: 600, color: isIncome ? 'var(--gr)' : 'var(--tx)', flexShrink: 0 }}>
                  {isIncome ? '+' : '−'}{fmtARS(Math.abs(Number(tx.amount)))}
                </span>
              </li>
            )
          })}
        </ul>
      )}
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
  avatarBtn: {
    width: 44, height: 44, margin: -6, padding: 0,
    background: 'none', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'var(--s2)', border: '1px solid var(--bd2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, color: 'var(--tx2)', fontWeight: 600, fontFamily: 'inherit',
  },
  notice: {
    display: 'flex', alignItems: 'center', gap: 12,
    minHeight: 44, padding: '14px 16px', borderRadius: 20,
    background: 'var(--amd)',
    border: '1px solid color-mix(in srgb, var(--am) 28%, transparent)',
    textDecoration: 'none',
  },
  seeAll: {
    minHeight: 44, display: 'flex', alignItems: 'center', padding: '0 4px',
    fontSize: 13, fontWeight: 600, color: 'var(--gr)', textDecoration: 'none',
  },
}
