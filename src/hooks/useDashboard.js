import { useMemo } from 'react'
import { useMonthsTransactions } from '../context/DataContext'
import { computeMetrics } from '../lib/metrics'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']


export function useDashboard({ year, month }) {
  // [mes actual, ...3 meses de historial]
  const months = useMemo(() => [
    { year, month },
    ...Array.from({ length: 3 }, (_, i) => {
      const d = new Date(year, month - 3 + i, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    }),
  ], [year, month])

  const { data, loading } = useMonthsTransactions(months)

  const metrics = useMemo(
    () => (loading ? null : computeMetrics(data[0])),
    [loading, data]
  )

  const history = useMemo(() => (loading ? [] : months.slice(1).map(({ year: y, month: m }, i) => {
    const m2 = computeMetrics(data[i + 1])
    return {
      label:            MONTHS_SHORT[m],
      year:             y,
      month:            m,
      totalFixedPaid:   m2.totalFixedPaid,
      totalVariable:    m2.totalVariable,
      available:        m2.available,
      availableClamped: Math.max(0, m2.available),
      totalIncome:      m2.totalIncome,
    }
  })), [loading, data, months])

  return { metrics, history, loading }
}
