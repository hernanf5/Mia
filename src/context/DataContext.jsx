// src/context/DataContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { transactionsApi } from '../hooks/useTransactions'
import { fetchCategories } from '../hooks/useCategories'
import { createTransactionStore, getKey } from '../lib/transactionStore'

const DataContext = createContext(null)

// Al volver a la pestaña después de este tiempo se refetchea todo
// (trae gastos cargados por WhatsApp u otro dispositivo).
const STALE_AFTER_HIDDEN_MS = 30_000

const NO_CATEGORIES = []

const parseKey = key => {
    const [y, m] = key.split('-').map(Number)
    return { year: y, month: m - 1 }
}

export function DataProvider({ children }) {
    const { user } = useAuth()
    const userId   = user?.id ?? null

    // Cambia en cada modificación del caché para que los consumidores relean
    const [version, setVersion] = useState(0)
    const [store] = useState(() => createTransactionStore({
        api: transactionsApi,
        onChange: () => setVersion(v => v + 1),
    }))

    // Categorías asociadas al usuario que las pidió: al cambiar de sesión
    // no se muestran las de la cuenta anterior
    const [cats, setCats] = useState({ userId: null, data: [] })
    const categories        = cats.userId === userId ? cats.data : NO_CATEGORIES
    const loadingCategories = userId !== null && cats.userId !== userId

    // ── Usuario: limpiar caché y cargar categorías al cambiar de sesión ──
    useEffect(() => {
        store.reset()
        if (!userId) return

        let cancelled = false
        fetchCategories().then(({ data }) => {
            if (!cancelled) setCats({ userId, data: data ?? [] })
        })
        return () => { cancelled = true }
    }, [userId, store])

    // ── Refetch al volver a la pestaña tras un rato oculta ──
    useEffect(() => {
        let hiddenAt = null
        function onVisibility() {
            if (document.visibilityState === 'hidden') { hiddenAt = Date.now(); return }
            if (hiddenAt && Date.now() - hiddenAt > STALE_AFTER_HIDDEN_MS) store.markStale()
            hiddenAt = null
        }
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [store])

    const value = useMemo(() => ({
        version,
        store,
        getTransactionsForMonth: store.get,
        createTransaction:       store.createTransaction,
        createTransactions:      store.createTransactions,
        updateTransaction:       store.updateTransaction,
        deleteTransaction:       store.deleteTransaction,
        toggleChecked:           store.toggleChecked,
        categories,
        loadingCategories,
        reloadCategories: async () => {
            const { data } = await fetchCategories()
            if (data) setCats({ userId, data })
        },
    }), [version, store, categories, loadingCategories, userId])

    return (
        <DataContext.Provider value={value}>
        {children}
        </DataContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useData() {
    return useContext(DataContext)
}

/**
 * Transacciones de varios meses, siempre sincronizadas con el caché.
 * `months`: [{ year, month }]. Devuelve `data` en el mismo orden.
 * `loading` solo es true mientras algún mes no tiene datos; en una
 * actualización se siguen mostrando los datos anteriores hasta tener los nuevos.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useMonthsTransactions(months) {
    const { version, store } = useData()
    const keys = months.map(({ year, month }) => getKey(year, month)).join(',')
    const list = useMemo(() => keys.split(',').map(parseKey), [keys])

    // Se recalcula en cada cambio del caché (version)
    const snapshot = useMemo(() => ({
        version,
        data:  list.map(({ year, month }) => store.peek(year, month)),
        fresh: list.every(({ year, month }) => store.isFresh(year, month)),
    }), [list, store, version])

    // Meses cuyo fetch ya terminó (aunque haya fallado), para no quedar en loading
    const [settled, setSettled] = useState(null)

    useEffect(() => {
        if (snapshot.fresh) return
        let cancelled = false
        // store.get escribe en caché y dispara onChange → nuevo snapshot
        Promise.all(list.map(({ year, month }) => store.get(year, month)))
            .then(() => { if (!cancelled) setSettled(keys) })
        return () => { cancelled = true }
    }, [snapshot, list, keys, store])

    const data    = useMemo(() => snapshot.data.map(d => d ?? []), [snapshot])
    const present = snapshot.data.every(Boolean)
    return { data, loading: !present && settled !== keys }
}

// eslint-disable-next-line react-refresh/only-export-components
export function useMonthTransactions(year, month) {
    const { data, loading } = useMonthsTransactions([{ year, month }])
    return { data: data[0], loading }
}
