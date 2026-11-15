// computeMetrics().byCategory agrupa por nombre y no expone el tipo de categoría.
// Esto lo deriva de las mismas transacciones que cuenta byCategory
// (variables + fijos pagados), con el mismo criterio de agrupado (nombre).
export function typeByCategoryName(transactions) {
  const map = {}
  for (const t of transactions) {
    const type = t.category?.type
    if (type === 'variable' || (type === 'fixed' && t.is_checked)) {
      map[t.category?.name ?? 'Otros'] ??= type
    }
  }
  return map
}
