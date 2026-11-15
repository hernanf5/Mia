// Caché de transacciones por mes, independiente de React.
// DataContext lo instancia una vez y re-renderiza cuando llama a onChange().

export const getKey = (year, month) => `${year}-${String(month + 1).padStart(2, '0')}`

const keyFromDate = date => String(date).slice(0, 7)
const sortByDate  = list => [...list].sort((a, b) => String(b.date).localeCompare(String(a.date)))

export function createTransactionStore({ api, onChange }) {
  // cache[key]    → { data, epoch }  (epoch viejo = dato stale, se muestra pero se refetchea)
  // gens[key]     → se incrementa en cada mutación del mes; un fetch que arrancó
  //                 con otra generación no escribe en caché
  // inflight[key] → { promise, stamp } para deduplicar requests en vuelo
  let cache    = {}
  let inflight = {}
  const gens   = {}
  let epoch    = 0

  const stampFor = key => `${epoch}:${gens[key] ?? 0}`
  const isFreshKey = key => cache[key]?.epoch === epoch

  // ── Lectura ──
  function peek(year, month) {
    return cache[getKey(year, month)]?.data
  }

  function isFresh(year, month) {
    return isFreshKey(getKey(year, month))
  }

  async function get(year, month) {
    const key = getKey(year, month)
    if (isFreshKey(key)) return cache[key].data

    const stamp = stampFor(key)
    let req = inflight[key]
    if (!req || req.stamp !== stamp) {
      const promise = api.fetchTransactions({ year, month })
      const current = { promise, stamp }
      req = current
      inflight[key] = current
      promise.finally(() => { if (inflight[key] === current) delete inflight[key] })
    }

    const { data, error } = await req.promise
    if (error) return cache[key]?.data ?? null

    // Hubo una mutación/invalidación mientras el fetch estaba en vuelo:
    // esta respuesta puede estar desactualizada, se descarta y se reintenta.
    if (stampFor(key) !== stamp) return get(year, month)

    if (!isFreshKey(key)) {
      cache[key] = { data, epoch }
      onChange()
    }
    return cache[key].data
  }

  // ── Invalidación ──
  // Cambio de usuario: se borra todo (no mostrar datos de otra cuenta)
  function reset() {
    epoch += 1
    cache = {}
    inflight = {}
    onChange()
  }

  // Volver a la pestaña: se siguen mostrando los datos y se refetchean
  function markStale() {
    epoch += 1
    inflight = {}
    onChange()
  }

  // ── Escritura inmutable ──
  // Siempre incrementa la generación del mes (descarta fetches en vuelo);
  // solo parchea si el mes ya está en caché (si no, se fetcheará fresco).
  function patchMonth(key, fn) {
    gens[key] = (gens[key] ?? 0) + 1
    const entry = cache[key]
    if (entry) cache[key] = { ...entry, data: sortByDate(fn(entry.data)) }
  }

  const insertRows = rows => {
    for (const row of rows) {
      patchMonth(keyFromDate(row.date), list => [row, ...list.filter(t => t.id !== row.id)])
    }
  }
  const removeRow  = row => patchMonth(keyFromDate(row.date), list => list.filter(t => t.id !== row.id))
  const replaceRow = (prev, next) => {
    const prevKey = keyFromDate(prev.date)
    const nextKey = keyFromDate(next.date)
    if (prevKey === nextKey) {
      patchMonth(nextKey, list => list.map(t => (t.id === next.id ? next : t)))
    } else {
      removeRow(prev)
      insertRows([next])
    }
  }

  // ── Mutaciones: Supabase + caché. Devuelven { data, error } ──
  async function createTransaction(payload) {
    const { data, error } = await api.createTransaction(payload)
    if (error) return { data: null, error }
    insertRows([data])
    onChange()
    return { data, error: null }
  }

  async function createTransactions(payloads) {
    if (!payloads.length) return { data: [], error: null }
    const { data, error } = await api.createTransactions(payloads)
    if (error) return { data: null, error }
    insertRows(data)
    onChange()
    return { data, error: null }
  }

  async function updateTransaction(prev, updates) {
    const { data, error } = await api.updateTransaction(prev.id, updates)
    if (error) return { data: null, error }
    replaceRow(prev, data)
    onChange()
    return { data, error: null }
  }

  async function deleteTransaction(tx) {
    const { error } = await api.deleteTransaction(tx.id)
    if (error) return { error }
    removeRow(tx)
    onChange()
    return { error: null }
  }

  // Optimista: refleja el cambio al instante y revierte si Supabase falla
  async function toggleChecked(tx) {
    const optimistic = { ...tx, is_checked: !tx.is_checked }
    replaceRow(tx, optimistic)
    onChange()

    const { data, error } = await api.toggleChecked(tx.id, tx.is_checked)
    replaceRow(optimistic, error ? tx : data)
    onChange()
    return { data: error ? null : data, error: error ?? null }
  }

  return {
    peek, isFresh, get, reset, markStale,
    createTransaction, createTransactions, updateTransaction, deleteTransaction, toggleChecked,
  }
}
