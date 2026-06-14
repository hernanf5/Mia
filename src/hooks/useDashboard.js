import { useCallback, useEffect, useState } from 'react'
import { useData } from '../context/DataContext'
import { computeMetrics } from '../lib/metrics'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']


export function useDashboard({ year, month }) {
  const { getTransactionsForMonth } = useData()
  const [metrics, setMetrics] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const histMonths = Array.from({ length: 3 }, (_, i) => {
      const d = new Date(year, month - 3 + i, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

    const [currentData, ...histData] = await Promise.all([
      getTransactionsForMonth( year, month ),
      ...histMonths.map(({ year: y, month: m }) => getTransactionsForMonth( y, m )),
    ])

    setMetrics(computeMetrics(currentData ?? []))

    setHistory(
      histMonths.map(({ year: y, month: m }, i) => {
        const m2 = computeMetrics(histData[i] ?? [])
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
      })
    )

    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  return { metrics, history, loading, reload: load }
}
