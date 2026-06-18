import { useState, useCallback, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { computeMetrics } from '../lib/metrics'
import { fmtARS } from '../lib/fmt'

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
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

    const load = useCallback(async() => {
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

    return (
        <div className="screen">
            {/* Header */}
            <div style={{ padding: '6px 16px 12px' }}>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Informe</div>
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
            </div>

            {/* Content */}
            {loading ? (
                <p style={{ color: 'var(--tx3)', textAlign: 'center', padding: '2rem', fontSize: 13 }}>Cargando...</p>
            ) : (
                <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                    {/* Resumen del mes */}
                    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx2)' }}>Resumen de {MONTHS_SHORT[month]}</span>
                        {[
                            { label: 'Ingresos',      value: metrics.totalIncome,    color: 'var(--gr)' },
                            { label: 'Fijos pagados', value: metrics.totalFixedPaid, color: 'var(--re)' },
                            { label: 'Variables',     value: metrics.totalVariable,  color: 'var(--re)' },
                            { label: 'Disponible',    value: metrics.available,      color: metrics.available >= 0 ? 'var(--gr)' : 'var(--re)' },
                        ].map(({ label, value, color }) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{label}</span>
                                <span className="mono" style={{ fontSize: 13, fontWeight: 600, color }}>
                                    {value >= 0 ? '+' : '−'}{fmtARS(Math.abs(value))}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Comparación vs mes anterior */}
                    {prevMetrics && (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx2)' }}>vs {MONTHS_SHORT[new Date(now.getFullYear(), now.getMonth() + monthOff - 1, 1).getMonth()]}</span>
                            {[
                                { label: 'Ingresos',      curr: metrics.totalIncome,    prev: prevMetrics.totalIncome,    higherIsBetter: true  },
                                { label: 'Fijos pagados', curr: metrics.totalFixedPaid, prev: prevMetrics.totalFixedPaid, higherIsBetter: false },
                                { label: 'Variables',     curr: metrics.totalVariable,  prev: prevMetrics.totalVariable,  higherIsBetter: false },
                                { label: 'Disponible',    curr: metrics.available,      prev: prevMetrics.available,      higherIsBetter: true  },
                            ].map(({ label, curr, prev, higherIsBetter }) => {
                                const diff = curr - prev
                                const isPositive = higherIsBetter ? diff >= 0 : diff <= 0
                                const color = diff === 0 ? 'var(--tx3)' : isPositive ? 'var(--gr)' : 'var(--re)'
                                const arrow = diff === 0 ? '→' : diff > 0 ? '↑' : '↓'
                                return (
                                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 13, color: 'var(--tx2)' }}>{label}</span>
                                        <span className="mono" style={{ fontSize: 13, fontWeight: 600, color }}>
                                            {arrow} {fmtARS(Math.abs(diff))}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Top categorías */}
                    {metrics.byCategory.length > 0 && (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx2)' }}>Top categorías</span>
                            {metrics.byCategory.slice(0, 5).map(cat => {
                                const total = metrics.byCategory.reduce((s, c) => s + c.amount, 0)
                                const pct = total > 0 ? (cat.amount / total * 100).toFixed(1) : 0
                                return (
                                    <div key={cat.name} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: cat.color }} />
                                                <span style={{ fontSize: 12, color: 'var(--tx2)' }}>{cat.name}</span>
                                            </div>
                                            <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{pct}%</span>
                                        </div>
                                        <div style={{ height: 4, borderRadius: 2, background: 'var(--s2)' }}>
                                            <div style={{ height: '100%', borderRadius: 2, background: cat.color, width: `${pct}%` }} />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {/* Consejos IA */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <button
                            onClick={fetchAdvice}
                            disabled={loadingAdvice}
                            style={{
                                background: loadingAdvice ? 'var(--s2)' : 'var(--gr)',
                                color: '#000',
                                border: 'none',
                                borderRadius: 10,
                                padding: '10px 16px',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: loadingAdvice ? 'not-allowed' : 'pointer',
                                opacity: loadingAdvice ? 0.6 : 1,
                                transition: 'opacity .15s',
                            }}
                        >
                            {loadingAdvice ? 'Analizando...' : 'Generar consejos'}
                        </button>

                        {adviceError && (
                            <p style={{ fontSize: 13, color: 'var(--re)', margin: 0 }}>{adviceError}</p>
                        )}

                        {advice.length > 0 && advice.map((tip, i) => (
                            <div key={i} className="card" style={{
                                background: 'var(--s2)',
                                border: '1px solid var(--bd2)',
                                fontSize: 13,
                                color: 'var(--tx2)',
                                lineHeight: 1.5,
                            }}>
                                {tip}
                            </div>
                        ))}
                    </div>

                </div>
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
}