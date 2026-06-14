export function computeMetrics(txns) {
    const totalIncome       = txns.filter(t => t.category?.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
    const totalFixed        = txns.filter(t => t.category?.type === 'fixed').reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
    const totalFixedPaid    = txns.filter(t => t.category?.type === 'fixed' && t.is_checked).reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
    const totalFixedPending = totalFixed - totalFixedPaid
    const totalVariable     = txns.filter(t => t.category?.type === 'variable').reduce((s, t) => s + Math.abs(Number(t.amount)), 0)
    const available         = totalIncome - totalFixedPaid - totalVariable

    const byCatMap = {}
    txns
        .filter(t => {
        if (t.category?.type === 'fixed')    return t.is_checked
        if (t.category?.type === 'variable') return true
        return false
        })
        .forEach(t => {
        const key   = t.category?.name ?? 'Otros'
        const color = t.category?.color ?? '#555'
        if (!byCatMap[key]) byCatMap[key] = { name: key, color, amount: 0 }
        byCatMap[key].amount += Math.abs(Number(t.amount))
        })
    const byCategory = Object.values(byCatMap).sort((a, b) => b.amount - a.amount)

    return { totalIncome, totalFixedPaid, totalFixedPending, totalVariable, available, byCategory }
}