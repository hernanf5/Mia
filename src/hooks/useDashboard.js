import { useMemo } from 'react'
import { useMonthTransactions } from '../context/DataContext'
import { computeMetrics } from '../lib/metrics'

// Datos del Dashboard para un mes. La comparación entre meses vive en Informe.
export function useDashboard({ year, month }) {
  const { data: transactions, loading } = useMonthTransactions(year, month)

  const metrics = useMemo(
    () => (loading ? null : computeMetrics(transactions)),
    [loading, transactions]
  )

  return { metrics, transactions, loading }
}
