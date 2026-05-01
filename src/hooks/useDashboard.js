import { useCallback, useEffect, useState } from 'react'
import { useTransactions } from './useTransactions'

const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function computeMetrics(txns) {
  const totalIncome    = txns.filter(t => t.category?.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
  const totalFixed     = txns.filter(t => t.category?.type === 'fixed').reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const totalFixedPaid = txns.filter(t => t.category?.type === 'fixed' && t.is_checked).reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const totalVariable  = txns.filter(t => t.category?.type === 'variable').reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
  const available      = totalIncome - totalFixed - totalVariable

  const byCatMap = {}
  txns.filter(t => Number(t.amount) < 0).forEach(t => {
    const key   = t.category?.name ?? 'Otros'
    const color = t.category?.color ?? '#555'
    if (!byCatMap[key]) byCatMap[key] = { name: key, color, amount: 0 }
    byCatMap[key].amount += Math.abs(Number(t.amount))
  })
  const byCategory = Object.values(byCatMap).sort((a, b) => b.amount - a.amount)

  return { totalIncome, totalFixed, totalFixedPaid, totalVariable, available, byCategory }
}

export function useDashboard({ year, month }) {
  const { fetchTransactions } = useTransactions()
  const [metrics, setMetrics] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)

    const histMonths = Array.from({ length: 4 }, (_, i) => {
      const d = new Date(year, month - 3 + i, 1)
      return { year: d.getFullYear(), month: d.getMonth() }
    })

    const [currentData, ...histData] = await Promise.all([
      fetchTransactions({ year, month }),
      ...histMonths.map(({ year: y, month: m }) => fetchTransactions({ year: y, month: m })),
    ])

    setMetrics(computeMetrics(currentData.data ?? []))

    setHistory(
      histMonths.map(({ year: y, month: m }, i) => {
        const m2 = computeMetrics(histData[i].data ?? [])
        return {
          label:           MONTHS_SHORT[m],
          year:            y,
          month:           m,
          totalFixed:      m2.totalFixed,
          totalVariable:   m2.totalVariable,
          available:       m2.available,
          availableClamped: Math.max(0, m2.available),
          totalIncome:     m2.totalIncome,
        }
      })
    )

    setLoading(false)
  }, [year, month])

  useEffect(() => { load() }, [load])

  return { metrics, history, loading, reload: load }
}
